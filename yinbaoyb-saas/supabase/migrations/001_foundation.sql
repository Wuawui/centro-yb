-- ============================================================
-- MIGRACIÓN 001: Fundación — Tablas base + RLS
-- YinbaoYB SaaS — Sistema de Gestión para Centros Terapéuticos
-- ============================================================

-- ── Extensión necesaria para UUID ──────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TENANTS (Centros terapéuticos) ─────────────────────────
CREATE TABLE tenants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#4F46E5',
  plan TEXT NOT NULL DEFAULT 'basico' CHECK (plan IN ('basico', 'profesional', 'avanzado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PROFILES (Extiende auth.users) ─────────────────────────
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'terapeuta' CHECK (role IN ('super_admin', 'director', 'coordinador', 'terapeuta', 'admin', 'paciente')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PACIENTES ──────────────────────────────────────────────
CREATE TABLE patients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  document_number TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('M', 'F', 'O', 'X')),
  phone TEXT,
  email TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_relation TEXT,
  emergency_contact_phone TEXT,
  reason_for_consultation TEXT,
  primary_diagnosis TEXT,
  primary_diagnosis_desc TEXT,
  secondary_diagnoses TEXT[] DEFAULT '{}',
  current_medication TEXT,
  medical_history TEXT,
  insurance_provider TEXT,
  insurance_policy TEXT,
  therapist_id UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'lista_espera' CHECK (status IN ('activo', 'alta', 'abandonado', 'lista_espera')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TERAPEUTAS (Extiende profiles) ─────────────────────────
CREATE TABLE therapists (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  specialty TEXT,
  license_number TEXT,
  certifications TEXT[] DEFAULT '{}',
  therapeutic_approach TEXT[] DEFAULT '{}',
  max_patients INTEGER DEFAULT 20,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── DISPONIBILIDAD SEMANAL ─────────────────────────────────
CREATE TABLE therapist_availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE NOT NULL,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Dom, 6=Sáb
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CITAS ──────────────────────────────────────────────────
CREATE TABLE appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  therapist_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT NOT NULL DEFAULT 'individual' CHECK (type IN ('individual', 'grupal', 'taller', 'evaluacion', 'supervision')),
  status TEXT NOT NULL DEFAULT 'programada' CHECK (status IN ('programada', 'confirmada', 'completada', 'cancelada', 'no_asistio', 'reprogramada')),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── NOTAS CLÍNICAS ─────────────────────────────────────────
CREATE TABLE clinical_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES appointments(id),
  therapist_id UUID REFERENCES profiles(id) NOT NULL,
  format TEXT NOT NULL DEFAULT 'SOAP' CHECK (format IN ('SOAP', 'BIRP', 'DAP', 'libre', 'progreso')),
  -- SOAP
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  -- BIRP
  behavior TEXT,
  intervention TEXT,
  response TEXT,
  -- DAP
  data TEXT,
  -- General
  mood TEXT,
  tasks_assigned TEXT,
  next_objective TEXT,
  -- Libre
  content TEXT,
  -- Progreso
  progress_score SMALLINT CHECK (progress_score BETWEEN 1 AND 10),
  -- Firma
  signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PLANES DE TRATAMIENTO ──────────────────────────────────
CREATE TABLE treatment_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  therapist_id UUID REFERENCES profiles(id) NOT NULL,
  notes TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── OBJETIVOS DEL PLAN ─────────────────────────────────────
CREATE TABLE treatment_objectives (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  treatment_plan_id UUID REFERENCES treatment_plans(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_progreso', 'alcanzado', 'abandonado')),
  progress_percentage SMALLINT DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ESCALAS CLÍNICAS (Definición) ──────────────────────────
CREATE TABLE clinical_scales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('PHQ-9', 'GAD-7', 'PCL-5', 'BDI-II', 'SRS', 'ORS', 'custom')),
  custom_name TEXT,
  max_score INTEGER NOT NULL,
  risk_threshold INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PREGUNTAS DE ESCALAS ───────────────────────────────────
CREATE TABLE scale_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  scale_id UUID REFERENCES clinical_scales(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  options JSONB NOT NULL -- [{label: "Nunca", value: 0}, {label: "Siempre", value: 3}]
);

-- ── RESULTADOS DE ESCALAS ──────────────────────────────────
CREATE TABLE scale_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  scale_id UUID REFERENCES clinical_scales(id) NOT NULL,
  therapist_id UUID REFERENCES profiles(id),
  answers JSONB NOT NULL, -- {question_id: value}
  total_score INTEGER NOT NULL,
  risk_alert BOOLEAN DEFAULT false,
  notes TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── LOG DE AUDITORÍA ───────────────────────────────────────
CREATE TABLE audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_patients_tenant ON patients(tenant_id);
CREATE INDEX idx_patients_therapist ON patients(therapist_id);
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_patients_search ON patients USING gin(to_tsvector('spanish', coalesce(first_name,'') || ' ' || coalesce(last_name,'') || ' ' || coalesce(document_number,'')));
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_therapist_date ON appointments(therapist_id, date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_tenant_date ON appointments(tenant_id, date);
CREATE INDEX idx_clinical_notes_patient ON clinical_notes(patient_id);
CREATE INDEX idx_clinical_notes_therapist ON clinical_notes(therapist_id);
CREATE INDEX idx_scale_results_patient ON scale_results(patient_id);
CREATE INDEX idx_scale_results_date ON scale_results(completed_at);
CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX idx_audit_tenant ON audit_log(tenant_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Multi-tenant
-- ============================================================

-- Función helper: obtiene el tenant_id del usuario actual
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Función helper: obtiene el rol del usuario actual
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── Habilitar RLS en todas las tablas ──────────────────────
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE scale_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scale_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ── TENANTS ────────────────────────────────────────────────
-- Super admin ve todo, director ve su sede
CREATE POLICY "Super admin ve todos los tenants"
  ON tenants FOR SELECT
  TO authenticated
  USING (auth.user_role() = 'super_admin');

CREATE POLICY "Usuarios ven su propio tenant"
  ON tenants FOR SELECT
  TO authenticated
  USING (id = auth.tenant_id());

-- ── PROFILES ───────────────────────────────────────────────
CREATE POLICY "Usuarios ven perfiles de su tenant"
  ON profiles FOR SELECT
  TO authenticated
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "Usuarios modifican su propio perfil"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- ── PACIENTES ──────────────────────────────────────────────
-- Todos los del tenant pueden ver pacientes
CREATE POLICY "Ver pacientes del tenant"
  ON patients FOR SELECT
  TO authenticated
  USING (tenant_id = auth.tenant_id());

-- Terapeutas ven solo SUS pacientes, admins ven todos
CREATE POLICY "Terapeuta ve sus pacientes"
  ON patients FOR SELECT
  TO authenticated
  USING (
    tenant_id = auth.tenant_id()
    AND (
      auth.user_role() IN ('super_admin', 'director', 'coordinador', 'admin')
      OR therapist_id = auth.uid()
    )
  );

-- Insertar: admin, coordinador, director
CREATE POLICY "Admins insertan pacientes"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = auth.tenant_id()
    AND auth.user_role() IN ('super_admin', 'director', 'coordinador', 'admin')
  );

-- Actualizar: admin, coordinador, director, terapeuta asignado
CREATE POLICY "Modificar pacientes"
  ON patients FOR UPDATE
  TO authenticated
  USING (
    tenant_id = auth.tenant_id()
    AND (
      auth.user_role() IN ('super_admin', 'director', 'coordinador', 'admin')
      OR therapist_id = auth.uid()
    )
  );

-- ── CITAS ──────────────────────────────────────────────────
CREATE POLICY "Ver citas del tenant"
  ON appointments FOR SELECT
  TO authenticated
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "Crear citas"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = auth.tenant_id()
    AND auth.user_role() IN ('super_admin', 'director', 'coordinador', 'admin', 'terapeuta')
  );

CREATE POLICY "Modificar citas"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    tenant_id = auth.tenant_id()
    AND (
      auth.user_role() IN ('super_admin', 'director', 'coordinador', 'admin')
      OR therapist_id = auth.uid()
    )
  );

-- ── NOTAS CLÍNICAS ─────────────────────────────────────────
-- Terapeutas ven solo sus notas, admins ven todo
CREATE POLICY "Ver notas del tenant"
  ON clinical_notes FOR SELECT
  TO authenticated
  USING (
    tenant_id = auth.tenant_id()
    AND (
      auth.user_role() IN ('super_admin', 'director', 'coordinador', 'admin')
      OR therapist_id = auth.uid()
    )
  );

CREATE POLICY "Crear notas"
  ON clinical_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = auth.tenant_id()
    AND therapist_id = auth.uid()
  );

CREATE POLICY "Modificar notas propias"
  ON clinical_notes FOR UPDATE
  TO authenticated
  USING (
    tenant_id = auth.tenant_id()
    AND therapist_id = auth.uid()
  );

-- ── ESCALAS Y RESULTADOS ───────────────────────────────────
CREATE POLICY "Ver escalas del tenant"
  ON clinical_scales FOR SELECT
  TO authenticated
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "Ver resultados del tenant"
  ON scale_results FOR SELECT
  TO authenticated
  USING (
    tenant_id = auth.tenant_id()
    AND (
      auth.user_role() IN ('super_admin', 'director', 'coordinador', 'admin', 'terapeuta')
      OR patient_id IN (SELECT id FROM patients WHERE therapist_id = auth.uid())
    )
  );

-- ── AUDITORÍA ──────────────────────────────────────────────
CREATE POLICY "Ver audit del tenant"
  ON audit_log FOR SELECT
  TO authenticated
  USING (tenant_id = auth.tenant_id())
  WHEN auth.user_role() IN ('super_admin', 'director');

-- ============================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas con updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_therapists_updated_at BEFORE UPDATE ON therapists FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_clinical_notes_updated_at BEFORE UPDATE ON clinical_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_treatment_plans_updated_at BEFORE UPDATE ON treatment_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_treatment_objectives_updated_at BEFORE UPDATE ON treatment_objectives FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: Audit log automático
-- ============================================================
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (tenant_id, user_id, action, table_name, record_id, new_data)
    VALUES (
      COALESCE(NEW.tenant_id, auth.tenant_id()),
      auth.uid(),
      'INSERT',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (tenant_id, user_id, action, table_name, record_id, old_data, new_data)
    VALUES (
      COALESCE(NEW.tenant_id, auth.tenant_id()),
      auth.uid(),
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (tenant_id, user_id, action, table_name, record_id, old_data)
    VALUES (
      COALESCE(OLD.tenant_id, auth.tenant_id()),
      auth.uid(),
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar audit a tablas críticas
CREATE TRIGGER audit_patients AFTER INSERT OR UPDATE OR DELETE ON patients FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER audit_appointments AFTER INSERT OR UPDATE OR DELETE ON appointments FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER audit_clinical_notes AFTER INSERT OR UPDATE OR DELETE ON clinical_notes FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER audit_treatment_plans AFTER INSERT OR UPDATE OR DELETE ON treatment_plans FOR EACH ROW EXECUTE FUNCTION log_audit();

-- ============================================================
-- DATOS INICIALES: Escalas clínicas estándar
-- ============================================================

-- PHQ-9 (Depresión)
INSERT INTO clinical_scales (tenant_id, type, max_score, risk_threshold) VALUES
('00000000-0000-0000-0000-000000000000', 'PHQ-9', 27, 15);

-- GAD-7 (Ansiedad)
INSERT INTO clinical_scales (tenant_id, type, max_score, risk_threshold) VALUES
('00000000-0000-0000-0000-000000000000', 'GAD-7', 21, 15);

-- PCL-5 (Estrés postraumático)
INSERT INTO clinical_scales (tenant_id, type, max_score, risk_threshold) VALUES
('00000000-0000-0000-0000-000000000000', 'PCL-5', 80, 33);

-- BDI-II (Beck)
INSERT INTO clinical_scales (tenant_id, type, max_score, risk_threshold) VALUES
('00000000-0000-0000-0000-000000000000', 'BDI-II', 63, 29);

-- SRS (Alianza terapéutica)
INSERT INTO clinical_scales (tenant_id, type, max_score, risk_threshold) VALUES
('00000000-0000-0000-0000-000000000000', 'SRS', 40, null);

-- ORS (Progreso)
INSERT INTO clinical_scales (tenant_id, type, max_score, risk_threshold) VALUES
('00000000-0000-0000-0000-000000000000', 'ORS', 40, 25);

-- ============================================================
-- Preguntas PHQ-9
-- ============================================================
INSERT INTO scale_questions (scale_id, order_index, text, options) VALUES
((SELECT id FROM clinical_scales WHERE type = 'PHQ-9' LIMIT 1), 1, 'Poco interés o placer en hacer las cosas', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
((SELECT id FROM clinical_scales WHERE type = 'PHQ-9' LIMIT 1), 2, 'Sentirse desanimado/a, deprimido/a o sin esperanza', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
((SELECT id FROM clinical_scales WHERE type = 'PHQ-9' LIMIT 1), 3, 'Problemas para dormir o dormir demasiado', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
((SELECT id FROM clinical_scales WHERE type = 'PHQ-9' LIMIT 1), 4, 'Sentirse cansado/a o con poca energía', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
((SELECT id FROM clinical_scales WHERE type = 'PHQ-9' LIMIT 1), 5, 'Poco apetito o comer en exceso', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
((SELECT id FROM clinical_scales WHERE type = 'PHQ-9' LIMIT 1), 6, 'Sentirse mal consigo mismo/a o que es un fracaso', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
((SELECT id FROM clinical_scales WHERE type = 'PHQ-9' LIMIT 1), 7, 'Problemas para concentrarse en cosas como leer o ver TV', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
((SELECT id FROM clinical_scales WHERE type = 'PHQ-9' LIMIT 1), 8, 'Moverse o hablar lentamente, o al contrario estar inquieto/a', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
((SELECT id FROM clinical_scales WHERE type = 'PHQ-9' LIMIT 1), 9, 'Pensamientos de que estaría mejor muerto/a o hacerse daño', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]');

-- ============================================================
-- Preguntas GAD-7
-- ============================================================
INSERT INTO scale_questions (scale_id, order_index, text, options) VALUES
((SELECT id FROM clinical_scales WHERE type = 'GAD-7' LIMIT 1), 1, 'Sentirse nervioso/a, ansioso/a o con los nervios de punta', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
((SELECT id FROM clinical_scales WHERE type = 'GAD-7' LIMIT 1), 2, 'No poder dejar de preocuparse', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
((SELECT id FROM clinical_scales WHERE type = 'GAD-7' LIMIT 1), 3, 'Preocuparse demasiado por diferentes cosas', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
((SELECT id FROM clinical_scales WHERE type = 'GAD-7' LIMIT 1), 4, 'Dificultad para relajarse', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
((SELECT id FROM clinical_scales WHERE type = 'GAD-7' LIMIT 1), 5, 'Estar tan inquieto/a que es difícil quedarse quieto/a', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
((SELECT id FROM clinical_scales WHERE type = 'GAD-7' LIMIT 1), 6, 'Irritarse fácilmente', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
((SELECT id FROM clinical_scales WHERE type = 'GAD-7' LIMIT 1), 7, 'Sentir miedo como si algo terrible fuera a pasar', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]');

-- ============================================================
-- Preguntas PCL-5 (primeras 5 de ejemplo)
-- ============================================================
INSERT INTO scale_questions (scale_id, order_index, text, options) VALUES
((SELECT id FROM clinical_scales WHERE type = 'PCL-5' LIMIT 1), 1, 'Recuerdos repetidos e intrusivos del evento estresante', '[{"label":"Nunca","value":0},{"label":"Un poco","value":1},{"label":"Moderadamente","value":2},{"label":"Bastante","value":3},{"label":"Extremadamente","value":4}]'),
((SELECT id FROM clinical_scales WHERE type = 'PCL-5' LIMIT 1), 2, 'Sueños repetidos y perturbadores sobre el evento', '[{"label":"Nunca","value":0},{"label":"Un poco","value":1},{"label":"Moderadamente","value":2},{"label":"Bastante","value":3},{"label":"Extremadamente","value":4}]'),
((SELECT id FROM clinical_scales WHERE type = 'PCL-5' LIMIT 1), 3, 'Sentirse como si el evento estresante estuviera ocurriendo de nuevo', '[{"label":"Nunca","value":0},{"label":"Un poco","value":1},{"label":"Moderadamente","value":2},{"label":"Bastante","value":3},{"label":"Extremadamente","value":4}]'),
((SELECT id FROM clinical_scales WHERE type = 'PCL-5' LIMIT 1), 4, 'Sentirse muy perturbado/a al recordarle el evento', '[{"label":"Nunca","value":0},{"label":"Un poco","value":1},{"label":"Moderadamente","value":2},{"label":"Bastante","value":3},{"label":"Extremadamente","value":4}]'),
((SELECT id FROM clinical_scales WHERE type = 'PCL-5' LIMIT 1), 5, 'Tener reacciones físicas al recordar el evento', '[{"label":"Nunca","value":0},{"label":"Un poco","value":1},{"label":"Moderadamente","value":2},{"label":"Bastante","value":3},{"label":"Extremadamente","value":4}]');

-- ============================================================
-- Nota: Las escalas con tenant_id = '0000...' son plantillas
-- que se copiarán para cada nuevo tenant.
-- En producción, el seed del tenant creará copias con el ID real.
-- ============================================================