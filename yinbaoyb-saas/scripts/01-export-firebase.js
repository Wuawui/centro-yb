// ============================================================
// PASO 1: Exportar datos de Firestore a JSON
// Solo las colecciones que SÍ se migran a CentroYB
// Ejecutar: node scripts/01-export-firebase.js
// Resultado: scripts/data/*.json con cada colección
// ============================================================

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");

// Cargar service account
const serviceAccount = require("./firebase-service-account.json");

// Inicializar Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// Solo las colecciones que CentroYB necesita
const collections = [
  "users",
  "patients",
  "therapists",
  "schedules",
  "clinical_notes",
  "payments",
];

async function exportCollection(name) {
  console.log(`📤 Exportando ${name}...`);
  const snapshot = await db.collection(name).get();
  const docs = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    // Convertir timestamps de Firestore a strings ISO
    const converted = {};
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === "object" && value._seconds !== undefined) {
        converted[key] = new Date(value._seconds * 1000).toISOString();
      } else if (value && typeof value === "object" && value.toDate && typeof value.toDate === "function") {
        converted[key] = value.toDate().toISOString();
      } else {
        converted[key] = value;
      }
    }
    docs.push({ id: doc.id, ...converted });
  });

  console.log(`   ✅ ${docs.length} documentos en ${name}`);
  return docs;
}

async function main() {
  const dataDir = path.join(__dirname, "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const results = {};

  for (const col of collections) {
    try {
      results[col] = await exportCollection(col);
    } catch (err) {
      console.log(`   ⚠️ Error en ${col}: ${err.message}`);
      results[col] = [];
    }
  }

  for (const [col, docs] of Object.entries(results)) {
    fs.writeFileSync(path.join(dataDir, `${col}.json`), JSON.stringify(docs, null, 2), "utf-8");
  }

  const summary = Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.length]));
  fs.writeFileSync(path.join(dataDir, "_summary.json"), JSON.stringify(summary, null, 2), "utf-8");

  console.log("\n📊 Resumen:");
  for (const [col, count] of Object.entries(summary)) {
    console.log(`   ${col}: ${count} documentos`);
  }
  console.log("\n✅ Exportación completa. Archivos en scripts/data/");
}

main().catch(console.error);