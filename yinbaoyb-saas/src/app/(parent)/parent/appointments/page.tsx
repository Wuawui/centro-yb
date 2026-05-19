"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ParentAppointmentsPage() {
  const supabase = createClient();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [therapistNames, setTherapistNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error: rpcErr } = await supabase.rpc("get_parent_appointments", { p_parent_id: user.id });
      if (rpcErr) { setError(rpcErr.message); setLoading(false); return; }
      setAppointments(data || []);

      if (data && data.length > 0) {
        const ids = [...new Set(data.map((a: any) => a.therapist_id).filter(Boolean))];
        if (ids.length > 0) {
          const { data: profiles } = await supabase.rpc("get_therapist_profiles");
          const map = new Map<string, string>((profiles || []).map((p: any) => [p.id as string, `${p.first_name} ${p.last_name}`] as [string, string]));
          setTherapistNames(map);
        }
      }
    } catch (err: any) {
      setError(err.message || "Error cargando citas");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const today = new Date().toISOString().split("T")[0];
  const upcoming = appointments.filter(a => a.date >= today).reverse();
  const past = appointments.filter(a => a.date < today);

  const typeLabels: Record<string, string> = {
    individual: "Individual", grupal: "Grupal", taller: "Taller",
    evaluacion: "Evaluación", supervision: "Supervisión",
  };
  const statusLabels: Record<string, { label: string; color: string }> = {
    programada: { label: "Programada", color: "bg-blue-50 text-blue-700" },
    completada: { label: "Completada", color: "bg-green-50 text-green-700" },
    cancelada: { label: "Cancelada", color: "bg-red-50 text-red-700" },
    no_asistio: { label: "No asistió", color: "bg-gray-50 text-gray-600" },
  };

  if (loading) return <div className="flex items-center justify-center h-32"><div className="animate-spin h-6 w-6 border-4 border-emerald-600 border-t-transparent rounded-full" /></div>;
  if (error) return <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">📅 Citas</h1>

      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Próximas citas</h2>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-gray-400 text-sm">Sin citas programadas</p>
          </div>
        ) : upcoming.map(a => {
          const status = statusLabels[a.status] || { label: a.status, color: "bg-gray-50 text-gray-600" };
          return (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(a.date + "T12:00:00").toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                  <p className="text-sm text-gray-600">{a.start_time?.slice(0, 5)} - {a.end_time?.slice(0, 5)}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{typeLabels[a.type] || a.type}</span>
                {a.therapist_id && <span>· 👩‍⚕️ {therapistNames.get(a.therapist_id) || "Terapeuta"}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {past.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Citas anteriores</h2>
          <div className="space-y-2">
            {past.slice(0, 10).map(a => {
              const status = statusLabels[a.status] || { label: a.status, color: "bg-gray-50 text-gray-600" };
              return (
                <div key={a.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">{new Date(a.date + "T12:00:00").toLocaleDateString("es-EC", { day: "numeric", month: "short" })} · {a.start_time?.slice(0, 5)}</p>
                    <p className="text-xs text-gray-500">{typeLabels[a.type] || a.type}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${status.color}`}>{status.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">Solo lectura · Las citas son gestionadas por el centro</p>
    </div>
  );
}