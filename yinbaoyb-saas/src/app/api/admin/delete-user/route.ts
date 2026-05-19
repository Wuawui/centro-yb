import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function DELETE(request: Request) {
  // 1. Obtener ID del usuario desde la URL (ej: /api/admin/delete-user?id=123)
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("id");

  if (!userId) {
    return NextResponse.json({ error: "Falta el ID del usuario" }, { status: 400 });
  }

  // 2. Verificar que el usuario que hace la petición es admin
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const authHeader = request.headers.get("authorization");
  const userToken = authHeader?.replace("Bearer ", "");

  if (!userToken) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Verificar admin
  const adminRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${userToken}`, apikey: anonKey },
  });
  const adminData = await adminRes.json();
  if (!adminData.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Comprobar si el que borra tiene rol de admin, director o super_admin
  const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${adminData.id}&select=role`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${userToken}` },
  });
  const profiles = await profileRes.json();
  const allowedRoles = ["super_admin", "director", "admin"];
  
  if (!profiles || profiles.length === 0 || !allowedRoles.includes(profiles[0].role)) {
    return NextResponse.json({ error: "No tienes permisos para eliminar usuarios" }, { status: 403 });
  }

// 3. Obtener información del terapeuta que se va a eliminar
  try {
    const fetchHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
    
    // Obtener perfil
    const tProfileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, { headers: fetchHeaders });
    const tProfiles = await tProfileRes.json();
    const tName = tProfiles && tProfiles.length > 0 ? `${tProfiles[0].first_name} ${tProfiles[0].last_name}` : "Desconocido";

    // Obtener pacientes asignados
    const patientsRes = await fetch(`${supabaseUrl}/rest/v1/patients?therapist_id=eq.${userId}`, { headers: fetchHeaders });
    const patientsData = await patientsRes.json() || [];

    // Obtener notas clínicas
    const notesRes = await fetch(`${supabaseUrl}/rest/v1/clinical_notes?therapist_id=eq.${userId}`, { headers: fetchHeaders });
    const notesData = await notesRes.json() || [];

    // Empaquetar el payload de respaldo
    const backupPayload = {
      therapist_id: userId,
      therapist_name: tName,
      deleted_at: new Date().toISOString(),
      patients_count: patientsData.length,
      notes_count: notesData.length,
      patients: patientsData,
      clinical_notes: notesData
    };

    // 4. Crear bucket de respaldos (si no existe ignora el error)
    await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      method: "POST",
      headers: fetchHeaders,
      body: JSON.stringify({ id: "backups", name: "backups", public: false })
    });

    // Subir el respaldo como archivo JSON
    const safeName = tName.replace(/ /g, '-').replace(/[^a-zA-Z0-9-]/g, '');
    const fileName = `respaldo_terapeuta_${safeName}_${Date.now()}.json`;
    await fetch(`${supabaseUrl}/storage/v1/object/backups/${fileName}`, {
      method: "POST",
      headers: fetchHeaders,
      body: JSON.stringify(backupPayload)
    });

    // 5. Desvincular información (Set null) en la base de datos para no quebrar FKs
    // Actualizar pacientes
    await fetch(`${supabaseUrl}/rest/v1/patients?therapist_id=eq.${userId}`, {
      method: "PATCH",
      headers: fetchHeaders,
      body: JSON.stringify({ therapist_id: null })
    });

    // Actualizar notas
    await fetch(`${supabaseUrl}/rest/v1/clinical_notes?therapist_id=eq.${userId}`, {
      method: "PATCH",
      headers: fetchHeaders,
      body: JSON.stringify({ therapist_id: null })
    });

    // 6. Eliminar completamente el usuario en Auth (y en cascada de therapists y profiles si está configurado)
    const deleteRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: fetchHeaders,
    });

    if (!deleteRes.ok) {
      const errorData = await deleteRes.json();
      return NextResponse.json({ error: errorData?.msg || errorData?.message || "Error al eliminar usuario en Auth." }, { status: 400 });
    }

    // Forzar limpieza manual en caso de que la cascada no funcione
    await fetch(`${supabaseUrl}/rest/v1/therapists?id=eq.${userId}`, { method: "DELETE", headers: fetchHeaders });
    await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, { method: "DELETE", headers: fetchHeaders });

    return NextResponse.json({ success: true, message: "Terapeuta eliminado y respaldado con éxito" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 });
  }
}
