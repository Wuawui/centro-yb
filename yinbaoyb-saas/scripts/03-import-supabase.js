// ============================================================
// PASO 3: Importar datos transformados a Supabase
// Solo las tablas que CentroYB SaaS necesita
// Ejecutar: node scripts/03-import-supabase.js
// ============================================================

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// ⚠️ CONFIGURA ESTO
// Opción A: Variables de entorno
// Opción B: Edita directamente aquí
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://enffspurprzvzozgznke.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZmZzcHVycHJ6dnpvemd6bmtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg3OTk0NiwiZXhwIjoyMDkxNDU1OTQ2fQ.gtiwcG0zxKJFV2kQTzXWypX5vxXmk_Yej2tQmI-aZqg";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const dataDir = path.join(__dirname, "data");

function loadFile(name) {
  const filePath = path.join(dataDir, name);
  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️ No encontrado: ${name}, saltando...`);
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

async function insertBatch(table, data, batchSize = 50) {
  if (!data || data.length === 0) {
    console.log(`   ⏭️ ${table}: sin datos`);
    return { inserted: 0, errors: 0 };
  }

  console.log(`   📥 ${table}: insertando ${data.length} registros...`);
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(batch);

    if (error) {
      console.log(`   ❌ Lote ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      // Intentar uno por uno
      for (const row of batch) {
        const { error: e2 } = await supabase.from(table).insert(row);
        if (e2) {
          console.log(`      Error: ${e2.message}`);
          errors++;
        } else {
          inserted++;
        }
      }
    } else {
      inserted += batch.length;
    }
  }

  console.log(`   ✅ ${table}: ${inserted} OK, ${errors} errores`);
  return { inserted, errors };
}

async function main() {
  console.log("🔄 Importando datos a Supabase...\n");
  console.log(`📍 URL: ${SUPABASE_URL.substring(0, 30)}...`);
  console.log("=".repeat(50));

  // ORDEN: respetar foreign keys
  const order = [
    { table: "tenants", file: "supabase-tenants.json" },
    { table: "profiles", file: "supabase-profiles.json" },
    { table: "therapists", file: "supabase-therapists.json" },
    { table: "patients", file: "supabase-patients.json" },
    { table: "therapist_availability", file: "supabase-therapist_availability.json" },
    { table: "clinical_notes", file: "supabase-clinical_notes.json" },
    { table: "payments", file: "supabase-payments.json" },
  ];

  const results = {};
  for (const { table, file } of order) {
    const data = loadFile(file);
    results[table] = await insertBatch(table, data);
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 RESUMEN DE IMPORTACIÓN");
  console.log("=".repeat(50));
  let totalIn = 0, totalErr = 0;
  for (const [table, r] of Object.entries(results)) {
    console.log(`  ${table}: ${r.inserted} insertados${r.errors > 0 ? `, ${r.errors} errores` : ""}`);
    totalIn += r.inserted;
    totalErr += r.errors;
  }
  console.log("=".repeat(50));
  console.log(`\n🎉 Total: ${totalIn} registros insertados, ${totalErr} errores`);

  if (totalErr > 0) {
    console.log("\n⚠️ Hubo errores. Revisa los mensajes arriba.");
    console.log("💡 Consejo: verifica que los UUIDs de perfiles existan en auth.users antes de insertar.");
  } else {
    console.log("\n✅ ¡Migración completada exitosamente!");
  }
}

main().catch(console.error);