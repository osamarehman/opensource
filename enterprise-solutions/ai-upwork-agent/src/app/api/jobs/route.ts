import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, createApiResponse, createErrorResponse, validateRequestBody } from '@/lib/api/auth';
import { savedJobs } from '@/lib/db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

// Validation schemas
const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  upworkJobId: z.string().min(1, 'Upwork job ID is required'),
  budget: z.string().optional(),
  skills: z.array(z.string()).default([]),
  clientInfo: z.record(z.string(), z.any()).default({}),
  url: z.string().url('Valid URL is required'),
  aiScore: z.number().min(0).max(100).optional(),
});

const updateJobSchema = createJobSchema.partial().extend({
  id: z.string().uuid('Valid job ID is required'),
});

// GET /api/jobs - Get all saved jobs for the tenant
export async function GET(request: NextRequest) {
  return withAuth(async (context) => {
    try {
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '20');
      const offset = parseInt(searchParams.get('offset') || '0');
      const search = searchParams.get('search') || '';

      const { db, tenantId } = context;

      // Build query with search filter if provided
      let query = db
        .select()
        .from(savedJobs)
        .where(eq(savedJobs.tenantId, tenantId))
        .orderBy(desc(savedJobs.createdAt))
        .limit(limit)
        .offset(offset);

      // Add search filter if provided
      if (search) {
        query = db
          .select()
          .from(savedJobs)
          .where(
            and(
              eq(savedJobs.tenantId, tenantId),
              sql`(
                ${savedJobs.title} ILIKE ${`%${search}%`} OR
                ${savedJobs.description} ILIKE ${`%${search}%`} OR
                array_to_string(${savedJobs.skills}, ',') ILIKE ${`%${search}%`}
              )`
            )
          )
          .orderBy(desc(savedJobs.createdAt))
          .limit(limit)
          .offset(offset);
      }

      const jobs = await query;

      // Get total count for pagination
      const totalCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(savedJobs)
        .where(eq(savedJobs.tenantId, tenantId));

      const totalCount = totalCountResult[0]?.count || 0;

      return createApiResponse({
        jobs,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      });
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return createErrorResponse('Failed to fetch jobs', 500);
    }
  })(request);
}

// POST /api/jobs - Create a new saved job
export async function POST(request: NextRequest) {
  return withAuth(async (context) => {
    try {
      const body = await validateRequestBody(request, createJobSchema);
      const { db, tenantId, userId } = context;

      const newJob = await db
        .insert(savedJobs)
        .values({
          title: body.title,
          description: body.description,
          upworkJobId: body.upworkJobId,
          budget: body.budget || null,
          skills: body.skills,
          clientInfo: body.clientInfo,
          url: body.url,
          aiScore: body.aiScore?.toString() || null,
          jobData: {
            title: body.title,
            description: body.description,
            budget: body.budget,
            skills: body.skills,
            clientInfo: body.clientInfo,
            url: body.url,
          },
          tenantId,
          userId,
        })
        .returning();

      return createApiResponse(newJob[0], 201);
    } catch (error) {
      console.error('Error creating job:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to create job',
        400
      );
    }
  })(request);
}

// PUT /api/jobs - Update an existing job
export async function PUT(request: NextRequest) {
  return withAuth(async (context) => {
    try {
      const body = await validateRequestBody(request, updateJobSchema);
      const { db, tenantId, userId } = context;
      const { id, ...updateData } = body;

      const updateFields: any = {};
      if (updateData.title) updateFields.title = updateData.title;
      if (updateData.description) updateFields.description = updateData.description;
      if (updateData.budget !== undefined) updateFields.budget = updateData.budget;
      if (updateData.skills) updateFields.skills = updateData.skills;
      if (updateData.clientInfo) updateFields.clientInfo = updateData.clientInfo;
      if (updateData.url) updateFields.url = updateData.url;
      if (updateData.aiScore !== undefined) updateFields.aiScore = updateData.aiScore.toString();

      const updatedJob = await db
        .update(savedJobs)
        .set({
          ...updateFields,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(savedJobs.id, id),
            eq(savedJobs.tenantId, tenantId),
            eq(savedJobs.userId, userId)
          )
        )
        .returning();

      if (updatedJob.length === 0) {
        return createErrorResponse('Job not found or access denied', 404);
      }

      return createApiResponse(updatedJob[0]);
    } catch (error) {
      console.error('Error updating job:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to update job',
        400
      );
    }
  })(request);
}

// DELETE /api/jobs - Delete a job
export async function DELETE(request: NextRequest) {
  return withAuth(async (context) => {
    try {
      const { searchParams } = new URL(request.url);
      const jobId = searchParams.get('id');

      if (!jobId) {
        return createErrorResponse('Job ID is required', 400);
      }

      const { db, tenantId, userId } = context;

      const deletedJob = await db
        .delete(savedJobs)
        .where(
          and(
            eq(savedJobs.id, jobId),
            eq(savedJobs.tenantId, tenantId),
            eq(savedJobs.userId, userId)
          )
        )
        .returning();

      if (deletedJob.length === 0) {
        return createErrorResponse('Job not found or access denied', 404);
      }

      return createApiResponse({ message: 'Job deleted successfully' });
    } catch (error) {
      console.error('Error deleting job:', error);
      return createErrorResponse('Failed to delete job', 500);
    }
  })(request);
}