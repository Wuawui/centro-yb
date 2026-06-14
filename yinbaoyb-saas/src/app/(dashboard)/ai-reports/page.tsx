"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/components/providers/SessionProvider";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { 
  Sparkles, 
  Search, 
  Printer, 
  FileText, 
  TrendingUp, 
  Lightbulb, 
  Calendar, 
  Home, 
  AlertCircle,
  FileSpreadsheet,
  Brain
} from "lucide-react";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  primary_diagnosis: string | null;
  reason_for_consultation: string | null;
  birth_date: string | null;
  status: string;
}

interface DetailedReport {
  resumen_clinico: string;
  analisis_conductual: string;
  analisis_habilidades: string;
  estrategias_clinicas: string;
  plan_4_semanas: string;
  plan_hogar: string;
}

export default function AIReportsPage() {
  const supabase = createClient();
  const { tenantId } = useSession();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  const [notesCount, setNotesCount] = useState<number>(0);
  const [report, setReport] = useState<DetailedReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load active patients for selector
  const loadPatients = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const { data, error: pErr } = await supabase
        .from("patients")
        .select("id, first_name, last_name, primary_diagnosis, reason_for_consultation, birth_date, status")
        .eq("tenant_id", tenantId)
        .eq("active", true)
        .order("first_name");

      if (pErr) throw pErr;
      setPatients(data || []);
      setFilteredPatients(data || []);
    } catch (err: any) {
      console.error("Error loading patients:", err);
      setError("No se pudieron cargar los pacientes de la sede.");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Search filter
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = patients.filter(p => 
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(query) ||
      (p.primary_diagnosis?.toLowerCase().includes(query) ?? false)
    );
    setFilteredPatients(filtered);
  }, [searchQuery, patients]);

  // Load notes count when patient is selected
  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setReport(null);
    setError(null);
    try {
      const { count, error: countErr } = await supabase
        .from("clinical_notes")
        .select("id", { count: "exact", head: true })
        .eq("patient_id", patient.id);
      
      if (countErr) throw countErr;
      setNotesCount(count || 0);
    } catch (err) {
      console.error("Error fetching notes count:", err);
      setNotesCount(0);
    }
  };

  // Call Detailed Report API
  const handleGenerateReport = async () => {
    if (!selectedPatient) return;
    setGenerating(true);
    setError(null);
    setReport(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Inicia sesión para realizar esta acción.");
        setGenerating(false);
        return;
      }

      const res = await fetch("/api/clinical/ai-detailed-report", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ patientId: selectedPatient.id }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Error al procesar el reporte con IA.");
      }

      setReport(result);
    } catch (err: any) {
      console.error("AI Report Error:", err);
      setError(err.message || "Error al conectar con el servidor de IA local.");
    } finally {
      setGenerating(false);
    }
  };

  // native window print trigger
  const handlePrint = () => {
    window.print();
  };

  if (loading) return <PageLoading text="Cargando panel de informes..." />;

  const getAge = (dob: string | null) => {
    if (!dob) return null;
    return Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000);
  };

  return (
    <div className="space-y-6 print-container">
      {/* Print Headings (Hidden on Screen, Visible on Print) */}
      <div className="hidden print:block border-b border-slate-350 pb-5 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-outfit uppercase tracking-wide">Centro Terapéutico Logros</h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Informe Clínico de Evolución y Pautas Psicoeducativas</p>
          </div>
          <div className="text-right text-[10px] text-slate-400 font-semibold font-mono">
            FECHA DE EMISIÓN: {new Date().toLocaleDateString("es-EC")}
          </div>
        </div>
        
        {selectedPatient && (
          <div className="mt-4 grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <div>
              <p><strong>Paciente:</strong> {selectedPatient.first_name} {selectedPatient.last_name}</p>
              <p><strong>Diagnóstico:</strong> {selectedPatient.primary_diagnosis || "No especificado"}</p>
            </div>
            <div>
              <p><strong>Edad:</strong> {getAge(selectedPatient.birth_date) ? `${getAge(selectedPatient.birth_date)} años` : "—"}</p>
              <p><strong>Sesiones Analizadas:</strong> {notesCount} notas clínicas de evolución</p>
            </div>
          </div>
        )}
      </div>

      {/* Screen Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Análisis Clínico IA</h1>
          <p className="text-sm text-gray-500 mt-1">Generación de informes de alta fidelidad para dirección y planificación clínica</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-800 flex items-start gap-3 print:hidden">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Error en la operación</h4>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Selector de Paciente & Ficha (Hidden on Print) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        {/* Columna Izquierda: Buscador de Paciente */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-soft p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4 font-outfit">🔍 Selección de Paciente</h2>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
            />
          </div>

          <div className="space-y-1 max-h-[45vh] overflow-y-auto pr-1">
            {filteredPatients.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No se encontraron pacientes activos</p>
            ) : filteredPatients.map(p => (
              <button 
                key={p.id} 
                onClick={() => handleSelectPatient(p)}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-semibold transition-all border ${
                  selectedPatient?.id === p.id 
                    ? "bg-indigo-50 text-indigo-700 border-indigo-250/50 shadow-sm" 
                    : "hover:bg-slate-50 text-slate-600 border-transparent"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-outfit text-sm">{p.first_name} {p.last_name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                    p.status === "activo" ? "bg-green-50 text-green-700 border border-green-200" : "bg-yellow-50 text-yellow-700 border border-yellow-250"
                  }`}>
                    {p.status}
                  </span>
                </div>
                {p.primary_diagnosis && (
                  <p className="text-[10px] text-slate-400 mt-1 font-mono italic">CIE-10: {p.primary_diagnosis}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Columna Derecha: Ficha de Paciente y Botón de Acción */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedPatient ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-12 text-center flex flex-col items-center justify-center">
              <div className="text-5xl mb-4">🩺</div>
              <h2 className="text-base font-bold text-gray-900 font-outfit">Módulo de Informes de Dirección</h2>
              <p className="text-xs text-gray-500 max-w-sm mt-1 leading-relaxed">
                Selecciona un paciente del menú lateral para revisar su historial de notas de evolución y disparar la síntesis estructurada.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6 space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-50">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase bg-indigo-50 text-indigo-650 px-2 py-0.5 rounded-full font-outfit">Ficha Médica</span>
                  <h2 className="text-lg font-bold text-slate-900 font-outfit mt-1.5">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right sm:text-right">
                    <span className="text-xl font-bold text-indigo-600 block">{notesCount}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Notas Clínicas</span>
                  </div>
                </div>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <dt className="text-slate-400 uppercase text-[9px] tracking-wider">Diagnóstico Principal</dt>
                  <dd className="text-slate-800 font-outfit text-sm mt-1">{selectedPatient.primary_diagnosis || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-400 uppercase text-[9px] tracking-wider">Edad del menor</dt>
                  <dd className="text-slate-800 font-outfit text-sm mt-1">
                    {getAge(selectedPatient.birth_date) ? `${getAge(selectedPatient.birth_date)} años` : "—"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-400 uppercase text-[9px] tracking-wider">Motivo de consulta</dt>
                  <dd className="text-slate-700 font-medium leading-relaxed mt-1">{selectedPatient.reason_for_consultation || "—"}</dd>
                </div>
              </dl>

              <div className="pt-4 border-t border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-[10px] text-slate-400 leading-relaxed max-w-md">
                  <span className="font-semibold text-slate-600 block">Condición para informe:</span>
                  El paciente requiere de notas registradas por los terapeutas tratantes para estructurar la síntesis de evolución clínica.
                </div>
                
                <button
                  onClick={handleGenerateReport}
                  disabled={generating || notesCount === 0}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold py-3 px-5 rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-indigo-500/10 active:scale-95 flex-shrink-0"
                >
                  <Sparkles className="h-4 w-4" />
                  {generating ? "Estructurando Informe..." : "Generar Informe Clínico IA"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State for Report (Hidden on Print) */}
      {generating && (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-soft print:hidden">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-50" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 animate-pulse font-outfit">Ollama IA Redactando Informe de Alta Fidelidad...</h3>
              <p className="text-xs text-slate-400 mt-1">Analizando {notesCount} notas de evolución clínica de la base de datos local</p>
            </div>
          </div>
        </div>
      )}

      {/* Report Render View */}
      {report && (
        <div className="space-y-6 print-container">
          {/* Action Header on screen, Hidden on print */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 print:hidden mt-4">
            <h2 className="text-lg font-bold text-slate-800 font-outfit flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
              Informe Generado con Éxito
            </h2>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Printer className="h-4 w-4" />
              Imprimir / Guardar PDF
            </button>
          </div>

          {/* Cards Stack */}
          <div className="grid grid-cols-1 gap-6">
            {/* 1. Resumen Clinico */}
            <div className="bg-white rounded-2xl border border-slate-100 border-l-4 border-l-indigo-600 p-6 shadow-soft print-card flex flex-col">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-4">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-outfit">Resumen Clínico Ejecutivo</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Análisis general del progreso y evolución clínica</p>
                </div>
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{report.resumen_clinico}</p>
            </div>

            {/* 2. Analisis Conductual */}
            <div className="bg-white rounded-2xl border border-slate-100 border-l-4 border-l-fuchsia-500 p-6 shadow-soft print-card flex flex-col">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-4">
                <div className="h-9 w-9 rounded-xl bg-fuchsia-50 flex items-center justify-center text-fuchsia-600 flex-shrink-0">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-outfit">Análisis Conductual y de Comportamiento</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Autorregulación, tolerancia a la frustración y modulación sensorial</p>
                </div>
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{report.analisis_conductual}</p>
            </div>

            {/* 3. Analisis Habilidades */}
            <div className="bg-white rounded-2xl border border-slate-100 border-l-4 border-l-emerald-500 p-6 shadow-soft print-card flex flex-col">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-4">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 flex-shrink-0">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-outfit">Análisis de Habilidades e Intervenciones</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Desempeño y desarrollo psicopedagógico y conductual</p>
                </div>
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{report.analisis_habilidades}</p>
            </div>

            {/* 4. Estrategias Clinicas */}
            <div className="bg-white rounded-2xl border border-slate-100 border-l-4 border-l-violet-500 p-6 shadow-soft print-card flex flex-col">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-4">
                <div className="h-9 w-9 rounded-xl bg-violet-50 flex items-center justify-center text-violet-500 flex-shrink-0">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-outfit">Estrategias Clínicas de Intervención</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Técnicas avanzadas recomendadas para el abordaje terapéutico</p>
                </div>
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{report.estrategias_clinicas}</p>
            </div>

            {/* 5. Planificacion de Sesiones */}
            <div className="bg-white rounded-2xl border border-slate-100 border-l-4 border-l-amber-500 p-6 shadow-soft print-card flex flex-col">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-4">
                <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 flex-shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-outfit">Planificación de Sesión (Próximas 4 Semanas)</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Objetivos semanales estructurados de intervención clínica</p>
                </div>
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{report.plan_4_semanas}</p>
            </div>

            {/* 6. Plan Hogar */}
            <div className="bg-white rounded-2xl border border-slate-100 border-l-4 border-l-rose-500 p-6 shadow-soft print-card flex flex-col">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-4">
                <div className="h-9 w-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 flex-shrink-0">
                  <Home className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-outfit">Plan de Estimulación en el Hogar</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Pautas de crianza, límites y adecuaciones ambientales para padres</p>
                </div>
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{report.plan_hogar}</p>
            </div>
          </div>

          {/* Footer Signature Box for Printed copy */}
          <div className="hidden print:block mt-16 pt-8 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-8 text-center text-xs">
              <div className="flex flex-col items-center">
                <div className="h-16 border-b border-slate-300 w-48 mb-2" />
                <p className="font-bold">Firma del Director de Sede</p>
                <p className="text-[10px] text-slate-400">Dirección Clínica Centro Logros</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-16 border-b border-slate-300 w-48 mb-2" />
                <p className="font-bold">Firma de Coordinación Clínica</p>
                <p className="text-[10px] text-slate-400">Coordinación de Tratamiento Infantil</p>
              </div>
            </div>
          </div>

          {/* Screen-only free analysis credit */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-150 print:hidden">
            <div className="text-[10px] text-slate-400 max-w-lg leading-relaxed font-semibold">
              <span className="font-bold text-indigo-650 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                Informe Directivo Potenciado de forma gratuita por Ollama (gemma4:31b-cloud)
              </span>
              <p className="mt-0.5">La compilación clínica y los objetivos sugeridos deben ser revisados y aprobados por la dirección médica tratante antes de su firma oficial.</p>
            </div>
            <button 
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/50 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 flex-shrink-0"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir Informe
            </button>
          </div>
        </div>
      )}

      {/* Global CSS for Native Print formatting */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            font-size: 11pt !important;
          }
          aside, nav, header, button, .print\\:hidden, .no-print {
            display: none !important;
          }
          main, .print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 12px !important;
            margin-bottom: 1.5rem !important;
            padding: 1.25rem !important;
            background: white !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
