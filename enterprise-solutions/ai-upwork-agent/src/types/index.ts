// Re-export validation types
export type {
  JobFilter,
  Job,
  Proposal,
  ProposalTemplate,
  ProposalGeneration,
  UserSettings,
  OrganizationSettings,
  PerformanceMetrics,
} from "@/lib/validations";

// Database types
export interface Tenant {
  id: string;
  name: string;
  clerkOrgId: string;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  clerkUserId: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "owner" | "admin" | "member" | "viewer";
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobAlert {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  filters: JobFilter;
  isActive: boolean;
  lastChecked: Date;
  createdAt: Date;
}

export interface SavedJob {
  id: string;
  tenantId: string;
  userId: string;
  jobId: string;
  jobData: Job;
  tags: string[];
  notes: string;
  aiScore: number;
  createdAt: Date;
}

export interface ProposalHistory {
  id: string;
  tenantId: string;
  userId: string;
  jobId: string;
  proposal: Proposal;
  status: "draft" | "sent" | "viewed" | "interview" | "hired" | "declined";
  aiGenerated: boolean;
  sentAt: Date | null;
  responseAt: Date | null;
  createdAt: Date;
}

export interface ClientResearch {
  id: string;
  tenantId: string;
  clientName: string;
  clientId: string;
  riskScore: number;
  insights: {
    totalHires: number;
    averageRating: number;
    paymentHistory: "verified" | "unverified" | "mixed";
    communicationStyle: string;
    projectTypes: string[];
    budgetRange: {
      min: number;
      max: number;
    };
  };
  notes: string;
  lastUpdated: Date;
}

// AI types
export interface AIProvider {
  name: string;
  model: string;
  apiKey: string;
  endpoint: string;
}

export interface AIUsage {
  id: string;
  tenantId: string;
  userId: string;
  provider: string;
  model: string;
  tokensUsed: number;
  cost: number;
  requestType: "proposal" | "analysis" | "chat" | "research";
  createdAt: Date;
}

export interface ProposalAIRequest {
  jobDescription: string;
  clientInfo: {
    name: string;
    history?: string;
    preferences?: string;
  };
  userProfile: {
    skills: string[];
    experience: string;
    portfolio?: string;
  };
  instructions?: string;
  tone: "professional" | "friendly" | "confident" | "casual";
}

export interface ProposalAIResponse {
  coverLetter: string;
  suggestedBid: number;
  confidence: number;
  reasoning: string;
  improvements: string[];
}

// Analytics types
export interface AnalyticsData {
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    proposalsSent: number;
    interviewsReceived: number;
    jobsWon: number;
    revenueEarned: number;
    successRate: number;
    responseRate: number;
    averageBidAmount: number;
  };
  trends: {
    metric: string;
    change: number;
    period: "day" | "week" | "month";
  }[];
  topSkills: {
    skill: string;
    count: number;
    successRate: number;
  }[];
  topClients: {
    name: string;
    revenue: number;
    projects: number;
  }[];
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// UI state types
export interface UIState {
  theme: "light" | "dark" | "system";
  sidebarOpen: boolean;
  loading: boolean;
  notifications: {
    id: string;
    type: "success" | "error" | "warning" | "info";
    message: string;
    createdAt: Date;
  }[];
}

export interface JobsState {
  jobs: Job[];
  filters: JobFilter;
  loading: boolean;
  selectedJob: Job | null;
  alerts: JobAlert[];
}

export interface ProposalsState {
  proposals: ProposalHistory[];
  templates: ProposalTemplate[];
  currentProposal: Proposal | null;
  aiGenerating: boolean;
}

export interface AnalyticsState {
  data: AnalyticsData | null;
  loading: boolean;
  selectedPeriod: {
    start: Date;
    end: Date;
  };
}

// Webhook types
export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors: Record<string, string[]>) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

export class AuthError extends AppError {
  constructor(message: string) {
    super(message, "AUTH_ERROR", 401);
    this.name = "AuthError";
  }
}

export class TenantError extends AppError {
  constructor(message: string) {
    super(message, "TENANT_ERROR", 403);
    this.name = "TenantError";
  }
}