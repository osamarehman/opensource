export const APP_CONFIG = {
  name: "AI Upwork Agent",
  description: "Enterprise-grade AI-powered Upwork automation platform",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  version: "1.0.0",
} as const;

export const API_ROUTES = {
  upwork: {
    jobs: "/api/upwork/jobs",
    profile: "/api/upwork/profile",
    proposals: "/api/upwork/proposals",
  },
  ai: {
    proposal: "/api/ai/proposal",
    analysis: "/api/ai/analysis",
    chat: "/api/ai/chat",
  },
  analytics: {
    dashboard: "/api/analytics/dashboard",
    performance: "/api/analytics/performance",
  },
} as const;

export const USER_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
  VIEWER: "viewer",
} as const;

export const JOB_FILTERS = {
  EXPERIENCE_LEVELS: ["entry", "intermediate", "expert"] as const,
  JOB_TYPES: ["hourly", "fixed"] as const,
  CLIENT_HISTORY: ["no-hires", "1-9-hires", "10-plus-hires"] as const,
  PAYMENT_VERIFIED: ["payment-verified", "payment-unverified"] as const,
} as const;

export const AI_MODELS = {
  OPENAI: {
    GPT4: "gpt-4",
    GPT4_TURBO: "gpt-4-turbo-preview",
  },
  ANTHROPIC: {
    CLAUDE: "claude-3-sonnet-20240229",
    CLAUDE_HAIKU: "claude-3-haiku-20240307",
  },
} as const;

export const CACHE_KEYS = {
  JOBS: "jobs",
  PROPOSALS: "proposals",
  ANALYTICS: "analytics",
  CLIENT_DATA: "client_data",
} as const;

export const RATE_LIMITS = {
  UPWORK_API: {
    REQUESTS_PER_SECOND: 10,
    MAX_REQUESTS_PER_DAY: 40000,
  },
  AI_API: {
    REQUESTS_PER_MINUTE: 60,
    MAX_TOKENS_PER_DAY: 1000000,
  },
} as const;