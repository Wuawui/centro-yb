-- ============================================================
-- MIGRACIÓN 017: Índices de Rendimiento y Optimización de Consultas
-- YinbaoYB SaaS
-- ============================================================

-- 1. Optimizar consultas de alertas y dashboards de escalas clínicas (consultado por tenant_id y risk_alert)
CREATE INDEX IF NOT EXISTS idx_scale_results_tenant_risk 
  ON scale_results(tenant_id, risk_alert);

-- 2. Optimizar búsquedas y desvinculaciones por terapeuta en resultados de escalas
CREATE INDEX IF NOT EXISTS idx_scale_results_therapist 
  ON scale_results(therapist_id);

-- 3. Optimizar eliminación de usuarios y desvinculación de registros de auditoría
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id 
  ON audit_log(user_id);
