// ============================================================
// PASO 3B: Importar notas clínicas y citas a Supabase
// ============================================================

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://enffspurprzvzozgznke.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZmZzcHVycHJ6dnpvemd6bmtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg3OTk0NiwiZXhwIjoyMDkxNDU1OTQ2fQ.gtiwcG0zxKJFV2kQTzXWypX5vxXmk_Yej2tQmI-aZqg";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const dataDir = path.join(__dirname, "data");

function loadFile(name) {
  const filePath = path.join(dataDir, name);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

async function insertBatch(table, data, batchSize = 50) {
  if (!data || data.length === 0) {
    console.log(`   ⏭️ ${table}: sin datos`);
    return { inserted: 0, errors: 0 };
  }
  console.log(`   📥 ${table}: insertando ${data.length} registros...`);
  let inserted = 0, errors = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(batch);
    if (error) {
      console.log(`   ❌ Lote ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      for (const row of batch) {
        const { error: e2 } = await supabase.from(table).insert(row);
        if (e2) { errors++; } else { inserted++; }
      }
    } else {
      inserted += batch.length;
    }
  }
  console.log(`   ✅ ${table}: ${inserted} OK, ${errors} errores`);
  return { inserted, errors };
}

async function main() {
  console.log("🔄 Importando notas y citas a Supabase...\n");

  const notes = loadFile("supabase-clinical_notes.json");
  const appointments = loadFile("supabase-appointments.json");

  // Primero notas, luego citas (no hay dependencia entre ellas)
  const r1 = await insertBatch("clinical_notes", notes);
  const r2 = await insertBatch("appointments", appointments);

  console.log("\n" + "=".repeat(50));
  console.log("📊 RESUMEN");
  console.log("=".repeat(50));
  console.log(`  clinical_notes: ${r1.inserted} OK, ${r1.errors} errores`);
  console.log(`  appointments:   ${r2.inserted} OK, ${r2.errors} errores`);
  console.log("=".repeat(50));

  const totalOk = r1.inserted + r2.inserted;
  const totalErr = r1.errors + r2.errors;
  console.log(`\n🎉 Total: ${totalOk} registros insertados, ${totalErr} errores`);
}

main().catch(console.error);