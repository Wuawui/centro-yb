// ============================================================
// Data Access Layer — Queries reutilizables de Supabase
// Elimina la duplicación de queries inline en cada página
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";

// ── Date Helpers ───────────────────────────────────────────

export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export function getWeekRange(dateStr: string): { start: string; end: string } {
  const d = new Date(dateStr + "T12:00:00");
  const dayOfWeek = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

export function getMonthRange(dateStr: string): { start: string; end: string } {
  const d = new Date(dateStr + "T12:00:00");
  const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { start, end: lastDay.toISOString().split("T")[0] };
}

export function getDateRange(
  dateStr: string,
  view: "day" | "week" | "month"
): { start: string; end: string } {
  if (view === "day") return { start: dateStr, end: dateStr };
  if (view === "week") return getWeekRange(dateStr);
  return getMonthRange(dateStr);
}

export function getWeekDates(dateStr: string): string[] {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const c = new Date(monday);
    c.setDate(monday.getDate() + i);
    return c.toISOString().split("T")[0];
  });
}

export function getMonthWeeks(dateStr: string): string[][] {
  const d = new Date(dateStr + "T12:00:00");
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const weeks: string[][] = [];
  let current = new Date(d.getFullYear(), d.getMonth(), 1);
  current.setDate(current.getDate() - (current.getDay() === 0 ? 6 : current.getDay() - 1));

  while (current <= lastDay || weeks.length === 0) {
    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
    if (current > lastDay && current.getDay() === 1) break;
  }
  return weeks;
}

// ── Dashboard Stats ────────────────────────────────────────

export interface DashboardStats {
  activePatients: number;
  totalPatients: number;
  todayAppointments: number;
  weekAppointments: number;
  pendingNotes: number;
  clinicalAlerts: number;
  therapistsCount: number;
}

export async function getDashboardStats(
  supabase: SupabaseClient,
  tenantId: string,
  therapistId?: string
): Promise<DashboardStats> {
  const today = getToday();
  const { start: weekStart, end: weekEnd } = getWeekRange(today);

  const buildQuery = (table: string, select: string, filters: Record<string, any> = {}) => {
    let q = supabase.from(table).select(select, { count: "exact", head: true }).eq("tenant_id", tenantId);
    if (therapistId && table === "patients") {
      q = q.or(`therapist_id.eq.${therapistId},secondary_therapist_ids.cs.{"${therapistId}"}`);
    } else if (therapistId) {
      q = q.eq("therapist_id", therapistId);
    }
    Object.entries(filters).forEach(([k, v]) => { q = q.eq(k, v); });
    return q;
  };

  const [
    totalPatientsRes,
    activePatientsRes,
    todayAptsRes,
    weekAptsRes,
    pendingNotesRes,
    alertsRes,
    therapistsRes,
  ] = await Promise.all([
    buildQuery("patients", "id", { active: true }),
    buildQuery("patients", "id", { active: true, status: "activo" }),
    (() => {
      let q = supabase.from("appointments").select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId).eq("date", today).neq("status", "cancelada");
      if (therapistId) q = q.eq("therapist_id", therapistId);
      return q;
    })(),
    (() => {
      let q = supabase.from("appointments").select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId).gte("date", weekStart).lte("date", weekEnd).neq("status", "cancelada");
      if (therapistId) q = q.eq("therapist_id", therapistId);
      return q;
    })(),
    (() => {
      let q = supabase.from("clinical_notes").select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId).eq("signed", false);
      if (therapistId) q = q.eq("therapist_id", therapistId);
      return q;
    })(),
    (() => {
      let q = supabase.from("scale_results").select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId).eq("risk_alert", true);
      if (therapistId) q = q.eq("therapist_id", therapistId);
      return q;
    })(),
    supabase.from("therapists").select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId).eq("active", true),
  ]);

  return {
    totalPatients: totalPatientsRes.count || 0,
    activePatients: activePatientsRes.count || 0,
    todayAppointments: todayAptsRes.count || 0,
    weekAppointments: weekAptsRes.count || 0,
    pendingNotes: pendingNotesRes.count || 0,
    clinicalAlerts: alertsRes.count || 0,
    therapistsCount: therapistsRes.count || 0,
  };
}

