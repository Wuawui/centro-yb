-- ============================================================
-- MIGRACIÓN 006 + 007 COMBINADAS - Ejecutar en Supabase SQL Editor
-- Solo incluye lo que FALTA (verificado por check-db-state)
-- ============================================================

-- === LO QUE FALTA DE 006 ===

-- profiles.email
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- clinical_scales.name and acronym
ALTER TABLE clinical_scales ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE clinical_scales ADD COLUMN IF NOT EXISTS acronym TEXT;

-- Populate name and acronym
UPDATE clinical_scales SET
  name = CASE type
    WHEN 'PHQ-9' THEN 'Patient Health Questionnaire-9'
    WHEN 'GAD-7' THEN 'Generalized Anxiety Disorder-7'
    WHEN 'PCL-5' THEN 'PTSD Checklist for DSM-5'
    WHEN 'BDI-II' THEN 'Beck Depression Inventory-II'
    WHEN 'SRS' THEN 'Session Rating Scale'
    WHEN 'ORS' THEN 'Outcome Rating Scale'
    ELSE COALESCE(custom_name, type)
  END,
  acronym = CASE type
    WHEN 'PHQ-9' THEN 'PHQ-9'
    WHEN 'GAD-7' THEN 'GAD-7'
    WHEN 'PCL-5' THEN 'PCL-5'
    WHEN 'BDI-II' THEN 'BDI-II'
    WHEN 'SRS' THEN 'SRS'
    WHEN 'ORS' THEN 'ORS'
    ELSE type
  END
WHERE name IS NULL OR acronym IS NULL;

-- scale_results insert/update policies
DROP POLICY IF EXISTS "results_insert" ON scale_results;
CREATE POLICY "results_insert" ON scale_results FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id());

DROP POLICY IF EXISTS "results_update" ON scale_results;
CREATE POLICY "results_update" ON scale_results FOR UPDATE TO authenticated
  USING (tenant_id = public.get_tenant_id());

-- appointments delete policy
DROP POLICY IF EXISTS "appointments_delete" ON appointments;
CREATE POLICY "appointments_delete" ON appointments FOR DELETE TO authenticated
  USING (tenant_id = public.get_tenant_id());

-- therapist_availability insert/delete policies
DROP POLICY IF EXISTS "availability_insert" ON therapist_availability;
CREATE POLICY "availability_insert" ON therapist_availability FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM therapists JOIN profiles ON profiles.id = therapists.id WHERE therapists.id = therapist_availability.therapist_id AND profiles.id = auth.uid()));

DROP POLICY IF EXISTS "availability_delete" ON therapist_availability;
CREATE POLICY "availability_delete" ON therapist_availability FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM therapists JOIN profiles ON profiles.id = therapists.id WHERE therapists.id = therapist_availability.therapist_id AND profiles.id = auth.uid()));

-- scale_questions insert policy
DROP POLICY IF EXISTS "questions_insert" ON scale_questions;
CREATE POLICY "questions_insert" ON scale_questions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM clinical_scales WHERE clinical_scales.id = scale_questions.scale_id AND clinical_scales.tenant_id = public.get_tenant_id()));

-- scale_results delete policy
DROP POLICY IF EXISTS "results_delete" ON scale_results;
CREATE POLICY "results_delete" ON scale_results FOR DELETE TO authenticated
  USING (tenant_id = public.get_tenant_id());

-- clinical_notes delete policy
DROP POLICY IF EXISTS "notes_delete" ON clinical_notes;
CREATE POLICY "notes_delete" ON clinical_notes FOR DELETE TO authenticated
  USING (tenant_id = public.get_tenant_id() AND public.get_user_role() IN ('super_admin', 'director', 'admin'));

-- parent_patients insert/delete policies
DROP POLICY IF EXISTS "parent_patients_insert_self" ON parent_patients;
CREATE POLICY "parent_patients_insert_self" ON parent_patients FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id());

DROP POLICY IF EXISTS "parent_patients_delete_self" ON parent_patients;
CREATE POLICY "parent_patients_delete_self" ON parent_patients FOR DELETE TO authenticated
  USING (tenant_id = public.get_tenant_id());

-- profiles insert policy
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id() OR public.get_user_role() IN ('super_admin', 'director'));

-- therapists insert/update policies
DROP POLICY IF EXISTS "therapists_insert" ON therapists;
CREATE POLICY "therapists_insert" ON therapists FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = therapists.id AND profiles.tenant_id = public.get_tenant_id()));

DROP POLICY IF EXISTS "therapists_update" ON therapists;
CREATE POLICY "therapists_update" ON therapists FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = therapists.id AND profiles.tenant_id = public.get_tenant_id()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_patients_active ON patients(active);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_therapist ON appointments(therapist_id);

-- RPC: get_all_users
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE(id UUID, first_name TEXT, last_name TEXT, email TEXT, phone TEXT, role TEXT, active BOOLEAN)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT p.id, p.first_name, p.last_name, p.email, p.phone, p.role, p.active
  FROM profiles p
  WHERE p.tenant_id = public.get_tenant_id()
  ORDER BY p.role, p.first_name;
$$;

-- === LO QUE FALTA DE 007 ===

-- RLS: Padres pueden actualizar su propio perfil
DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- RLS: Padres pueden leer su propio perfil
DROP POLICY IF EXISTS "profiles_select_self" ON profiles;
CREATE POLICY "profiles_select_self" ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR tenant_id = public.get_tenant_id());

-- RPC: update_parent_profile (SECURITY DEFINER para evitar RLS issues)
CREATE OR REPLACE FUNCTION public.update_parent_profile(
  p_user_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_phone TEXT
)
RETURNS TABLE(success BOOLEAN)
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE profiles
  SET first_name = p_first_name,
      last_name = p_last_name,
      phone = p_phone,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING true AS success;
$$;

-- RLS: Padres pueden leer parent_patients (sus propios links)
DROP POLICY IF EXISTS "parent_patients_select_self" ON parent_patients;
CREATE POLICY "parent_patients_select_self" ON parent_patients FOR SELECT TO authenticated
  USING (parent_id = auth.uid() OR tenant_id = public.get_tenant_id());