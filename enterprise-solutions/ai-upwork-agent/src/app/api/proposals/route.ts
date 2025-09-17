import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, createApiResponse, createErrorResponse, validateRequestBody } from '@/lib/api/auth';
import { proposalHistory } from '@/lib/db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

// Validation schemas
const createProposalSchema = z.object({
  jobId: z.string().uuid('Valid job ID is required'),
  templateId: z.string().uuid().optional(),
  content: z.string().min(1, 'Proposal content is required'),
  customizations: z.record(z.string(), z.any()).default({}),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected']).default('draft'),
  sentAt: z.string().datetime().optional(),
});

const updateProposalSchema = createProposalSchema.partial().extend({
  id: z.string().uuid('Valid proposal ID is required'),
});

// GET /api/proposals - Get all proposals for the tenant
export async function GET(request: NextRequest) {
  return withAuth(async (context) => {
    try {
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '20');
      const offset = parseInt(searchParams.get('offset') || '0');
      const status = searchParams.get('status');
      const jobId = searchParams.get('jobId');

      const { db, tenantId } = context;

      // Build base query
      let whereConditions = [eq(proposalHistory.tenantId, tenantId)];

      // Add status filter if provided
      if (status) {
        whereConditions.push(eq(proposalHistory.status, status as any));
      }

      // Add job filter if provided (need to join with savedJobs to filter by jobId)
      if (jobId) {
        // For now, we'll filter by upworkJobId from the savedJobs table
        // This would require a join or a separate query to get the upworkJobId
        // For simplicity, we'll skip this filter for now or implement proper join
        // whereConditions.push(eq(proposalHistory.upworkJobId, upworkJobId));
      }

      const proposals = await db
        .select()
        .from(proposalHistory)
        .where(and(...whereConditions))
        .orderBy(desc(proposalHistory.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const totalCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(proposalHistory)
        .where(and(...whereConditions));

      const totalCount = totalCountResult[0]?.count || 0;

      return createApiResponse({
        proposals,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      });
    } catch (error) {
      console.error('Error fetching proposals:', error);
      return createErrorResponse('Failed to fetch proposals', 500);
    }
  })(request);
}

// POST /api/proposals - Create a new proposal
export async function POST(request: NextRequest) {
  return withAuth(async (context) => {
    try {
      const body = await validateRequestBody(request, createProposalSchema);
      const { db, tenantId, userId } = context;

      const newProposal = await db
        .insert(proposalHistory)
        .values({
          upworkJobId: body.jobId, // Assuming jobId maps to upworkJobId
          content: body.proposalData.coverLetter || '',
          proposalData: body.proposalData,
          status: 'draft',
          tenantId,
          userId,
          sentAt: body.sentAt ? new Date(body.sentAt) : null,
          aiGenerated: body.aiGenerated,
        })
        .returning();

      return createApiResponse(newProposal[0], 201);
    } catch (error) {
      console.error('Error creating proposal:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to create proposal',
        400
      );
    }
  })(request);
}

// PUT /api/proposals - Update an existing proposal
export async function PUT(request: NextRequest) {
  return withAuth(async (context) => {
    try {
      const body = await validateRequestBody(request, updateProposalSchema);
      const { db, tenantId, userId } = context;
      const { id, ...updateData } = body;

      const updateFields: any = {};
      if (updateData.proposalData) updateFields.proposalData = updateData.proposalData;
      if (updateData.status) updateFields.status = updateData.status;
      if (updateData.sentAt) updateFields.sentAt = new Date(updateData.sentAt);
      if (updateData.responseAt) updateFields.responseAt = new Date(updateData.responseAt);

      const updatedProposal = await db
        .update(proposalHistory)
        .set({
          ...updateFields,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(proposalHistory.id, id),
            eq(proposalHistory.tenantId, tenantId),
            eq(proposalHistory.userId, userId)
          )
        )
        .returning();

      if (updatedProposal.length === 0) {
        return createErrorResponse('Proposal not found or access denied', 404);
      }

      return createApiResponse(updatedProposal[0]);
    } catch (error) {
      console.error('Error updating proposal:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to update proposal',
        400
      );
    }
  })(request);
}

// DELETE /api/proposals - Delete a proposal
export async function DELETE(request: NextRequest) {
  return withAuth(async (context) => {
    try {
      const { searchParams } = new URL(request.url);
      const proposalId = searchParams.get('id');

      if (!proposalId) {
        return createErrorResponse('Proposal ID is required', 400);
      }

      const { db, tenantId, userId } = context;

      const deletedProposal = await db
        .delete(proposalHistory)
        .where(
          and(
            eq(proposalHistory.id, proposalId),
            eq(proposalHistory.tenantId, tenantId),
            eq(proposalHistory.userId, userId)
          )
        )
        .returning();

      if (deletedProposal.length === 0) {
        return createErrorResponse('Proposal not found or access denied', 404);
      }

      return createApiResponse({ message: 'Proposal deleted successfully' });
    } catch (error) {
      console.error('Error deleting proposal:', error);
      return createErrorResponse('Failed to delete proposal', 500);
    }
  })(request);
}