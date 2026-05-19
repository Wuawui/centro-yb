// ============================================================
// PASO 2: Transformar datos de Firebase a formato Supabase
// Solo mapea lo que CentroYB SaaS necesita
// Ejecutar: node scripts/02-transform-data.js
// ============================================================

const fs = require("fs");
const path = require("path");
const { v5: uuidv5 } = require("uuid");

const dataDir = path.join(__dirname, "data");
const NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

function loadCollection(name) {
  const filePath = path.join(dataDir, `${name}.json`);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function saveFile(name, data) {
  fs.writeFileSync(path.join(dataDir, name), JSON.stringify(data, null, 2), "utf-8");
}

function mapId(prefix, firebaseId) {
  return uuidv5(`${prefix}-${firebaseId}`, NAMESPACE);
}

async function main() {
  console.log("🔄 Transformando datos de Firebase a formato Supabase...\n");

  // ── ID fijo del tenant ──────────────────────────────────────
  const TENANT_ID = "00000000-0000-0000-0000-000000000001";

  const idMap = {}; // firebaseId -> supabase UUID
  idMap["TENANT"] = TENANT_ID;

  // ── 1. TENANTS ─────────────────────────────────────────────
  const tenants = [{
    id: TENANT_ID,
    name: "Centro Terapéutico Logros",
    slug: "centro-logros",
    primary_color: "#0D9488",
    plan: "avanzado",
  }];
  saveFile("supabase-tenants.json", tenants);
  console.log(`✅ tenants: ${tenants.length} (ID: ${TENANT_ID})`);
  console.log(`   ⚠️ Cambia TENANT_ID por el UUID real de tu tenant en Supabase`);

  // ── 2. PROFILES (desde users) ───────────────────────────────
  const firebaseUsers = loadCollection("users");

  const profiles = firebaseUsers.map((u) => {
    const suId = mapId("user", u.id);
    idMap[u.id] = suId;

    return {
      id: suId,
      tenant_id: TENANT_ID,
      role: u.role === "admin" ? "super_admin"
           : u.role === "accountant" ? "admin"
           : u.role === "therapist" ? "terapeuta"
           : u.role === "parent" ? "padre"
           : u.role || "terapeuta",
      first_name: u.firstName || u.displayName?.split(" ")[0] || "",
      last_name: u.lastName || u.displayName?.split(" ").slice(1).join(" ") || "",
      phone: u.phone || null,
      email: u.email || null,
      active: u.active !== false,
    };
  });
  saveFile("supabase-profiles.json", profiles);
  console.log(`✅ profiles: ${profiles.length}`);

  // ── 3. THERAPISTS (desde users con role=therapist) ──────────────────
  const firebaseTherapists = loadCollection("therapists");
  const therapists = [];

  // Terapeutas desde la colección therapists (vacía en este caso)
  firebaseTherapists.forEach((t) => {
    const suId = idMap[t.id] || mapId("user", t.id);
    if (!idMap[t.id]) idMap[t.id] = suId;
    const existingProfile = profiles.find(p => p.id === suId);
    if (!existingProfile) {
      profiles.push({
        id: suId,
        tenant_id: TENANT_ID,
        role: "terapeuta",
        first_name: t.firstName || "",
        last_name: t.lastName || "",
        phone: null,
        email: t.email || null,
        active: t.active !== false,
      });
    }
    therapists.push({
      id: suId,
      specialty: t.specialization || null,
      license_number: null,
      certifications: [],
      therapeutic_approach: [],
      max_patients: 20,
      active: t.active !== false,
    });
  });

  // También crear therapists para users con role=therapist
  const therapistUsers = firebaseUsers.filter(u => u.role === "therapist");
  therapistUsers.forEach((u) => {
    const suId = idMap[u.id] || mapId("user", u.id);
    if (!idMap[u.id]) idMap[u.id] = suId;
    // Verificar si ya existe en therapists
    const existing = therapists.find(t => t.id === suId);
    if (!existing) {
      therapists.push({
        id: suId,
        specialty: u.specialization || u.specialty || null,
        license_number: null,
        certifications: [],
        therapeutic_approach: [],
        max_patients: 20,
        active: u.active !== false,
      });
    }
  });

  // Re-guardar profiles actualizado
  saveFile("supabase-profiles.json", profiles);
  saveFile("supabase-therapists.json", therapists);
  console.log(`✅ therapists: ${therapists.length}`);

  // ── 4. PATIENTS ─────────────────────────────────────────────
  const firebasePatients = loadCollection("patients");

  const patients = firebasePatients.map((p) => {
    const suId = idMap[p.id] || mapId("patient", p.id);
    if (!idMap[p.id]) idMap[p.id] = suId;

    const primaryTherapist = p.therapistIds?.[0]
      ? (idMap[p.therapistIds[0]] || mapId("user", p.therapistIds[0]))
      : null;

    const secondaryTherapists = (p.therapistIds || [])
      .slice(1)
      .map((tid) => idMap[tid] || mapId("user", tid));

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

  // ── 5. THERAPIST_AVAILABILITY (desde schedules) ─────────────
  const firebaseSchedules = loadCollection("schedules");
  const dayMap = {
    domingo: 0, sunday: 0, sunday: 0,
    lunes: 1, monday: 1,
    martes: 2, tuesday: 2,
    miercoles: 3, miércoles: 3, wednesday: 3,
    jueves: 4, thursday: 4,
    viernes: 5, friday: 5,
    sabado: 6, sábado: 6, saturday: 6,
  };

  const availability = firebaseSchedules
    .filter((s) => s.active !== false)
    .map((s) => ({
      therapist_id: idMap[s.therapistId] || mapId("user", s.therapistId),
      tenant_id: TENANT_ID,
      day_of_week: dayMap[(s.dayOfWeek || "").toLowerCase()] ?? 1,
      start_time: s.startTime || "09:00",
      end_time: s.endTime || "10:00",
    }))
    .filter((a) => a.therapist_id);
  saveFile("supabase-therapist_availability.json", availability);
  console.log(`✅ therapist_availability: ${availability.length}`);

  // ── 6. CLINICAL_NOTES ───────────────────────────────────────
  const firebaseNotes = loadCollection("clinical_notes");

  const clinicalNotes = firebaseNotes.map((n) => {
    const suId = mapId("note", n.id);
    const patientSuId = idMap[n.patientId] || mapId("patient", n.patientId);
    const therapistSuId = idMap[n.therapistId] || mapId("user", n.therapistId);

    // Combinar campos de Firebase en formato legible
    const parts = [];
    if (n.tasks) parts.push(`**Tareas Realizadas:**\n${n.tasks}`);
    if (n.observations) parts.push(`**Observaciones:**\n${n.observations}`);
    if (n.recommendations) parts.push(`**Recomendaciones para Casa:**\n${n.recommendations}`);
    const content = parts.join("\n\n") || n.observations || n.tasks || "Sin contenido";

    return {
      id: suId,
      tenant_id: TENANT_ID,
      patient_id: patientSuId,
      therapist_id: therapistSuId,
      format: "libre",
      content,
      signed: false,
      created_at: n.createdAt || n.date || new Date().toISOString(),
    };
  }).filter((n) => n.patient_id && n.therapist_id);
  saveFile("supabase-clinical_notes.json", clinicalNotes);
  console.log(`✅ clinical_notes: ${clinicalNotes.length}`);

  // ── 7. PAYMENTS ─────────────────────────────────────────────
  const firebasePayments = loadCollection("payments");

  const payments = firebasePayments.map((p) => {
    const suId = mapId("payment", p.id);
    const patientSuId = idMap[p.patientId] || mapId("patient", p.patientId);

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

  // ── GUARDAR MAPA DE IDs ──────────────────────────────────────
  saveFile("_id-map.json", idMap);

  console.log(`\n🗺️ Mapa de IDs: ${Object.keys(idMap).length} mapeos`);
  console.log("\n" + "=".repeat(50));
  console.log("📊 RESUMEN FINAL");
  console.log("=".repeat(50));
  console.log(`  tenants:              ${tenants.length}`);
  console.log(`  profiles:             ${profiles.length}`);
  console.log(`  therapists:           ${therapists.length}`);
  console.log(`  patients:             ${patients.length}`);
  console.log(`  therapist_avail:      ${availability.length}`);
  console.log(`  clinical_notes:        ${clinicalNotes.length}`);
  console.log(`  payments:             ${payments.length}`);
  console.log("=".repeat(50));
  console.log("\n✅ Transformación completa.");
  console.log("📝 Siguiente paso: ejecutar 03-import-supabase.js");
}

main().catch(console.error);