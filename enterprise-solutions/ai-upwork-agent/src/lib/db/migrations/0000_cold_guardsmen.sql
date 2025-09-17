CREATE TABLE "ai_upwork_ai_usage" (
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
--> statement-breakpoint
CREATE TABLE "ai_upwork_client_research" (
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
--> statement-breakpoint
CREATE TABLE "ai_upwork_job_alerts" (
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
--> statement-breakpoint
CREATE TABLE "ai_upwork_performance_metrics" (
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
--> statement-breakpoint
CREATE TABLE "ai_upwork_proposal_history" (
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
--> statement-breakpoint
CREATE TABLE "ai_upwork_proposal_templates" (
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
--> statement-breakpoint
CREATE TABLE "ai_upwork_saved_jobs" (
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
--> statement-breakpoint
CREATE TABLE "ai_upwork_tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"clerk_org_id" text NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ai_upwork_tenants_clerk_org_id_unique" UNIQUE("clerk_org_id")
);
--> statement-breakpoint
CREATE TABLE "ai_upwork_users" (
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
--> statement-breakpoint
ALTER TABLE "ai_upwork_ai_usage" ADD CONSTRAINT "ai_upwork_ai_usage_tenant_id_ai_upwork_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."ai_upwork_tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_upwork_ai_usage" ADD CONSTRAINT "ai_upwork_ai_usage_user_id_ai_upwork_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ai_upwork_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_upwork_client_research" ADD CONSTRAINT "ai_upwork_client_research_tenant_id_ai_upwork_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."ai_upwork_tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_upwork_job_alerts" ADD CONSTRAINT "ai_upwork_job_alerts_tenant_id_ai_upwork_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."ai_upwork_tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_upwork_job_alerts" ADD CONSTRAINT "ai_upwork_job_alerts_user_id_ai_upwork_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ai_upwork_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_upwork_performance_metrics" ADD CONSTRAINT "ai_upwork_performance_metrics_tenant_id_ai_upwork_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."ai_upwork_tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_upwork_performance_metrics" ADD CONSTRAINT "ai_upwork_performance_metrics_user_id_ai_upwork_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ai_upwork_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_upwork_proposal_history" ADD CONSTRAINT "ai_upwork_proposal_history_tenant_id_ai_upwork_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."ai_upwork_tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_upwork_proposal_history" ADD CONSTRAINT "ai_upwork_proposal_history_user_id_ai_upwork_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ai_upwork_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_upwork_proposal_history" ADD CONSTRAINT "ai_upwork_proposal_history_template_id_ai_upwork_proposal_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."ai_upwork_proposal_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_upwork_proposal_templates" ADD CONSTRAINT "ai_upwork_proposal_templates_tenant_id_ai_upwork_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."ai_upwork_tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_upwork_proposal_templates" ADD CONSTRAINT "ai_upwork_proposal_templates_user_id_ai_upwork_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ai_upwork_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_upwork_saved_jobs" ADD CONSTRAINT "ai_upwork_saved_jobs_tenant_id_ai_upwork_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."ai_upwork_tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_upwork_saved_jobs" ADD CONSTRAINT "ai_upwork_saved_jobs_user_id_ai_upwork_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ai_upwork_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_upwork_users" ADD CONSTRAINT "ai_upwork_users_tenant_id_ai_upwork_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."ai_upwork_tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_usage_tenant_id_idx" ON "ai_upwork_ai_usage" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ai_usage_user_id_idx" ON "ai_upwork_ai_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_usage_provider_idx" ON "ai_upwork_ai_usage" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "ai_usage_tenant_created_idx" ON "ai_upwork_ai_usage" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "client_research_tenant_id_idx" ON "ai_upwork_client_research" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "client_research_client_id_idx" ON "ai_upwork_client_research" USING btree ("tenant_id","upwork_client_id");--> statement-breakpoint
CREATE INDEX "client_research_tenant_updated_idx" ON "ai_upwork_client_research" USING btree ("tenant_id","last_updated");--> statement-breakpoint
CREATE INDEX "job_alerts_tenant_id_idx" ON "ai_upwork_job_alerts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "job_alerts_user_id_idx" ON "ai_upwork_job_alerts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "job_alerts_tenant_created_idx" ON "ai_upwork_job_alerts" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "performance_metrics_tenant_id_idx" ON "ai_upwork_performance_metrics" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "performance_metrics_user_id_idx" ON "ai_upwork_performance_metrics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "performance_metrics_period_idx" ON "ai_upwork_performance_metrics" USING btree ("period");--> statement-breakpoint
CREATE UNIQUE INDEX "performance_metrics_tenant_date_idx" ON "ai_upwork_performance_metrics" USING btree ("tenant_id","user_id","period","date");--> statement-breakpoint
CREATE INDEX "proposal_history_tenant_id_idx" ON "ai_upwork_proposal_history" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "proposal_history_user_id_idx" ON "ai_upwork_proposal_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "proposal_history_status_idx" ON "ai_upwork_proposal_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "proposal_history_tenant_created_idx" ON "ai_upwork_proposal_history" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "proposal_templates_tenant_id_idx" ON "ai_upwork_proposal_templates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "proposal_templates_user_id_idx" ON "ai_upwork_proposal_templates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "proposal_templates_tenant_created_idx" ON "ai_upwork_proposal_templates" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "saved_jobs_tenant_id_idx" ON "ai_upwork_saved_jobs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "saved_jobs_user_id_idx" ON "ai_upwork_saved_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_jobs_tenant_job_idx" ON "ai_upwork_saved_jobs" USING btree ("tenant_id","upwork_job_id");--> statement-breakpoint
CREATE INDEX "saved_jobs_tenant_created_idx" ON "ai_upwork_saved_jobs" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_clerk_org_id_idx" ON "ai_upwork_tenants" USING btree ("clerk_org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_clerk_user_id_idx" ON "ai_upwork_users" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "users_tenant_id_idx" ON "ai_upwork_users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "users_tenant_user_idx" ON "ai_upwork_users" USING btree ("tenant_id","id");