"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface BackupFile {
  name: string;
  created_at: string;
  metadata: { size: number };
}

export default function BackupsPage() {
  const supabase = createClient();
  const toast = useToast();
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => { loadBackups(); }, []);

  async function loadBackups() {
    setLoading(true);
    const { data, error } = await supabase.storage.from("backups").list("");
    
    if (error) {
      if (error.message.includes("Bucket not found")) {
        setBackups([]);
      } else {
        toast.addToast("Error cargando respaldos: " + error.message, "error");
      }
      setLoading(false);
      return;
    }

    const validBackups = [];
    const now = new Date();
    
    // Auto-depuración: Eliminar archivos mayores a 30 días
    for (const file of data || []) {
      if (file.name === ".emptyFolderPlaceholder") continue;
      
      const fileDate = new Date(file.created_at);
      const diffTime = Math.abs(now.getTime() - fileDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 30) {
        // Auto-delete
        await supabase.storage.from("backups").remove([file.name]);
      } else {
        validBackups.push({ ...file, days_left: 30 - diffDays });
      }
    }
    
    validBackups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setBackups(validBackups as any[]);
    setLoading(false);
  }

  const handleDownloadPDF = async (fileName: string) => {
    setDownloading(fileName);
    try {
      // 1. Descargar el JSON del bucket
      const { data, error } = await supabase.storage.from("backups").download(fileName);
      if (error) throw error;
      
      const text = await data.text();
      const payload = JSON.parse(text);
      
      // 2. Generar PDF
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.setTextColor(5, 150, 105); // Emerald-600
      doc.text("Respaldo de Información Clínica", 14, 22);
      
      // Info Terapeuta
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text(`Terapeuta: ${payload.therapist_name}`, 14, 32);
      doc.text(`Fecha de Respaldo: ${new Date(payload.deleted_at).toLocaleString('es-EC')}`, 14, 38);
      doc.text(`Total Pacientes: ${payload.patients_count} | Total Notas: ${payload.notes_count}`, 14, 44);

      let currentY = 55;

      // Resumen Pacientes
      if (payload.patients && payload.patients.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text("Pacientes Asignados Historicamente", 14, currentY);
        
        const patientsData = payload.patients.map((p: any) => [
          p.first_name + " " + p.last_name,
          p.status,
          p.primary_diagnosis || "N/A",
          new Date(p.created_at).toLocaleDateString()
        ]);

        (doc as any).autoTable({
          startY: currentY + 5,
          head: [['Nombre', 'Estado', 'Diagnóstico Principal', 'Fecha Ingreso']],
          body: patientsData,
          theme: 'grid',
          headStyles: { fillColor: [5, 150, 105] },
          styles: { fontSize: 10 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }

      // Notas Clínicas
      if (payload.clinical_notes && payload.clinical_notes.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text("Notas Clínicas Elaboradas", 14, currentY);
        
        const notesData = payload.clinical_notes.map((n: any) => [
          new Date(n.created_at).toLocaleDateString(),
          n.format,
          n.progress_score ? `${n.progress_score}/10` : "N/A",
          (n.content?.subjective?.substring(0, 50) || "Sin nota subjetiva...") + "..."
        ]);

        (doc as any).autoTable({
          startY: currentY + 5,
          head: [['Fecha', 'Formato', 'Puntaje', 'Resumen (Subjetivo)']],
          body: notesData,
          theme: 'striped',
          headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
          styles: { fontSize: 9 }
        });
      }
      
      // Descargar
      doc.save(`Respaldo_${payload.therapist_name.replace(" ", "_")}.pdf`);
      toast.addToast("PDF Generado exitosamente", "success");
    } catch (err: any) {
      console.error(err);
      toast.addToast("Error al generar PDF: " + err.message, "error");
    }
    setDownloading(null);
  };

  const handleDeleteNow = async (fileName: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar el respaldo ahora? La información se perderá irremediablemente.")) return;
    const { error } = await supabase.storage.from("backups").remove([fileName]);
    if (error) {
      toast.addToast("Error al eliminar: " + error.message, "error");
    } else {
      toast.addToast("Respaldo eliminado", "success");
      loadBackups();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin h-8 w-8 text-emerald-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Bóveda de Respaldo (30 Días)
          </h1>
          <p className="text-sm text-gray-500 mt-1">Los historiales de terapeutas eliminados se resguardan aquí de forma segura antes de ser destruidos.</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3 text-sm text-yellow-800">
        <svg className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p><strong>Privacidad y Retención:</strong> Los archivos aquí almacenados contienen datos clínicos confidenciales. Pasados los 30 días estipulados de gracia, el sistema efectuará un barrido automático irrecuperable por políticas de privaciad médica.</p>
      </div>

      {backups.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="text-5xl mb-4 text-emerald-100">🗄️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Bóveda Vacía</h3>
          <p className="text-gray-500 max-w-sm mx-auto">No hay copias de seguridad de terapeutas eliminados en este momento. La plataforma está limpia.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {backups.map((file: any) => {
            const terapeutaName = file.name.split("_")[2] || "Terapeuta"; // respaldo_terapeuta_ID_TIMESTAMP.json
            const timestampStr = file.name.split("_")[3]?.replace(".json", "");
            const dateStr = timestampStr ? new Date(parseInt(timestampStr)).toLocaleDateString("es-EC") : new Date(file.created_at).toLocaleDateString("es-EC");

            return (
              <div key={file.name} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-emerald-300 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <svg className="h-6 w-6 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded bg-gray-100 text-gray-600`}>
                    Quedan {file.days_left} días
                  </span>
                </div>
                
                <h3 className="font-semibold text-gray-900 truncate">Respaldo_{terapeutaName}</h3>
                <p className="text-xs text-gray-500 mt-1">Generado: {dateStr}</p>
                <p className="text-xs text-gray-400 mt-0.5">Peso: {(file.metadata?.size / 1024).toFixed(1)} KB</p>

                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                  <button 
                    onClick={() => handleDownloadPDF(file.name)}
                    disabled={downloading === file.name}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {downloading === file.name ? (
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    )}
                    {downloading === file.name ? "Generando..." : "Descargar PDF"}
                  </button>
                  {/* Delete local */}
                  <button onClick={() => handleDeleteNow(file.name)} className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="Eliminar ya">
                     <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