// ── Appointments ───────────────────────────────────────────

export async function getTodayAppointments(
  supabase: SupabaseClient,
  tenantId: string,
  therapistId?: string
) {
  const today = getToday();
  let q = supabase
    .from("appointments")
    .select("id, date, start_time, end_time, type, status, patients!appointments_patient_id_fkey(first_name, last_name)")
    .eq("tenant_id", tenantId)
    .eq("date", today)
    .neq("status", "cancelada")
    .order("start_time");
  if (therapistId) q = q.eq("therapist_id", therapistId);
  const { data } = await q;
  return data || [];
}

export async function getAppointments(
  supabase: SupabaseClient,
  tenantId: string,
  dateRange: { start: string; end: string },
  options?: { therapistId?: string; includeTherapistProfile?: boolean }
) {
  let select = "id, patient_id, therapist_id, type, status, date, start_time, end_time, notes, patients!appointments_patient_id_fkey(first_name, last_name)";
  if (options?.includeTherapistProfile) {
    select += ", profiles!appointments_therapist_id_fkey(first_name, last_name)";
  }

  let q = supabase
    .from("appointments")
    .select(select)
    .eq("tenant_id", tenantId)
    .gte("date", dateRange.start)
    .lte("date", dateRange.end)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (options?.therapistId) q = q.eq("therapist_id", options.therapistId);

  const { data } = await q;
  return data || [];
}

// ── Patients ───────────────────────────────────────────────

export async function getRecentPatients(
  supabase: SupabaseClient,
  tenantId: string,
  therapistId?: string,
  limit = 5
) {
  let q = supabase
    .from("patients")
    .select("id, first_name, last_name, status, reason_for_consultation, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (therapistId) q = q.or(`therapist_id.eq.${therapistId},secondary_therapist_ids.cs.{"${therapistId}"}`).eq("active", true);
  const { data } = await q;
  return data || [];
}

// ── Clinical Notes ─────────────────────────────────────────

export async function createClinicalNote(
  supabase: SupabaseClient,
  data: {
    tenant_id: string;
    patient_id: string;
    therapist_id: string;
    format?: string;
    note_type?: string;
    content?: string;
    signed?: boolean;
    [key: string]: any;
  }
) {
  // Clean empty strings to null
  const cleaned = { ...data };
  Object.keys(cleaned).forEach((k) => {
    if (cleaned[k] === "" || cleaned[k] === undefined) cleaned[k] = null;
  });
  return supabase.from("clinical_notes").insert(cleaned);
}

export async function signClinicalNote(supabase: SupabaseClient, noteId: string) {
  return supabase.from("clinical_notes").update({ signed: true }).eq("id", noteId);
}

// ── Scale Results ──────────────────────────────────────────

export async function saveScaleResult(
  supabase: SupabaseClient,
  data: {
    tenant_id: string;
    patient_id: string;
    scale_id: string;
    therapist_id: string;
    answers: Record<string, number>;
    total_score: number;
    risk_alert: boolean;
    notes?: string | null;
  }
) {
  return supabase.from("scale_results").insert(data);
}

// ── Scale Alerts (for therapist dashboard) ─────────────────

export async function getScaleAlerts(
  supabase: SupabaseClient,
  tenantId: string,
  therapistId: string,
  limit = 5
) {
  const { data } = await supabase
    .from("scale_results")
    .select("id, scale_type, total_score, risk_alert, applied_at, patients!scale_results_patient_id_fkey(first_name, last_name)")
    .eq("tenant_id", tenantId)
    .eq("therapist_id", therapistId)
    .eq("risk_alert", true)
    .order("applied_at", { ascending: false })
    .limit(limit);
  return data || [];
}
