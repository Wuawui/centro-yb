// ============================================================
// PASO 2.5: Crear usuarios en Supabase Auth + profiles
// Necesitamos crear los usuarios en auth.users PRIMERO
// porque profiles tiene FK a auth.users(id)
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
const firebaseUsers = JSON.parse(fs.readFileSync(path.join(dataDir, "users.json"), "utf-8"));
const TENANT_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  console.log("👤 Creando usuarios en Supabase Auth...\n");

  const idMap = JSON.parse(fs.readFileSync(path.join(dataDir, "_id-map.json"), "utf-8"));
  const results = { created: 0, skipped: 0, errors: 0, errorList: [] };

  for (const u of firebaseUsers) {
    const email = u.email;
    if (!email) {
      console.log(`   ⚠️ Usuario sin email: ${u.id} (${u.firstName} ${u.lastName}), saltando`);
      results.skipped++;
      continue;
    }

    const role = u.role === "admin" ? "super_admin"
               : u.role === "accountant" ? "admin"
               : u.role === "therapist" ? "terapeuta"
               : u.role === "parent" ? "padre"
               : u.role || "terapeuta";

    console.log(`   📧 Creando ${email} (${role})...`);

    try {
      // Crear usuario en Supabase Auth con contraseña temporal
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: `CentroYB2026!`, // Contraseña temporal
        email_confirm: true, // Marcar como verificado
        user_metadata: {
          first_name: u.firstName || "",
          last_name: u.lastName || "",
          role: role,
        },
      });

      if (authError) {
        // Si ya existe, intentar obtener el ID
        if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
          console.log(`      ⚠️ Ya existe: ${email}, obteniendo ID...`);
          // Buscar usuario existente
          const { data: userList } = await supabase.auth.admin.listUsers({
            filter: { email: email },
          });
          if (userList && userList.users && userList.users.length > 0) {
            const existingUser = userList.users[0];
            idMap[u.id] = existingUser.id;
            console.log(`      ✅ ID existente: ${existingUser.id}`);
            results.skipped++;
          } else {
            console.log(`      ❌ No se pudo obtener ID para: ${email}`);
            results.errors++;
            results.errorList.push({ email, error: authError.message });
          }
        } else {
          console.log(`      ❌ Error: ${authError.message}`);
          results.errors++;
          results.errorList.push({ email, error: authError.message });
        }
        continue;
      }

      // Usuario creado exitosamente
      const newUserId = authData.user.id;
      idMap[u.id] = newUserId;
      console.log(`      ✅ Creado: ${newUserId}`);
      results.created++;

      // Insertar en profiles usando el ID real de Supabase Auth
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: newUserId,
        tenant_id: TENANT_ID,
        role: role,
        first_name: u.firstName || "",
        last_name: u.lastName || "",
        phone: u.phone || null,
        email: email,
        active: u.active !== false,
      }, { onConflict: "id" });

      if (profileError) {
        console.log(`      ⚠️ Error en profile: ${profileError.message}`);
      }

    } catch (err) {
      console.log(`      ❌ Excepción: ${err.message}`);
      results.errors++;
      results.errorList.push({ email, error: err.message });
    }
  }

  // Guardar mapa actualizado
  fs.writeFileSync(path.join(dataDir, "_id-map.json"), JSON.stringify(idMap, null, 2), "utf-8");

  console.log("\n" + "=".repeat(50));
  console.log("📊 RESUMEN DE USUARIOS");
  console.log("=".repeat(50));
  console.log(`  Creados:     ${results.created}`);
  console.log(`  Ya existen:  ${results.skipped}`);
  console.log(`  Errores:     ${results.errors}`);
  if (results.errorList.length > 0) {
    console.log("\n  Errores:");
    results.errorList.forEach(e => console.log(`    - ${e.email}: ${e.error}`));
  }
  console.log("=".repeat(50));
  console.log(`\n📝 Mapa de IDs actualizado: ${Object.keys(idMap).length} mapeos`);
  console.log("   Los IDs reales de Supabase Auth están en _id-map.json");
  console.log("\n⚠️ Contraseña temporal para TODOS: CentroYB2026!");
  console.log("   Los usuarios deberán cambiarla al primer login.");
  console.log("\n📝 Siguiente paso: ejecutar 02-retransform.js para usar IDs reales");
}

main().catch(console.error);