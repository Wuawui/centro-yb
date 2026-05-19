"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/components/providers/SessionProvider";
import { useToast } from "@/components/ui/Toast";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { PATIENT_STATUS_CONFIG } from "@/lib/constants";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  document_number: string | null;
  phone: string | null;
  email: string | null;
  primary_diagnosis: string | null;
  primary_diagnosis_desc: string | null;
  status: string;
  active: boolean | null;
  created_at: string;
}

const statusConfig = PATIENT_STATUS_CONFIG;

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const toast = useToast();
  const supabase = createClient();
  const { tenantId } = useSession();

  useEffect(() => { if (tenantId) fetchPatients(); }, [tenantId]);

  async function fetchPatients() {
    if (!tenantId) { setLoading(false); return; }
    setLoading(true);
    setErrorMsg(null);
    const { data, error } = await supabase
      .from("patients")
      .select("id, first_name, last_name, document_number, phone, email, status, primary_diagnosis, primary_diagnosis_desc, active, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) {
      setErrorMsg(`Error: ${error.message}`);
    } else {
      setPatients(data || []);
    }
    setLoading(false);
  }

  const activePatients = patients.filter(p => p.active !== false);
  const inactivePatients = patients.filter(p => p.active === false);

  const filterList = (list: Patient[]) =>
    search ? list.filter(p => {
      const q = search.toLowerCase();
      return `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
        (p.document_number || "").toLowerCase().includes(q) ||
        (p.primary_diagnosis_desc || p.primary_diagnosis || "").toLowerCase().includes(q);
    }) : list;

  if (loading) return <PageLoading text="Cargando pacientes..." />;

  const PatientCard = ({ patient, inactive }: { patient: Patient; inactive?: boolean }) => {
    const status = statusConfig[patient.status] || { label: patient.status, color: "bg-gray-50 text-gray-700" };
    const initials = `${patient.first_name?.[0] || ""}${patient.last_name?.[0] || ""}`;
    const dx = patient.primary_diagnosis_desc || patient.primary_diagnosis;

    return (
      <Link
        href={`/patients/${patient.id}`}
        className={`block bg-white rounded-2xl border p-4 transition-all duration-200 hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 group ${
          inactive ? "border-gray-200 opacity-70" : "border-gray-200"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm ${
            inactive ? "bg-gray-400" : "bg-gradient-to-br from-indigo-500 to-purple-600"
          }`}>
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                {patient.first_name} {patient.last_name}
              </h3>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {patient.phone && (
                <span className="flex items-center gap-1">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  {patient.phone}
                </span>
              )}
              {dx && (
                <span className="flex items-center gap-1 truncate">
                  <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span className="truncate">{dx}</span>
                </span>
              )}
            </div>
          </div>

          <svg className="h-5 w-5 text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activePatients.length} activo{activePatients.length !== 1 ? "s" : ""} · {inactivePatients.length} inactivo{inactivePatients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/patients/new" className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2 shadow-sm">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nuevo Paciente
        </Link>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 text-sm font-medium">Error al cargar pacientes</p>
          <p className="text-red-600 text-xs mt-1">{errorMsg}</p>
          <button onClick={fetchPatients} className="mt-2 text-xs text-red-700 underline">Reintentar</button>
        </div>
      )}

      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input
          type="text"
          placeholder="Buscar paciente por nombre o diagnóstico..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
        />
      </div>

      {activePatients.length === 0 && patients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No hay pacientes registrados</h3>
          <p className="text-sm text-gray-500 mb-5">Comienza registrando a tu primer paciente</p>
          <Link href="/patients/new" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 inline-flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Registrar Paciente
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filterList(activePatients).map(p => (
            <PatientCard key={p.id} patient={p} />
          ))}
          {filterList(activePatients).length === 0 && search && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-500">No se encontraron pacientes con &quot;{search}&quot;</p>
            </div>
          )}
        </div>
      )}

      {inactivePatients.length > 0 && (
        <div>
          <button onClick={() => setShowInactive(!showInactive)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <svg className={`h-4 w-4 transition-transform ${showInactive ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            {inactivePatients.length} paciente{inactivePatients.length !== 1 ? "s" : ""} inactivo{inactivePatients.length !== 1 ? "s" : ""}
          </button>
          {showInactive && (
            <div className="space-y-3 mt-3">
              {filterList(inactivePatients).map(p => (
                <PatientCard key={p.id} patient={p} inactive />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}