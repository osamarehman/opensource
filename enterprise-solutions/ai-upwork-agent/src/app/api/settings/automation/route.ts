import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, createApiResponse, createErrorResponse, validateRequestBody } from '@/lib/api/auth';
import { users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Validation schema for automation settings
const automationSettingsSchema = z.object({
  jobFiltering: z.object({
    autoApplyThreshold: z.number().min(0).max(100).default(85),
    approvalThreshold: z.number().min(0).max(100).default(65),
    skipThreshold: z.number().min(0).max(100).default(40),
    maxBudgetRange: z.number().min(0).default(50000),
    minBudgetRange: z.number().min(0).default(500),
    clientRatingMinimum: z.number().min(0).max(5).default(4.0),
    competitionThreshold: z.number().min(0).default(20),
    preferredSkills: z.array(z.string()).default([]),
    avoidedKeywords: z.array(z.string()).default([]),
    riskTolerance: z.enum(['low', 'medium', 'high']).default('medium'),
  }),

  cronJobs: z.object({
    enabled: z.boolean().default(true),
    frequency: z.enum(['hourly', 'every-2-hours', 'every-4-hours', 'daily']).default('every-2-hours'),
    maxJobsPerRun: z.number().min(1).max(100).default(20),
    autoProcessHighScoreJobs: z.boolean().default(false),
    notifyOnHighValueJobs: z.boolean().default(true),
  }),

  automation: z.object({
    maxDailyApplications: z.number().min(1).max(50).default(10),
    autoApplyEnabled: z.boolean().default(false),
    requireApprovalForHighValue: z.boolean().default(true),
    minimumConfidenceForAutoApply: z.number().min(0).max(100).default(80),
  }),

  proposals: z.object({
    defaultTone: z.enum(['professional', 'friendly', 'confident', 'casual']).default('professional'),
    includePortfolioLinks: z.boolean().default(true),
    includeAvailability: z.boolean().default(true),
    customSignature: z.string().max(200).optional(),
    templatePreferences: z.array(z.string()).default([]),
  }),

  notifications: z.object({
    emailNotifications: z.boolean().default(true),
    highValueJobAlerts: z.boolean().default(true),
    dailySummary: z.boolean().default(true),
    proposalStatusUpdates: z.boolean().default(true),
    weeklyAnalytics: z.boolean().default(true),
  }),

  upworkIntegration: z.object({
    enabled: z.boolean().default(false),
    apiKey: z.string().optional(),
    secretKey: z.string().optional(),
    autoSubmitProposals: z.boolean().default(false),
    testModeEnabled: z.boolean().default(true),
  }),
});

type AutomationSettings = z.infer<typeof automationSettingsSchema>;

// GET /api/settings/automation - Get current automation settings
export async function GET(request: NextRequest) {
  return withAuth(async (context) => {
    try {
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

      // Parse existing settings or return defaults
      const settings = user[0].settings as AutomationSettings || getDefaultSettings();

      return createApiResponse({
        settings,
        lastUpdated: user[0].updatedAt,
        isConfigured: !!user[0].settings,
      });

    } catch (error) {
      console.error('Settings fetch error:', error);
      return createErrorResponse('Failed to fetch settings', 500);
    }
  })(request);
}

// POST /api/settings/automation - Update automation settings
export async function POST(request: NextRequest) {
  return withAuth(async (context) => {
    try {
      const body = await validateRequestBody(request, automationSettingsSchema.partial());
      const { db, tenantId, userId } = context;

      // Get current settings
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

      // Merge with existing settings
      const currentSettings = (user[0].settings as AutomationSettings) || getDefaultSettings();
      const updatedSettings = deepMerge(currentSettings, body);

      // Validate the merged settings
      const validatedSettings = automationSettingsSchema.parse(updatedSettings);

      // Update user settings
      const updated = await db
        .update(users)
        .set({
          settings: validatedSettings,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(users.id, userId),
            eq(users.tenantId, tenantId)
          )
        )
        .returning();

      return createApiResponse({
        message: 'Settings updated successfully',
        settings: validatedSettings,
        updatedAt: updated[0].updatedAt,
      });

    } catch (error) {
      console.error('Settings update error:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to update settings',
        400
      );
    }
  })(request);
}

// PUT /api/settings/automation - Reset settings to defaults
export async function PUT(request: NextRequest) {
  return withAuth(async (context) => {
    try {
      const { db, tenantId, userId } = context;

      const defaultSettings = getDefaultSettings();

      // Reset to default settings
      const updated = await db
        .update(users)
        .set({
          settings: defaultSettings,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(users.id, userId),
            eq(users.tenantId, tenantId)
          )
        )
        .returning();

      return createApiResponse({
        message: 'Settings reset to defaults',
        settings: defaultSettings,
        updatedAt: updated[0].updatedAt,
      });

    } catch (error) {
      console.error('Settings reset error:', error);
      return createErrorResponse('Failed to reset settings', 500);
    }
  })(request);
}

// Get default automation settings
function getDefaultSettings(): AutomationSettings {
  return {
    jobFiltering: {
      autoApplyThreshold: 85,
      approvalThreshold: 65,
      skipThreshold: 40,
      maxBudgetRange: 50000,
      minBudgetRange: 500,
      clientRatingMinimum: 4.0,
      competitionThreshold: 20,
      preferredSkills: ['react', 'typescript', 'node.js', 'python', 'ai', 'machine learning'],
      avoidedKeywords: ['crypto', 'gambling', 'adult', 'illegal', 'mlm'],
      riskTolerance: 'medium',
    },

    cronJobs: {
      enabled: true,
      frequency: 'every-2-hours',
      maxJobsPerRun: 20,
      autoProcessHighScoreJobs: false,
      notifyOnHighValueJobs: true,
    },

    automation: {
      maxDailyApplications: 10,
      autoApplyEnabled: false,
      requireApprovalForHighValue: true,
      minimumConfidenceForAutoApply: 80,
    },

    proposals: {
      defaultTone: 'professional',
      includePortfolioLinks: true,
      includeAvailability: true,
      customSignature: undefined,
      templatePreferences: [],
    },

    notifications: {
      emailNotifications: true,
      highValueJobAlerts: true,
      dailySummary: true,
      proposalStatusUpdates: true,
      weeklyAnalytics: true,
    },

    upworkIntegration: {
      enabled: false,
      autoSubmitProposals: false,
      testModeEnabled: true,
    },
  };
}

// Deep merge utility function
function deepMerge(target: any, source: any): any {
  const result = { ...target };

  for (const key in source) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}