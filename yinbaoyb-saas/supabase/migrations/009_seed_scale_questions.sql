-- ============================================================
-- MIGRACIÓN 009: Seed PHQ-9 y GAD-7 questions
-- ============================================================

-- PHQ-9 Questions (9 preguntas, escala 0-3)
INSERT INTO scale_questions (id, scale_id, order_index, text, options) VALUES
('00000001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, 'Poco interés o placer en hacer las cosas', '["Nunca","Varios días","Más de la mitad de los días","Casi todos los días"]'),
('00000001-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 2, 'Sentirse desanimado/a, deprimido/a o sin esperanza', '["Nunca","Varios días","Más de la mitad de los días","Casi todos los días"]'),
('00000001-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 3, 'Problemas para dormir o dormir demasiado', '["Nunca","Varios días","Más de la mitad de los días","Casi todos los días"]'),
('00000001-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 4, 'Sentirse cansado/a o tener poca energía', '["Nunca","Varios días","Más de la mitad de los días","Casi todos los días"]'),
('00000001-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 5, 'Poco apetito o comer en exceso', '["Nunca","Varios días","Más de la mitad de los días","Casi todos los días"]'),
('00000001-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 6, 'Sentirse mal consigo mismo/a — que es un fracaso o ha decepcionado a la familia', '["Nunca","Varios días","Más de la mitad de los días","Casi todos los días"]'),
('00000001-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 7, 'Dificultad para concentrarse en las cosas (como leer el periódico o ver televisión)', '["Nunca","Varios días","Más de la mitad de los días","Casi todos los días"]'),
('00000001-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', 8, 'Moverse o hablar tan lentamente que otras personas se dan cuenta, o al contrario, estar tan inquieto/a que se mueve más de lo normal', '["Nunca","Varios días","Más de la mitad de los días","Casi todos los días"]'),
('00000001-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', 9, 'Pensamientos de que estaría mejor muerto/a o de hacerse daño de alguna manera', '["Nunca","Varios días","Más de la mitad de los días","Casi todos los días"]');

-- GAD-7 Questions (7 preguntas, escala 0-3)
INSERT INTO scale_questions (id, scale_id, order_index, text, options) VALUES
('00000002-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 1, 'Sentirse nervioso/a, ansioso/a o con los nervios de punta', '["Nunca","Varios días","Más de la mitad de los días","Casi todos los días"]'),
('00000002-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 2, 'No poder dejar de preocuparse o no poder controlar la preocupación', '["Nunca","Varios días","Más de la mitad de los días","Casi todos los días"]'),
('00000002-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 3, 'Preocuparse demasiado por diferentes cosas', '["Nunca","Varios días","Más de la mitad de los días","Casi todos los días"]'),
('00000002-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 4, 'Dificultad para relajarse', '["Nunca","Varios días","Más de la mitad de los días","Casi todos los días"]'),
('00000002-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 5, 'Estar tan inquieto/a que es difícil quedarse sentado/a', '["Nunca","Varios días","Más de la mitad de los días","Casi todos los días"]'),
('00000002-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 6, 'Sentirse fácilmente molesto/a o irritable', '["Nunca","Varios días","Más de la mitad de los días","Casi todos los días"]'),
('00000002-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 7, 'Sentir miedo como si algo terrible pudiera suceder', '["Nunca","Varios días","Más de la mitad de los días","Casi todos los días"]');