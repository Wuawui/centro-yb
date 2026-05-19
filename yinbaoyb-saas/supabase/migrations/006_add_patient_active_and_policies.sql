-- ============================================================
-- MIGRACIÓN 006: Add active column to patients + missing columns
-- The codebase references patients.active but the column doesn't exist
-- ============================================================

-- 1. Add active column to patients
ALTER TABLE patients ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- 2. Add missing columns referenced by parent portal (from 005 but may not have been applied)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES profiles(id);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_phone TEXT;

-- 3. Add insert/update policies for scale_results (missing from 004)
DROP POLICY IF EXISTS "results_insert" ON scale_results;
CREATE POLICY "results_insert" ON scale_results FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id());

DROP POLICY IF EXISTS "results_update" ON scale_results;
CREATE POLICY "results_update" ON scale_results FOR UPDATE TO authenticated
  USING (tenant_id = public.get_tenant_id());

-- 4. Add delete policies for appointments (missing)
DROP POLICY IF EXISTS "appointments_delete" ON appointments;
CREATE POLICY "appointments_delete" ON appointments FOR DELETE TO authenticated
  USING (tenant_id = public.get_tenant_id());

-- 5. Add insert policy for therapist_availability
DROP POLICY IF EXISTS "availability_insert" ON therapist_availability;
CREATE POLICY "availability_insert" ON therapist_availability FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM therapists JOIN profiles ON profiles.id = therapists.id WHERE therapists.id = therapist_availability.therapist_id AND profiles.id = auth.uid()));

-- 6. Add delete policy for therapist_availability
DROP POLICY IF EXISTS "availability_delete" ON therapist_availability;
CREATE POLICY "availability_delete" ON therapist_availability FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM therapists JOIN profiles ON profiles.id = therapists.id WHERE therapists.id = therapist_availability.therapist_id AND profiles.id = auth.uid()));

-- 7. Add insert policy for scale_questions (for seeding)
DROP POLICY IF EXISTS "questions_insert" ON scale_questions;
CREATE POLICY "questions_insert" ON scale_questions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM clinical_scales WHERE clinical_scales.id = scale_questions.scale_id AND clinical_scales.tenant_id = public.get_tenant_id()));

-- 8. Add delete policy for scale_results
DROP POLICY IF EXISTS "results_delete" ON scale_results;
CREATE POLICY "results_delete" ON scale_results FOR DELETE TO authenticated
  USING (tenant_id = public.get_tenant_id());

-- 9. Add missing insert/update policies for clinical_notes
DROP POLICY IF EXISTS "notes_delete" ON clinical_notes;
CREATE POLICY "notes_delete" ON clinical_notes FOR DELETE TO authenticated
  USING (tenant_id = public.get_tenant_id() AND public.get_user_role() IN ('super_admin', 'director', 'admin'));

-- 10. Add insert policy for parent_patients
DROP POLICY IF EXISTS "parent_patients_insert_self" ON parent_patients;
CREATE POLICY "parent_patients_insert_self" ON parent_patients FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id());

-- 11. Add delete policy for parent_patients
DROP POLICY IF EXISTS "parent_patients_delete_self" ON parent_patients;
CREATE POLICY "parent_patients_delete_self" ON parent_patients FOR DELETE TO authenticated
  USING (tenant_id = public.get_tenant_id());

-- 12. Add profiles insert policy (for admin user creation)
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id() OR public.get_user_role() IN ('super_admin', 'director'));

-- 13. Add therapists insert policy (for admin user creation)
DROP POLICY IF EXISTS "therapists_insert" ON therapists;
CREATE POLICY "therapists_insert" ON therapists FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = therapists.id AND profiles.tenant_id = public.get_tenant_id()));

-- 14. Add therapists update policy
DROP POLICY IF EXISTS "therapists_update" ON therapists;
CREATE POLICY "therapists_update" ON therapists FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = therapists.id AND profiles.tenant_id = public.get_tenant_id()));

-- 15. Create index on patients.active for faster queries
CREATE INDEX IF NOT EXISTS idx_patients_active ON patients(active);

-- 16. Create index on appointments.date for faster date-range queries
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);

-- 17. Create index on appointments.therapist_id for therapist filtering
CREATE INDEX IF NOT EXISTS idx_appointments_therapist ON appointments(therapist_id);

-- ============================================================
-- RPC FUNCTIONS referenced by the codebase
-- ============================================================

-- get_therapist_profiles: returns profiles for users with therapist/coordinator/director/super_admin roles
CREATE OR REPLACE FUNCTION public.get_therapist_profiles()
RETURNS TABLE(id UUID, first_name TEXT, last_name TEXT, phone TEXT, email TEXT, avatar_url TEXT, role TEXT)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT p.id, p.first_name, p.last_name, p.phone, p.email, p.avatar_url, p.role
  FROM profiles p
  WHERE p.role IN ('terapeuta', 'coordinador', 'director', 'super_admin')
    AND p.active = true
    AND p.tenant_id = public.get_tenant_id()
  ORDER BY p.first_name, p.last_name;
$$;

-- get_profile_by_id: returns a single profile by ID
CREATE OR REPLACE FUNCTION public.get_profile_by_id(profile_id UUID)
RETURNS TABLE(id UUID, first_name TEXT, last_name TEXT, phone TEXT, email TEXT, avatar_url TEXT, role TEXT, tenant_id UUID, active BOOLEAN)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT p.id, p.first_name, p.last_name, p.phone, p.email, p.avatar_url, p.role, p.tenant_id, p.active
  FROM profiles p
  WHERE p.id = profile_id;
$$;

-- get_all_users: returns all users in the current tenant
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE(id UUID, first_name TEXT, last_name TEXT, email TEXT, phone TEXT, role TEXT, active BOOLEAN)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT p.id, p.first_name, p.last_name, p.email, p.phone, p.role, p.active
  FROM profiles p
  WHERE p.tenant_id = public.get_tenant_id()
  ORDER BY p.role, p.first_name;
$$;

-- ============================================================
-- ADD name and acronym to clinical_scales (codebase references them)
-- ============================================================

-- Add name and acronym columns
ALTER TABLE clinical_scales ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE clinical_scales ADD COLUMN IF NOT EXISTS acronym TEXT;

-- Populate name and acronym from type
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

-- ============================================================
-- ADD email column to profiles (if missing, codebase references it)
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;