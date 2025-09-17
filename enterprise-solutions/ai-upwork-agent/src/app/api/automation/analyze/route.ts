import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, createApiResponse, createErrorResponse, validateRequestBody } from '@/lib/api/auth';
import { AutomationDecisionEngine, AutomationAction } from '@/lib/automation/decision-engine';
import { ProposalGenerator } from '@/lib/ai/proposal-generator';
import { savedJobs, proposalHistory } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Validation schema for automation analysis
const analyzeJobSchema = z.object({
  jobId: z.string().uuid('Valid job ID is required'),
  settings: z.object({
    autoApplyThreshold: z.number().min(0).max(100).optional(),
    approvalThreshold: z.number().min(0).max(100).optional(),
    skipThreshold: z.number().min(0).max(100).optional(),
    maxDailyApplications: z.number().min(1).max(50).optional(),
    maxBudgetRange: z.number().min(0).optional(),
    minBudgetRange: z.number().min(0).optional(),
    preferredSkills: z.array(z.string()).optional(),
    avoidedKeywords: z.array(z.string()).optional(),
    clientRatingMinimum: z.number().min(0).max(5).optional(),
    competitionThreshold: z.number().min(0).optional(),
    riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
  }).optional(),
  executeAction: z.boolean().default(false), // Whether to execute the recommended action
});

