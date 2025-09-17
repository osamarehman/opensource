import { z } from "zod";

// Job Filter Validation Schema
export const jobFilterSchema = z.object({
  search: z.string().optional(),
  skills: z.array(z.string()).optional(),
  budget: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  experienceLevel: z.enum(["entry", "intermediate", "expert"]).optional(),
  jobType: z.enum(["hourly", "fixed"]).optional(),
  clientVerified: z.boolean().optional(),
  clientRating: z.number().min(0).max(5).optional(),
  duration: z.string().optional(),
  proposalCount: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  postedWithin: z.enum(["1h", "24h", "3d", "7d", "30d"]).optional(),
  sortBy: z.enum(["relevance", "newest", "budget", "proposals"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type JobFilter = z.infer<typeof jobFilterSchema>;

// Client Info Schema
export const clientInfoSchema = z.object({
  name: z.string().optional(),
  rating: z.number().optional(),
  totalSpent: z.number().optional(),
  totalHires: z.number().optional(),
  location: z.string().optional(),
  verificationStatus: z.string().optional(),
  paymentVerified: z.boolean().optional(),
  companySize: z.string().optional(),
  industry: z.string().optional(),
});

export type ClientInfo = z.infer<typeof clientInfoSchema>;

// Job Schema
export const jobSchema = z.object({
  id: z.string().optional(),
  upworkJobId: z.string(),
  title: z.string(),
  description: z.string(),
  budget: z.string().optional(),
  budgetType: z.enum(["hourly", "fixed"]).optional(),
  skills: z.array(z.string()).default([]),
  clientInfo: clientInfoSchema.default({}),
  url: z.string().url(),
  postedAt: z.string().datetime().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  jobType: z.enum(["hourly", "fixed"]).optional(),
  experienceLevel: z.enum(["entry", "intermediate", "expert"]).optional(),
  duration: z.string().optional(),
  proposalCount: z.number().optional(),
  interviewsToHire: z.number().optional(),
  isInvitationOnly: z.boolean().optional(),
  tags: z.array(z.string()).default([]),
  attachments: z.array(z.string()).default([]),
});

export type Job = z.infer<typeof jobSchema>;

// Proposal Schema
export const proposalSchema = z.object({
  id: z.string().optional(),
  jobId: z.string(),
  coverLetter: z.string(),
  bid: z.object({
    amount: z.number(),
    type: z.enum(["hourly", "fixed"]),
    currency: z.string().default("USD"),
  }),
  timeline: z.string().optional(),
  milestones: z.array(z.object({
    title: z.string(),
    description: z.string(),
    amount: z.number(),
    dueDate: z.string().datetime().optional(),
  })).optional(),
  attachments: z.array(z.string()).default([]),
  questions: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).default([]),
  status: z.enum(["draft", "sent", "viewed", "interview", "hired", "declined"]).default("draft"),
  aiGenerated: z.boolean().default(false),
  confidence: z.number().min(0).max(100).optional(),
  reasoning: z.string().optional(),
  improvements: z.array(z.string()).default([]),
});

export type Proposal = z.infer<typeof proposalSchema>;

// Proposal Template Schema
export const proposalTemplateSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  content: z.string(),
  variables: z.array(z.object({
    key: z.string(),
    label: z.string(),
    type: z.enum(["text", "number", "date", "select"]),
    required: z.boolean().default(false),
    defaultValue: z.string().optional(),
    options: z.array(z.string()).optional(),
  })).default([]),
  tags: z.array(z.string()).default([]),
  isShared: z.boolean().default(false),
  usageCount: z.number().default(0),
  lastUsed: z.string().datetime().optional(),
});

export type ProposalTemplate = z.infer<typeof proposalTemplateSchema>;

// Proposal Generation Schema
export const proposalGenerationSchema = z.object({
  jobId: z.string(),
  templateId: z.string().optional(),
  customInstructions: z.string().optional(),
  tone: z.enum(["professional", "friendly", "confident", "casual"]).default("professional"),
  includePortfolio: z.boolean().default(true),
  includePricing: z.boolean().default(true),
  autoSave: z.boolean().default(false),
  bidRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  timeline: z.string().optional(),
  questions: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).default([]),
});

