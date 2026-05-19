"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ParentScalesPage() {
  const supabase = createClient();
  const [scales, setScales] = useState<any[]>([]);
  const [scaleInfo, setScaleInfo] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error: rpcErr } = await supabase.rpc("get_parent_scales", { p_parent_id: user.id });
      if (rpcErr) { setError(rpcErr.message); setLoading(false); return; }
      setScales(data || []);

      if (data && data.length > 0) {
        const scaleIds = [...new Set(data.map((s: any) => s.scale_id))];
        const { data: infoData } = await supabase.from("clinical_scales").select("id, name, acronym, max_score, risk_threshold").in("id", scaleIds);
        setScaleInfo(new Map((infoData || []).map((s: any) => [s.id, s])));
      }
    } catch (err: any) {
      setError(err.message || "Error cargando evaluaciones");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getRiskEmoji = (score: number, max: number) => {
    const pct = max ? (score / max) * 100 : 0;
    if (pct >= 70) return { emoji: "🔴", label: "Riesgo alto", color: "text-red-600", bg: "bg-red-50" };
    if (pct >= 40) return { emoji: "🟡", label: "Riesgo moderado", color: "text-yellow-600", bg: "bg-yellow-50" };
    return { emoji: "🟢", label: "Bajo riesgo", color: "text-green-600", bg: "bg-green-50" };
  };

  if (loading) return <div className="flex items-center justify-center h-32"><div className="animate-spin h-6 w-6 border-4 border-emerald-600 border-t-transparent rounded-full" /></div>;
  if (error) return <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">📊 Evaluaciones</h1>

      {scales.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-gray-500">Aún no hay evaluaciones registradas</p>
        </div>
      ) : (
        <>
          {scales.length >= 2 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Evolución</h3>
              <div className="flex items-end gap-2 h-24">
                {[...scales].reverse().slice(0, 8).map((s, i) => {
                  const info = scaleInfo.get(s.scale_id);
                  const max = info?.max_score || 27;
                  const pct = max ? (s.total_score / max) * 100 : 0;
                  const risk = getRiskEmoji(s.total_score, max);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-full rounded-t ${risk.emoji === "🔴" ? "bg-red-400" : risk.emoji === "🟡" ? "bg-yellow-400" : "bg-green-400"}`} style={{ height: `${Math.max(pct, 10)}%` }} />
                      <span className="text-[9px] text-gray-400">{new Date(s.completed_at).toLocaleDateString("es-EC", { day: "numeric", month: "short" })}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {scales.map(s => {
            const info = scaleInfo.get(s.scale_id);
            const max = info?.max_score || 27;
            const risk = getRiskEmoji(s.total_score, max);
            return (
              <div key={s.id} className={`rounded-xl border p-4 ${s.risk_alert ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">{info?.acronym || "Escala"}</span>
                    <span className="text-xs text-gray-500 ml-2">{info?.name}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-bold ${risk.color}`}>{s.total_score}</span>
                    <span className="text-sm text-gray-400">/{max}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${risk.emoji === "🔴" ? "bg-red-500" : risk.emoji === "🟡" ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${Math.min(max ? (s.total_score / max) * 100 : 0, 100)}%` }} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs font-medium ${risk.color}`}>{risk.emoji} {risk.label}</span>
                  <span className="text-xs text-gray-400">{new Date(s.completed_at).toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                {s.notes && <p className="text-xs text-gray-500 mt-1 italic">"{s.notes}"</p>}
              </div>
            );
          })}
        </>
      )}

      <p className="text-xs text-gray-400 text-center">Solo lectura · Las evaluaciones son aplicadas por el terapeuta</p>
    </div>
  );
}