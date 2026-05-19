"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/components/providers/SessionProvider";

// Hook para datos del padre (hijos, notas, escalas, citas)
export function useParentData() {
  const { user } = useSession();
  const [children, setChildren] = useState<any[]>([]);
  const [lastNote, setLastNote] = useState<any>(null);
  const [lastScale, setLastScale] = useState<any>(null);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Obtener hijos vinculados
      let childrenData: any[] = [];

      // Try RPC first, fallback to direct queries
      const { data: rpcData, error: cErr } = await supabase.rpc("get_parent_children", { p_parent_id: user.id });

      if (cErr || !rpcData || rpcData.length === 0) {
        // Fallback: direct query via parent_patients join
        const { data: parentLinks } = await supabase
          .from("parent_patients")
          .select("patient_id, relationship, can_view_notes, can_view_scales, can_view_appointments")
          .eq("parent_id", user.id);

        if (parentLinks && parentLinks.length > 0) {
          const patientIds = parentLinks.map((pl: any) => pl.patient_id);
          const { data: patients } = await supabase
            .from("patients")
            .select("id, first_name, last_name, status, active, primary_diagnosis, birth_date, therapist_id, emergency_contact, emergency_phone")
            .in("id", patientIds);

          if (patients) {
            childrenData = patients.map((p: any) => ({
              ...p,
              _parentLink: parentLinks.find((pl: any) => pl.patient_id === p.id),
            }));
          }
        }
      } else {
        childrenData = rpcData as any[];
      }

      setChildren(childrenData);

      if (childrenData.length > 0) {
        const firstChild = childrenData[0];
        const patientId = firstChild.id || firstChild.patient_id;

        // Load notes, scales, appointments in parallel
        const loadNotes = async () => {
          const { data } = await supabase.rpc("get_parent_notes", { p_parent_id: user.id });
          if (data && data.length > 0) return data[0];
          // Fallback: direct query
          const { data: notes } = await supabase
            .from("clinical_notes")
            .select("id, patient_id, therapist_id, format, subjective, objective, assessment, plan, behavior, intervention, response, data, mood, content, tasks_assigned, next_objective, progress_score, signed, created_at")
            .eq("patient_id", patientId)
            .order("created_at", { ascending: false })
            .limit(1);
          return notes && notes.length > 0 ? notes[0] : null;
        };

        const loadScales = async () => {
          const { data } = await supabase.rpc("get_parent_scales", { p_parent_id: user.id });
          if (data && data.length > 0) return data[0];
          // Fallback: direct query
          const { data: scales } = await supabase
            .from("scale_results")
            .select("id, patient_id, scale_id, total_score, risk_alert, notes, completed_at")
            .eq("patient_id", patientId)
            .order("completed_at", { ascending: false })
            .limit(1);
          return scales && scales.length > 0 ? scales[0] : null;
        };

        const loadAppointments = async () => {
          const { data } = await supabase.rpc("get_parent_appointments", { p_parent_id: user.id });
          if (data && data.length > 0) {
            const future = data.filter((a: any) => new Date(a.date) >= new Date(new Date().toISOString().split("T")[0]));
            return future.length > 0 ? future[0] : null;
          }
          // Fallback: direct query
          const today = new Date().toISOString().split("T")[0];
          const { data: appts } = await supabase
            .from("appointments")
            .select("id, patient_id, therapist_id, date, start_time, end_time, type, status, notes, created_at")
            .eq("patient_id", patientId)
            .gte("date", today)
            .neq("status", "cancelada")
            .order("date", { ascending: true })
            .limit(1);
          return appts && appts.length > 0 ? appts[0] : null;
        };

        const [lastNoteData, lastScaleData, nextAptData] = await Promise.all([
          loadNotes(),
          loadScales(),
          loadAppointments(),
        ]);

        if (lastNoteData) setLastNote(lastNoteData);
        if (lastScaleData) setLastScale(lastScaleData);
        if (nextAptData) setNextAppointment(nextAptData);
      }
    } catch (err: any) {
      setError(err.message || "Error cargando datos");
    }
    setLoading(false);
  }, [user]);

  // Auto-ejecutar cuando el usuario esté disponible
  useEffect(() => {
    loadData();
  }, [loadData]);

  return { children, lastNote, lastScale, nextAppointment, loading, error, loadData };
}