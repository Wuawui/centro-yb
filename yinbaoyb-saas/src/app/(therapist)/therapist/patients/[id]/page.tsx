"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";

interface Patient { id: string; first_name: string; last_name: string; date_of_birth: string | null; phone: string | null; email: string | null; status: string; reason_for_consultation: string | null; medical_history: string | null; active: boolean; }
interface Appointment { id: string; date: string; start_time: string; end_time: string; type: string; status: string; notes: string | null; }
interface ClinicalNote { id: string; format: string; content: string; signed: boolean; created_at: string; }
interface ScaleResult { id: string; scale_type: string; total_score: number; risk_alert: boolean; applied_at: string; }

const typeLabels: Record<string, string> = { individual: "Individual", grupal: "Grupal", taller: "Taller", evaluacion: "Evaluación", supervision: "Supervisión" };
const statusLabels: Record<string, string> = { programada: "Programada", confirmada: "Confirmada", completada: "Completada", cancelada: "Cancelada", no_asistio: "No asistió" };
const statusColors: Record<string, string> = { programada: "bg-blue-50 text-blue-700", confirmada: "bg-green-50 text-green-700", completada: "bg-gray-50 text-gray-700", cancelada: "bg-red-50 text-red-700", no_asistio: "bg-orange-50 text-orange-700" };
const noteLabels: Record<string, string> = { soap: "SOAP", birp: "BIRP", dap: "DAP", libre: "Libre", progreso: "Progreso" };

