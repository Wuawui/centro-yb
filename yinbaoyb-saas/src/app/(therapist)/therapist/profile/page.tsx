"use client";

import { useSession } from "@/components/providers/SessionProvider";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { ROLE_LABELS } from "@/lib/constants";

export default function TherapistProfilePage() {
  const { profile, user, loading } = useSession();

  if (loading || !profile) {
    return <PageLoading text="Cargando perfil..." color="text-teal-600" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-sm text-gray-500 mt-1">Información de tu cuenta</p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">👤 <strong>Solo lectura.</strong> Si necesitas cambiar tu nombre, teléfono u otros datos, contacta al administrador del centro.</p>
      </div>

      {/* Profile card — SOLO LECTURA */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-2xl font-bold">
            {profile.first_name?.[0] || "?"}{profile.last_name?.[0] || "?"}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{profile.first_name} {profile.last_name}</p>
            <p className="text-sm text-teal-600 font-medium">Terapeuta</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Nombre</p>
            <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{profile.first_name || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Apellido</p>
            <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{profile.last_name || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Teléfono</p>
            <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{profile.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Email</p>
            <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{user?.email || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Rol</p>
            <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{ROLE_LABELS[profile.role] || profile.role}</p>
          </div>
        </div>
      </div>

      {/* Password reset */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">¿Necesitas cambiar algo?</h3>
        <p className="text-sm text-gray-500 mb-4">
          Si necesitas actualizar tu información o cambiar tu contraseña, contacta al administrador del centro terapéutico.
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>📧</span>
          <span>El administrador puede actualizar tus datos desde el panel de administración.</span>
        </div>
      </div>
    </div>
  );
}