export type ProposalGeneration = z.infer<typeof proposalGenerationSchema>;

// User Settings Schema
export const userSettingsSchema = z.object({
  profile: z.object({
    title: z.string().optional(),
    overview: z.string().optional(),
    hourlyRate: z.number().optional(),
    skills: z.array(z.string()).default([]),
    portfolio: z.array(z.object({
      title: z.string(),
      description: z.string(),
      url: z.string().url().optional(),
      technologies: z.array(z.string()).default([]),
    })).default([]),
    certifications: z.array(z.object({
      name: z.string(),
      issuer: z.string(),
      date: z.string().datetime().optional(),
      url: z.string().url().optional(),
    })).default([]),
    languages: z.array(z.object({
      language: z.string(),
      proficiency: z.enum(["basic", "conversational", "fluent", "native"]),
    })).default([]),
  }).optional(),
  notifications: z.object({
    email: z.boolean().default(true),
    desktop: z.boolean().default(true),
    jobAlerts: z.boolean().default(true),
    proposalUpdates: z.boolean().default(true),
    clientMessages: z.boolean().default(true),
  }).default({}),
  automation: z.object({
    autoApply: z.boolean().default(false),
    autoApplySettings: z.object({
      minScore: z.number().min(0).max(100).default(80),
      maxDailyApplications: z.number().min(1).max(50).default(5),
      skipLowBudget: z.boolean().default(true),
      requireVerifiedClients: z.boolean().default(false),
    }).optional(),
    proposalGeneration: z.object({
      defaultTone: z.enum(["professional", "friendly", "confident", "casual"]).default("professional"),
      includePortfolio: z.boolean().default(true),
      includePricing: z.boolean().default(true),
      customSignature: z.string().optional(),
    }).optional(),
  }).default({}),
  privacy: z.object({
    profileVisibility: z.enum(["public", "upwork_only", "private"]).default("upwork_only"),
    showRealName: z.boolean().default(true),
    showLocation: z.boolean().default(true),
    showRates: z.boolean().default(false),
  }).default({}),
});

export type UserSettings = z.infer<typeof userSettingsSchema>;

// Organization Settings Schema
export const organizationSettingsSchema = z.object({
  company: z.object({
    name: z.string(),
    description: z.string().optional(),
    website: z.string().url().optional(),
    logo: z.string().url().optional(),
    industry: z.string().optional(),
    size: z.enum(["1-10", "11-50", "51-200", "201-500", "500+"]).optional(),
  }).optional(),
  billing: z.object({
    plan: z.enum(["free", "starter", "professional", "enterprise"]).default("free"),
    billingEmail: z.string().email().optional(),
    paymentMethod: z.string().optional(),
    billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
  }).default({}),
  features: z.object({
    aiProposals: z.boolean().default(true),
    automation: z.boolean().default(false),
    analytics: z.boolean().default(true),
    clientResearch: z.boolean().default(false),
    teamManagement: z.boolean().default(false),
    apiAccess: z.boolean().default(false),
  }).default({}),
  limits: z.object({
    monthlyProposals: z.number().default(50),
    aiTokens: z.number().default(100000),
    teamMembers: z.number().default(5),
    jobAlerts: z.number().default(10),
  }).default({}),
  integrations: z.object({
    upworkApi: z.object({
      enabled: z.boolean().default(false),
      apiKey: z.string().optional(),
      refreshToken: z.string().optional(),
    }).optional(),
    slack: z.object({
      enabled: z.boolean().default(false),
      webhookUrl: z.string().url().optional(),
    }).optional(),
    discord: z.object({
      enabled: z.boolean().default(false),
      webhookUrl: z.string().url().optional(),
    }).optional(),
  }).default({}),
});

