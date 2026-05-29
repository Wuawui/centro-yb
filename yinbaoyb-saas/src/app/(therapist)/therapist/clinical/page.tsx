"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/components/providers/SessionProvider";
import { useToast } from "@/components/ui/Toast";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { NOTE_FORMAT_LABELS, NOTE_FORMAT_COLORS } from "@/lib/constants";
import { createClinicalNote, signClinicalNote } from "@/lib/data/queries";

interface ClinicalNote {
  id: string;
  patient_id: string;
  format: string;
  content: string;
  signed: boolean;
  created_at: string;
  patients: { first_name: string; last_name: string } | null;
}

export default function TherapistClinicalPage() {
  const supabase = createClient();
  const toast = useToast();
  const { profile, user, tenantId } = useSession();
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [myPatients, setMyPatients] = useState<{ id: string; first_name: string; last_name: string }[]>([]);
  const [form, setForm] = useState({ patient_id: "", tareas: "", observaciones: "", resultados: "", recomendaciones: "" });

  const loadNotes = useCallback(async () => {
    if (!tenantId || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    let query = supabase.from("clinical_notes")
      .select("id, patient_id, format, content, signed, created_at, patients!clinical_notes_patient_id_fkey(first_name, last_name)")
      .eq("tenant_id", tenantId).eq("therapist_id", user.id)
      .order("created_at", { ascending: false }).limit(50);
    if (filter !== "all" && filter !== "unsigned") query = query.eq("format", filter.toUpperCase());
    if (filter === "unsigned") query = query.eq("signed", false);

    const [notesRes, patRes] = await Promise.all([
      query,
      supabase.from("patients").select("id, first_name, last_name").eq("tenant_id", tenantId).eq("therapist_id", user.id).eq("active", true),
    ]);
    setNotes((notesRes.data || []) as unknown as ClinicalNote[]);
    setMyPatients(patRes.data || []);
    setLoading(false);
  }, [filter, tenantId, user?.id]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.patient_id || !form.tareas.trim() || !form.observaciones.trim()) {
      toast.addToast("Completa los campos obligatorios", "error");
      return;
    }
    if (!user || !tenantId) return;
    setSaving(true);

    // Combinar los 4 campos en un solo content legible
    const combinedContent = [
      form.tareas.trim() ? `**Tareas Realizadas:**\n${form.tareas.trim()}` : null,
      form.observaciones.trim() ? `**Observaciones:**\n${form.observaciones.trim()}` : null,
      form.resultados.trim() ? `**Avances / Resultados:**\n${form.resultados.trim()}` : null,
      form.recomendaciones.trim() ? `**Recomendaciones para Casa:**\n${form.recomendaciones.trim()}` : null,
    ].filter(Boolean).join("\n\n");

    const timestampStr = new Date().toLocaleString("es-EC", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
    const finalContent = `${combinedContent}\n\n---\n*Nota registrada el ${timestampStr}*`;

    const { error } = await createClinicalNote(supabase, {
      tenant_id: tenantId,
      patient_id: form.patient_id,
      therapist_id: user.id,
      format: "libre",
      content: finalContent,
      signed: false,
    });

    if (error) { toast.addToast("Error: " + error.message, "error"); setSaving(false); return; }
    toast.addToast("Nota de evolución creada ✓", "success");
    setShowNew(false);
    setForm({ patient_id: "", tareas: "", observaciones: "", resultados: "", recomendaciones: "" });
    setSaving(false);
    loadNotes();
  }

  async function handleSign(noteId: string) {
    const { error } = await signClinicalNote(supabase, noteId);
    if (error) { toast.addToast("Error: " + error.message, "error"); return; }
    toast.addToast("Nota firmada ✓", "success");
    loadNotes();
  }

  const filtered = filter === "unsigned"
    ? notes.filter(n => !n.signed)
    : filter === "all"
    ? notes
    : notes.filter(n => n.format?.toLowerCase() === filter);

  const formatLabel = (fmt: string) => NOTE_FORMAT_LABELS[fmt] || NOTE_FORMAT_LABELS[fmt?.toLowerCase()] || fmt;
  const formatColor = (fmt: string) => NOTE_FORMAT_COLORS[fmt] || NOTE_FORMAT_COLORS[fmt?.toLowerCase()] || "bg-gray-50 text-gray-700";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notas Clínicas</h1>
          <p className="text-sm text-gray-500 mt-1">Registro de evolución de tus pacientes</p>
        </div>
        <button onClick={() => setShowNew(true)} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 inline-flex items-center gap-2">
          📋 Registrar evolución
        </button>
      </div>

      {/* Formulario de nueva nota — 4 campos */}
      {showNew && (
        <div className="bg-white rounded-xl border border-teal-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Registrar evolución de sesión</h2>
            <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <form onSubmit={handleCreate} className="space-y-5">
            {/* Paciente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label>
              <select
                value={form.patient_id}
                required
                onChange={e => setForm({ ...form, patient_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="">Seleccionar paciente...</option>
                {myPatients.map(p => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                ))}
              </select>
            </div>

            {/* 4 cajas de texto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tareas Realizadas <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.tareas}
                  onChange={e => setForm({ ...form, tareas: e.target.value })}
                  rows={3}
                  placeholder="Actividades o dinámicas trabajadas durante la sesión..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.observaciones}
                  onChange={e => setForm({ ...form, observaciones: e.target.value })}
                  rows={3}
                  placeholder="Comportamiento, participación, estado de ánimo del paciente..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avances / Resultados <span className="text-gray-400 text-xs">(recomendado)</span>
                </label>
                <textarea
                  value={form.resultados}
                  onChange={e => setForm({ ...form, resultados: e.target.value })}
                  rows={3}
                  placeholder="Logros alcanzados, evolución respecto a objetivos..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recomendaciones para Casa <span className="text-gray-400 text-xs">(opcional)</span>
                </label>
                <textarea
                  value={form.recomendaciones}
                  onChange={e => setForm({ ...form, recomendaciones: e.target.value })}
                  rows={3}
                  placeholder="Actividades de refuerzo sugeridas para el hogar..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button
                type="submit"
                disabled={saving || !form.tareas.trim() || !form.observaciones.trim()}
                className="px-5 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar Nota"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="flex bg-gray-100 rounded-lg p-0.5 max-w-sm">
        {[
          { key: "all", label: "Todas" },
          { key: "unsigned", label: "Sin firmar" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === f.key ? "bg-white text-teal-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de notas */}
      {loading ? (
        <PageLoading text="Cargando notas..." color="text-teal-600" />
      ) : filtered.length === 0 ? (
        <EmptyState icon="📋" title="Sin notas clínicas" description="Registra la evolución después de cada sesión" />
      ) : (
        <div className="space-y-3">
          {filtered.map((note) => {
            const pName = note.patients
              ? `${(note.patients as any).first_name} ${(note.patients as any).last_name}`
              : "Paciente";
            return (
              <div key={note.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${formatColor(note.format)}`}>
                      {formatLabel(note.format)}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{pName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {note.signed ? (
                      <span className="text-xs text-green-600 font-medium">✓ Firmada</span>
                    ) : (
                      <button
                        onClick={() => handleSign(note.id)}
                        className="text-xs text-amber-600 hover:text-amber-700 font-medium px-2 py-1 bg-amber-50 rounded-lg"
                      >
                        Firmar
                      </button>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(note.created_at).toLocaleDateString("es-EC", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed line-clamp-4">
                  {note.content}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}