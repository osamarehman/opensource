-- Initial Schema Migration for AI Upwork Agent
-- Generated from Drizzle schema definitions

-- Create tables with proper constraints and indexes

CREATE TABLE IF NOT EXISTS "ai_upwork_tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"clerk_org_id" text NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ai_upwork_tenants_clerk_org_id_unique" UNIQUE("clerk_org_id")
);

CREATE TABLE IF NOT EXISTS "ai_upwork_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"role" text DEFAULT 'member' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ai_upwork_users_clerk_user_id_unique" UNIQUE("clerk_user_id")
);

CREATE TABLE IF NOT EXISTS "ai_upwork_job_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"filters" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_checked" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ai_upwork_saved_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"upwork_job_id" text NOT NULL,
	"job_data" jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"ai_score" numeric(3, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ai_upwork_proposal_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"variables" jsonb DEFAULT '[]'::jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"is_shared" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ai_upwork_proposal_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"upwork_job_id" text NOT NULL,
	"proposal_data" jsonb NOT NULL,
	"status" text DEFAULT 'draft',
	"ai_generated" boolean DEFAULT false,
	"template_id" uuid,
	"sent_at" timestamp,
	"response_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ai_upwork_client_research" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"client_name" text NOT NULL,
	"upwork_client_id" text NOT NULL,
	"risk_score" numeric(3, 2),
	"insights" jsonb NOT NULL,
	"notes" text,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ai_upwork_ai_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"tokens_used" integer NOT NULL,
	"cost" numeric(10, 6),
	"request_type" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ai_upwork_performance_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"period" text NOT NULL,
	"date" timestamp NOT NULL,
	"proposals_sent" integer DEFAULT 0,
	"interviews_received" integer DEFAULT 0,
	"jobs_won" integer DEFAULT 0,
	"revenue_earned" numeric(10, 2) DEFAULT '0',
	"success_rate" numeric(5, 2) DEFAULT '0',
	"response_rate" numeric(5, 2) DEFAULT '0',
	"average_bid_amount" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "ai_upwork_users" ADD CONSTRAINT "ai_upwork_users_tenant_id_ai_upwork_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "ai_upwork_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_upwork_job_alerts" ADD CONSTRAINT "ai_upwork_job_alerts_tenant_id_ai_upwork_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "ai_upwork_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_upwork_job_alerts" ADD CONSTRAINT "ai_upwork_job_alerts_user_id_ai_upwork_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "ai_upwork_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_upwork_saved_jobs" ADD CONSTRAINT "ai_upwork_saved_jobs_tenant_id_ai_upwork_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "ai_upwork_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_upwork_saved_jobs" ADD CONSTRAINT "ai_upwork_saved_jobs_user_id_ai_upwork_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "ai_upwork_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_upwork_proposal_templates" ADD CONSTRAINT "ai_upwork_proposal_templates_tenant_id_ai_upwork_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "ai_upwork_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_upwork_proposal_templates" ADD CONSTRAINT "ai_upwork_proposal_templates_user_id_ai_upwork_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "ai_upwork_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_upwork_proposal_history" ADD CONSTRAINT "ai_upwork_proposal_history_tenant_id_ai_upwork_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "ai_upwork_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_upwork_proposal_history" ADD CONSTRAINT "ai_upwork_proposal_history_user_id_ai_upwork_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "ai_upwork_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_upwork_proposal_history" ADD CONSTRAINT "ai_upwork_proposal_history_template_id_ai_upwork_proposal_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "ai_upwork_proposal_templates"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_upwork_client_research" ADD CONSTRAINT "ai_upwork_client_research_tenant_id_ai_upwork_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "ai_upwork_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_upwork_ai_usage" ADD CONSTRAINT "ai_upwork_ai_usage_tenant_id_ai_upwork_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "ai_upwork_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_upwork_ai_usage" ADD CONSTRAINT "ai_upwork_ai_usage_user_id_ai_upwork_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "ai_upwork_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_upwork_performance_metrics" ADD CONSTRAINT "ai_upwork_performance_metrics_tenant_id_ai_upwork_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "ai_upwork_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_upwork_performance_metrics" ADD CONSTRAINT "ai_upwork_performance_metrics_user_id_ai_upwork_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "ai_upwork_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_clerk_org_id_idx" ON "ai_upwork_tenants" ("clerk_org_id");
CREATE UNIQUE INDEX IF NOT EXISTS "users_clerk_user_id_idx" ON "ai_upwork_users" ("clerk_user_id");
CREATE INDEX IF NOT EXISTS "users_tenant_id_idx" ON "ai_upwork_users" ("tenant_id");
CREATE INDEX IF NOT EXISTS "users_tenant_user_idx" ON "ai_upwork_users" ("tenant_id","id");
CREATE INDEX IF NOT EXISTS "job_alerts_tenant_id_idx" ON "ai_upwork_job_alerts" ("tenant_id");
CREATE INDEX IF NOT EXISTS "job_alerts_user_id_idx" ON "ai_upwork_job_alerts" ("user_id");
CREATE INDEX IF NOT EXISTS "job_alerts_tenant_created_idx" ON "ai_upwork_job_alerts" ("tenant_id","created_at");
CREATE INDEX IF NOT EXISTS "saved_jobs_tenant_id_idx" ON "ai_upwork_saved_jobs" ("tenant_id");
CREATE INDEX IF NOT EXISTS "saved_jobs_user_id_idx" ON "ai_upwork_saved_jobs" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "saved_jobs_tenant_job_idx" ON "ai_upwork_saved_jobs" ("tenant_id","upwork_job_id");
CREATE INDEX IF NOT EXISTS "saved_jobs_tenant_created_idx" ON "ai_upwork_saved_jobs" ("tenant_id","created_at");
CREATE INDEX IF NOT EXISTS "proposal_templates_tenant_id_idx" ON "ai_upwork_proposal_templates" ("tenant_id");
CREATE INDEX IF NOT EXISTS "proposal_templates_user_id_idx" ON "ai_upwork_proposal_templates" ("user_id");
CREATE INDEX IF NOT EXISTS "proposal_templates_tenant_created_idx" ON "ai_upwork_proposal_templates" ("tenant_id","created_at");
CREATE INDEX IF NOT EXISTS "proposal_history_tenant_id_idx" ON "ai_upwork_proposal_history" ("tenant_id");
CREATE INDEX IF NOT EXISTS "proposal_history_user_id_idx" ON "ai_upwork_proposal_history" ("user_id");
CREATE INDEX IF NOT EXISTS "proposal_history_status_idx" ON "ai_upwork_proposal_history" ("status");
CREATE INDEX IF NOT EXISTS "proposal_history_tenant_created_idx" ON "ai_upwork_proposal_history" ("tenant_id","created_at");
CREATE INDEX IF NOT EXISTS "client_research_tenant_id_idx" ON "ai_upwork_client_research" ("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "client_research_client_id_idx" ON "ai_upwork_client_research" ("tenant_id","upwork_client_id");
CREATE INDEX IF NOT EXISTS "client_research_tenant_updated_idx" ON "ai_upwork_client_research" ("tenant_id","last_updated");
CREATE INDEX IF NOT EXISTS "ai_usage_tenant_id_idx" ON "ai_upwork_ai_usage" ("tenant_id");
CREATE INDEX IF NOT EXISTS "ai_usage_user_id_idx" ON "ai_upwork_ai_usage" ("user_id");
CREATE INDEX IF NOT EXISTS "ai_usage_provider_idx" ON "ai_upwork_ai_usage" ("provider");
CREATE INDEX IF NOT EXISTS "ai_usage_tenant_created_idx" ON "ai_upwork_ai_usage" ("tenant_id","created_at");
CREATE INDEX IF NOT EXISTS "performance_metrics_tenant_id_idx" ON "ai_upwork_performance_metrics" ("tenant_id");
CREATE INDEX IF NOT EXISTS "performance_metrics_user_id_idx" ON "ai_upwork_performance_metrics" ("user_id");
CREATE INDEX IF NOT EXISTS "performance_metrics_period_idx" ON "ai_upwork_performance_metrics" ("period");
CREATE UNIQUE INDEX IF NOT EXISTS "performance_metrics_tenant_date_idx" ON "ai_upwork_performance_metrics" ("tenant_id","user_id","period","date");