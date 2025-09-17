import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse, validateRequestBody } from '@/lib/api/auth';
import { createTenantDB } from '@/lib/db';
import { savedJobs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { jobWebhookSchema } from '@/lib/validations';
import type { z } from 'zod';

// Job webhook data type
type JobWebhookData = z.infer<typeof jobWebhookSchema>;

// POST /api/webhooks/jobs - Receive job data from external sources
export async function POST(request: NextRequest) {
  try {
    // Validate the request body
    const body = await validateRequestBody<JobWebhookData>(request, jobWebhookSchema);

    // Verify webhook secret (you should set this in environment variables)
    const expectedSecret = process.env.WEBHOOK_SECRET;
    if (!expectedSecret || body.webhookSecret !== expectedSecret) {
      return createErrorResponse('Invalid webhook secret', 401);
    }

    // Create tenant-aware database connection
    const tenantDB = createTenantDB(body.tenantId);
    const db = await tenantDB.getDB();

    // Check if job already exists to avoid duplicates
    const existingJob = await db
      .select()
      .from(savedJobs)
      .where(
        and(
          eq(savedJobs.upworkJobId, body.upworkJobId),
          eq(savedJobs.tenantId, body.tenantId)
        )
      )
      .limit(1);

    if (existingJob.length > 0) {
      return createApiResponse({
        message: 'Job already exists',
        jobId: existingJob[0].id,
        status: 'duplicate'
      });
    }

    // Calculate initial AI score based on basic criteria
    const aiScore = await calculateInitialJobScore(body);

    // Prepare job data for storage
    const jobData = {
      upworkJobId: body.upworkJobId,
      title: body.title,
      description: body.description,
      budget: body.budget,
      skills: body.skills,
      clientInfo: body.clientInfo,
      url: body.url,
      postedAt: body.postedAt,
      category: body.category,
      jobType: body.jobType,
      experienceLevel: body.experienceLevel,
      duration: body.duration,
      proposals: body.proposals,
    };

    // Insert the new job
    const newJob = await db
      .insert(savedJobs)
      .values({
        upworkJobId: body.upworkJobId,
        title: body.title,
        description: body.description,
        budget: body.budget || null,
        skills: body.skills,
        clientInfo: body.clientInfo,
        url: body.url,
        jobData: jobData,
        aiScore: aiScore.toString(), // Convert to string as schema expects
        tenantId: body.tenantId,
        userId: 'webhook-system', // We'll update this when we have user context
        createdAt: body.postedAt ? new Date(body.postedAt) : new Date(),
        tags: [],
        notes: null,
      })
      .returning();

    // Close the database connection
    await tenantDB.close();

    // Trigger job analysis workflow (we'll implement this next)
    await triggerJobAnalysis(newJob[0]);

    return createApiResponse({
      message: 'Job received and processed successfully',
      job: newJob[0],
      status: 'processed',
      aiScore,
    }, 201);

  } catch (error) {
    console.error('Webhook processing error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to process job webhook',
      500
    );
  }
}

// Calculate initial job score based on basic criteria
async function calculateInitialJobScore(jobData: JobWebhookData): Promise<number> {
  let score = 50; // Base score

  // Budget analysis
  if (jobData.budget) {
    const budgetMatch = jobData.budget.match(/\$(\d+)/);
    if (budgetMatch) {
      const budgetAmount = parseInt(budgetMatch[1]);
      if (budgetAmount >= 5000) score += 20;
      else if (budgetAmount >= 1000) score += 10;
      else if (budgetAmount >= 500) score += 5;
    }
  }

  // Client quality analysis
  if (jobData.clientInfo.rating && jobData.clientInfo.rating >= 4.5) score += 15;
  if (jobData.clientInfo.totalSpent && jobData.clientInfo.totalSpent >= 10000) score += 10;
  if (jobData.clientInfo.verificationStatus === 'verified') score += 5;

  // Skills matching (we'll improve this with user preferences later)
  const highValueSkills = ['react', 'typescript', 'node.js', 'python', 'ai', 'machine learning'];
  const skillMatches = jobData.skills.filter(skill =>
    highValueSkills.some(hvs => skill.toLowerCase().includes(hvs))
  ).length;
  score += skillMatches * 5;

  // Experience level preference
  if (jobData.experienceLevel === 'expert') score += 10;
  else if (jobData.experienceLevel === 'intermediate') score += 5;

  // Competition analysis
  if (jobData.proposals && jobData.proposals < 5) score += 15;
  else if (jobData.proposals && jobData.proposals < 10) score += 10;
  else if (jobData.proposals && jobData.proposals > 50) score -= 20;

  // Cap the score between 0 and 100
  return Math.max(0, Math.min(100, score));
}

// Trigger job analysis workflow with automation
async function triggerJobAnalysis(job: any) {
  try {
    console.log(`🔍 Job analysis triggered for job ${job.id} with score ${job.aiScore}`);

    // Import automation classes (dynamic import to avoid circular dependencies)
    const { AutomationDecisionEngine } = await import('@/lib/automation/decision-engine');

    // Get user for this tenant (simplified - in production, you'd have proper user mapping)
    const userId = 'webhook-system'; // This should be mapped to actual user

    // Initialize decision engine
    const decisionEngine = new AutomationDecisionEngine(job.tenantId, userId);

    // Analyze the job
    const decision = await decisionEngine.analyzeJob(job.id);

    console.log(`📊 Automation analysis complete:
      - Action: ${decision.action}
      - Confidence: ${decision.confidence}%
      - Job Score: ${decision.jobScore}
      - Risk Factors: ${decision.riskFactors.length}
    `);

    // For high-value jobs, trigger immediate processing
    if (decision.jobScore >= 80) {
      console.log(`🎯 High-value job detected: ${job.title} (Score: ${decision.jobScore})`);

      // TODO: Trigger proposal generation for high-value jobs
      if (decision.action === 'auto_apply') {
        console.log(`🚀 Auto-apply recommended for job: ${job.title}`);
        // In production, this would trigger the actual proposal generation and submission
      } else if (decision.action === 'request_approval') {
        console.log(`📋 Manual approval required for job: ${job.title}`);
        // In production, this would send a notification to the user
      }
    }

    // Mark job as analyzed
    const tenantDB = createTenantDB(job.tenantId);
    const db = await tenantDB.getDB();

    await db
      .update(savedJobs)
      .set({
        jobData: {
          ...job.jobData,
          automationAnalyzed: true,
          automationAction: decision.action,
          automationConfidence: decision.confidence,
          automationJobScore: decision.jobScore,
          analyzedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      })
      .where(eq(savedJobs.id, job.id));

    await tenantDB.close();

  } catch (error) {
    console.error('Job analysis error:', error);
  }
}