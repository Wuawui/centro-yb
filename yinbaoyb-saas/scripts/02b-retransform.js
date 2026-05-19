// ============================================================
// PASO 2B: Re-transformar datos usando IDs reales de Supabase Auth
// Se ejecuta DESPUÉS de 02-create-auth-users.js
// Los IDs reales están en _id-map.json
// ============================================================

const fs = require("fs");
const path = require("path");
const { v5: uuidv5 } = require("uuid");

const dataDir = path.join(__dirname, "data");
const NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const TENANT_ID = "00000000-0000-0000-0000-000000000001";

function loadCollection(name) {
  const filePath = path.join(dataDir, `${name}.json`);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function saveFile(name, data) {
  fs.writeFileSync(path.join(dataDir, name), JSON.stringify(data, null, 2), "utf-8");
}

async function main() {
  console.log("🔄 Re-transformando datos con IDs reales de Supabase Auth...\n");

  // Cargar mapa de IDs reales
  const idMap = JSON.parse(fs.readFileSync(path.join(dataDir, "_id-map.json"), "utf-8"));
  console.log(`🗺️ Mapa cargado: ${Object.keys(idMap).length} IDs`);

  // ── 1. TENANTS (ya existe) ──────────────────────────────────
  const tenants = [{
    id: TENANT_ID,
    name: "Centro Terapéutico Logros",
    slug: "centro-logros",
    primary_color: "#0D9488",
    plan: "avanzado",
  }];
  saveFile("supabase-tenants.json", tenants);
  console.log(`✅ tenants: ${tenants.length}`);

  // ── 2. PATIENTS ─────────────────────────────────────────────
  const firebasePatients = loadCollection("patients");

  const patients = firebasePatients.map((p) => {
    const suId = idMap[p.id] || uuidv5(`centro-logros-patient-${p.id}`, NAMESPACE);
    if (!idMap[p.id]) idMap[p.id] = suId;

    const primaryTherapist = p.therapistIds?.[0]
      ? idMap[p.therapistIds[0]] || null
      : null;

    const secondaryTherapists = (p.therapistIds || [])
      .slice(1)
      .map((tid) => idMap[tid])
      .filter(Boolean);

    return {
      id: suId,
      tenant_id: TENANT_ID,
      first_name: p.firstName || "",
      last_name: p.lastName || "",
      document_number: p.patientId || null,
      birth_date: p.dateOfBirth ? p.dateOfBirth.split("T")[0] : null,
      phone: p.phoneNumber || null,
      email: p.parentEmail || null,
      reason_for_consultation: p.diagnosis?.join(", ") || null,
      primary_diagnosis: p.diagnosis?.[0] || null,
      therapist_id: primaryTherapist,
      secondary_therapist_ids: secondaryTherapists.length > 0 ? secondaryTherapists : null,
      status: p.active === false ? "abandonado" : "activo",
      active: p.active !== false,
    };
  });
  saveFile("supabase-patients.json", patients);
  console.log(`✅ patients: ${patients.length}`);

  // ── 3. THERAPISTS ───────────────────────────────────────────
  const firebaseUsers = loadCollection("users");
  const therapistUsers = firebaseUsers.filter(u => u.role === "therapist");

  const therapists = therapistUsers.map((u) => {
    const suId = idMap[u.id] || uuidv5(`centro-logros-user-${u.id}`, NAMESPACE);
    return {
      id: suId,
      specialty: u.specialization || null,
      license_number: null,
      certifications: [],
      therapeutic_approach: [],
      max_patients: 20,
      active: u.active !== false,
    };
  });
  saveFile("supabase-therapists.json", therapists);
  console.log(`✅ therapists: ${therapists.length}`);

  // ── 4. THERAPIST_AVAILABILITY ────────────────────────────────
  const firebaseSchedules = loadCollection("schedules");
  const dayMap = {
    domingo: 0, sunday: 0, lunes: 1, monday: 1, martes: 2, tuesday: 2,
    miercoles: 3, "miércoles": 3, wednesday: 3, jueves: 4, thursday: 4,
    viernes: 5, friday: 5, sabado: 6, "sábado": 6, saturday: 6,
  };

  const availability = firebaseSchedules
    .filter((s) => s.active !== false)
    .map((s) => ({
      therapist_id: idMap[s.therapistId] || null,
      tenant_id: TENANT_ID,
      day_of_week: dayMap[(s.dayOfWeek || "").toLowerCase()] ?? 1,
      start_time: s.startTime || "09:00",
      end_time: s.endTime || "10:00",
    }))
    .filter((a) => a.therapist_id);
  saveFile("supabase-therapist_availability.json", availability);
  console.log(`✅ therapist_availability: ${availability.length}`);

  // ── 5. CLINICAL_NOTES (0 en este caso) ────────────────────────
  const firebaseNotes = loadCollection("clinical_notes");
  const clinicalNotes = firebaseNotes.map((n) => {
    const suId = uuidv5(`centro-logros-note-${n.id}`, NAMESPACE);
    const patientSuId = idMap[n.patientId] || null;
    const therapistSuId = idMap[n.therapistId] || null;

    const parts = [];
    if (n.tasks) parts.push(`**Tareas Realizadas:**\n${n.tasks}`);
    if (n.observations) parts.push(`**Observaciones:**\n${n.observations}`);
    if (n.recommendations) parts.push(`**Recomendaciones para Casa:**\n${n.recommendations}`);

    return {
      id: suId,
      tenant_id: TENANT_ID,
      patient_id: patientSuId,
      therapist_id: therapistSuId,
      format: "libre",
      content: parts.join("\n\n") || "Sin contenido",
      signed: false,
      created_at: n.createdAt || n.date || new Date().toISOString(),
    };
  }).filter((n) => n.patient_id && n.therapist_id);
  saveFile("supabase-clinical_notes.json", clinicalNotes);
  console.log(`✅ clinical_notes: ${clinicalNotes.length}`);

  // ── 6. PAYMENTS ──────────────────────────────────────────────
  const firebasePayments = loadCollection("payments");

  const payments = firebasePayments.map((p) => {
    const suId = uuidv5(`centro-logros-payment-${p.id}`, NAMESPACE);
    const patientSuId = idMap[p.patientId] || null;

    return {
      id: suId,
      tenant_id: TENANT_ID,
      patient_id: patientSuId,
      amount: p.amount || 0,
      date: p.date ? p.date.split("T")[0] : new Date().toISOString().split("T")[0],
      package_type: p.packageType || "Mensual",
      description: p.description || null,
      is_installment: p.isInstallment || false,
      total_amount: p.totalAmount || null,
      remaining_balance: p.remainingBalance || null,
      status: p.status || "pending",
      created_at: p.createdAt || new Date().toISOString(),
    };
  }).filter((p) => p.patient_id);
  saveFile("supabase-payments.json", payments);
  console.log(`✅ payments: ${payments.length}`);

  // Guardar mapa actualizado
  saveFile("_id-map.json", idMap);

  console.log("\n" + "=".repeat(50));
  console.log("📊 RESUMEN FINAL (con IDs reales)");
  console.log("=".repeat(50));
  console.log(`  patients:             ${patients.length}`);
  console.log(`  therapists:           ${therapists.length}`);
  console.log(`  therapist_avail:      ${availability.length}`);
  console.log(`  clinical_notes:        ${clinicalNotes.length}`);
  console.log(`  payments:             ${payments.length}`);
  console.log(`  ID mapeos:            ${Object.keys(idMap).length}`);
  console.log("=".repeat(50));
  console.log("\n✅ Re-transformación completa.");
  console.log("📝 Siguiente paso: ejecutar 03-import-supabase.js");
}

main().catch(console.error);