export type OrganizationSettings = z.infer<typeof organizationSettingsSchema>;

// Performance Metrics Schema
export const performanceMetricsSchema = z.object({
  period: z.enum(["daily", "weekly", "monthly", "yearly"]),
  date: z.string().datetime(),
  metrics: z.object({
    proposalsSent: z.number().default(0),
    interviewsReceived: z.number().default(0),
    jobsWon: z.number().default(0),
    revenueEarned: z.number().default(0),
    successRate: z.number().min(0).max(100).default(0),
    responseRate: z.number().min(0).max(100).default(0),
    averageBidAmount: z.number().default(0),
    averageHourlyRate: z.number().default(0),
    clientSatisfaction: z.number().min(0).max(5).default(0),
    repeatClients: z.number().default(0),
  }),
  comparisons: z.object({
    previousPeriod: z.object({
      proposalsSent: z.number().default(0),
      interviewsReceived: z.number().default(0),
      jobsWon: z.number().default(0),
      revenueEarned: z.number().default(0),
      successRate: z.number().default(0),
      responseRate: z.number().default(0),
    }).optional(),
    percentageChanges: z.object({
      proposalsSent: z.number().default(0),
      interviewsReceived: z.number().default(0),
      jobsWon: z.number().default(0),
      revenueEarned: z.number().default(0),
      successRate: z.number().default(0),
      responseRate: z.number().default(0),
    }).optional(),
  }).optional(),
});

export type PerformanceMetrics = z.infer<typeof performanceMetricsSchema>;

// API Request/Response Schemas
export const createJobSchema = z.object({
  upworkJobId: z.string(),
  jobData: jobSchema,
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export const updateJobSchema = z.object({
  id: z.string(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  aiScore: z.number().min(0).max(100).optional(),
});

export const createProposalSchema = z.object({
  jobId: z.string(),
  proposalData: proposalSchema,
  templateId: z.string().optional(),
  aiGenerated: z.boolean().default(false),
});

export const updateProposalSchema = z.object({
  id: z.string(),
  proposalData: proposalSchema.partial(),
  status: z.enum(["draft", "sent", "viewed", "interview", "hired", "declined"]).optional(),
  sentAt: z.string().datetime().optional(),
  responseAt: z.string().datetime().optional(),
});

// Webhook Schemas
export const jobWebhookSchema = z.object({
  upworkJobId: z.string().min(1, 'Upwork job ID is required'),
  title: z.string().min(1, 'Job title is required'),
  description: z.string().min(1, 'Job description is required'),
  budget: z.string().optional(),
  skills: z.array(z.string()).default([]),
  clientInfo: clientInfoSchema.default({}),
  url: z.string().url('Valid job URL is required'),
  postedAt: z.string().datetime().optional(),
  category: z.string().optional(),
  jobType: z.enum(['hourly', 'fixed']).optional(),
  experienceLevel: z.enum(['entry', 'intermediate', 'expert']).optional(),
  duration: z.string().optional(),
  proposals: z.number().optional(),
  tenantId: z.string().uuid('Valid tenant ID is required'),
  webhookSecret: z.string().min(1, 'Webhook secret is required'),
});

// Automation Schemas
export const automationAnalyzeSchema = z.object({
  jobId: z.string().uuid('Valid job ID is required'),
  settings: z.object({
    minScore: z.number().min(0).max(100).default(70),
    autoApply: z.boolean().default(false),
    requireClientVerification: z.boolean().default(false),
    minBudget: z.number().optional(),
    maxProposals: z.number().optional(),
  }).optional(),
  executeAction: z.boolean().default(false),
});

export const cronJobSchema = z.object({
  maxJobs: z.number().min(1).max(100).default(20),
  autoProcess: z.boolean().default(false),
  notify: z.boolean().default(true),
  settings: z.object({
    minScore: z.number().min(0).max(100).default(80),
    maxDailyApplications: z.number().min(1).max(50).default(5),
  }).optional(),
});

// All schemas are already exported above