import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, createApiResponse, createErrorResponse, validateRequestBody } from '@/lib/api/auth';
import { CronJobService, getDefaultCronConfig } from '@/lib/automation/cron-service';
import { users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Validation schema for manual cron execution
const executeCronSchema = z.object({
  maxJobs: z.number().min(1).max(100).optional(),
  autoProcess: z.boolean().default(false),
  notify: z.boolean().default(true),
});

// GET /api/automation/cron - Get cron job status and configuration
export async function GET(request: NextRequest) {
  return withAuth(async (context) => {
    try {
      const { db, tenantId, userId } = context;

      // Get user settings for cron configuration
      const user = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, userId),
            eq(users.tenantId, tenantId)
          )
        )
        .limit(1);

      if (user.length === 0) {
        return createErrorResponse('User not found', 404);
      }

      const userSettings = user[0].settings as any;
      const cronConfig = userSettings?.cronJobs || getDefaultCronConfig();

      // Get recent execution history (you might want to store this in a separate table)
      const executionHistory = await getExecutionHistory(tenantId, userId);

      return createApiResponse({
        configuration: cronConfig,
        status: cronConfig.enabled ? 'enabled' : 'disabled',
        nextRun: calculateNextRun(cronConfig.frequency),
        executionHistory,
        lastExecution: executionHistory[0] || null,
      });

    } catch (error) {
      console.error('Cron status error:', error);
      return createErrorResponse('Failed to get cron status', 500);
    }
  })(request);
}

// POST /api/automation/cron - Execute cron job manually
export async function POST(request: NextRequest) {
  return withAuth(async (context) => {
    try {
      const body = await validateRequestBody(request, executeCronSchema);
      const { db, tenantId, userId } = context;

      // Get user settings
      const user = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, userId),
            eq(users.tenantId, tenantId)
          )
        )
        .limit(1);

      if (user.length === 0) {
        return createErrorResponse('User not found', 404);
      }

      const userSettings = user[0].settings as any;
      const cronConfig = {
        ...getDefaultCronConfig(),
        ...userSettings?.cronJobs,
        maxJobsPerRun: body.maxJobs || userSettings?.cronJobs?.maxJobsPerRun || 20,
        autoProcessHighScoreJobs: body.autoProcess,
        notifyOnHighValueJobs: body.notify,
      };

      // Execute the cron job
      const cronService = new CronJobService(tenantId, userId);
      const result = await cronService.executeJobDiscovery(cronConfig);

      // Log execution result (in production, you'd save this to database)
      await logExecutionResult(tenantId, userId, result);

      return createApiResponse({
        message: 'Cron job executed successfully',
        result,
        executedAt: new Date().toISOString(),
        configuration: cronConfig,
      });

    } catch (error) {
      console.error('Cron execution error:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to execute cron job',
        500
      );
    }
  })(request);
}

// PUT /api/automation/cron - Update cron job configuration
export async function PUT(request: NextRequest) {
  return withAuth(async (context) => {
    try {
      const cronConfigSchema = z.object({
        enabled: z.boolean(),
        frequency: z.enum(['hourly', 'every-2-hours', 'every-4-hours', 'daily']),
        maxJobsPerRun: z.number().min(1).max(100),
        autoProcessHighScoreJobs: z.boolean(),
        notifyOnHighValueJobs: z.boolean(),
      });

      const body = await validateRequestBody(request, cronConfigSchema.partial());
      const { db, tenantId, userId } = context;

      // Get current user settings
      const user = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, userId),
            eq(users.tenantId, tenantId)
          )
        )
        .limit(1);

      if (user.length === 0) {
        return createErrorResponse('User not found', 404);
      }

      const currentSettings = (user[0].settings as any) || {};
      const updatedCronConfig = {
        ...getDefaultCronConfig(),
        ...currentSettings.cronJobs,
        ...body,
      };

      // Update user settings
      const updatedSettings = {
        ...currentSettings,
        cronJobs: updatedCronConfig,
      };

      await db
        .update(users)
        .set({
          settings: updatedSettings,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(users.id, userId),
            eq(users.tenantId, tenantId)
          )
        );

      return createApiResponse({
        message: 'Cron configuration updated successfully',
        configuration: updatedCronConfig,
        nextRun: updatedCronConfig.enabled ? calculateNextRun(updatedCronConfig.frequency) : null,
      });

    } catch (error) {
      console.error('Cron config update error:', error);
      return createErrorResponse('Failed to update cron configuration', 500);
    }
  })(request);
}

// DELETE /api/automation/cron - Disable cron jobs
export async function DELETE(request: NextRequest) {
  return withAuth(async (context) => {
    try {
      const { db, tenantId, userId } = context;

      // Get current settings and disable cron
      const user = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, userId),
            eq(users.tenantId, tenantId)
          )
        )
        .limit(1);

      if (user.length === 0) {
        return createErrorResponse('User not found', 404);
      }

      const currentSettings = (user[0].settings as any) || {};
      const updatedSettings = {
        ...currentSettings,
        cronJobs: {
          ...currentSettings.cronJobs,
          enabled: false,
        },
      };

      await db
        .update(users)
        .set({
          settings: updatedSettings,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(users.id, userId),
            eq(users.tenantId, tenantId)
          )
        );

      return createApiResponse({
        message: 'Cron jobs disabled successfully',
        configuration: updatedSettings.cronJobs,
      });

    } catch (error) {
      console.error('Cron disable error:', error);
      return createErrorResponse('Failed to disable cron jobs', 500);
    }
  })(request);
}

// Calculate next run time based on frequency
function calculateNextRun(frequency: string): string {
  const now = new Date();
  let nextRun = new Date(now);

  switch (frequency) {
    case 'hourly':
      nextRun.setHours(now.getHours() + 1, 0, 0, 0);
      break;
    case 'every-2-hours':
      nextRun.setHours(now.getHours() + 2, 0, 0, 0);
      break;
    case 'every-4-hours':
      nextRun.setHours(now.getHours() + 4, 0, 0, 0);
      break;
    case 'daily':
      nextRun.setDate(now.getDate() + 1);
      nextRun.setHours(9, 0, 0, 0); // 9 AM next day
      break;
    default:
      nextRun.setHours(now.getHours() + 2, 0, 0, 0);
  }

  return nextRun.toISOString();
}

// Get execution history (simplified - in production, use a dedicated table)
async function getExecutionHistory(tenantId: string, userId: string) {
  // TODO: Implement proper execution history storage
  // For now, return mock data
  return [
    {
      executedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      jobsProcessed: 15,
      highValueJobsFound: 3,
      proposalsGenerated: 2,
      autoApplications: 1,
      errors: [],
      duration: 45000, // milliseconds
    },
    {
      executedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      jobsProcessed: 8,
      highValueJobsFound: 1,
      proposalsGenerated: 1,
      autoApplications: 0,
      errors: [],
      duration: 32000,
    },
  ];
}

// Log execution result (simplified - in production, use a dedicated table)
async function logExecutionResult(tenantId: string, userId: string, result: any) {
  // TODO: Implement proper execution logging
  console.log(`📊 Cron execution logged for tenant ${tenantId}:`, result);
}