-- Enable Row Level Security on all tables
ALTER TABLE ai_upwork_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_upwork_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_upwork_job_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_upwork_saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_upwork_proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_upwork_proposal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_upwork_client_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_upwork_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_upwork_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create function to get current tenant ID from session
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
  RETURN COALESCE(
    current_setting('app.current_tenant_id', true)::UUID,
    NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current user ID from session
CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
BEGIN
  RETURN COALESCE(
    current_setting('app.current_user_id', true)::UUID,
    NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tenants table policies (only allow access to own tenant)
CREATE POLICY tenant_isolation_tenants ON ai_upwork_tenants
  FOR ALL USING (id = current_tenant_id());

-- Users table policies
CREATE POLICY tenant_isolation_users ON ai_upwork_users
  FOR ALL USING (tenant_id = current_tenant_id());

-- Job alerts policies
CREATE POLICY tenant_isolation_job_alerts ON ai_upwork_job_alerts
  FOR ALL USING (tenant_id = current_tenant_id());

-- Saved jobs policies
CREATE POLICY tenant_isolation_saved_jobs ON ai_upwork_saved_jobs
  FOR ALL USING (tenant_id = current_tenant_id());

-- Proposal templates policies
CREATE POLICY tenant_isolation_proposal_templates ON ai_upwork_proposal_templates
  FOR ALL USING (tenant_id = current_tenant_id());

-- Proposal history policies
CREATE POLICY tenant_isolation_proposal_history ON ai_upwork_proposal_history
  FOR ALL USING (tenant_id = current_tenant_id());

-- Client research policies
CREATE POLICY tenant_isolation_client_research ON ai_upwork_client_research
  FOR ALL USING (tenant_id = current_tenant_id());

-- AI usage policies
CREATE POLICY tenant_isolation_ai_usage ON ai_upwork_ai_usage
  FOR ALL USING (tenant_id = current_tenant_id());

-- Performance metrics policies
CREATE POLICY tenant_isolation_performance_metrics ON ai_upwork_performance_metrics
  FOR ALL USING (tenant_id = current_tenant_id());

-- Additional user-specific policies for data owned by users
CREATE POLICY user_isolation_job_alerts ON ai_upwork_job_alerts
  FOR ALL USING (tenant_id = current_tenant_id() AND user_id = current_user_id());

CREATE POLICY user_isolation_saved_jobs ON ai_upwork_saved_jobs
  FOR ALL USING (tenant_id = current_tenant_id() AND user_id = current_user_id());

CREATE POLICY user_isolation_proposal_templates ON ai_upwork_proposal_templates
  FOR ALL USING (
    tenant_id = current_tenant_id() AND
    (user_id = current_user_id() OR is_shared = true)
  );

CREATE POLICY user_isolation_proposal_history ON ai_upwork_proposal_history
  FOR ALL USING (tenant_id = current_tenant_id() AND user_id = current_user_id());

CREATE POLICY user_isolation_ai_usage ON ai_upwork_ai_usage
  FOR ALL USING (tenant_id = current_tenant_id() AND user_id = current_user_id());

CREATE POLICY user_isolation_performance_metrics ON ai_upwork_performance_metrics
  FOR ALL USING (tenant_id = current_tenant_id() AND user_id = current_user_id());

-- Create indexes for performance with RLS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant_clerk
  ON ai_upwork_users(tenant_id, clerk_user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_alerts_tenant_user_active
  ON ai_upwork_job_alerts(tenant_id, user_id, is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_jobs_tenant_user_created
  ON ai_upwork_saved_jobs(tenant_id, user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposal_history_tenant_user_status
  ON ai_upwork_proposal_history(tenant_id, user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_usage_tenant_user_created
  ON ai_upwork_ai_usage(tenant_id, user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_tenant_user_period
  ON ai_upwork_performance_metrics(tenant_id, user_id, period, date DESC);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;