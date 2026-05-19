-- ============================================================
-- MIGRACIÓN 013: Tabla de pagos de pacientes
-- CentroYB SaaS — Solo gestión clínica, sin contabilidad
-- ============================================================

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  package_type TEXT NOT NULL DEFAULT 'Mensual'
    CHECK (package_type IN ('Mensual', 'Semanal', 'Sesión', 'Otro')),
  description TEXT,
  is_installment BOOLEAN DEFAULT false,
  total_amount DECIMAL(10,2),
  remaining_balance DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('paid', 'partial', 'pending', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);

-- RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver pagos del tenant"
  ON payments FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY "Crear pagos"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id()
    AND public.get_user_role() IN ('super_admin', 'director', 'coordinador', 'admin'));

CREATE POLICY "Modificar pagos"
  ON payments FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_tenant_id()
    AND public.get_user_role() IN ('super_admin', 'director', 'coordinador', 'admin'));

-- Triggers
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION log_audit();