"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface EvolutionChartProps {
  patientId: string;
}

export default function EvolutionChart({ patientId }: EvolutionChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!patientId) return;
      
      const supabase = createClient();
      
      const { data: notes, error } = await supabase
        .from("clinical_notes")
        .select("created_at, progress_score")
        .eq("patient_id", patientId)
        .not("progress_score", "is", null)
        .order("created_at", { ascending: true }) // De más antiguo a más reciente
        .limit(20);
        
      if (!error && notes && notes.length > 0) {
        // Formatear la fecha para el gráfico
        const chartData = notes.map((n: any) => ({
          fecha: new Date(n.created_at).toLocaleDateString("es-EC", { day: "numeric", month: "short" }),
          puntaje: n.progress_score
        }));
        setData(chartData);
      }
      setLoading(false);
    }
    
    loadData();
  }, [patientId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center h-[300px]">
        <div className="animate-spin h-6 w-6 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center h-[300px] flex flex-col items-center justify-center">
        <span className="text-3xl mb-2">📈</span>
        <h3 className="text-sm font-semibold text-gray-800">Sin datos suficientes</h3>
        <p className="text-xs text-gray-500 max-w-[250px] mt-1">El terapeuta documentará los puntajes de progreso pronto para generar este gráfico de evolución.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          📈 Línea de Vida Terapéutica
        </h3>
        <p className="text-xs text-gray-500">Puntaje clínico de progreso (1-10) de las últimas sesiones</p>
      </div>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={10} />
            <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ color: '#374151', fontWeight: 'bold', marginBottom: '4px' }}
            />
            <Line 
              type="monotone" 
              dataKey="puntaje" 
              name="Progreso"
              stroke="#059669" 
              strokeWidth={3}
              activeDot={{ r: 6, fill: "#059669", stroke: "#fff", strokeWidth: 2 }}
              dot={{ r: 4, fill: "#059669", strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
