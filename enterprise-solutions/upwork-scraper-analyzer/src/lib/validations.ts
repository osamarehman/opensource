import { z } from "zod";

// User and Organization schemas
export const userRoleSchema = z.enum(["owner", "admin", "member", "viewer"]);

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Organization name is required"),
  settings: z.record(z.unknown()).optional(),
});

// Job-related schemas
export const jobFilterSchema = z.object({
  keywords: z.string().optional(),
  experienceLevel: z.enum(["entry", "intermediate", "expert"]).optional(),
  jobType: z.enum(["hourly", "fixed"]).optional(),
  minBudget: z.number().min(0).optional(),
  maxBudget: z.number().min(0).optional(),
  clientHistory: z.enum(["no-hires", "1-9-hires", "10-plus-hires"]).optional(),
  paymentVerified: z.boolean().optional(),
  skills: z.array(z.string()).optional(),
});

export const jobSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  budget: z.number().nullable(),
  jobType: z.enum(["hourly", "fixed"]),
  experienceLevel: z.enum(["entry", "intermediate", "expert"]),
  skills: z.array(z.string()),
  clientInfo: z.object({
    name: z.string(),
    rating: z.number().min(0).max(5).nullable(),
    totalHires: z.number().min(0),
    paymentVerified: z.boolean(),
    location: z.string().nullable(),
  }),
  postedAt: z.date(),
  url: z.string().url(),
});

// Proposal schemas
export const proposalSchema = z.object({
  jobId: z.string(),
  coverLetter: z.string().min(50, "Cover letter must be at least 50 characters"),
  bidAmount: z.number().min(1, "Bid amount must be greater than 0"),
  proposedDuration: z.string().optional(),
  questions: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional(),
});

export const proposalTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  content: z.string().min(10, "Template content is required"),
  variables: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

// AI schemas
export const aiRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  model: z.enum(["gpt-4", "gpt-4-turbo-preview", "claude-3-sonnet-20240229"]),
  maxTokens: z.number().min(1).max(4000).optional(),
  temperature: z.number().min(0).max(2).optional(),
});

export const proposalGenerationSchema = z.object({
  jobDescription: z.string().min(1, "Job description is required"),
  clientInfo: z.object({
    name: z.string(),
    history: z.string().optional(),
    preferences: z.string().optional(),
  }),
  userProfile: z.object({
    skills: z.array(z.string()),
    experience: z.string(),
    portfolio: z.string().optional(),
  }),
  instructions: z.string().optional(),
  tone: z.enum(["professional", "friendly", "confident", "casual"]).default("professional"),
});

// Analytics schemas
export const analyticsRequestSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  metrics: z.array(z.enum([
    "proposals_sent",
    "interviews_received",
    "jobs_won",
    "revenue_earned",
    "success_rate",
    "response_rate"
  ])),
});

export const performanceMetricsSchema = z.object({
  proposalsSent: z.number().min(0),
  interviewsReceived: z.number().min(0),
  jobsWon: z.number().min(0),
  revenueEarned: z.number().min(0),
  successRate: z.number().min(0).max(100),
  responseRate: z.number().min(0).max(100),
  averageBidAmount: z.number().min(0),
  period: z.object({
    start: z.date(),
    end: z.date(),
  }),
});

// Settings schemas
export const userSettingsSchema = z.object({
  notifications: z.object({
    newJobs: z.boolean().default(true),
    proposalUpdates: z.boolean().default(true),
    analytics: z.boolean().default(false),
  }),
  filters: jobFilterSchema,
  aiPreferences: z.object({
    defaultModel: z.enum(["gpt-4", "claude-3-sonnet-20240229"]).default("gpt-4"),
    tone: z.enum(["professional", "friendly", "confident", "casual"]).default("professional"),
    autoGenerate: z.boolean().default(false),
  }),
});

export const organizationSettingsSchema = z.object({
  branding: z.object({
    logo: z.string().url().optional(),
    primaryColor: z.string().optional(),
    customDomain: z.string().optional(),
  }).optional(),
  features: z.object({
    aiProposals: z.boolean().default(true),
    analytics: z.boolean().default(true),
    teamCollaboration: z.boolean().default(false),
  }),
  limits: z.object({
    maxUsers: z.number().min(1).default(10),
    maxProposalsPerMonth: z.number().min(1).default(100),
    maxAiRequestsPerDay: z.number().min(1).default(1000),
  }),
});

// Form validation helpers
export type JobFilter = z.infer<typeof jobFilterSchema>;
export type Job = z.infer<typeof jobSchema>;
export type Proposal = z.infer<typeof proposalSchema>;
export type ProposalTemplate = z.infer<typeof proposalTemplateSchema>;
export type ProposalGeneration = z.infer<typeof proposalGenerationSchema>;
export type UserSettings = z.infer<typeof userSettingsSchema>;
export type OrganizationSettings = z.infer<typeof organizationSettingsSchema>;
export type PerformanceMetrics = z.infer<typeof performanceMetricsSchema>;