import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  decimal,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Tenants table - maps to Clerk organizations
export const tenants = pgTable(
  "ai_upwork_tenants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    clerkOrgId: text("clerk_org_id").notNull().unique(),
    settings: jsonb("settings").default({}),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    clerkOrgIdIdx: uniqueIndex("tenants_clerk_org_id_idx").on(table.clerkOrgId),
  })
);

// Users table - maps to Clerk users with tenant relationship
export const users = pgTable(
  "ai_upwork_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id").notNull().unique(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    email: text("email").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    role: text("role", { enum: ["owner", "admin", "member", "viewer"] })
      .default("member")
      .notNull(),
    settings: jsonb("settings").default({}),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    clerkUserIdIdx: uniqueIndex("users_clerk_user_id_idx").on(table.clerkUserId),
    tenantIdIdx: index("users_tenant_id_idx").on(table.tenantId),
    tenantUserIdx: index("users_tenant_user_idx").on(table.tenantId, table.id),
  })
);

// Job alerts for automated job discovery
export const jobAlerts = pgTable(
  "ai_upwork_job_alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    name: text("name").notNull(),
    filters: jsonb("filters").notNull(),
    isActive: boolean("is_active").default(true),
    lastChecked: timestamp("last_checked"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("job_alerts_tenant_id_idx").on(table.tenantId),
    userIdIdx: index("job_alerts_user_id_idx").on(table.userId),
    tenantCreatedIdx: index("job_alerts_tenant_created_idx").on(
      table.tenantId,
      table.createdAt
    ),
  })
);

// Saved jobs from Upwork
export const savedJobs = pgTable(
  "ai_upwork_saved_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    upworkJobId: text("upwork_job_id").notNull(),
    jobData: jsonb("job_data").notNull(),
    tags: jsonb("tags").default([]),
    notes: text("notes"),
    aiScore: decimal("ai_score", { precision: 3, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("saved_jobs_tenant_id_idx").on(table.tenantId),
    userIdIdx: index("saved_jobs_user_id_idx").on(table.userId),
    tenantJobIdx: uniqueIndex("saved_jobs_tenant_job_idx").on(
      table.tenantId,
      table.upworkJobId
    ),
    tenantCreatedIdx: index("saved_jobs_tenant_created_idx").on(
      table.tenantId,
      table.createdAt
    ),
  })
);

// Proposal templates
export const proposalTemplates = pgTable(
  "ai_upwork_proposal_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    name: text("name").notNull(),
    content: text("content").notNull(),
    variables: jsonb("variables").default([]),
    tags: jsonb("tags").default([]),
    isShared: boolean("is_shared").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("proposal_templates_tenant_id_idx").on(table.tenantId),
    userIdIdx: index("proposal_templates_user_id_idx").on(table.userId),
    tenantCreatedIdx: index("proposal_templates_tenant_created_idx").on(
      table.tenantId,
      table.createdAt
    ),
  })
);

// Proposal history and tracking
export const proposalHistory = pgTable(
  "ai_upwork_proposal_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    upworkJobId: text("upwork_job_id").notNull(),
    proposalData: jsonb("proposal_data").notNull(),
    status: text("status", {
      enum: ["draft", "sent", "viewed", "interview", "hired", "declined"],
    }).default("draft"),
    aiGenerated: boolean("ai_generated").default(false),
    templateId: uuid("template_id").references(() => proposalTemplates.id),
    sentAt: timestamp("sent_at"),
    responseAt: timestamp("response_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("proposal_history_tenant_id_idx").on(table.tenantId),
    userIdIdx: index("proposal_history_user_id_idx").on(table.userId),
    statusIdx: index("proposal_history_status_idx").on(table.status),
    tenantCreatedIdx: index("proposal_history_tenant_created_idx").on(
      table.tenantId,
      table.createdAt
    ),
  })
);

// Client research and intelligence
export const clientResearch = pgTable(
  "ai_upwork_client_research",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    clientName: text("client_name").notNull(),
    upworkClientId: text("upwork_client_id").notNull(),
    riskScore: decimal("risk_score", { precision: 3, scale: 2 }),
    insights: jsonb("insights").notNull(),
    notes: text("notes"),
    lastUpdated: timestamp("last_updated").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("client_research_tenant_id_idx").on(table.tenantId),
    clientIdIdx: uniqueIndex("client_research_client_id_idx").on(
      table.tenantId,
      table.upworkClientId
    ),
    tenantUpdatedIdx: index("client_research_tenant_updated_idx").on(
      table.tenantId,
      table.lastUpdated
    ),
  })
);

