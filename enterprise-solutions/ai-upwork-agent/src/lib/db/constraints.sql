-- Additional Constraints and Business Rules for Data Integrity
-- These constraints enforce business logic at the database level

-- Constraint: AI scores should be between 0 and 1
ALTER TABLE ai_upwork_saved_jobs
ADD CONSTRAINT check_ai_score_range
CHECK (ai_score IS NULL OR (ai_score >= 0 AND ai_score <= 1));

-- Constraint: Risk scores should be between 0 and 1
ALTER TABLE ai_upwork_client_research
ADD CONSTRAINT check_risk_score_range
CHECK (risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 1));

-- Constraint: Success rate should be between 0 and 100
ALTER TABLE ai_upwork_performance_metrics
ADD CONSTRAINT check_success_rate_range
CHECK (success_rate >= 0 AND success_rate <= 100);

-- Constraint: Response rate should be between 0 and 100
ALTER TABLE ai_upwork_performance_metrics
ADD CONSTRAINT check_response_rate_range
CHECK (response_rate >= 0 AND response_rate <= 100);

-- Constraint: Tokens used should be positive
ALTER TABLE ai_upwork_ai_usage
ADD CONSTRAINT check_tokens_positive
CHECK (tokens_used > 0);

-- Constraint: Cost should be non-negative
ALTER TABLE ai_upwork_ai_usage
ADD CONSTRAINT check_cost_non_negative
CHECK (cost IS NULL OR cost >= 0);

-- Constraint: Revenue earned should be non-negative
ALTER TABLE ai_upwork_performance_metrics
ADD CONSTRAINT check_revenue_non_negative
CHECK (revenue_earned >= 0);

-- Constraint: Average bid amount should be positive when set
ALTER TABLE ai_upwork_performance_metrics
ADD CONSTRAINT check_avg_bid_positive
CHECK (average_bid_amount IS NULL OR average_bid_amount > 0);

-- Constraint: Metric counts should be non-negative
ALTER TABLE ai_upwork_performance_metrics
ADD CONSTRAINT check_proposals_sent_non_negative
CHECK (proposals_sent >= 0);

ALTER TABLE ai_upwork_performance_metrics
ADD CONSTRAINT check_interviews_received_non_negative
CHECK (interviews_received >= 0);

ALTER TABLE ai_upwork_performance_metrics
ADD CONSTRAINT check_jobs_won_non_negative
CHECK (jobs_won >= 0);

-- Constraint: Jobs won cannot exceed interviews received
ALTER TABLE ai_upwork_performance_metrics
ADD CONSTRAINT check_jobs_won_vs_interviews
CHECK (jobs_won <= interviews_received);

-- Constraint: Interviews cannot exceed proposals sent
ALTER TABLE ai_upwork_performance_metrics
ADD CONSTRAINT check_interviews_vs_proposals
CHECK (interviews_received <= proposals_sent);

-- Constraint: Valid period values
ALTER TABLE ai_upwork_performance_metrics
ADD CONSTRAINT check_valid_period
CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly'));

-- Constraint: Email format validation
ALTER TABLE ai_upwork_users
ADD CONSTRAINT check_email_format
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Constraint: Tenant names should not be empty
ALTER TABLE ai_upwork_tenants
ADD CONSTRAINT check_name_not_empty
CHECK (length(trim(name)) > 0);

-- Constraint: Client names should not be empty
ALTER TABLE ai_upwork_client_research
ADD CONSTRAINT check_client_name_not_empty
CHECK (length(trim(client_name)) > 0);

-- Constraint: Proposal template names should not be empty
ALTER TABLE ai_upwork_proposal_templates
ADD CONSTRAINT check_template_name_not_empty
CHECK (length(trim(name)) > 0);

-- Constraint: Job alert names should not be empty
ALTER TABLE ai_upwork_job_alerts
ADD CONSTRAINT check_alert_name_not_empty
CHECK (length(trim(name)) > 0);

-- Index for performance: AI usage tracking by provider and model
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider_model_date
ON ai_upwork_ai_usage (tenant_id, provider, model, created_at);

-- Index for performance: Proposal history by status
CREATE INDEX IF NOT EXISTS idx_proposal_history_status_date
ON ai_upwork_proposal_history (tenant_id, status, created_at);

-- Index for performance: Job alerts active status
CREATE INDEX IF NOT EXISTS idx_job_alerts_active
ON ai_upwork_job_alerts (tenant_id, is_active, last_checked);

-- Index for performance: Performance metrics by period and date
CREATE INDEX IF NOT EXISTS idx_performance_metrics_period_date
ON ai_upwork_performance_metrics (tenant_id, period, date DESC);

-- Index for performance: Client research by risk score
CREATE INDEX IF NOT EXISTS idx_client_research_risk_score
ON ai_upwork_client_research (tenant_id, risk_score DESC)
WHERE risk_score IS NOT NULL;