"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AIProgressSummary({ isFullPage = false }: { isFullPage?: boolean }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [notesCount, setNotesCount] = useState<number>(0);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("No autenticado. Inicia sesión nuevamente.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/parent/ai-summary", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Error generando el análisis");
      } else {
        setSummary(data.summary);
        setNotesCount(data.notesAnalyzed || 0);
        setGeneratedAt(data.generatedAt || null);
      }
    } catch (err: any) {
      setError("Error de conexión. Intenta nuevamente.");
    }

    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-2xl border border-emerald-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold text-base">Análisis de Evolución IA</h3>
            <p className="text-emerald-100 text-xs">Resumen inteligente del progreso terapéutico</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* No summary yet */}
        {!summary && !loading && !error && (
          <div className="text-center py-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 mb-3">
              <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-4 max-w-sm mx-auto">
              Nuestra IA analizará las notas clínicas registradas por el terapeuta y te dará un resumen claro del progreso de tu hijo/a.
            </p>
            <button
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-200 active:scale-[0.98]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Ver Análisis de Evolución IA
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-3 px-5 py-3 bg-emerald-50 rounded-xl">
              <div className="relative">
                <div className="h-5 w-5 border-2 border-emerald-200 rounded-full" />
                <div className="absolute inset-0 h-5 w-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-emerald-700">IA analizando reportes...</p>
                <p className="text-xs text-emerald-500">Esto puede tomar unos segundos</p>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="py-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-3">
              {error}
            </div>
            <button
              onClick={handleGenerate}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Reintentar →
            </button>
          </div>
        )}

        {/* Summary result */}
        {summary && !loading && (
          <div>
            {/* Meta info */}
            <div className="flex items-center gap-3 mb-4 text-xs text-gray-400">
              {notesCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-medium">
                  📊 {notesCount} notas analizadas
                </span>
              )}
              {generatedAt && (
                <span>
                  Generado: {new Date(generatedAt).toLocaleDateString("es-EC", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>

            {/* AI text */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                {summary}
              </div>
            </div>

            {/* Regenerate button */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-[10px] text-gray-400 max-w-[200px]">
                Este análisis fue generado por IA y no reemplaza la evaluación profesional.
              </p>
              <button
                onClick={handleGenerate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualizar análisis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
