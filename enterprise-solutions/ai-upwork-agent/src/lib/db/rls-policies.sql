-- Row-Level Security (RLS) Policies for Multi-Tenant Data Isolation
-- These policies ensure complete data isolation between tenants

-- Enable RLS on all tables
ALTER TABLE ai_upwork_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_upwork_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_upwork_job_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_upwork_saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_upwork_proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_upwork_proposal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_upwork_client_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_upwork_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_upwork_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Function to get current tenant ID from session variable
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.tenant_id', true), '')::UUID;
EXCEPTION
  WHEN others THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tenants: Users can only see their own tenant record
CREATE POLICY tenant_isolation_tenants ON ai_upwork_tenants
  USING (id = current_tenant_id());

-- Users: Users can only see users in their tenant
CREATE POLICY tenant_isolation_users ON ai_upwork_users
  USING (tenant_id = current_tenant_id());

-- Job Alerts: Users can only see job alerts in their tenant
CREATE POLICY tenant_isolation_job_alerts ON ai_upwork_job_alerts
  USING (tenant_id = current_tenant_id());

-- Saved Jobs: Users can only see saved jobs in their tenant
CREATE POLICY tenant_isolation_saved_jobs ON ai_upwork_saved_jobs
  USING (tenant_id = current_tenant_id());

-- Proposal Templates: Users can only see proposal templates in their tenant
CREATE POLICY tenant_isolation_proposal_templates ON ai_upwork_proposal_templates
  USING (tenant_id = current_tenant_id());

-- Proposal History: Users can only see proposal history in their tenant
CREATE POLICY tenant_isolation_proposal_history ON ai_upwork_proposal_history
  USING (tenant_id = current_tenant_id());

-- Client Research: Users can only see client research in their tenant
CREATE POLICY tenant_isolation_client_research ON ai_upwork_client_research
  USING (tenant_id = current_tenant_id());

-- AI Usage: Users can only see AI usage in their tenant
CREATE POLICY tenant_isolation_ai_usage ON ai_upwork_ai_usage
  USING (tenant_id = current_tenant_id());

-- Performance Metrics: Users can only see performance metrics in their tenant
CREATE POLICY tenant_isolation_performance_metrics ON ai_upwork_performance_metrics
  USING (tenant_id = current_tenant_id());

-- Additional security: Prevent bypassing RLS for non-superusers
CREATE POLICY deny_all_default_tenants ON ai_upwork_tenants FOR ALL TO PUBLIC USING (false);
CREATE POLICY deny_all_default_users ON ai_upwork_users FOR ALL TO PUBLIC USING (false);
CREATE POLICY deny_all_default_job_alerts ON ai_upwork_job_alerts FOR ALL TO PUBLIC USING (false);
CREATE POLICY deny_all_default_saved_jobs ON ai_upwork_saved_jobs FOR ALL TO PUBLIC USING (false);
CREATE POLICY deny_all_default_proposal_templates ON ai_upwork_proposal_templates FOR ALL TO PUBLIC USING (false);
CREATE POLICY deny_all_default_proposal_history ON ai_upwork_proposal_history FOR ALL TO PUBLIC USING (false);
CREATE POLICY deny_all_default_client_research ON ai_upwork_client_research FOR ALL TO PUBLIC USING (false);
CREATE POLICY deny_all_default_ai_usage ON ai_upwork_ai_usage FOR ALL TO PUBLIC USING (false);
CREATE POLICY deny_all_default_performance_metrics ON ai_upwork_performance_metrics FOR ALL TO PUBLIC USING (false);