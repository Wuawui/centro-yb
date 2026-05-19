-- ============================================================
-- MIGRACIÓN 014: Estado de cuenta activo (God Mode)
-- YinbaoYB SaaS
-- ============================================================

-- Añadir columna de estado de cuenta a los tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Añadir política para que los Service Roles puedan hacer bypass a RLS
-- Por defecto Supabase ya otorga bypassrls a postgres y service_role,
-- así que no necesitamos una nueva policy en la tabla, el backend lo hará con el SUPER_KEY.
