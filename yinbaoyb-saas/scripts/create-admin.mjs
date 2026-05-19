// Script para crear el primer usuario admin de YinbaoYB
// Ejecutar con: node scripts/create-admin.mjs

const SUPABASE_URL = "https://enffspurprzvzozgznke.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZmZzcHVycHJ6dnpvemd6bmtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg3OTk0NiwiZXhwIjoyMDkxNDU1OTQ2fQ.gtiwcG0zxKJFV2kQTzXWypX5vxXmk_Yej2tQmI-aZqg";
const TENANT_ID = "00000000-0000-0000-0000-000000000001";

async function createAdmin() {
  console.log("🔧 Creando tenant y admin...\n");

  // 1. Crear tenant si no existe
  console.log("1. Creando tenant...");
  const tenantRes = await fetch(`${SUPABASE_URL}/rest/v1/tenants`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      id: TENANT_ID,
      name: "Centro Terapéutico Logros",
      slug: "centro-logros",
      primary_color: "#4F46E5",
      plan: "basico",
    }),
  });

  if (tenantRes.ok) {
    console.log("   ✅ Tenant creado");
  } else {
    const err = await tenantRes.json();
    if (err.code === "23505") {
      console.log("   ⏭️  Tenant ya existe (ok)");
    } else {
      console.log("   ❌ Error:", err);
    }
  }

  // 2. Crear escalas clínicas
  console.log("\n2. Creando escalas clínicas...");
  const scales = [
    { id: "10000000-0000-0000-0000-000000000001", type: "PHQ-9", max_score: 27, risk_threshold: 15 },
    { id: "10000000-0000-0000-0000-000000000002", type: "GAD-7", max_score: 21, risk_threshold: 15 },
    { id: "10000000-0000-0000-0000-000000000003", type: "PCL-5", max_score: 80, risk_threshold: 33 },
    { id: "10000000-0000-0000-0000-000000000004", type: "BDI-II", max_score: 63, risk_threshold: 29 },
    { id: "10000000-0000-0000-0000-000000000005", type: "SRS", max_score: 40, risk_threshold: null },
    { id: "10000000-0000-0000-0000-000000000006", type: "ORS", max_score: 40, risk_threshold: 25 },
  ];

  for (const scale of scales) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/clinical_scales`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ ...scale, tenant_id: TENANT_ID }),
    });
    if (res.ok) {
      console.log(`   ✅ Escala ${scale.type} creada`);
    } else {
      const err = await res.json();
      if (err.code === "23505") {
        console.log(`   ⏭️  Escala ${scale.type} ya existe (ok)`);
      } else {
        console.log(`   ❌ Error en ${scale.type}:`, err);
      }
    }
  }

  // 3. Crear usuario admin
  console.log("\n3. Creando usuario admin...");
  console.log("   Email: darwin@yinbaoyb.com");
  
  const signUpRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "darwin@yinbaoyb.com",
      password: "YinbaoYB2026!",
      email_confirm: true,
    }),
  });

  let userId;
  if (signUpRes.ok) {
    const userData = await signUpRes.json();
    userId = userData.id;
    console.log(`   ✅ Usuario creado (ID: ${userId})`);
  } else {
    const err = await signUpRes.json();
    if (err.msg?.includes("already registered") || err.msg?.includes("already exists")) {
      console.log("   ⏭️  Usuario ya existe, buscando ID...");
      // Buscar usuario existente
      const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=darwin@yinbaoyb.com`, {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      });
      const listData = await listRes.json();
      userId = listData.users?.[0]?.id;
      console.log(`   📋 Usuario encontrado (ID: ${userId})`);
    } else {
      console.log("   ❌ Error:", err);
      process.exit(1);
    }
  }

  // 4. Crear perfil
  console.log("\n4. Creando perfil de admin...");
  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      id: userId,
      tenant_id: TENANT_ID,
      role: "super_admin",
      first_name: "Darwin",
      last_name: "Quijije",
      phone: "+593959994706",
      active: true,
    }),
  });

  if (profileRes.ok) {
    console.log("   ✅ Perfil de admin creado");
  } else {
    const err = await profileRes.json();
    if (err.code === "23505") {
      console.log("   ⏭️  Perfil ya existe (ok)");
    } else {
      console.log("   ❌ Error:", err);
    }
  }

  console.log("\n🎉 ¡Setup completo!");
  console.log("─────────────────────────────────");
  console.log("Email:    darwin@yinbaoyb.com");
  console.log("Password: YinbaoYB2026!");
  console.log("Rol:      super_admin");
  console.log("URL:      http://localhost:3002/login");
  console.log("─────────────────────────────────");
}

createAdmin().catch(console.error);