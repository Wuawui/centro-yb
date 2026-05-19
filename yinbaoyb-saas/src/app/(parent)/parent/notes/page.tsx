"use client";

import AIProgressSummary from "@/features/clinical/components/AIProgressSummary";

export default function ParentNotesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">✨ Notas Clínicas IA</h1>
          <p className="text-sm text-gray-500 mt-1">Evolución de tu hijo analizada inteligentemente</p>
        </div>
      </div>

      {/* Renders the full width AI Summary Component */}
      <AIProgressSummary isFullPage={true} />

      <p className="text-xs text-gray-400 text-center mt-8">
        La Inteligencia Artificial lee el historial de reportes técnicos del terapeuta y genera un resumen claro para la familia.
      </p>
    </div>
  );
}