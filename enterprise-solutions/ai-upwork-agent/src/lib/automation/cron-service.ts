import { createTenantDB } from '@/lib/db';
import { savedJobs, users, proposalHistory } from '@/lib/db/schema';
import { eq, desc, gte, and } from 'drizzle-orm';
import { AutomationDecisionEngine, AutomationAction } from './decision-engine';
import { ProposalGenerator } from '@/lib/ai/proposal-generator';

export interface CronJobConfig {
  enabled: boolean;
  frequency: 'hourly' | 'every-2-hours' | 'every-4-hours' | 'daily';
  maxJobsPerRun: number;
  autoProcessHighScoreJobs: boolean;
  notifyOnHighValueJobs: boolean;
}

export interface JobDiscoveryResult {
  jobsProcessed: number;
  highValueJobsFound: number;
  proposalsGenerated: number;
  autoApplications: number;
  approvalRequests: number;
  errors: string[];
}

export class CronJobService {
  private tenantId: string;
  private userId: string;

  constructor(tenantId: string, userId: string) {
    this.tenantId = tenantId;
    this.userId = userId;
  }

  // Main cron job execution method
  async executeJobDiscovery(config: CronJobConfig): Promise<JobDiscoveryResult> {
    const result: JobDiscoveryResult = {
      jobsProcessed: 0,
      highValueJobsFound: 0,
      proposalsGenerated: 0,
      autoApplications: 0,
      approvalRequests: 0,
      errors: [],
    };

    try {
      console.log(`🔄 Starting job discovery cron for tenant ${this.tenantId}`);

      // Get recent unprocessed jobs
      const unprocessedJobs = await this.getUnprocessedJobs(config.maxJobsPerRun);

      if (unprocessedJobs.length === 0) {
        console.log('No unprocessed jobs found');
        return result;
      }

      result.jobsProcessed = unprocessedJobs.length;

      // Process each job through automation workflow
      for (const job of unprocessedJobs) {
        try {
          await this.processJobAutomation(job, config, result);
        } catch (error) {
          const errorMsg = `Failed to process job ${job.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      // Send summary notification if enabled
      if (config.notifyOnHighValueJobs && result.highValueJobsFound > 0) {
        await this.sendSummaryNotification(result);
      }

      console.log(`✅ Cron job completed:`, result);
      return result;

    } catch (error) {
      const errorMsg = `Cron job execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      console.error(errorMsg);
      return result;
    }
  }

  // Get unprocessed jobs for automation
  private async getUnprocessedJobs(maxJobs: number) {
    const tenantDB = createTenantDB(this.tenantId);
    const db = await tenantDB.getDB();

    try {
      // Get jobs that haven't been processed by automation yet
      const jobs = await db
        .select()
        .from(savedJobs)
        .where(
          and(
            eq(savedJobs.tenantId, this.tenantId),
            // Add condition to check if job hasn't been processed yet
            // We can use the clientInfo to store automation status
          )
        )
        .orderBy(desc(savedJobs.createdAt))
        .limit(maxJobs);

      await tenantDB.close();
      return jobs.filter(job => {
        const clientInfo = job.clientInfo as any || {};
        return !clientInfo.automationProcessed && !clientInfo.automationStatus;
      });

    } catch (error) {
      await tenantDB.close();
      throw error;
    }
  }

  // Process individual job through automation workflow
  private async processJobAutomation(job: any, config: CronJobConfig, result: JobDiscoveryResult) {
    try {
      // Initialize decision engine
      const decisionEngine = new AutomationDecisionEngine(this.tenantId, this.userId);

      // Analyze the job
      const decision = await decisionEngine.analyzeJob(job.id);

      // Check if it's a high-value job
      if (decision.jobScore >= 80) {
        result.highValueJobsFound++;
      }

      // Execute automation action if auto-processing is enabled
      if (config.autoProcessHighScoreJobs) {
        const executionResult = await this.executeAutomationAction(decision.action, job);

        switch (decision.action) {
          case AutomationAction.AUTO_APPLY:
            result.autoApplications++;
            result.proposalsGenerated++;
            break;
          case AutomationAction.REQUEST_APPROVAL:
            result.approvalRequests++;
            result.proposalsGenerated++;
            break;
        }
      }

      // Mark job as processed
      await this.markJobAsProcessed(job.id, decision);

    } catch (error) {
      throw new Error(`Job processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Execute automation action
  private async executeAutomationAction(action: AutomationAction, job: any) {
    const tenantDB = createTenantDB(this.tenantId);
    const db = await tenantDB.getDB();

    try {
      switch (action) {
        case AutomationAction.AUTO_APPLY:
          return await this.autoApplyToJob(job, db);

        case AutomationAction.REQUEST_APPROVAL:
          return await this.createApprovalRequest(job, db);

        case AutomationAction.SKIP:
          return await this.logSkippedJob(job, db);

        default:
          console.log(`No action taken for job ${job.id}: ${action}`);
      }
    } finally {
      await tenantDB.close();
    }
  }

  // Auto-apply to job
  private async autoApplyToJob(job: any, db: any) {
    console.log(`🚀 Auto-applying to job: ${job.title}`);

    const generator = new ProposalGenerator(this.tenantId);
    const proposalResult = await generator.generateProposal({
      id: job.id,
      title: job.title,
      description: job.description,
      budget: job.budget,
      skills: job.skills,
      clientInfo: job.clientInfo,
      url: job.url,
      aiScore: job.aiScore,
    }, this.userId);

    // Save the proposal
    await db
      .insert(proposalHistory)
      .values({
        upworkJobId: job.upworkJobId,
        content: proposalResult.proposal,
        proposalData: {
          automationAction: 'auto_apply',
          confidence: proposalResult.confidence,
          cronJobGenerated: true,
          generatedAt: new Date().toISOString(),
        },
        status: 'draft', // Will be sent via Upwork API
        tenantId: this.tenantId,
        userId: this.userId,
        aiGenerated: true,
        updatedAt: new Date(),
      });

    // TODO: Integrate with Upwork API to submit proposal
    console.log(`✅ Proposal generated for: ${job.title} (Confidence: ${proposalResult.confidence}%)`);
  }

  // Create approval request
  private async createApprovalRequest(job: any, db: any) {
    console.log(`📋 Creating approval request for: ${job.title}`);

    const generator = new ProposalGenerator(this.tenantId);
    const proposalResult = await generator.generateProposal({
      id: job.id,
      title: job.title,
      description: job.description,
      budget: job.budget,
      skills: job.skills,
      clientInfo: job.clientInfo,
      url: job.url,
      aiScore: job.aiScore,
    }, this.userId);

    await db
      .insert(proposalHistory)
      .values({
        upworkJobId: job.upworkJobId,
        content: proposalResult.proposal,
        proposalData: {
          automationAction: 'request_approval',
          requiresApproval: true,
          confidence: proposalResult.confidence,
          cronJobGenerated: true,
          generatedAt: new Date().toISOString(),
        },
        status: 'draft',
        tenantId: this.tenantId,
        userId: this.userId,
        aiGenerated: true,
      });

    // TODO: Send notification to user
    console.log(`📧 Approval request created for: ${job.title}`);
  }

  // Log skipped job
  private async logSkippedJob(job: any, db: any) {
    console.log(`⏭️ Skipping job: ${job.title}`);
    // Job already marked as processed in markJobAsProcessed
  }

  // Mark job as processed by automation
  private async markJobAsProcessed(jobId: string, decision: any) {
    const tenantDB = createTenantDB(this.tenantId);
    const db = await tenantDB.getDB();

    try {
      await db
        .update(savedJobs)
        .set({
          clientInfo: {
            automationProcessed: true,
            automationStatus: decision.action,
            processedAt: new Date().toISOString(),
            jobScore: decision.jobScore,
            confidence: decision.confidence,
            reasoning: decision.reasoning,
          },
          updatedAt: new Date(),
        })
        .where(eq(savedJobs.id, jobId));

    } finally {
      await tenantDB.close();
    }
  }

  // Send summary notification
  private async sendSummaryNotification(result: JobDiscoveryResult) {
    // TODO: Implement notification system (email, in-app notifications, etc.)
    console.log(`📊 Job Discovery Summary:
      - Jobs Processed: ${result.jobsProcessed}
      - High-Value Jobs: ${result.highValueJobsFound}
      - Proposals Generated: ${result.proposalsGenerated}
      - Auto Applications: ${result.autoApplications}
      - Approval Requests: ${result.approvalRequests}
      - Errors: ${result.errors.length}
    `);
  }
}

// Utility function to get default cron configuration
export function getDefaultCronConfig(): CronJobConfig {
  return {
    enabled: true,
    frequency: 'every-2-hours',
    maxJobsPerRun: 20,
    autoProcessHighScoreJobs: false, // Start with manual approval
    notifyOnHighValueJobs: true,
  };
}

// Schedule and execute cron jobs for all active tenants
export async function executeCronJobsForAllTenants() {
  try {
    console.log('🕐 Starting scheduled job discovery for all tenants...');

    // TODO: Get all active tenants from database
    // For now, this would be called by a scheduler like Vercel Cron or similar

    console.log('✅ Scheduled job discovery completed');

  } catch (error) {
    console.error('❌ Scheduled job discovery failed:', error);
  }
}