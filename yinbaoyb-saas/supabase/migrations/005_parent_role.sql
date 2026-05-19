-- Migración 005 FINAL: Roles de padre y tabla parent_patients
-- Columnas alineadas con el schema real de la BD

-- 1. Agregar rol 'padre' al CHECK de roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('super_admin', 'director', 'coordinador', 'terapeuta', 'admin', 'paciente', 'padre'));

-- 2. DROP + CREATE tabla parent_patients
DROP TABLE IF EXISTS parent_patients CASCADE;
CREATE TABLE parent_patients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  relationship TEXT CHECK (relationship IN ('madre', 'padre', 'tutor', 'otro')),
  can_view_notes BOOLEAN DEFAULT true,
  can_view_scales BOOLEAN DEFAULT true,
  can_view_appointments BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, patient_id)
);

-- 3. Índices
CREATE INDEX idx_parent_patients_parent ON parent_patients(parent_id);
CREATE INDEX idx_parent_patients_patient ON parent_patients(patient_id);
CREATE INDEX idx_parent_patients_tenant ON parent_patients(tenant_id);

-- 4. RLS
ALTER TABLE parent_patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_patients_select" ON parent_patients FOR SELECT TO authenticated
  USING (tenant_id = public.get_tenant_id());
CREATE POLICY "parent_patients_insert" ON parent_patients FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id());
CREATE POLICY "parent_patients_update" ON parent_patients FOR UPDATE TO authenticated
  USING (tenant_id = public.get_tenant_id());
CREATE POLICY "parent_patients_delete" ON parent_patients FOR DELETE TO authenticated
  USING (tenant_id = public.get_tenant_id());

-- 5. Columnas nuevas en patients
ALTER TABLE patients ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES profiles(id);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_phone TEXT;

-- 6. RPC get_parent_children (columnas reales: primary_diagnosis, birth_date)
DROP FUNCTION IF EXISTS public.get_parent_children(UUID);
CREATE OR REPLACE FUNCTION public.get_parent_children(p_parent_id UUID)
RETURNS TABLE(
  id UUID, first_name TEXT, last_name TEXT, status TEXT, active BOOLEAN,
  primary_diagnosis TEXT, birth_date DATE, therapist_id UUID, emergency_contact TEXT, emergency_phone TEXT
)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT p.id, p.first_name, p.last_name, p.status, p.active,
         p.primary_diagnosis, p.birth_date, p.therapist_id, p.emergency_contact, p.emergency_phone
  FROM patients p
  INNER JOIN parent_patients pp ON pp.patient_id = p.id
  WHERE pp.parent_id = p_parent_id
    AND p.tenant_id = public.get_tenant_id()
    AND pp.can_view_notes = true;
$$;

-- 7. RPC get_parent_notes
DROP FUNCTION IF EXISTS public.get_parent_notes(UUID);
CREATE OR REPLACE FUNCTION public.get_parent_notes(p_parent_id UUID)
RETURNS TABLE(
  id UUID, patient_id UUID, therapist_id UUID, format TEXT,
  subjective TEXT, objective TEXT, assessment TEXT, plan TEXT,
  behavior TEXT, intervention TEXT, response TEXT,
  data TEXT, mood TEXT, content TEXT,
  tasks_assigned TEXT, next_objective TEXT,
  progress_score SMALLINT, signed BOOLEAN, created_at TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT cn.id, cn.patient_id, cn.therapist_id, cn.format,
         cn.subjective, cn.objective, cn.assessment, cn.plan,
         cn.behavior, cn.intervention, cn.response,
         cn.data, cn.mood, cn.content,
         cn.tasks_assigned, cn.next_objective,
         cn.progress_score, cn.signed, cn.created_at
  FROM clinical_notes cn
  INNER JOIN parent_patients pp ON pp.patient_id = cn.patient_id
  WHERE pp.parent_id = p_parent_id
    AND pp.can_view_notes = true
    AND cn.tenant_id = public.get_tenant_id()
  ORDER BY cn.created_at DESC;
$$;

-- 8. RPC get_parent_scales
DROP FUNCTION IF EXISTS public.get_parent_scales(UUID);
CREATE OR REPLACE FUNCTION public.get_parent_scales(p_parent_id UUID)
RETURNS TABLE(
  id UUID, patient_id UUID, scale_id UUID, total_score INTEGER,
  risk_alert BOOLEAN, notes TEXT, completed_at TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT sr.id, sr.patient_id, sr.scale_id, sr.total_score,
         sr.risk_alert, sr.notes, sr.completed_at
  FROM scale_results sr
  INNER JOIN parent_patients pp ON pp.patient_id = sr.patient_id
  WHERE pp.parent_id = p_parent_id
    AND pp.can_view_scales = true
    AND sr.tenant_id = public.get_tenant_id()
  ORDER BY sr.completed_at DESC;
$$;

-- 9. RPC get_parent_appointments (columnas reales: type, date)
DROP FUNCTION IF EXISTS public.get_parent_appointments(UUID);
CREATE OR REPLACE FUNCTION public.get_parent_appointments(p_parent_id UUID)
RETURNS TABLE(
  id UUID, patient_id UUID, therapist_id UUID, date DATE,
  start_time TIME, end_time TIME, type TEXT, status TEXT, notes TEXT, created_at TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT a.id, a.patient_id, a.therapist_id, a.date,
         a.start_time, a.end_time, a.type, a.status, a.notes, a.created_at
  FROM appointments a
  INNER JOIN parent_patients pp ON pp.patient_id = a.patient_id
  WHERE pp.parent_id = p_parent_id
    AND pp.can_view_appointments = true
    AND a.tenant_id = public.get_tenant_id()
  ORDER BY a.date DESC, a.start_time DESC;
$$;