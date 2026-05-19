-- 1. Ampliar tabla de pacientes para admitir equipo terapéutico extendido
ALTER TABLE patients ADD COLUMN IF NOT EXISTS secondary_therapist_ids UUID[] DEFAULT '{}'::uuid[];

-- 2. Permitir que los Terapeutas Secundarios puedan VER a sus pacientes asignados
DROP POLICY IF EXISTS "Terapeuta ve sus pacientes" ON patients;
CREATE POLICY "Terapeuta ve sus pacientes"
  ON patients FOR SELECT
  TO authenticated
  USING (
    tenant_id = auth.tenant_id()
    AND (
      auth.user_role() IN ('super_admin', 'director', 'coordinador', 'admin')
      OR therapist_id = auth.uid()
      OR auth.uid() = ANY(secondary_therapist_ids)
    )
  );

-- 3. Permitir que los Terapeutas Secundarios puedan MODIFICAR a sus pacientes asignados
DROP POLICY IF EXISTS "Modificar pacientes" ON patients;
CREATE POLICY "Modificar pacientes"
  ON patients FOR UPDATE
  TO authenticated
  USING (
    tenant_id = auth.tenant_id()
    AND (
      auth.user_role() IN ('super_admin', 'director', 'coordinador', 'admin')
      OR therapist_id = auth.uid()
      OR auth.uid() = ANY(secondary_therapist_ids)
    )
  );

-- 4. Permitir que los Terapeutas Secundarios vean las RESPUESTAS de escalas de sus pacientes
DROP POLICY IF EXISTS "Ver resultados del tenant" ON scale_results;
CREATE POLICY "Ver resultados del tenant"
  ON scale_results FOR SELECT
  TO authenticated
  USING (
    tenant_id = auth.tenant_id()
    AND (
      auth.user_role() IN ('super_admin', 'director', 'coordinador', 'admin', 'terapeuta')
      OR patient_id IN (SELECT id FROM patients WHERE therapist_id = auth.uid() OR auth.uid() = ANY(secondary_therapist_ids))
    )
  );
