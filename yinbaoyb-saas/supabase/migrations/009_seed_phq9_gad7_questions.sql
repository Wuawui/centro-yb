-- ============================================================
-- MIGRACIÓN 009: Seed PHQ-9 y GAD-7 questions
-- ============================================================

-- PHQ-9 Questions (Patient Health Questionnaire-9)
-- Scale ID: 10000000-0000-0000-0000-000000000001
-- Score: 0=Not at all, 1=Several days, 2=More than half the days, 3=Nearly every day
-- Max score: 27, Risk threshold: 15

INSERT INTO scale_questions (id, scale_id, order_index, text, options, tenant_id) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, 'Poco interés o placer en hacer las cosas', '[{"value": 0, "label": "Para nada"}, {"value": 1, "label": "Varios días"}, {"value": 2, "label": "Más de la mitad de los días"}, {"value": 3, "label": "Casi todos los días"}]', '00000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 2, 'Sentirse desanimado/a, deprimido/a o sin esperanzas', '[{"value": 0, "label": "Para nada"}, {"value": 1, "label": "Varios días"}, {"value": 2, "label": "Más de la mitad de los días"}, {"value": 3, "label": "Casi todos los días"}]', '00000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 3, 'Problemas para dormir o dormir demasiado', '[{"value": 0, "label": "Para nada"}, {"value": 1, "label": "Varios días"}, {"value": 2, "label": "Más de la mitad de los días"}, {"value": 3, "label": "Casi todos los días"}]', '00000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 4, 'Sentirse cansado/a o con poca energía', '[{"value": 0, "label": "Para nada"}, {"value": 1, "label": "Varios días"}, {"value": 2, "label": "Más de la mitad de los días"}, {"value": 3, "label": "Casi todos los días"}]', '00000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 5, 'Poco apetito o comer en exceso', '[{"value": 0, "label": "Para nada"}, {"value": 1, "label": "Varios días"}, {"value": 2, "label": "Más de la mitad de los días"}, {"value": 3, "label": "Casi todos los días"}]', '00000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 6, 'Sentirse mal consigo mismo/a — que es un fracaso o que ha decepcionado a su familia', '[{"value": 0, "label": "Para nada"}, {"value": 1, "label": "Varios días"}, {"value": 2, "label": "Más de la mitad de los días"}, {"value": 3, "label": "Casi todos los días"}]', '00000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 7, 'Problemas de concentración en las cosas, como leer el periódico o ver televisión', '[{"value": 0, "label": "Para nada"}, {"value": 1, "label": "Varios días"}, {"value": 2, "label": "Más de la mitad de los días"}, {"value": 3, "label": "Casi todos los días"}]', '00000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', 8, 'Moverse o hablar más lentamente de lo normal — o al contrario, estar inquieto/a o moviéndose más de lo habitual', '[{"value": 0, "label": "Para nada"}, {"value": 1, "label": "Varios días"}, {"value": 2, "label": "Más de la mitad de los días"}, {"value": 3, "label": "Casi todos los días"}]', '00000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', 9, 'Pensamientos de que estaría mejor muerto/a o de hacerse daño de alguna manera', '[{"value": 0, "label": "Para nada"}, {"value": 1, "label": "Varios días"}, {"value": 2, "label": "Más de la mitad de los días"}, {"value": 3, "label": "Casi todos los días"}]', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- GAD-7 Questions (Generalized Anxiety Disorder-7)
-- Scale ID: 10000000-0000-0000-0000-000000000002
-- Score: 0=Not at all, 1=Several days, 2=More than half the days, 3=Nearly every day
-- Max score: 21, Risk threshold: 10

INSERT INTO scale_questions (id, scale_id, order_index, text, options, tenant_id) VALUES
('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000002', 1, 'Sentirse nervioso/a, ansioso/a o con los nervios de punta', '[{"value": 0, "label": "Para nada"}, {"value": 1, "label": "Varios días"}, {"value": 2, "label": "Más de la mitad de los días"}, {"value": 3, "label": "Casi todos los días"}]', '00000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002', 2, 'No poder dejar de preocuparse o no poder controlar la preocupación', '[{"value": 0, "label": "Para nada"}, {"value": 1, "label": "Varios días"}, {"value": 2, "label": "Más de la mitad de los días"}, {"value": 3, "label": "Casi todos los días"}]', '00000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000002', 3, 'Preocuparse demasiado por diferentes cosas', '[{"value": 0, "label": "Para nada"}, {"value": 1, "label": "Varios días"}, {"value": 2, "label": "Más de la mitad de los días"}, {"value": 3, "label": "Casi todos los días"}]', '00000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000002', 4, 'Dificultad para relajarse', '[{"value": 0, "label": "Para nada"}, {"value": 1, "label": "Varios días"}, {"value": 2, "label": "Más de la mitad de los días"}, {"value": 3, "label": "Casi todos los días"}]', '00000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000002', 5, 'Estar tan inquieto/a que es difícil quedarse quieto/a', '[{"value": 0, "label": "Para nada"}, {"value": 1, "label": "Varios días"}, {"value": 2, "label": "Más de la mitad de los días"}, {"value": 3, "label": "Casi todos los días"}]', '00000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000002', 6, 'Sentirse fácilmente irritado/a o molesto/a', '[{"value": 0, "label": "Para nada"}, {"value": 1, "label": "Varios días"}, {"value": 2, "label": "Más de la mitad de los días"}, {"value": 3, "label": "Casi todos los días"}]', '00000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000002', 7, 'Sentir miedo como si algo terrible fuera a pasar', '[{"value": 0, "label": "Para nada"}, {"value": 1, "label": "Varios días"}, {"value": 2, "label": "Más de la mitad de los días"}, {"value": 3, "label": "Casi todos los días"}]', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Update clinical_scales: set description for PHQ-9 and GAD-7
UPDATE clinical_scales SET description = 'Escala de depresión. 9 preguntas. Puntuación: 0-4 mínima, 5-9 leve, 10-14 moderada, 15-19 moderada-severa, 20-27 severa.' WHERE type = 'PHQ-9';
UPDATE clinical_scales SET description = 'Escala de ansiedad. 7 preguntas. Puntuación: 0-4 mínima, 5-9 leve, 10-14 moderada, 15-21 severa.' WHERE type = 'GAD-7';