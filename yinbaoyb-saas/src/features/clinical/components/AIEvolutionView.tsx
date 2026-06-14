"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  TrendingDown, 
  TrendingUp, 
  Lightbulb, 
  Calendar, 
  RefreshCw,
  Sparkles,
  Check
} from "lucide-react";

interface EvolutionData {
  carencias: string[];
  areas_mejora: string[];
  estrategias?: string[];
  planificacion?: string[];
}

export default function AIEvolutionView({ patientId }: { patientId: string }) {
  const [data, setData] = useState<EvolutionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvolution = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Inicia sesión para ver el análisis.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/clinical/ai-evolution", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ patientId }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Error al obtener la evolución clínica");
      }

      setData(result);
    } catch (err: any) {
      setError(err.message || "Error al conectar con la IA.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchEvolution();
    }
  }, [patientId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-soft">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-50" />
            <div className="absolute inset-0 rounded-full border-4 border-indigo-650 border-t-transparent animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 animate-pulse font-outfit">Gemini IA Analizando Notas Clínicas...</h3>
            <p className="text-xs text-slate-400 mt-1">Estructurando estrategias terapéuticas y pautas de planificación</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-red-100 p-6 text-center shadow-soft">
        <div className="text-3xl mb-2">⚠️</div>
        <h3 className="text-sm font-semibold text-red-900 font-outfit">No se pudo generar el análisis de evolución</h3>
        <p className="text-xs text-red-700 mt-1 mb-4">{error}</p>
        <button 
          onClick={fetchEvolution} 
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Reintentar Análisis
        </button>
      </div>
    );
  }

  if (!data) return null;

  // Safe checks for arrays
  const carencias = data.carencias || [];
  const areasMejora = data.areas_mejora || [];
  const estrategias = data.estrategias || [];
  const planificacion = data.planificacion || [];

  return (
    <div className="space-y-6">
      {/* Banner de Introducción */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl p-6 text-white shadow-soft relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-indigo-200 fill-indigo-200/20" />
            <span className="text-[10px] font-bold tracking-wider uppercase bg-white/20 px-2.5 py-0.5 rounded-full font-outfit">
              Análisis Clínico Inteligente
            </span>
          </div>
          <h2 className="text-xl font-bold font-outfit">Línea de Vida y Guía de Intervención IA</h2>
          <p className="text-indigo-100 text-xs mt-1.5 leading-relaxed max-w-2xl">
            Este informe sintetiza la evolución del paciente analizando sus notas clínicas registradas en la sede. Proporciona carencias principales, metas futuras, estrategias terapéuticas y pautas de planificación.
          </p>
        </div>
      </div>

      {/* Grid 2x2 de Tarjetas de Evolución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna Carencias */}
        <div className="bg-white rounded-2xl border border-slate-100 border-l-4 border-l-rose-500 p-6 shadow-soft flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-4">
            <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-outfit">Carencias y Dificultades</h3>
              <p className="text-[11px] text-slate-400">Áreas de mayor rezago o dificultades conductuales detectadas</p>
            </div>
          </div>

          <ul className="space-y-3.5 flex-1">
            {carencias.map((item, idx) => (
              <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-600 font-medium">
                <span className="h-5 w-5 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
            {carencias.length === 0 && (
              <p className="text-xs text-slate-400 italic">No se identificaron carencias en las notas analizadas.</p>
            )}
          </ul>
        </div>

        {/* Columna Áreas de Mejora */}
        <div className="bg-white rounded-2xl border border-slate-100 border-l-4 border-l-emerald-500 p-6 shadow-soft flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-outfit">Áreas de Mejora y Trabajo</h3>
              <p className="text-[11px] text-slate-400">Habilidades priorizadas y objetivos para desarrollar</p>
            </div>
          </div>

          <ul className="space-y-3.5 flex-1">
            {areasMejora.map((item, idx) => (
              <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-600 font-medium">
                <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3" />
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
            {areasMejora.length === 0 && (
              <p className="text-xs text-slate-400 italic">No se identificaron áreas de mejora en las notas analizadas.</p>
            )}
          </ul>
        </div>

        {/* Columna Estrategias Clínicas */}
        <div className="bg-white rounded-2xl border border-slate-100 border-l-4 border-l-violet-500 p-6 shadow-soft flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-4">
            <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-500">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-outfit">Estrategias Clínicas Recomendadas</h3>
              <p className="text-[11px] text-slate-400">Técnicas y apoyos específicos sugeridos para el terapeuta</p>
            </div>
          </div>

          <ul className="space-y-3.5 flex-1">
            {estrategias.map((item, idx) => (
              <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-600 font-medium">
                <span className="h-5 w-5 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="h-3 w-3" />
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
            {estrategias.length === 0 && (
              <p className="text-xs text-slate-400 italic">
                Carga o actualiza la evolución para recibir estrategias de intervención basadas en evidencia.
              </p>
            )}
          </ul>
        </div>

        {/* Columna Planificación */}
        <div className="bg-white rounded-2xl border border-slate-100 border-l-4 border-l-amber-500 p-6 shadow-soft flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-4">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-outfit">Planificación y Guía de Sesión</h3>
              <p className="text-[11px] text-slate-400">Pautas de estructuración y enfoque profesional para futuras citas</p>
            </div>
          </div>

          <ul className="space-y-3.5 flex-1">
            {planificacion.map((item, idx) => (
              <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-600 font-medium">
                <span className="h-5 w-5 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
            {planificacion.length === 0 && (
              <p className="text-xs text-slate-400 italic">
                Carga o actualiza la evolución para recibir pautas de planificación de próximas sesiones.
              </p>
            )}
          </ul>
        </div>
      </div>

      {/* Footer Info Box */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-150">
        <div className="text-[10px] text-slate-400 max-w-lg leading-relaxed font-medium">
          <span className="font-semibold text-indigo-650 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            Análisis clínico potenciado por Ollama (gemma4:31b-cloud)
          </span>
          <p className="mt-0.5">Este informe procesa en tiempo real de forma gratuita los registros históricos cargados. El criterio e intervención del profesional clínico son soberanos.</p>
        </div>
        <button 
          onClick={fetchEvolution} 
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/50 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 flex-shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Recalcular Evolución
        </button>
      </div>
    </div>
  );
}