export default function TherapistPatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [scales, setScales] = useState<ScaleResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"appointments" | "notes" | "scales">("notes");

  // Form for new note
  const [showNewNote, setShowNewNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noteForm, setNoteForm] = useState({ tareas: "", observaciones: "", resultados: "", recomendaciones: "" });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
      if (!profile) { setLoading(false); return; }
      const patientId = params.id as string;

      const { data: pData } = await supabase.from("patients").select("*").eq("id", patientId).or(`therapist_id.eq.${user.id},secondary_therapist_ids.cs.{"${user.id}"}`).single();
      if (!pData) { setLoading(false); return; }
      setPatient(pData as Patient);

      const [aptRes, notesRes, scalesRes] = await Promise.all([
        supabase.from("appointments").select("id, date, start_time, end_time, type, status, notes").eq("tenant_id", profile.tenant_id).eq("patient_id", patientId).eq("therapist_id", user.id).order("date", { ascending: false }).limit(20),
        supabase.from("clinical_notes").select("id, format, content, signed, created_at").eq("tenant_id", profile.tenant_id).eq("patient_id", patientId).eq("therapist_id", user.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("scale_results").select("id, scale_type, total_score, risk_alert, applied_at").eq("tenant_id", profile.tenant_id).eq("patient_id", patientId).order("applied_at", { ascending: false }).limit(10),
      ]);
      setAppointments((aptRes.data || []) as Appointment[]);
      setNotes((notesRes.data || []) as ClinicalNote[]);
      setScales((scalesRes.data || []) as ScaleResult[]);
      setLoading(false);
    }
    load();
  }, [params.id]);

  async function handleCreateNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteForm.tareas.trim() && !noteForm.observaciones.trim()) return;
    setSaving(true);
    
    // Concatenate exactly as structured single content
    const combinedContent = [
      noteForm.tareas.trim() ? `**Tareas Realizadas:**\n${noteForm.tareas.trim()}` : null,
      noteForm.observaciones.trim() ? `**Observaciones:**\n${noteForm.observaciones.trim()}` : null,
      noteForm.resultados.trim() ? `**Avances / Resultados:**\n${noteForm.resultados.trim()}` : null,
      noteForm.recomendaciones.trim() ? `**Recomendaciones para Casa:**\n${noteForm.recomendaciones.trim()}` : null,
    ].filter(Boolean).join("\n\n");

    const { data: { user } } = await supabase.auth.getUser();
    const { data: prof } = await supabase.from("profiles").select("tenant_id").eq("id", user!.id).single();
    const { error } = await supabase.from("clinical_notes").insert({
      tenant_id: prof!.tenant_id, patient_id: params.id as string, therapist_id: user!.id,
      format: "libre", content: combinedContent, signed: false,
    });
    if (error) { alert("Error: " + error.message); setSaving(false); return; }
    setShowNewNote(false);
    setNoteForm({ tareas: "", observaciones: "", resultados: "", recomendaciones: "" });
    setSaving(false);
    // Reload notes
    const { data } = await supabase.from("clinical_notes").select("id, format, content, signed, created_at").eq("tenant_id", prof!.tenant_id).eq("patient_id", params.id as string).eq("therapist_id", user!.id).order("created_at", { ascending: false }).limit(20);
    setNotes((data || []) as ClinicalNote[]);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><svg className="animate-spin h-8 w-8 text-teal-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>;
  if (!patient) return <div className="text-center py-12"><p className="text-gray-500">Paciente no encontrado</p><Link href="/therapist/patients" className="text-teal-600 text-sm mt-2 inline-block">← Volver a mis pacientes</Link></div>;

  const age = patient.date_of_birth ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="h-5 w-5 text-gray-600" /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{patient.first_name} {patient.last_name}</h1>
          <div className="flex items-center gap-3 mt-1">
            {age !== null && <span className="text-sm text-gray-500">{age} años</span>}
            {patient.phone && <span className="text-sm text-gray-500">📞 {patient.phone}</span>}
            {patient.email && <span className="text-sm text-gray-500">✉️ {patient.email}</span>}
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${patient.status === "activo" ? "bg-green-50 text-green-700" : patient.status === "lista_espera" ? "bg-yellow-50 text-yellow-700" : patient.status === "alta" ? "bg-blue-50 text-blue-700" : "bg-gray-50 text-gray-700"}`}>
          {patient.status === "lista_espera" ? "En espera" : patient.status === "activo" ? "Activo" : patient.status === "alta" ? "Alta" : patient.status}
        </span>
      </div>

      {/* Info cards — SOLO LECTURA */}
      {(patient.reason_for_consultation || patient.medical_history) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patient.reason_for_consultation && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Motivo de consulta</p>
              <p className="text-sm text-gray-900">{patient.reason_for_consultation}</p>
            </div>
          )}
          {patient.medical_history && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Historial médico</p>
              <p className="text-sm text-gray-900">{patient.medical_history}</p>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {[
            { key: "appointments", label: "Citas", count: appointments.length },
            { key: "notes", label: "Notas Clínicas", count: notes.length },
            { key: "scales", label: "Escalas", count: scales.length },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? "border-teal-600 text-teal-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Appointments tab — SOLO LECTURA */}
      {activeTab === "appointments" && (
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border border-gray-200"><div className="text-3xl mb-2">📅</div><p className="text-sm text-gray-500">Sin citas registradas</p></div>
          ) : appointments.map(apt => (
            <div key={apt.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{new Date(apt.date + "T12:00:00").toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "short" })}</p>
                  <p className="text-sm text-gray-500">{apt.start_time?.slice(0, 5)} - {apt.end_time?.slice(0, 5)} · {typeLabels[apt.type] || apt.type}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[apt.status] || "bg-gray-100 text-gray-600"}`}>{statusLabels[apt.status] || apt.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes tab — PUEDE CREAR NOTAS DE EVOLUCIÓN */}
      {activeTab === "notes" && (
        <div className="space-y-4">
          {/* Botón para registrar evolución */}
          <button onClick={() => setShowNewNote(true)} className="w-full bg-teal-600 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-teal-700 inline-flex items-center justify-center gap-2">
            📋 Registrar nota de evolución
          </button>

          {/* Formulario de nueva nota */}
          {showNewNote && (
            <div className="bg-white rounded-xl border border-teal-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Registrar evolución</h3>
                <button onClick={() => setShowNewNote(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <form onSubmit={handleCreateNote} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tareas Realizadas *</label>
                  <textarea value={noteForm.tareas} onChange={e => setNoteForm({ ...noteForm, tareas: e.target.value })} rows={3} placeholder="Actividades o dinámicas trabajadas durante la sesión..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones *</label>
                  <textarea value={noteForm.observaciones} onChange={e => setNoteForm({ ...noteForm, observaciones: e.target.value })} rows={3} placeholder="Comportamiento, participación, dificultades, estado de ánimo del paciente..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Avances / Resultados (Opcional)</label>
                  <textarea value={noteForm.resultados} onChange={e => setNoteForm({ ...noteForm, resultados: e.target.value })} rows={2} placeholder="Logros alcanzados en esta sesión, evolución respecto a los objetivos..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recomendaciones para Casa (Opcional)</label>
                  <textarea value={noteForm.recomendaciones} onChange={e => setNoteForm({ ...noteForm, recomendaciones: e.target.value })} rows={2} placeholder="Actividades de refuerzo sugeridas para realizar en el hogar..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowNewNote(false)} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                  <button type="submit" disabled={saving || !noteForm.tareas.trim() || !noteForm.observaciones.trim()} className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 tracking-wide">{saving ? "Guardando..." : "Guardar Nota de Sesión"}</button>
                </div>
              </form>
            </div>
          )}

          {notes.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border border-gray-200"><div className="text-3xl mb-2">📋</div><p className="text-sm text-gray-500">Sin notas clínicas aún</p><p className="text-xs text-gray-400 mt-1">Registra la evolución después de cada sesión</p></div>
          ) : notes.map(note => (
            <div key={note.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-teal-50 text-teal-700">{noteLabels[note.format?.toLowerCase()] || note.format}</span>
                <div className="flex items-center gap-2">
                  {note.signed ? (
                    <span className="text-xs text-green-600 font-medium">✓ Firmada</span>
                  ) : (
                    <span className="text-xs text-amber-600">Pendiente</span>
                  )}
                  <span className="text-xs text-gray-400">{new Date(note.created_at).toLocaleDateString("es-EC")}</span>
                </div>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.content}</div>
            </div>
          ))}
        </div>
      )}

      {/* Scales tab — SOLO LECTURA */}
      {activeTab === "scales" && (
        <div className="space-y-3">
          {scales.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border border-gray-200"><div className="text-3xl mb-2">📊</div><p className="text-sm text-gray-500">Sin escalas aplicadas</p></div>
          ) : scales.map(scale => (
            <div key={scale.id} className={`bg-white rounded-xl border p-4 ${scale.risk_alert ? "border-red-200" : "border-gray-200"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{scale.scale_type}</p>
                  <p className="text-xs text-gray-500">{new Date(scale.applied_at).toLocaleDateString("es-EC")}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${scale.risk_alert ? "text-red-600" : "text-gray-900"}`}>{scale.total_score}</p>
                  {scale.risk_alert && <span className="text-xs text-red-600 font-medium">⚠️ Riesgo</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}