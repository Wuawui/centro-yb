-- ============================================================
-- MIGRACIÓN 002: Seed — Primer tenant y usuario admin
-- EJECUTAR DESPUÉS de registrar el primer usuario en la app
-- ============================================================

-- ⚠️ INSTRUCCIONES:
-- 1. Primero regístrate en la app (http://localhost:3000/login)
-- 2. Copia el ID del usuario que te da Supabase Auth
-- 3. Reemplaza 'USER_ID_AQUI' abajo con ese ID
-- 4. Ejecuta este SQL en el SQL Editor de Supabase

-- Crear el primer tenant (Centro Logros como ejemplo)
INSERT INTO tenants (id, name, slug, primary_color, plan)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Centro Terapéutico Logros',
  'centro-logros',
  '#4F46E5',
  'basico'
);

-- Crear el perfil del admin
-- ⚠️ REEMPLAZA 'USER_ID_AQUI' con tu user ID real de auth.users
INSERT INTO profiles (id, tenant_id, role, first_name, last_name, phone, active)
VALUES (
  'USER_ID_AQUI',
  '00000000-0000-0000-0000-000000000001',
  'super_admin',
  'Darwin',
  'Quijije',
  '+593959994706',
  true
);

-- Crear el perfil de terapeuta
-- ⚠️ REEMPLAZA 'THERAPIST_USER_ID' cuando crees otro usuario
-- INSERT INTO therapists (id, specialty, license_number, max_patients, active)
-- VALUES (
--   'THERAPIST_USER_ID',
--   'Psicología Clínica',
--   'PSI-XXXX',
--   20,
--   true
-- );

-- ============================================================
-- Escalas clínicas para el tenant
-- ============================================================
INSERT INTO clinical_scales (id, tenant_id, type, max_score, risk_threshold) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'PHQ-9', 27, 15),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'GAD-7', 21, 15),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'PCL-5', 80, 33),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'BDI-II', 63, 29),
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'SRS', 40, NULL),
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'ORS', 40, 25);

-- PHQ-9 Preguntas
INSERT INTO scale_questions (scale_id, order_index, text, options) VALUES
('10000000-0000-0000-0000-000000000001', 1, 'Poco interés o placer en hacer las cosas', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
('10000000-0000-0000-0000-000000000001', 2, 'Sentirse desanimado/a, deprimido/a o sin esperanza', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
('10000000-0000-0000-0000-000000000001', 3, 'Problemas para dormir o dormir demasiado', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
('10000000-0000-0000-0000-000000000001', 4, 'Sentirse cansado/a o con poca energía', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
('10000000-0000-0000-0000-000000000001', 5, 'Poco apetito o comer en exceso', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
('10000000-0000-0000-0000-000000000001', 6, 'Sentirse mal consigo mismo/a o que es un fracaso', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
('10000000-0000-0000-0000-000000000001', 7, 'Problemas para concentrarse', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
('10000000-0000-0000-0000-000000000001', 8, 'Moverse o hablar lentamente, o estar inquieto/a', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
('10000000-0000-0000-0000-000000000001', 9, 'Pensamientos de que estaría mejor muerto/a', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]');

-- GAD-7 Preguntas
INSERT INTO scale_questions (scale_id, order_index, text, options) VALUES
('10000000-0000-0000-0000-000000000002', 1, 'Sentirse nervioso/a, ansioso/a o con los nervios de punta', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
('10000000-0000-0000-0000-000000000002', 2, 'No poder dejar de preocuparse', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
('10000000-0000-0000-0000-000000000002', 3, 'Preocuparse demasiado por diferentes cosas', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
('10000000-0000-0000-0000-000000000002', 4, 'Dificultad para relajarse', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
('10000000-0000-0000-0000-000000000002', 5, 'Estar tan inquieto/a que es difícil quedarse quieto/a', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
('10000000-0000-0000-0000-000000000002', 6, 'Irritarse fácilmente', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]'),
('10000000-0000-0000-0000-000000000002', 7, 'Sentir miedo como si algo terrible fuera a pasar', '[{"label":"Nunca","value":0},{"label":"Varios días","value":1},{"label":"Más de la mitad de los días","value":2},{"label":"Casi todos los días","value":3}]');