"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/components/providers/SessionProvider";
import { useToast } from "@/components/ui/Toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_TYPE_COLORS,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_COLORS,
  DAY_NAMES,
  MONTH_NAMES,
  APPOINTMENT_COLOR_MAP,
  APPOINTMENT_COLOR_OPTIONS,
  parseAppointmentNotes,
} from "@/lib/constants";
import { getDateRange, getWeekDates, getMonthWeeks } from "@/lib/data/queries";
import Link from "next/link";

interface Appointment {
  id: string;
  patient_id: string;
  therapist_id: string;
  type: string;
  status: string;
  date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  patients?: { first_name: string; last_name: string } | null;
  profiles?: { first_name: string; last_name: string } | null;
}

interface TherapistOption {
  id: string;
  first_name: string;
  last_name: string;
}

const typeLabels = APPOINTMENT_TYPE_LABELS;
const typeColors = APPOINTMENT_TYPE_COLORS;
const statusLabels = APPOINTMENT_STATUS_LABELS;
const statusColors = APPOINTMENT_STATUS_COLORS;
const colorMap = APPOINTMENT_COLOR_MAP;
const colorOptions = APPOINTMENT_COLOR_OPTIONS;

export default function AgendaPage() {
  const supabase = createClient();
  const { tenantId, user } = useSession();
  const toast = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [therapists, setTherapists] = useState<TherapistOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [filterTherapist, setFilterTherapist] = useState("all");

  // New appointment form
  const [showNewForm, setShowNewForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);
  const [form, setForm] = useState({
    patient_search: "",
    patient_id: "",
    therapist_id: "",
    type: "individual",
    date: new Date().toISOString().split("T")[0],
    start_time: "09:00",
    end_time: "10:00",
    notes: "",
    color: "",
  });
  const [patientResults, setPatientResults] = useState<{ id: string; first_name: string; last_name: string }[]>([]);
  const [allPatients, setAllPatients] = useState<{ id: string; first_name: string; last_name: string }[]>([]);

  // Edit appointment
  const [editApt, setEditApt] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");

  useEffect(() => { loadData(); }, [selectedDate, filterTherapist]);

  async function loadData() {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // Load therapists
    const { data: tData } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("tenant_id", tenantId)
      .in("role", ["terapeuta", "coordinador", "director", "super_admin"]);
    if (tData) setTherapists(tData as TherapistOption[]);

    // Load patients
    const { data: pData } = await supabase
      .from("patients")
      .select("id, first_name, last_name")
      .eq("tenant_id", tenantId)
      .eq("active", true)
      .order("first_name", { ascending: true });
    if (pData) setAllPatients(pData);

    // Calculate date range based on view
    const { start: startDate, end: endDate } = getDateRange(selectedDate, view);

    // Load appointments
    let query = supabase
      .from("appointments")
      .select("id, patient_id, therapist_id, type, status, date, start_time, end_time, notes, patients(first_name, last_name), profiles!appointments_therapist_id_fkey(first_name, last_name)")
      .eq("tenant_id", tenantId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (filterTherapist !== "all") {
      query = query.eq("therapist_id", filterTherapist);
    }

    const { data: aData } = await query;
    if (aData) setAppointments(aData as unknown as Appointment[]);
    setLoading(false);
  }

  // Search patients - (Replaced by direct select, kept for safety but unused)
  async function searchPatients(query: string) {
    setForm({ ...form, patient_search: query, patient_id: "" });
  }

  // Check conflicts
  async function checkConflict(therapistId: string, date: string, startTime: string, endTime: string, excludeId?: string) {
    setConflict(null);
    const { data } = await supabase
      .from("appointments")
      .select("id, start_time, end_time, patients(first_name, last_name)")
      .eq("therapist_id", therapistId)
      .eq("date", date)
      .neq("status", "cancelada")
      .not("id", "eq", excludeId || "00000000");

    if (data && data.length > 0) {
      for (const apt of data) {
        if (startTime < (apt as any).end_time && endTime > (apt as any).start_time) {
          const pName = (apt as any).patients ? `${(apt as any).patients.first_name} ${(apt as any).patients.last_name}` : "otro paciente";
          setConflict(`Conflicto: ${(apt as any).start_time}-${(apt as any).end_time} con ${pName}`);
          return;
        }
      }
    }
    setConflict(null);
  }

  // Create appointment
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.patient_id || !form.therapist_id) {
      setError("Selecciona un paciente y un terapeuta");
      return;
    }
    setSaving(true);
    setError(null);

    const notesPayload = form.color
      ? JSON.stringify({ color: form.color, text: form.notes })
      : form.notes || null;

    const { error: insertError } = await supabase.from("appointments").insert({
      tenant_id: tenantId!,
      patient_id: form.patient_id,
      therapist_id: form.therapist_id,
      type: form.type,
      date: form.date,
      start_time: form.start_time,
      end_time: form.end_time,
      notes: notesPayload,
      status: "programada",
    });

    if (insertError) { setError(insertError.message); setSaving(false); return; }
    setShowNewForm(false);
    setForm({ patient_search: "", patient_id: "", therapist_id: "", type: "individual", date: selectedDate, start_time: "09:00", end_time: "10:00", notes: "", color: "" });
    setSaving(false);
    loadData();
  }

  // Update appointment color
  async function handleColorUpdate(aptId: string, currentNotes: string | null, newColor: string) {
    const { color: _, text: notesText } = parseAppointmentNotes(currentNotes);
    const notesPayload = newColor
      ? JSON.stringify({ color: newColor, text: notesText })
      : notesText || null;

    const { error: err } = await supabase
      .from("appointments")
      .update({ notes: notesPayload })
      .eq("id", aptId);

    if (err) { toast.addToast("Error: " + err.message, "error"); return; }
    loadData();
  }

  // Delete all appointments for the current tenant
  async function handleDeleteAll() {
    if (!tenantId) return;
    
    // First confirmation
    const firstConfirm = confirm(
      "¿Estás seguro de que deseas eliminar TODAS las citas del calendario? Esta acción no se puede deshacer."
    );
    if (!firstConfirm) return;
    
    // Second confirmation
    const secondConfirm = prompt(
      "Para confirmar la eliminación completa, escribe la palabra 'ELIMINAR' en mayúsculas:"
    );
    if (secondConfirm !== "ELIMINAR") {
      toast.addToast("Confirmación incorrecta. No se eliminaron las citas.", "error");
      return;
    }
    
    setLoading(true);
    const { error: err } = await supabase
      .from("appointments")
      .delete()
      .eq("tenant_id", tenantId);
      
    if (err) {
      toast.addToast("Error al vaciar el calendario: " + err.message, "error");
      setLoading(false);
      return;
    }
    
    toast.addToast("El calendario ha sido vaciado con éxito.", "success");
    loadData();
  }

  // Update status
  async function handleStatusUpdate(aptId: string, newStatus: string) {
    const { error: err } = await supabase.from("appointments").update({ status: newStatus }).eq("id", aptId);
    if (err) { toast.addToast("Error: " + err.message, "error"); return; }
    setEditApt(null);
    loadData();
  }

  // Delete appointment
  async function handleDelete(aptId: string) {
    if (!confirm("¿Eliminar esta cita?")) return;
    const { error: err } = await supabase.from("appointments").delete().eq("id", aptId);
    if (err) { toast.addToast("Error: " + err.message, "error"); return; }
    loadData();
  }

  // Get day names
  const dayNames = DAY_NAMES;
  const monthNames = MONTH_NAMES;

  // Group appointments by date
  const byDate = appointments.reduce((acc, apt) => {
    if (!acc[apt.date]) acc[apt.date] = [];
    acc[apt.date].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  // Get week dates
  function getWeekDatesLocal() {
    return getWeekDates(selectedDate);
  }

  // Get month dates as weeks
  function getMonthWeeksLocal() {
    return getMonthWeeks(selectedDate);
  }

  const isToday = (date: string) => date === new Date().toISOString().split("T")[0];
  const isSelected = (date: string) => date === selectedDate;

  // Navigate dates
  function navDate(direction: number) {
    const d = new Date(selectedDate + "T12:00:00");
    if (view === "day") d.setDate(d.getDate() + direction);
    else if (view === "week") d.setDate(d.getDate() + direction * 7);
    else d.setMonth(d.getMonth() + direction);
    setSelectedDate(d.toISOString().split("T")[0]);
  }

  function goToToday() { setSelectedDate(new Date().toISOString().split("T")[0]); }

  const dateLabel = () => {
    const d = new Date(selectedDate + "T12:00:00");
    if (view === "day") return `${d.getDate()} de ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    if (view === "week") {
      const dates = getWeekDatesLocal();
      const s = new Date(dates[0] + "T12:00:00");
      const e = new Date(dates[6] + "T12:00:00");
      return `${s.getDate()} ${monthNames[s.getMonth()]} - ${e.getDate()} ${monthNames[e.getMonth()]} ${e.getFullYear()}`;
    }
    return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  };

  const todayApts = appointments.filter(a => a.date === new Date().toISOString().split("T")[0] && a.status !== "cancelada");
  const pendingCount = todayApts.filter(a => a.status === "programada" || a.status === "confirmada").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pendingCount} cita{pendingCount !== 1 ? "s" : ""} pendiente{pendingCount !== 1 ? "s" : ""} hoy
          </p>
        </div>
        <div className="flex gap-2">
          {appointments.length > 0 && (
            <button onClick={handleDeleteAll} className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 inline-flex items-center gap-2">
              🗑️ Vaciar Calendario
            </button>
          )}
          <button onClick={() => { setShowNewForm(true); setForm({ ...form, date: selectedDate }); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 inline-flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nueva Cita
          </button>
        </div>
      </div>

      {/* New appointment form */}
      {showNewForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Nueva Cita</h2>
            <button onClick={() => setShowNewForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          {conflict && <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">⚠️ {conflict}</div>}
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient select */}
            <div className="md:col-span-2 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label>
              <select value={form.patient_id} required onChange={e => setForm({ ...form, patient_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="">-- Seleccionar paciente registrado --</option>
                {allPatients.map(p => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Terapeuta *</label>
              <select value={form.therapist_id} onChange={e => { setForm({ ...form, therapist_id: e.target.value }); if (form.date && form.start_time && form.end_time) checkConflict(e.target.value, form.date, form.start_time, form.end_time); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Seleccionar...</option>
                {therapists.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de cita</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
              <input type="date" value={form.date} onChange={e => { setForm({ ...form, date: e.target.value }); if (form.therapist_id && form.start_time && form.end_time) checkConflict(form.therapist_id, e.target.value, form.start_time, form.end_time); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inicio *</label>
                <input type="time" value={form.start_time} onChange={e => { setForm({ ...form, start_time: e.target.value }); if (form.therapist_id && form.date && form.end_time) checkConflict(form.therapist_id, form.date, e.target.value, form.end_time); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fin *</label>
                <input type="time" value={form.end_time} onChange={e => { setForm({ ...form, end_time: e.target.value }); if (form.therapist_id && form.date && form.start_time) checkConflict(form.therapist_id, form.date, form.start_time, e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Observaciones..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Color de la cita</label>
              <div className="flex gap-2 flex-wrap items-center mt-1">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, color: "" })}
                  className={`h-7 w-7 rounded-full border border-gray-300 relative flex items-center justify-center bg-white transition-all hover:scale-105`}
                  title="Color por defecto"
                >
                  {form.color === "" && <span className="text-xs text-gray-600 font-bold">✓</span>}
                </button>
                {colorOptions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setForm({ ...form, color: c.id })}
                    className={`h-7 w-7 rounded-full border ${c.classes.split(" ")[0]} ${c.classes.split(" ")[2]} flex items-center justify-center transition-all hover:scale-105`}
                    title={c.name}
                  >
                    {form.color === c.id && <span className="text-xs font-bold">✓</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowNewForm(false)} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={saving || !!conflict} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {saving ? "Guardando..." : conflict ? "Resolver conflicto" : "Crear Cita"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button onClick={() => navDate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-sm font-semibold text-gray-900 min-w-[180px] text-center">{dateLabel()}</h2>
            <button onClick={() => navDate(1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <button onClick={goToToday} className="px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100">Hoy</button>
          </div>

          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {(["day", "week", "month"] as const).map(v => (
                <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === v ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {v === "day" ? "Día" : v === "week" ? "Semana" : "Mes"}
                </button>
              ))}
            </div>
            {/* Therapist filter */}
            <select value={filterTherapist} onChange={e => setFilterTherapist(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs">
              <option value="all">Todos los terapeutas</option>
              {therapists.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* CALENDAR VIEWS */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><svg className="animate-spin h-6 w-6 text-indigo-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
      ) : view === "day" ? (
        /* DAY VIEW */
        <div className="space-y-3">
          {(byDate[selectedDate] || []).length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="text-4xl mb-2">📅</div>
              <p className="text-sm text-gray-500">Sin citas para este día</p>
            </div>
          ) : byDate[selectedDate].map(renderAppointment)}
        </div>
      ) : view === "week" ? (
        /* WEEK VIEW */
        <div className="grid grid-cols-7 gap-2">
          {getWeekDatesLocal().map(date => {
            const d = new Date(date + "T12:00:00");
            const apts = byDate[date] || [];
            const isT = isToday(date);
            return (
              <div key={date} className={`rounded-xl border ${isT ? "border-indigo-300 bg-indigo-50/30" : "border-gray-200 bg-white"} min-h-[120px]`}>
                <div className={`text-center py-2 border-b ${isT ? "border-indigo-200" : "border-gray-100"}`}>
                  <p className="text-[10px] text-gray-500 uppercase">{dayNames[d.getDay()]}</p>
                  <p className={`text-lg font-bold ${isT ? "text-indigo-600" : "text-gray-900"}`}>{d.getDate()}</p>
                </div>
                <div className="p-1.5 space-y-1">
                  {apts.filter(a => a.status !== "cancelada").slice(0, 3).map(apt => {
                    const { color: customColorId } = parseAppointmentNotes(apt.notes);
                    const colorClasses = (customColorId && colorMap[customColorId]) || typeColors[apt.type] || "bg-gray-100 text-gray-700";
                    return (
                      <div key={apt.id} className={`px-1.5 py-1 rounded text-[10px] border ${colorClasses}`} onClick={() => setEditApt(editApt === apt.id ? null : apt.id)}>
                        <p className="font-medium truncate">{apt.start_time}</p>
                        <p className="truncate">{(apt.patients as any)?.first_name || "?"}</p>
                      </div>
                    );
                  })}
                  {apts.filter(a => a.status !== "cancelada").length > 3 && (
                    <p className="text-[10px] text-gray-400 text-center">+{apts.filter(a => a.status !== "cancelada").length - 3} más</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* MONTH VIEW */
        <div>
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden">
            {dayNames.map(d => <div key={d} className="bg-gray-50 text-center py-2 text-xs font-medium text-gray-500">{d}</div>)}
            {getMonthWeeksLocal().flat().map((date, i) => {
              const d = new Date(date + "T12:00:00");
              const apts = byDate[date] || [];
              const isCurrentMonth = d.getMonth() === new Date(selectedDate + "T12:00:00").getMonth();
              const isT = isToday(date);
              return (
                <div key={i} className={`bg-white p-1.5 min-h-[80px] ${!isCurrentMonth ? "opacity-40" : ""} ${isT ? "ring-2 ring-indigo-400 ring-inset" : ""}`} onClick={() => { setSelectedDate(date); setView("day"); }}>
                  <p className={`text-xs font-medium mb-1 ${isT ? "text-indigo-600" : "text-gray-700"}`}>{d.getDate()}</p>
                  {apts.filter(a => a.status !== "cancelada").slice(0, 2).map(apt => {
                    const { color: customColorId } = parseAppointmentNotes(apt.notes);
                    const colorClasses = (customColorId && colorMap[customColorId]) || typeColors[apt.type] || "bg-gray-100 text-gray-700";
                    const bgClass = colorClasses.split(" ")[0];
                    const textClass = colorClasses.split(" ")[1];
                    return (
                      <div key={apt.id} className={`px-1 py-0.5 rounded text-[9px] mb-0.5 ${bgClass} ${textClass}`}>
                        {apt.start_time} {(apt.patients as any)?.first_name?.charAt(0) || ""}
                      </div>
                    );
                  })}
                  {apts.filter(a => a.status !== "cancelada").length > 2 && <p className="text-[9px] text-gray-400">+{apts.filter(a => a.status !== "cancelada").length - 2}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Appointment detail/edit popup */}
      {editApt && (() => {
        const apt = appointments.find(a => a.id === editApt);
        if (!apt) return null;
        const pName = (apt.patients as any) ? `${(apt.patients as any).first_name} ${(apt.patients as any).last_name}` : "Paciente";
        const tName = (apt.profiles as any) ? `${(apt.profiles as any).first_name} ${(apt.profiles as any).last_name}` : "Terapeuta";
        const d = new Date(apt.date + "T12:00:00");
        const { color: customColorId, text: notesText } = parseAppointmentNotes(apt.notes);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditApt(null)}>
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Detalle de Cita</h3>
                <button onClick={() => setEditApt(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${(customColorId && colorMap[customColorId]) || typeColors[apt.type] || "bg-gray-100"}`}>{typeLabels[apt.type] || apt.type}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[apt.status] || "bg-gray-100"}`}>{statusLabels[apt.status] || apt.status}</span>
                </div>
                <p className="text-sm"><span className="text-gray-500">Paciente:</span> <span className="font-medium">{pName}</span></p>
                <p className="text-sm"><span className="text-gray-500">Terapeuta:</span> <span className="font-medium">{tName}</span></p>
                <p className="text-sm"><span className="text-gray-500">Fecha:</span> {d.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" })}</p>
                <p className="text-sm"><span className="text-gray-500">Hora:</span> {apt.start_time} - {apt.end_time}</p>
                {notesText && <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{notesText}</p>}
              </div>
              {/* Status actions */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Cambiar estado</p>
                <div className="flex flex-wrap gap-2">
                  {apt.status !== "confirmada" && <button onClick={() => handleStatusUpdate(apt.id, "confirmada")} className="px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100">Confirmar</button>}
                  {apt.status !== "completada" && <button onClick={() => handleStatusUpdate(apt.id, "completada")} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Completada</button>}
                  <button onClick={() => handleStatusUpdate(apt.id, "no_asistio")} className="px-3 py-1.5 text-xs bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100">No asistió</button>
                  <button onClick={() => handleStatusUpdate(apt.id, "cancelada")} className="px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100">Cancelar</button>
                </div>
              </div>
              {/* Color actions */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Color de la cita</p>
                <div className="flex gap-2 flex-wrap items-center mt-1">
                  <button
                    type="button"
                    onClick={() => handleColorUpdate(apt.id, apt.notes, "")}
                    className={`h-7 w-7 rounded-full border border-gray-300 relative flex items-center justify-center bg-white transition-all hover:scale-105`}
                    title="Color por defecto"
                  >
                    {customColorId === null && <span className="text-xs text-gray-600 font-bold">✓</span>}
                  </button>
                  {colorOptions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleColorUpdate(apt.id, apt.notes, c.id)}
                      className={`h-7 w-7 rounded-full border ${c.classes.split(" ")[0]} ${c.classes.split(" ")[2]} flex items-center justify-center transition-all hover:scale-105`}
                      title={c.name}
                    >
                      {customColorId === c.id && <span className="text-xs font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 mt-3">
                <button onClick={() => { handleDelete(apt.id); setEditApt(null); }} className="px-3 py-1.5 text-xs text-red-700 bg-red-50 rounded-lg hover:bg-red-100">Eliminar cita</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );

  function renderAppointment(apt: Appointment) {
    const pName = (apt.patients as any) ? `${(apt.patients as any).first_name} ${(apt.patients as any).last_name}` : "Paciente";
    const tName = (apt.profiles as any) ? `${(apt.profiles as any).first_name} ${(apt.profiles as any).last_name}` : "Terapeuta";
    const { color: customColorId } = parseAppointmentNotes(apt.notes);
    const colorClasses = (customColorId && colorMap[customColorId]) || typeColors[apt.type] || "bg-gray-100 text-gray-700";
    return (
      <div key={apt.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:shadow-sm cursor-pointer" onClick={() => setEditApt(editApt === apt.id ? null : apt.id)}>
        <div className="flex items-center gap-4">
          <div className="text-center min-w-[60px]">
            <p className="text-lg font-bold text-gray-900">{apt.start_time}</p>
            <p className="text-xs text-gray-500">{apt.end_time}</p>
          </div>
          <div className="h-10 w-0.5 bg-gray-200" />
          <div>
            <p className="font-medium text-gray-900">{pName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${colorClasses}`}>{typeLabels[apt.type] || apt.type}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColors[apt.status] || "bg-gray-100"}`}>{statusLabels[apt.status] || apt.status}</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500">{tName}</p>
      </div>
    );
  }
}