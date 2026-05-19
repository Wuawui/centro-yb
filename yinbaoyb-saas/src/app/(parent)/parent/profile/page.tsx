"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/components/providers/SessionProvider";

export default function ParentProfilePage() {
  const supabase = createClient();
  const { profile, user } = useSession();
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      if (!user) { setError("No autenticado"); setSaving(false); return; }

      // Primero intentar con RPC (más seguro, evita problemas de RLS)
      const { error: rpcErr } = await supabase.rpc("update_parent_profile", {
        p_user_id: user.id,
        p_first_name: firstName || null,
        p_last_name: lastName || null,
        p_phone: phone || null,
      });

      if (rpcErr) {
        // Fallback: direct update (funciona si RLS policy está aplicada)
        const { error: err } = await supabase
          .from("profiles")
          .update({
            first_name: firstName || null,
            last_name: lastName || null,
            phone: phone || null,
          })
          .eq("id", user.id);

        if (err) {
          setError("No se pudo actualizar el perfil. Contacta al administrador.");
          setSaving(false);
          return;
        }
      }
      setSaved(true);
    } catch (err: any) {
      setError(err.message || "Error guardando");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900">👤 Mi Perfil</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        {saved && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">✓ Perfil actualizado</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={(profile as any)?.email || ""} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
          <p className="text-xs text-gray-400 mt-0.5">El email no se puede cambiar</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
        </div>

        <div className="pt-2">
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50">
            {saving ? "Guardando..." : "💾 Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}