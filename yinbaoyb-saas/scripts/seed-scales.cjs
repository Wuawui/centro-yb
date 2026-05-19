const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://enffspurprzvzozgznke.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZmZzcHVycHJ6dnpvemd6bmtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg3OTk0NiwiZXhwIjoyMDkxNDU1OTQ2fQ.gtiwcG0zxKJFV2kQTzXWypX5vxXmk_Yej2tQmI-aZqg';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function runMigration() {
  // Insert PHQ-9 questions
  const phq9Questions = [
    { id: '20000000-0000-0000-0000-000000000001', scale_id: '10000000-0000-0000-0000-000000000001', order_index: 1, text: 'Poco interés o placer en hacer las cosas', options: [{value:0,label:"Para nada"},{value:1,label:"Varios días"},{value:2,label:"Más de la mitad de los días"},{value:3,label:"Casi todos los días"}], tenant_id: '00000000-0000-0000-0000-000000000001' },
    { id: '20000000-0000-0000-0000-000000000002', scale_id: '10000000-0000-0000-0000-000000000001', order_index: 2, text: 'Sentirse desanimado/a, deprimido/a o sin esperanzas', options: [{value:0,label:"Para nada"},{value:1,label:"Varios días"},{value:2,label:"Más de la mitad de los días"},{value:3,label:"Casi todos los días"}], tenant_id: '00000000-0000-0000-0000-000000000001' },
    { id: '20000000-0000-0000-0000-000000000003', scale_id: '10000000-0000-0000-0000-000000000001', order_index: 3, text: 'Problemas para dormir o dormir demasiado', options: [{value:0,label:"Para nada"},{value:1,label:"Varios días"},{value:2,label:"Más de la mitad de los días"},{value:3,label:"Casi todos los días"}], tenant_id: '00000000-0000-0000-0000-000000000001' },
    { id: '20000000-0000-0000-0000-000000000004', scale_id: '10000000-0000-0000-0000-000000000001', order_index: 4, text: 'Sentirse cansado/a o con poca energía', options: [{value:0,label:"Para nada"},{value:1,label:"Varios días"},{value:2,label:"Más de la mitad de los días"},{value:3,label:"Casi todos los días"}], tenant_id: '00000000-0000-0000-0000-000000000001' },
    { id: '20000000-0000-0000-0000-000000000005', scale_id: '10000000-0000-0000-0000-000000000001', order_index: 5, text: 'Poco apetito o comer en exceso', options: [{value:0,label:"Para nada"},{value:1,label:"Varios días"},{value:2,label:"Más de la mitad de los días"},{value:3,label:"Casi todos los días"}], tenant_id: '00000000-0000-0000-0000-000000000001' },
    { id: '20000000-0000-0000-0000-000000000006', scale_id: '10000000-0000-0000-0000-000000000001', order_index: 6, text: 'Sentirse mal consigo mismo/a — que es un fracaso o que ha decepcionado a su familia', options: [{value:0,label:"Para nada"},{value:1,label:"Varios días"},{value:2,label:"Más de la mitad de los días"},{value:3,label:"Casi todos los días"}], tenant_id: '00000000-0000-0000-0000-000000000001' },
    { id: '20000000-0000-0000-0000-000000000007', scale_id: '10000000-0000-0000-0000-000000000001', order_index: 7, text: 'Problemas de concentración en las cosas, como leer el periódico o ver televisión', options: [{value:0,label:"Para nada"},{value:1,label:"Varios días"},{value:2,label:"Más de la mitad de los días"},{value:3,label:"Casi todos los días"}], tenant_id: '00000000-0000-0000-0000-000000000001' },
    { id: '20000000-0000-0000-0000-000000000008', scale_id: '10000000-0000-0000-0000-000000000001', order_index: 8, text: 'Moverse o hablar más lentamente de lo normal — o al contrario, estar inquieto/a', options: [{value:0,label:"Para nada"},{value:1,label:"Varios días"},{value:2,label:"Más de la mitad de los días"},{value:3,label:"Casi todos los días"}], tenant_id: '00000000-0000-0000-0000-000000000001' },
    { id: '20000000-0000-0000-0000-000000000009', scale_id: '10000000-0000-0000-0000-000000000001', order_index: 9, text: 'Pensamientos de que estaría mejor muerto/a o de hacerse daño', options: [{value:0,label:"Para nada"},{value:1,label:"Varios días"},{value:2,label:"Más de la mitad de los días"},{value:3,label:"Casi todos los días"}], tenant_id: '00000000-0000-0000-0000-000000000001' },
  ];

  // Insert GAD-7 questions
  const gad7Questions = [
    { id: '20000000-0000-0000-0000-000000000010', scale_id: '10000000-0000-0000-0000-000000000002', order_index: 1, text: 'Sentirse nervioso/a, ansioso/a o con los nervios de punta', options: [{value:0,label:"Para nada"},{value:1,label:"Varios días"},{value:2,label:"Más de la mitad de los días"},{value:3,label:"Casi todos los días"}], tenant_id: '00000000-0000-0000-0000-000000000001' },
    { id: '20000000-0000-0000-0000-000000000011', scale_id: '10000000-0000-0000-0000-000000000002', order_index: 2, text: 'No poder dejar de preocuparse o no poder controlar la preocupación', options: [{value:0,label:"Para nada"},{value:1,label:"Varios días"},{value:2,label:"Más de la mitad de los días"},{value:3,label:"Casi todos los días"}], tenant_id: '00000000-0000-0000-0000-000000000001' },
    { id: '20000000-0000-0000-0000-000000000012', scale_id: '10000000-0000-0000-0000-000000000002', order_index: 3, text: 'Preocuparse demasiado por diferentes cosas', options: [{value:0,label:"Para nada"},{value:1,label:"Varios días"},{value:2,label:"Más de la mitad de los días"},{value:3,label:"Casi todos los días"}], tenant_id: '00000000-0000-0000-0000-000000000001' },
    { id: '20000000-0000-0000-0000-000000000013', scale_id: '10000000-0000-0000-0000-000000000002', order_index: 4, text: 'Dificultad para relajarse', options: [{value:0,label:"Para nada"},{value:1,label:"Varios días"},{value:2,label:"Más de la mitad de los días"},{value:3,label:"Casi todos los días"}], tenant_id: '00000000-0000-0000-0000-000000000001' },
    { id: '20000000-0000-0000-0000-000000000014', scale_id: '10000000-0000-0000-0000-000000000002', order_index: 5, text: 'Estar tan inquieto/a que es difícil quedarse quieto/a', options: [{value:0,label:"Para nada"},{value:1,label:"Varios días"},{value:2,label:"Más de la mitad de los días"},{value:3,label:"Casi todos los días"}], tenant_id: '00000000-0000-0000-0000-000000000001' },
    { id: '20000000-0000-0000-0000-000000000015', scale_id: '10000000-0000-0000-0000-000000000002', order_index: 6, text: 'Sentirse fácilmente irritado/a o molesto/a', options: [{value:0,label:"Para nada"},{value:1,label:"Varios días"},{value:2,label:"Más de la mitad de los días"},{value:3,label:"Casi todos los días"}], tenant_id: '00000000-0000-0000-0000-000000000001' },
    { id: '20000000-0000-0000-0000-000000000016', scale_id: '10000000-0000-0000-0000-000000000002', order_index: 7, text: 'Sentir miedo como si algo terrible fuera a pasar', options: [{value:0,label:"Para nada"},{value:1,label:"Varios días"},{value:2,label:"Más de la mitad de los días"},{value:3,label:"Casi todos los días"}], tenant_id: '00000000-0000-0000-0000-000000000001' },
  ];

  const allQuestions = [...phq9Questions, ...gad7Questions];

  // Insert questions
  const { data, error } = await supabase.from('scale_questions').upsert(allQuestions, { onConflict: 'id' });
  if (error) {
    console.error('Error inserting questions:', error);
  } else {
    console.log(`✅ Inserted ${allQuestions.length} questions`);
  }

  // Update scale descriptions
  const { error: e1 } = await supabase.from('clinical_scales').update({ description: 'Escala de depresión. 9 preguntas. Puntuación: 0-4 mínima, 5-9 leve, 10-14 moderada, 15-19 moderada-severa, 20-27 severa.' }).eq('type', 'PHQ-9');
  if (e1) console.error('Error updating PHQ-9:', e1); else console.log('✅ PHQ-9 description updated');

  const { error: e2 } = await supabase.from('clinical_scales').update({ description: 'Escala de ansiedad. 7 preguntas. Puntuación: 0-4 mínima, 5-9 leve, 10-14 moderada, 15-21 severa.' }).eq('type', 'GAD-7');
  if (e2) console.error('Error updating GAD-7:', e2); else console.log('✅ GAD-7 description updated');

  // Verify
  const { data: q } = await supabase.from('scale_questions').select('scale_id, order_index, text').order('scale_id,order_index');
  console.log(`\n📊 Total questions in DB: ${q?.length}`);
  q?.forEach(row => console.log(`  ${row.order_index}. ${row.text}`));
}

runMigration().catch(console.error);