// POST /api/automation/analyze - Analyze job and get automation recommendation
export async function POST(request: NextRequest) {
  return withAuth(async (context) => {
    try {
      const body = await validateRequestBody(request, analyzeJobSchema);
      const { db, tenantId, userId } = context;

      // Verify job exists and belongs to tenant
      const job = await db
        .select()
        .from(savedJobs)
        .where(
          and(
            eq(savedJobs.id, body.jobId),
            eq(savedJobs.tenantId, tenantId)
          )
        )
        .limit(1);

      if (job.length === 0) {
        return createErrorResponse('Job not found', 404);
      }

      // Initialize decision engine
      const decisionEngine = new AutomationDecisionEngine(tenantId, userId);

      // Analyze the job
      const decision = await decisionEngine.analyzeJob(body.jobId, body.settings);

      let executionResult = null;

      // Execute the recommended action if requested
      if (body.executeAction) {
        executionResult = await executeAutomationAction(
          decision.action,
          body.jobId,
          tenantId,
          userId,
          job[0]
        );
      }

      return createApiResponse({
        jobId: body.jobId,
        jobTitle: job[0].title,
        analysis: decision,
        executed: body.executeAction,
        executionResult,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Automation analysis error:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to analyze job',
        500
      );
    }
  })(request);
}

// GET /api/automation/analyze - Get analysis for a job without executing
export async function GET(request: NextRequest) {
  return withAuth(async (context) => {
    try {
      const { searchParams } = new URL(request.url);
      const jobId = searchParams.get('jobId');

      if (!jobId) {
        return createErrorResponse('Job ID is required', 400);
      }

      const { db, tenantId, userId } = context;

      // Verify job exists
      const job = await db
        .select()
        .from(savedJobs)
        .where(
          and(
            eq(savedJobs.id, jobId),
            eq(savedJobs.tenantId, tenantId)
          )
        )
        .limit(1);

      if (job.length === 0) {
        return createErrorResponse('Job not found', 404);
      }

      // Initialize decision engine and analyze
      const decisionEngine = new AutomationDecisionEngine(tenantId, userId);
      const decision = await decisionEngine.analyzeJob(jobId);

      return createApiResponse({
        jobId,
        jobTitle: job[0].title,
        analysis: decision,
        canExecute: true,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Automation analysis error:', error);
      return createErrorResponse('Failed to analyze job', 500);
    }
  })(request);
}

// Execute automation action based on decision
async function executeAutomationAction(
  action: AutomationAction,
  jobId: string,
  tenantId: string,
  userId: string,
  jobData: any
): Promise<any> {
  const tenantDB = createTenantDB(tenantId);
  const db = await tenantDB.getDB();

  try {
    switch (action) {
      case AutomationAction.AUTO_APPLY:
        return await executeAutoApply(jobId, tenantId, userId, jobData, db);

      case AutomationAction.REQUEST_APPROVAL:
        return await createApprovalRequest(jobId, tenantId, userId, jobData, db);

      case AutomationAction.SKIP:
        return await logSkippedJob(jobId, tenantId, userId, jobData, db);

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } finally {
    await tenantDB.close();
  }
}

// Execute auto-apply workflow
async function executeAutoApply(jobId: string, tenantId: string, userId: string, jobData: any, db: any) {
  // Generate proposal
  const generator = new ProposalGenerator(tenantId);
  const proposalResult = await generator.generateProposal({
    id: jobData.id,
    title: jobData.title,
    description: jobData.description,
    budget: jobData.budget,
    skills: jobData.skills,
    clientInfo: jobData.clientInfo,
    url: jobData.url,
    aiScore: jobData.aiScore,
  }, userId);

  // Save proposal
  const savedProposal = await db
    .insert(proposalHistory)
    .values({
      upworkJobId: jobData.upworkJobId,
      content: proposalResult.proposal,
      proposalData: {
        automationAction: 'auto_apply',
        confidence: proposalResult.confidence,
        reasoning: proposalResult.reasoning,
        patterns: proposalResult.patterns,
        generatedAt: new Date().toISOString(),
      },
      status: 'draft', // Will be 'sent' after actual submission
      tenantId,
      userId,
      aiGenerated: true,
    })
    .returning();

  // TODO: Integrate with Upwork API to actually submit the proposal
  // For now, we'll mark it as ready for submission

  return {
    action: 'auto_apply',
    status: 'proposal_generated',
    proposalId: savedProposal[0].id,
    confidence: proposalResult.confidence,
    wordCount: proposalResult.wordCount,
    message: 'Proposal generated and ready for submission',
  };
}

// Create approval request for manual review
async function createApprovalRequest(jobId: string, tenantId: string, userId: string, jobData: any, db: any) {
  // Generate a draft proposal for review
  const generator = new ProposalGenerator(tenantId);
  const proposalResult = await generator.generateProposal({
    id: jobData.id,
    title: jobData.title,
    description: jobData.description,
    budget: jobData.budget,
    skills: jobData.skills,
    clientInfo: jobData.clientInfo,
    url: jobData.url,
    aiScore: jobData.aiScore,
  }, userId);

  // Save as draft for approval
  const draftProposal = await db
    .insert(proposalHistory)
    .values({
      upworkJobId: jobData.upworkJobId,
      content: proposalResult.proposal,
      proposalData: {
        automationAction: 'request_approval',
        confidence: proposalResult.confidence,
        reasoning: proposalResult.reasoning,
        requiresApproval: true,
        generatedAt: new Date().toISOString(),
      },
      status: 'draft',
      tenantId,
      userId,
      aiGenerated: true,
    })
    .returning();

  // TODO: Send notification to user for approval
  // TODO: Create approval workflow in dashboard

  return {
    action: 'request_approval',
    status: 'pending_approval',
    proposalId: draftProposal[0].id,
    confidence: proposalResult.confidence,
    message: 'Proposal generated and pending your approval',
  };
}

// Log skipped job with reasoning
async function logSkippedJob(jobId: string, tenantId: string, userId: string, jobData: any, db: any) {
  // Update job with skip reason
  await db
    .update(savedJobs)
    .set({
      updatedAt: new Date(),
      // Add skip metadata to clientInfo
      clientInfo: {
        ...jobData.clientInfo,
        automationStatus: 'skipped',
        skippedAt: new Date().toISOString(),
        skipReason: 'Below automation threshold',
      },
    })
    .where(eq(savedJobs.id, jobId));

  return {
    action: 'skip',
    status: 'skipped',
    message: 'Job skipped due to low score or risk factors',
  };
}

// Import createTenantDB (should be at the top but placing here due to function definition order)
import { createTenantDB } from '@/lib/db';