// AI usage tracking for billing and monitoring
export const aiUsage = pgTable(
  "ai_upwork_ai_usage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    provider: text("provider").notNull(), // openai, anthropic, etc.
    model: text("model").notNull(),
    tokensUsed: integer("tokens_used").notNull(),
    cost: decimal("cost", { precision: 10, scale: 6 }),
    requestType: text("request_type", {
      enum: ["proposal", "analysis", "chat", "research"],
    }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("ai_usage_tenant_id_idx").on(table.tenantId),
    userIdIdx: index("ai_usage_user_id_idx").on(table.userId),
    providerIdx: index("ai_usage_provider_idx").on(table.provider),
    tenantCreatedIdx: index("ai_usage_tenant_created_idx").on(
      table.tenantId,
      table.createdAt
    ),
  })
);

// Performance analytics and metrics
export const performanceMetrics = pgTable(
  "ai_upwork_performance_metrics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    period: text("period").notNull(), // daily, weekly, monthly
    date: timestamp("date").notNull(),
    proposalsSent: integer("proposals_sent").default(0),
    interviewsReceived: integer("interviews_received").default(0),
    jobsWon: integer("jobs_won").default(0),
    revenueEarned: decimal("revenue_earned", { precision: 10, scale: 2 }).default("0"),
    successRate: decimal("success_rate", { precision: 5, scale: 2 }).default("0"),
    responseRate: decimal("response_rate", { precision: 5, scale: 2 }).default("0"),
    averageBidAmount: decimal("average_bid_amount", { precision: 10, scale: 2 }).default("0"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("performance_metrics_tenant_id_idx").on(table.tenantId),
    userIdIdx: index("performance_metrics_user_id_idx").on(table.userId),
    periodIdx: index("performance_metrics_period_idx").on(table.period),
    tenantDateIdx: uniqueIndex("performance_metrics_tenant_date_idx").on(
      table.tenantId,
      table.userId,
      table.period,
      table.date
    ),
  })
);

// Define relationships
export const tenantRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  jobAlerts: many(jobAlerts),
  savedJobs: many(savedJobs),
  proposalTemplates: many(proposalTemplates),
  proposalHistory: many(proposalHistory),
  clientResearch: many(clientResearch),
  aiUsage: many(aiUsage),
  performanceMetrics: many(performanceMetrics),
}));

export const userRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  jobAlerts: many(jobAlerts),
  savedJobs: many(savedJobs),
  proposalTemplates: many(proposalTemplates),
  proposalHistory: many(proposalHistory),
  aiUsage: many(aiUsage),
  performanceMetrics: many(performanceMetrics),
}));

export const jobAlertRelations = relations(jobAlerts, ({ one }) => ({
  tenant: one(tenants, {
    fields: [jobAlerts.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [jobAlerts.userId],
    references: [users.id],
  }),
}));

export const savedJobRelations = relations(savedJobs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [savedJobs.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [savedJobs.userId],
    references: [users.id],
  }),
}));

export const proposalTemplateRelations = relations(proposalTemplates, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [proposalTemplates.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [proposalTemplates.userId],
    references: [users.id],
  }),
  proposalHistory: many(proposalHistory),
}));

export const proposalHistoryRelations = relations(proposalHistory, ({ one }) => ({
  tenant: one(tenants, {
    fields: [proposalHistory.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [proposalHistory.userId],
    references: [users.id],
  }),
  template: one(proposalTemplates, {
    fields: [proposalHistory.templateId],
    references: [proposalTemplates.id],
  }),
}));

export const clientResearchRelations = relations(clientResearch, ({ one }) => ({
  tenant: one(tenants, {
    fields: [clientResearch.tenantId],
    references: [tenants.id],
  }),
}));

export const aiUsageRelations = relations(aiUsage, ({ one }) => ({
  tenant: one(tenants, {
    fields: [aiUsage.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [aiUsage.userId],
    references: [users.id],
  }),
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({ one }) => ({
  tenant: one(tenants, {
    fields: [performanceMetrics.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [performanceMetrics.userId],
    references: [users.id],
  }),
}));

// Export all table types
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type JobAlert = typeof jobAlerts.$inferSelect;
export type NewJobAlert = typeof jobAlerts.$inferInsert;
export type SavedJob = typeof savedJobs.$inferSelect;
export type NewSavedJob = typeof savedJobs.$inferInsert;
export type ProposalTemplate = typeof proposalTemplates.$inferSelect;
export type NewProposalTemplate = typeof proposalTemplates.$inferInsert;
export type ProposalHistory = typeof proposalHistory.$inferSelect;
export type NewProposalHistory = typeof proposalHistory.$inferInsert;
export type ClientResearch = typeof clientResearch.$inferSelect;
export type NewClientResearch = typeof clientResearch.$inferInsert;
export type AIUsage = typeof aiUsage.$inferSelect;
export type NewAIUsage = typeof aiUsage.$inferInsert;
export type PerformanceMetrics = typeof performanceMetrics.$inferSelect;
export type NewPerformanceMetrics = typeof performanceMetrics.$inferInsert;