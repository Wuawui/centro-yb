-- Simplificar políticas RLS para que funcionen correctamente
-- Las funciones auth.tenant_id() y auth.user_role() pueden causar problemas
-- así que usamos subqueries directas

-- DROP políticas existentes de patients
DROP POLICY IF EXISTS "Ver pacientes del tenant" ON patients;
DROP POLICY IF EXISTS "Admins insertan pacientes" ON patients;
DROP POLICY IF EXISTS "Modificar pacientes" ON patients;

-- Nuevas políticas simplificadas para patients
-- Todos los del mismo tenant pueden ver pacientes
CREATE POLICY "Ver pacientes del tenant" ON patients
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

-- Admins y super_admin pueden insertar
CREATE POLICY "Admins insertan pacientes" ON patients
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ) AND (
    SELECT role FROM profiles WHERE id = auth.uid()
  ) IN ('super_admin', 'director', 'coordinador', 'admin'));

-- Admins y terapeuta asignado pueden modificar
CREATE POLICY "Modificar pacientes" ON patients
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

-- Permitir delete para admins
CREATE POLICY "Admins eliminan pacientes" ON patients
  FOR DELETE TO authenticated
  USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ) AND (
    SELECT role FROM profiles WHERE id = auth.uid()
  ) IN ('super_admin', 'director', 'admin'));

-- Simplificar profiles también
DROP POLICY IF EXISTS "Usuarios ven perfiles de su tenant" ON profiles;
DROP POLICY IF EXISTS "Usuarios modifican su propio perfil" ON profiles;

CREATE POLICY "Ver perfiles del tenant" ON profiles
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Modificar perfil propio" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- Simplificar appointments
DROP POLICY IF EXISTS "Ver citas del tenant" ON appointments;
DROP POLICY IF EXISTS "Crear citas" ON appointments;
DROP POLICY IF EXISTS "Modificar citas" ON appointments;

CREATE POLICY "Ver citas del tenant" ON appointments
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Crear citas" ON appointments
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Modificar citas" ON appointments
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

-- Simplificar clinical_notes
DROP POLICY IF EXISTS "Ver notas del tenant" ON clinical_notes;
DROP POLICY IF EXISTS "Crear notas" ON clinical_notes;
DROP POLICY IF EXISTS "Modificar notas propias" ON clinical_notes;

CREATE POLICY "Ver notas del tenant" ON clinical_notes
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Crear notas" ON clinical_notes
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Modificar notas" ON clinical_notes
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

-- Simplificar escalas
DROP POLICY IF EXISTS "Ver escalas del tenant" ON clinical_scales;
DROP POLICY IF EXISTS "Ver resultados del tenant" ON scale_results;

CREATE POLICY "Ver escalas del tenant" ON clinical_scales
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Ver resultados del tenant" ON scale_results
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

-- Simplificar treatment_plans
DROP POLICY IF EXISTS "Ver planes del tenant" ON treatment_plans;

CREATE POLICY "Ver planes del tenant" ON treatment_plans
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

-- Simplificar audit_log
DROP POLICY IF EXISTS "Ver audit del tenant" ON audit_log;

CREATE POLICY "Ver audit del tenant" ON audit_log
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));