"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// ────────────────────────────────────────────────────────────────────────
// CLIENTE SUPER ADMIN (Bypass RLS)
// ────────────────────────────────────────────────────────────────────────
// ALERTA: Este cliente IGNORA EL RLS.
// Únicamente debe ser usado en funciones seguras de God-Mode.

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Llave secreta en .env.local
);

export async function checkIsDeveloper(email: string | null) {
  const devEmail = process.env.NEXT_PUBLIC_DEVELOPER_EMAIL || "YinbaoYB@gmail.com";
  return email?.toLowerCase() === devEmail.toLowerCase();
}

/**
 * Obtener todos los tenants registrados en la plataforma
 */
export async function getAllTenants() {
  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tenants:", error);
    return [];
  }
  return data;
}

/**
 * Suspender / Reactivar un Tenant
 */
export async function toggleTenantStatus(tenantId: string, isActive: boolean) {
  const { error } = await supabaseAdmin
    .from("tenants")
    .update({ active: isActive })
    .eq("id", tenantId);

  if (error) throw new Error("No se pudo actualizar el estado del centro: " + error.message);
  revalidatePath("/developer");
  return { success: true };
}

/**
 * Crear una nueva instancia de Centro Terapéutico
 */
export async function createNewTenant(data: { name: string; slug: string; plan: string; adminEmail: string; adminName: string; adminPassword?: string }) {
  // 1. Validar slug único
  const { data: existing } = await supabaseAdmin
    .from("tenants")
    .select("id")
    .eq("slug", data.slug)
    .single();

  if (existing) {
    throw new Error("El slug (URL) ya está en uso.");
  }

  // 2. Crear Tenant
  const { data: newTenant, error: tenantErr } = await supabaseAdmin
    .from("tenants")
    .insert([
      {
        name: data.name,
        slug: data.slug,
        plan: data.plan,
        active: true,
      }
    ])
    .select()
    .single();

  if (tenantErr || !newTenant) throw new Error("Error creando el centro: " + tenantErr?.message);

  // 3. Crear Auth User local
  if (!data.adminPassword) throw new Error("Falta la contraseña del administrador.");

  const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email: data.adminEmail,
    password: data.adminPassword,
    email_confirm: true,
  });

  if (authErr || !authUser.user) {
    // Si falla crear el usuario principal, rodamos atrás y borramos el tenant recién creado
    await supabaseAdmin.from("tenants").delete().eq("id", newTenant.id);
    throw new Error("Error creando el acceso del dueño: " + authErr?.message);
  }

  // 4. Crear Perfil de SuperAdmin apuntando al Tenant
  // First or last name split
  const names = data.adminName.trim().split(" ");
  const firstName = names[0];
  const lastName = names.slice(1).join(" ") || " ";

  const { error: profileErr } = await supabaseAdmin
    .from("profiles")
    .insert([
      {
        id: authUser.user.id,
        tenant_id: newTenant.id,
        role: "super_admin",
        first_name: firstName,
        last_name: lastName,
        active: true,
      }
    ]);

  if (profileErr) {
    console.error("Error al crear perfil (Se ha creado el usuario Auth):", profileErr);
    throw new Error("Se creó Auth pero falló conectarlo a Profiles: " + profileErr.message);
  }

  revalidatePath("/developer");
  return { success: true, tenant: newTenant };
}
