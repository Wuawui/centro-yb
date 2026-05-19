import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, slug, primary_color } = body;

    if (!id) {
      return NextResponse.json({ error: "Falta el ID del tenant" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // 1. Obtener y verificar token de administrador
    const authHeader = request.headers.get("authorization");
    const userToken = authHeader?.replace("Bearer ", "");
    if (!userToken) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const adminRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${userToken}`, apikey: anonKey },
    });
    const adminData = await adminRes.json();
    if (!adminData.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    // 2. Verificar que es admin o super_admin y pertenece a este tenant
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${adminData.id}&select=role,tenant_id`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${userToken}` },
    });
    const profiles = await profileRes.json();
    if (!profiles || profiles.length === 0) return NextResponse.json({ error: "Sin perfil" }, { status: 403 });

    const userProfile = profiles[0];
    const allowedRoles = ["super_admin", "director", "admin"];
    if (!allowedRoles.includes(userProfile.role)) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }
    
    // Si no es super admin, solo puede editar SU tenant
    if (userProfile.role !== "super_admin" && userProfile.tenant_id !== id) {
      return NextResponse.json({ error: "No puedes editar otro centro" }, { status: 403 });
    }

    // 3. Actualizar el tenant usando service_role
    const updates: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (primary_color !== undefined) updates.primary_color = primary_color;

    const tenantUpdateRes = await fetch(`${supabaseUrl}/rest/v1/tenants?id=eq.${id}`, {
      method: "PATCH",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!tenantUpdateRes.ok) {
      const errorData = await tenantUpdateRes.json();
      return NextResponse.json({ error: "Error actualizando centro", details: errorData }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update Tenant Error:", error);
    return NextResponse.json({ error: "Error interno del servidor", details: error.message }, { status: 500 });
  }
}
