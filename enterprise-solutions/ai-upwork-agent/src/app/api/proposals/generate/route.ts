import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, createApiResponse, createErrorResponse, validateRequestBody } from '@/lib/api/auth';
import { ProposalGenerator } from '@/lib/ai/proposal-generator';
import { savedJobs, proposalHistory } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Validation schema for proposal generation request
const generateProposalSchema = z.object({
  jobId: z.string().uuid('Valid job ID is required'),
  customInstructions: z.string().optional(),
  autoSave: z.boolean().default(true),
});

// POST /api/proposals/generate - Generate AI proposal for a job
export async function POST(request: NextRequest) {
  return withAuth(async (context) => {
    try {
      const body = await validateRequestBody(request, generateProposalSchema);
      const { db, tenantId, userId } = context;

      // Get the job details
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

      const jobContext = job[0];

      // Check if a proposal already exists for this job
      const existingProposal = await db
        .select()
        .from(proposalHistory)
        .where(
          and(
            eq(proposalHistory.upworkJobId, jobContext.upworkJobId),
            eq(proposalHistory.tenantId, tenantId),
            eq(proposalHistory.userId, userId)
          )
        )
        .limit(1);

      // Initialize proposal generator
      const generator = new ProposalGenerator(tenantId);

      // Generate the proposal
      const result = await generator.generateProposal(
        {
          id: jobContext.id,
          title: jobContext.title,
          description: jobContext.description,
          budget: jobContext.budget,
          skills: jobContext.skills as string[],
          clientInfo: jobContext.clientInfo as Record<string, any>,
          url: jobContext.url,
          aiScore: jobContext.aiScore ? parseFloat(jobContext.aiScore) : null,
        },
        userId,
        body.customInstructions
      );

      // Auto-save the proposal if requested
      let savedProposal = null;
      if (body.autoSave) {
        if (existingProposal.length > 0) {
          // Update existing proposal
          const updated = await db
            .update(proposalHistory)
            .set({
              content: result.proposal,
              proposalData: {
                confidence: result.confidence,
                reasoning: result.reasoning,
                patterns: result.patterns,
                wordCount: result.wordCount,
                generatedAt: new Date().toISOString(),
              },
              updatedAt: new Date(),
            })
            .where(eq(proposalHistory.id, existingProposal[0].id))
            .returning();

          savedProposal = updated[0];
        } else {
          // Create new proposal
          const created = await db
            .insert(proposalHistory)
            .values({
              upworkJobId: jobContext.upworkJobId,
              content: result.proposal,
              proposalData: {
                confidence: result.confidence,
                reasoning: result.reasoning,
                patterns: result.patterns,
                wordCount: result.wordCount,
                generatedAt: new Date().toISOString(),
              },
              status: 'draft',
              tenantId,
              userId,
              aiGenerated: true,
            })
            .returning();

          savedProposal = created[0];
        }
      }

      return createApiResponse({
        success: true,
        proposal: result.proposal,
        confidence: result.confidence,
        reasoning: result.reasoning,
        patterns: result.patterns,
        wordCount: result.wordCount,
        characterCount: result.proposal.length,
        savedProposal: savedProposal,
        jobContext: {
          title: jobContext.title,
          budget: jobContext.budget,
          aiScore: jobContext.aiScore,
        },
      });

    } catch (error) {
      console.error('Proposal generation error:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to generate proposal',
        500
      );
    }
  })(request);
}

// GET /api/proposals/generate - Get generation status or preview
export async function GET(request: NextRequest) {
  return withAuth(async (context) => {
    try {
      const { searchParams } = new URL(request.url);
      const jobId = searchParams.get('jobId');

      if (!jobId) {
        return createErrorResponse('Job ID is required', 400);
      }

      const { db, tenantId, userId } = context;

      // Get job and existing proposal info
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

      const existingProposal = await db
        .select()
        .from(proposalHistory)
        .where(
          and(
            eq(proposalHistory.upworkJobId, job[0].upworkJobId),
            eq(proposalHistory.tenantId, tenantId),
            eq(proposalHistory.userId, userId)
          )
        )
        .limit(1);

      return createApiResponse({
        job: job[0],
        hasExistingProposal: existingProposal.length > 0,
        existingProposal: existingProposal[0] || null,
        canGenerate: true,
        estimatedQuality: job[0].aiScore || 50,
      });

    } catch (error) {
      console.error('Proposal generation status error:', error);
      return createErrorResponse('Failed to get generation status', 500);
    }
  })(request);
}