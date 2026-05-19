-- ============================================================
-- MIGRACIÓN 011: Fix parent portal RPCs
-- Problema: get_parent_children retorna vacío porque get_tenant_id()
-- puede fallar en ciertos contextos de autenticación.
-- Solución: Obtener tenant_id del parent_patients en vez de get_tenant_id()
-- ============================================================

-- 1. Fix get_parent_children: usar tenant_id del parent_patients
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
    AND p.tenant_id = pp.tenant_id;
$$;

-- 2. Fix get_parent_notes: usar tenant_id del parent_patients
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
    AND cn.tenant_id = pp.tenant_id
  ORDER BY cn.created_at DESC;
$$;

-- 3. Fix get_parent_scales: usar tenant_id del parent_patients
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
    AND sr.tenant_id = pp.tenant_id
  ORDER BY sr.completed_at DESC;
$$;

-- 4. Fix get_parent_appointments: usar tenant_id del parent_patients
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
    AND a.tenant_id = pp.tenant_id
  ORDER BY a.date DESC, a.start_time DESC;
$$;