-- ============================================================
-- MIGRACIÓN 015: Reparar llaves foráneas de Audit Log
-- YinbaoYB SaaS
-- ============================================================

-- Reparar la restricción del user_id (para que al borrar usuario no explote)
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_user_id_fkey;
ALTER TABLE audit_log ADD CONSTRAINT audit_log_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Reparar la restricción del tenant_id 
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_tenant_id_fkey;
ALTER TABLE audit_log ADD CONSTRAINT audit_log_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
