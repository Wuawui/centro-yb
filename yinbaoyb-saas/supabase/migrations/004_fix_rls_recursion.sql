-- ============================================================
-- MIGRACIÓN 004: Fix infinite recursion in RLS
-- El problema: las políticas de profiles se referencian a sí mismas
-- La solución: usar funciones SECURITY DEFINER que bypassan RLS
-- ============================================================

-- 1. Crear funciones helper que NO pasan por RLS
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Eliminar TODAS las políticas existentes de patients
DROP POLICY IF EXISTS "Ver pacientes del tenant" ON patients;
DROP POLICY IF EXISTS "Admins insertan pacientes" ON patients;
DROP POLICY IF EXISTS "Modificar pacientes" ON patients;
DROP POLICY IF EXISTS "Admins eliminan pacientes" ON patients;

-- 3. Crear políticas de patients usando las funciones
CREATE POLICY "patients_select" ON patients FOR SELECT TO authenticated
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY "patients_insert" ON patients FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id() AND public.get_user_role() IN ('super_admin', 'director', 'coordinador', 'admin'));

CREATE POLICY "patients_update" ON patients FOR UPDATE TO authenticated
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY "patients_delete" ON patients FOR DELETE TO authenticated
  USING (tenant_id = public.get_tenant_id() AND public.get_user_role() IN ('super_admin', 'director', 'admin'));

-- 4. Fix profiles - la clave: NO usar subquery de profiles en policies de profiles
DROP POLICY IF EXISTS "Ver perfiles del tenant" ON profiles;
DROP POLICY IF EXISTS "Modificar perfil propio" ON profiles;
DROP POLICY IF EXISTS "Usuarios ven perfiles de su tenant" ON profiles;
DROP POLICY IF EXISTS "Usuarios modifican su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Super admin ve todos los tenants" ON tenants;
DROP POLICY IF EXISTS "Usuarios ven su propio tenant" ON tenants;

-- Profiles: ver tu propio perfil SIEMPRE, y los del mismo tenant
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR tenant_id = public.get_tenant_id());

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- 5. Fix tenants
CREATE POLICY "tenants_select" ON tenants FOR SELECT TO authenticated
  USING (id = public.get_tenant_id() OR public.get_user_role() = 'super_admin');

-- 6. Fix appointments
DROP POLICY IF EXISTS "Ver citas del tenant" ON appointments;
DROP POLICY IF EXISTS "Crear citas" ON appointments;
DROP POLICY IF EXISTS "Modificar citas" ON appointments;

CREATE POLICY "appointments_select" ON appointments FOR SELECT TO authenticated
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY "appointments_insert" ON appointments FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY "appointments_update" ON appointments FOR UPDATE TO authenticated
  USING (tenant_id = public.get_tenant_id());

-- 7. Fix clinical_notes
DROP POLICY IF EXISTS "Ver notas del tenant" ON clinical_notes;
DROP POLICY IF EXISTS "Crear notas" ON clinical_notes;
DROP POLICY IF EXISTS "Modificar notas" ON clinical_notes;

CREATE POLICY "notes_select" ON clinical_notes FOR SELECT TO authenticated
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY "notes_insert" ON clinical_notes FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE POLICY "notes_update" ON clinical_notes FOR UPDATE TO authenticated
  USING (tenant_id = public.get_tenant_id());

-- 8. Fix scales
DROP POLICY IF EXISTS "Ver escalas del tenant" ON clinical_scales;
DROP POLICY IF EXISTS "Ver resultados del tenant" ON scale_results;

CREATE POLICY "scales_select" ON clinical_scales FOR SELECT TO authenticated
  USING (tenant_id = public.get_tenant_id());

CREATE POLICY "results_select" ON scale_results FOR SELECT TO authenticated
  USING (tenant_id = public.get_tenant_id());

-- 9. Fix treatment_plans
DROP POLICY IF EXISTS "Ver planes del tenant" ON treatment_plans;

CREATE POLICY "plans_select" ON treatment_plans FOR SELECT TO authenticated
  USING (tenant_id = public.get_tenant_id());

-- 10. Fix treatment_objectives
DROP POLICY IF EXISTS "Ver objetivos del tenant" ON treatment_objectives;

CREATE POLICY "objectives_select" ON treatment_objectives FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM treatment_plans WHERE treatment_plans.id = treatment_objectives.treatment_plan_id AND treatment_plans.tenant_id = public.get_tenant_id()));

-- 11. Fix therapists
DROP POLICY IF EXISTS "Ver terapeutas del tenant" ON therapists;

CREATE POLICY "therapists_select" ON therapists FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = therapists.id AND profiles.tenant_id = public.get_tenant_id()));

-- 12. Fix therapist_availability
DROP POLICY IF EXISTS "Ver disponibilidad del tenant" ON therapist_availability;

CREATE POLICY "availability_select" ON therapist_availability FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM therapists JOIN profiles ON profiles.id = therapists.id WHERE therapists.id = therapist_availability.therapist_id AND profiles.tenant_id = public.get_tenant_id()));

-- 13. Fix scale_questions
DROP POLICY IF EXISTS "Ver preguntas del tenant" ON scale_questions;

CREATE POLICY "questions_select" ON scale_questions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM clinical_scales WHERE clinical_scales.id = scale_questions.scale_id AND clinical_scales.tenant_id = public.get_tenant_id()));

-- 14. Fix audit_log
DROP POLICY IF EXISTS "Ver audit del tenant" ON audit_log;

CREATE POLICY "audit_select" ON audit_log FOR SELECT TO authenticated
  USING (tenant_id = public.get_tenant_id() AND public.get_user_role() IN ('super_admin', 'director'));