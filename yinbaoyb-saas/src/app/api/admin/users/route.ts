import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  // Verificar que el usuario que hace la petición es admin
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Obtener el token del usuario autenticado
  const authHeader = request.headers.get("authorization");
  const userToken = authHeader?.replace("Bearer ", "");

  if (!userToken) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Verificar que es admin
  const adminRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${userToken}`, apikey: anonKey },
  });
  const adminData = await adminRes.json();
  if (!adminData.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Verificar rol
  const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${adminData.id}&select=role,tenant_id`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${userToken}` },
  });
  const profiles = await profileRes.json();
  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ error: "Sin perfil" }, { status: 403 });
  }

  const userProfile = profiles[0];
  const allowedRoles = ["super_admin", "director", "admin", "coordinador"];
  if (!allowedRoles.includes(userProfile.role)) {
    return NextResponse.json({ error: "No tienes permisos para ver usuarios" }, { status: 403 });
  }

  try {
    // 1. Obtener todos los perfiles del tenant actual
    const allProfilesRes = await fetch(`${supabaseUrl}/rest/v1/profiles?tenant_id=eq.${userProfile.tenant_id}&select=id,first_name,last_name,phone,role,active,tenant_id&order=role.asc`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    const allProfiles = await allProfilesRes.json();

    // 2. Obtener todos los usuarios de Auth (emails) max 1000
    // Usando el Service_Role key podemos leer todos los de Auth
    const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    const authData = await authRes.json();
    const authUsers = authData.users || [];

    // Mapear los arreglos (join)
    const combinedData = allProfiles.map((p: any) => {
        const u = authUsers.find((user: any) => user.id === p.id);
        return {
            ...p,
            email: u ? u.email : null,
        };
    });

    return NextResponse.json({ users: combinedData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error cargando usuarios" }, { status: 500 });
  }
}
