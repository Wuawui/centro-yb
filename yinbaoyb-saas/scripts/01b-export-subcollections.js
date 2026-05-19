// ============================================================
// PASO 1B: Exportar subcolecciones de Firebase
// Las clinical_notes están como subcolección dentro de patients
// patients/{patientId}/clinical_notes
// También exporta schedules como citas
// ============================================================

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");

const serviceAccount = require("./firebase-service-account.json");
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function convertTimestamps(obj) {
  const converted = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === "object" && value._seconds !== undefined) {
      converted[key] = new Date(value._seconds * 1000).toISOString();
    } else if (value && typeof value === "object" && value.toDate && typeof value.toDate === "function") {
      converted[key] = value.toDate().toISOString();
    } else {
      converted[key] = value;
    }
  }
  return converted;
}

async function main() {
  console.log("📤 Exportando SUBCOLECCIONES de Firebase...\n");

  // ── 1. Clinical Notes (subcolección de cada paciente) ──────
  console.log("📋 Buscando clinical_notes dentro de cada paciente...");
  const patientsSnap = await db.collection("patients").get();
  const allNotes = [];
  let totalNotes = 0;

  for (const patientDoc of patientsSnap.docs) {
    const patientId = patientDoc.id;
    const patientData = patientDoc.data();

    // Subcolección clinical_notes
    const notesSnap = await db.collection("patients").doc(patientId).collection("clinical_notes").get();

    notesSnap.forEach((noteDoc) => {
      const data = convertTimestamps(noteDoc.data());
      allNotes.push({
        id: noteDoc.id,
        patientId: patientId,
        patientFirstName: patientData.firstName || "",
        patientLastName: patientData.lastName || "",
        ...data,
      });
      totalNotes++;
    });

    console.log(`   📁 Paciente ${patientData.firstName} ${patientData.lastName}: ${notesSnap.size} notas`);
  }

  fs.writeFileSync(path.join(dataDir, "clinical_notes.json"), JSON.stringify(allNotes, null, 2), "utf-8");
  console.log(`\n   ✅ Total clinical_notes: ${totalNotes}`);

  // ── 2. Schedules con información completa ────────────────────
  console.log("\n📅 Exportando schedules completos...");
  const schedulesSnap = await db.collection("schedules").get();
  const schedules = [];

  schedulesSnap.forEach((doc) => {
    schedules.push({ id: doc.id, ...convertTimestamps(doc.data()) });
  });

  fs.writeFileSync(path.join(dataDir, "schedules.json"), JSON.stringify(schedules, null, 2), "utf-8");
  console.log(`   ✅ Total schedules: ${schedules.length}`);

  // ── 3. Tasks (subcolección de pacientes, si existe) ────────
  console.log("\n📝 Buscando tasks dentro de cada paciente...");
  const allTasks = [];
  let totalTasks = 0;

  for (const patientDoc of patientsSnap.docs) {
    const patientId = patientDoc.id;
    try {
      const tasksSnap = await db.collection("patients").doc(patientId).collection("tasks").get();
      tasksSnap.forEach((taskDoc) => {
        allTasks.push({
          id: taskDoc.id,
          patientId: patientId,
          ...convertTimestamps(taskDoc.data()),
        });
        totalTasks++;
      });
    } catch (e) {
      // No hay subcolección tasks para este paciente
    }
  }

  if (totalTasks > 0) {
    fs.writeFileSync(path.join(dataDir, "tasks.json"), JSON.stringify(allTasks, null, 2), "utf-8");
    console.log(`   ✅ Total tasks: ${totalTasks}`);
  } else {
    console.log(`   ⏭️ Sin tasks en subcolecciones`);
  }

  // ── 4. Clinical Notes raíz (si el terapeuta escribió ahí) ──
  console.log("\n📋 Verificando clinical_notes en raíz...");
  const rootNotesSnap = await db.collection("clinical_notes").get();
  const rootNotes = [];
  rootNotesSnap.forEach((doc) => {
    rootNotes.push({ id: doc.id, ...convertTimestamps(doc.data()) });
  });
  if (rootNotes.length > 0) {
    fs.writeFileSync(path.join(dataDir, "clinical_notes_root.json"), JSON.stringify(rootNotes, null, 2), "utf-8");
    console.log(`   ✅ clinical_notes (raíz): ${rootNotes.length}`);
  } else {
    console.log(`   ⏭️ Sin clinical_notes en raíz`);
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 RESUMEN DE EXPORTACIÓN");
  console.log("=".repeat(50));
  console.log(`  clinical_notes (sub): ${totalNotes}`);
  console.log(`  clinical_notes (raíz): ${rootNotes.length}`);
  console.log(`  schedules: ${schedules.length}`);
  console.log(`  tasks: ${totalTasks}`);
  console.log("=".repeat(50));
  console.log("\n✅ Exportación de subcolecciones completa.");
}

main().catch(console.error);