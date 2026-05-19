-- ============================================================
-- MIGRACIÓN 012: Agregar tenant_id a therapist_availability
-- Esta tabla no tenía tenant_id, lo que causa errores en RLS
-- y al insertar registros desde el frontend.
-- ============================================================

-- Agregar columna tenant_id
ALTER TABLE therapist_availability
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Crear índice para performance
CREATE INDEX IF NOT EXISTS idx_therapist_availability_tenant ON therapist_availability(tenant_id);

-- Backfill: asignar tenant_id existente basado en el therapist_id → profiles → tenants
UPDATE therapist_availability ta
SET tenant_id = (
  SELECT p.tenant_id
  FROM therapists t
  JOIN profiles p ON p.id = t.id
  WHERE ta.therapist_id = t.id
)
WHERE ta.tenant_id IS NULL;

-- Agregar RLS policy para therapist_availability
CREATE POLICY "Ver disponibilidad del tenant"
  ON therapist_availability FOR SELECT
  TO authenticated
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "Crear disponibilidad"
  ON therapist_availability FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY "Modificar disponibilidad"
  ON therapist_availability FOR UPDATE
  TO authenticated
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "Eliminar disponibilidad"
  ON therapist_availability FOR DELETE
  TO authenticated
  USING (tenant_id = auth.tenant_id());

-- Agregar al trigger de audit
CREATE TRIGGER audit_therapist_availability AFTER INSERT OR UPDATE OR DELETE ON therapist_availability FOR EACH ROW EXECUTE FUNCTION log_audit();