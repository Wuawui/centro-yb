"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface ParentInfo {
  id: string;
  parent_id: string;
  first_name: string;
  last_name: string;
  email: string;
  relationship?: string;
  can_view_notes: boolean;
  can_view_scales: boolean;
  can_view_appointments: boolean;
}

export default function ParentLinking({ patientId }: { patientId: string }) {
  const supabase = createClient();
  const [parents, setParents] = useState<ParentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form for creating new parent
  const [createForm, setCreateForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
    relationship: "madre" as "madre" | "padre" | "tutor" | "otro",
  });

  // Form for linking existing parent
  const [availableParents, setAvailableParents] = useState<any[]>([]);
  const [selectedParent, setSelectedParent] = useState("");
  const [linkRelationship, setLinkRelationship] = useState<"madre" | "padre" | "tutor" | "otro">("madre");

  const loadParents = useCallback(async () => {
    setLoading(true);
    const { data: ppData } = await supabase
      .from("parent_patients")
      .select("id, parent_id, relationship, can_view_notes, can_view_scales, can_view_appointments, profiles!parent_patients_parent_id_fkey(id, first_name, last_name)")
      .eq("patient_id", patientId);

    if (ppData) {
      const mapped = ppData.map((pp: any) => ({
        id: pp.id,
        parent_id: pp.profiles?.id || pp.parent_id,
        first_name: pp.profiles?.first_name || "",
        last_name: pp.profiles?.last_name || "",
        email: pp.profiles?.email || "",
        relationship: pp.relationship,
        can_view_notes: pp.can_view_notes,
        can_view_scales: pp.can_view_scales,
        can_view_appointments: pp.can_view_appointments,
      }));
      setParents(mapped);
    }

    // Load available parents (role = padre, not already linked)
    const { data: allParents } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, role")
      .eq("role", "padre");

    const linkedIds = new Set((ppData || []).map((pp: any) => pp.parent_id));
    const available = (allParents || []).filter((p: any) => !linkedIds.has(p.id));
    setAvailableParents(available);

    setLoading(false);
  }, [patientId]);

  useEffect(() => { loadParents(); }, [loadParents]);

  async function handleCreateAndLink() {
    if (!createForm.first_name || !createForm.last_name || !createForm.email || !createForm.password) {
      setError("Completa todos los campos obligatorios");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError("No autenticado"); setSaving(false); return; }

      // Create user via API
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
        body: JSON.stringify({
          email: createForm.email,
          password: createForm.password,
          first_name: createForm.first_name,
          last_name: createForm.last_name,
          phone: createForm.phone || undefined,
          role: "padre",
        }),
      });

      const result = await res.json();
      if (!res.ok) { setError(result.error || "Error creando usuario"); setSaving(false); return; }

      const userId = result.user.id;

      // Get tenant_id from current user's profile
      const { data: currentUserProfile } = await supabase.from("profiles").select("tenant_id").eq("id", session.user.id).single();
      const tenantId = currentUserProfile?.tenant_id;

      // Link parent to patient
      const { error: linkErr } = await supabase.from("parent_patients").insert({
        parent_id: userId,
        patient_id: patientId,
        tenant_id: tenantId,
        relationship: createForm.relationship,
        can_view_notes: true,
        can_view_scales: true,
        can_view_appointments: true,
      });

      if (linkErr) { setError("Usuario creado pero error al vincular: " + linkErr.message); setSaving(false); return; }

      setSuccess(`✅ ${createForm.first_name} ${createForm.last_name} creado y vinculado como ${createForm.relationship}`);
      setShowCreate(false);
      setCreateForm({ first_name: "", last_name: "", email: "", password: "", phone: "", relationship: "madre" });
      loadParents();
    } catch (err: any) {
      setError(err.message);
    }
    setSaving(false);
  }

  async function handleLinkExisting() {
    if (!selectedParent) return;
    setSaving(true);
    setError(null);

    // Get tenant_id from current user
    const { data: { user: curUser } } = await supabase.auth.getUser();
    const { data: curProfile } = await supabase.from("profiles").select("tenant_id").eq("id", curUser!.id).single();

    const { error: err } = await supabase.from("parent_patients").insert({
      parent_id: selectedParent,
      patient_id: patientId,
      tenant_id: curProfile?.tenant_id,
      relationship: linkRelationship,
      can_view_notes: true,
      can_view_scales: true,
      can_view_appointments: true,
    });

    if (err) { setError(err.message); setSaving(false); return; }
    setShowAdd(false);
    setSelectedParent("");
    setSaving(false);
    loadParents();
  }

  async function handleRemoveParent(ppId: string) {
    await supabase.from("parent_patients").delete().eq("id", ppId);
    loadParents();
  }

  async function handleTogglePermission(ppId: string, field: "can_view_notes" | "can_view_scales" | "can_view_appointments", current: boolean) {
    await supabase.from("parent_patients").update({ [field]: !current }).eq("id", ppId);
    loadParents();
  }

  const relLabels: Record<string, string> = { madre: "Madre", padre: "Padre", tutor: "Tutor/Acudiente", otro: "Otro" };

  if (loading) return <div className="text-sm text-gray-400">Cargando padres...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">👨‍👩‍👧 Padre / Acudiente</h3>
        <div className="flex gap-2">
          <button onClick={() => { setShowCreate(true); setShowAdd(false); setError(null); setSuccess(null); }} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700">
            + Crear nuevo
          </button>
          {availableParents.length > 0 && (
            <button onClick={() => { setShowAdd(true); setShowCreate(false); setError(null); setSuccess(null); }} className="text-xs bg-white text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50">
              Vincular existente
            </button>
          )}
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>}

      {parents.length === 0 && !showCreate && !showAdd && (
        <div className="text-center py-6 bg-gray-50 rounded-xl">
          <div className="text-3xl mb-2">👨‍👩‍👧</div>
          <p className="text-sm text-gray-500">Sin padre/acudiente vinculado</p>
          <p className="text-xs text-gray-400 mt-1">Crea uno nuevo para que pueda ver el progreso del paciente</p>
        </div>
      )}

      {parents.map(p => (
        <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-medium text-sm">
                {p.first_name[0]}{p.last_name[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{p.first_name} {p.last_name}</p>
                <p className="text-xs text-gray-500">{relLabels[p.relationship || ""] || p.relationship} · Portal de padres activo</p>
              </div>
            </div>
            <button onClick={() => handleRemoveParent(p.id)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1">Desvincular</button>
          </div>
          <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={p.can_view_notes} onChange={() => handleTogglePermission(p.id, "can_view_notes", p.can_view_notes)} className="rounded text-indigo-600" />
              Ver notas clínicas
            </label>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={p.can_view_scales} onChange={() => handleTogglePermission(p.id, "can_view_scales", p.can_view_scales)} className="rounded text-indigo-600" />
              Ver evaluaciones
            </label>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={p.can_view_appointments} onChange={() => handleTogglePermission(p.id, "can_view_appointments", p.can_view_appointments)} className="rounded text-indigo-600" />
              Ver citas
            </label>
          </div>
        </div>
      ))}

      {/* CREATE NEW PARENT */}
      {showCreate && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">Crear nuevo padre/acudiente</h4>
            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
              <input value={createForm.first_name} onChange={e => setCreateForm({...createForm, first_name: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="María" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Apellido *</label>
              <input value={createForm.last_name} onChange={e => setCreateForm({...createForm, last_name: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="García" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="maria@email.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contraseña *</label>
              <input type="password" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} required minLength={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
              <input value={createForm.phone} onChange={e => setCreateForm({...createForm, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="+593..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Relación *</label>
              <select value={createForm.relationship} onChange={e => setCreateForm({...createForm, relationship: e.target.value as any})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="madre">Madre</option>
                <option value="padre">Padre</option>
                <option value="tutor">Tutor/Acudiente</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-400">Se creará una cuenta con acceso al portal de padres. El padre podrá ver notas, evaluaciones y citas según los permisos configurados.</p>
          <div className="flex gap-2">
            <button onClick={handleCreateAndLink} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? "Creando..." : "Crear y vincular"}</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
          </div>
        </div>
      )}

      {/* LINK EXISTING PARENT */}
      {showAdd && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">Vincular padre existente</h4>
            <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Seleccionar padre</label>
            <select value={selectedParent} onChange={e => setSelectedParent(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">Buscar padre...</option>
              {availableParents.map(p => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Relación</label>
            <select value={linkRelationship} onChange={e => setLinkRelationship(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="madre">Madre</option>
              <option value="padre">Padre</option>
              <option value="tutor">Tutor/Acudiente</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleLinkExisting} disabled={saving || !selectedParent} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? "Vinculando..." : "Vincular"}</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}