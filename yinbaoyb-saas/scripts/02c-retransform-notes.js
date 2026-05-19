// ============================================================
// PASO 2C: Re-transformar notes y appointments con IDs reales
// Usa los IDs del mapa creado por 02-create-auth-users.js
// ============================================================

const fs = require("fs");
const path = require("path");
const { v5: uuidv5 } = require("uuid");

const dataDir = path.join(__dirname, "data");
const NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const TENANT_ID = "00000000-0000-0000-0000-000000000001";

function loadFile(name) {
  const filePath = path.join(dataDir, name);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function saveFile(name, data) {
  fs.writeFileSync(path.join(dataDir, name), JSON.stringify(data, null, 2), "utf-8");
}

async function main() {
  console.log("🔄 Re-transformando notas clínicas y citas...\n");

  const idMap = JSON.parse(fs.readFileSync(path.join(dataDir, "_id-map.json"), "utf-8"));
  console.log(`🗺️ Mapa cargado: ${Object.keys(idMap).length} IDs`);

  // ── 1. CLINICAL_NOTES (92 notas de subcolecciones) ──────────
  const firebaseNotes = loadFile("clinical_notes.json");
  console.log(`📋 Procesando ${firebaseNotes.length} notas clínicas...`);

  const clinicalNotes = firebaseNotes.map((n) => {
    const suId = uuidv5(`centro-logros-note-${n.patientId}-${n.id}`, NAMESPACE);
    const patientSuId = idMap[n.patientId] || null;
    const therapistSuId = idMap[n.therapistId] || null;

    // Construir content estructurado
    const parts = [];
    if (n.tasks) parts.push(`**Tareas Realizadas:**\n${n.tasks}`);
    if (n.observations) parts.push(`**Observaciones:**\n${n.observations}`);
    if (n.recommendations) parts.push(`**Recomendaciones para Casa:**\n${n.recommendations}`);
    const content = parts.join("\n\n") || n.observations || n.tasks || "Sin contenido";

    // Determinar formato
    const format = n.tasks && n.observations && n.recommendations ? "libre" : "libre";

    return {
      id: suId,
      tenant_id: TENANT_ID,
      patient_id: patientSuId,
      therapist_id: therapistSuId,
      format: format,
      content: content,
      signed: false,
      created_at: n.createdAt || n.date || new Date().toISOString(),
    };
  }).filter((n) => n.patient_id); // Solo notas con paciente mapeado

  saveFile("supabase-clinical_notes.json", clinicalNotes);
  console.log(`✅ clinical_notes: ${clinicalNotes.length} (de ${firebaseNotes.length} originales)`);
  
  const sinPaciente = firebaseNotes.length - clinicalNotes.length;
  if (sinPaciente > 0) console.log(`   ⚠️ ${sinPaciente} notas sin paciente mapeado, no importadas`);

  // ── 2. APPOINTMENTS (desde schedules) ────────────────────────
  // Los schedules de Firebase son recurrentes (ej: Lunes 9-10 con Paciente X)
  // Los convertimos en appointments para las próximas 4 semanas
  const firebaseSchedules = loadFile("schedules.json");
  console.log(`\n📅 Procesando ${firebaseSchedules.length} schedules → citas...`);

  const dayNameToNumber = {
    domingo: 0, sunday: 0,
    lunes: 1, monday: 1,
    martes: 2, tuesday: 2,
    miercoles: 3, "miércoles": 3, wednesday: 3,
    jueves: 4, thursday: 4,
    viernes: 5, friday: 5,
    sabado: 6, "sábado": 6, saturday: 6,
  };

  const appointments = [];
  const today = new Date();

  // Generar citas para las próximas 4 semanas
  for (let week = 0; week < 4; week++) {
    for (const s of firebaseSchedules) {
      if (s.active === false) continue;

      const dayOfWeek = dayNameToNumber[(s.dayOfWeek || "").toLowerCase()] ?? 1;
      const therapistSuId = idMap[s.therapistId] || null;
      const patientSuId = s.patientId ? (idMap[s.patientId] || null) : null;

      if (!therapistSuId) continue;

      // Calcular la fecha de esta cita
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + (dayOfWeek - today.getDay() + 7) % 7 + week * 7);
      const dateStr = targetDate.toISOString().split("T")[0];

      const aptId = uuidv5(`centro-logros-apt-${s.id}-${week}`, NAMESPACE);

      appointments.push({
        id: aptId,
        tenant_id: TENANT_ID,
        patient_id: patientSuId,
        therapist_id: therapistSuId,
        type: "individual",
        status: "programada",
        date: dateStr,
        start_time: s.startTime || "09:00",
        end_time: s.endTime || "10:00",
        notes: s.patientName ? `Paciente: ${s.patientName}` : null,
      });
    }
  }

  // Solo crear citas futuras (no pasadas)
  const futureApts = appointments.filter(a => a.date >= today.toISOString().split("T")[0]);
  saveFile("supabase-appointments.json", futureApts);
  console.log(`✅ appointments: ${futureApts.length} (próximas 4 semanas)`);

  console.log("\n" + "=".repeat(50));
  console.log("📊 RESUMEN FINAL");
  console.log("=".repeat(50));
  console.log(`  clinical_notes: ${clinicalNotes.length}`);
  console.log(`  appointments:   ${futureApts.length}`);
  console.log("=".repeat(50));
  console.log("\n✅ Re-transformación completa.");
  console.log("📝 Siguiente paso: ejecutar 03b-import-notes-appointments.js");
}

main().catch(console.error);