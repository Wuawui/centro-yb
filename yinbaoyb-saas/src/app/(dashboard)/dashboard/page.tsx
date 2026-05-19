"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/components/providers/SessionProvider";
import { DashboardSkeleton } from "@/components/ui/Skeletons";
import { KPICard } from "@/features/dashboard/components/KPICard";
import { AppointmentCard } from "@/features/appointments/components/AppointmentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getDashboardStats, getTodayAppointments, getRecentPatients, type DashboardStats } from "@/lib/data/queries";
import {
  Users,
  CalendarDays,
  ClipboardCheck,
  AlertTriangle,
  Activity,
  Plus,
} from "lucide-react";

export default function DashboardPage() {
  const supabase = createClient();
  const { profile, tenantId, isTherapist } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayApts, setTodayApts] = useState<any[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const therapistId = isTherapist ? profile?.id : undefined;

      const [statsData, aptsData, patientsData] = await Promise.all([
        getDashboardStats(supabase, tenantId, therapistId),
        getTodayAppointments(supabase, tenantId, therapistId),
        getRecentPatients(supabase, tenantId, therapistId),
      ]);

      setStats(statsData);
      setTodayApts(aptsData);
      setRecentPatients(patientsData);
    } catch (err) {
      console.error("Error loading dashboard:", err);
    }
    setLoading(false);
  }, [tenantId, isTherapist, profile?.id]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  if (loading) return <DashboardSkeleton />;

  const kpis = [
    {
      name: isTherapist ? "Mis pacientes" : "Pacientes activos",
      value: stats?.activePatients ?? 0,
      sub: isTherapist ? "Asignados a ti" : (stats ? `de ${stats.totalPatients} totales` : ""),
      icon: Users,
      color: "bg-blue-50 text-blue-600",
      href: "/patients",
    },
    {
      name: "Citas hoy",
      value: stats?.todayAppointments ?? 0,
      sub: stats ? `${stats.weekAppointments} esta semana` : "",
      icon: CalendarDays,
      color: "bg-green-50 text-green-600",
      href: "/agenda",
    },
    {
      name: "Notas sin firmar",
      value: stats?.pendingNotes ?? 0,
      sub: "Pendientes de revisión",
      icon: ClipboardCheck,
      color: "bg-yellow-50 text-yellow-600",
      href: "/clinical",
    },
    {
      name: "Alertas clínicas",
      value: stats?.clinicalAlerts ?? 0,
      sub: "Escalas con riesgo",
      icon: AlertTriangle,
      color: "bg-red-50 text-red-600",
      href: "/clinical",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isTherapist ? "Tu resumen personal" : "Resumen del centro"} — Bienvenido, {profile?.first_name || ""}
          </p>
        </div>
        <button onClick={loadDashboard} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
          ↻ Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.name} {...kpi} />
        ))}
      </div>

      {/* Quick Actions */}
      {!isTherapist && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/agenda"
            className="flex items-center gap-3 px-4 py-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-2xl transition-colors group"
          >
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Plus className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-900">Nueva Cita</p>
              <p className="text-[11px] text-indigo-600/70">Agendar desde el calendario</p>
            </div>
          </Link>
          <Link
            href="/patients/new"
            className="flex items-center gap-3 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-2xl transition-colors group"
          >
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-900">Nuevo Paciente</p>
              <p className="text-[11px] text-emerald-600/70">Registrar datos del paciente</p>
            </div>
          </Link>
          <Link
            href="/clinical"
            className="flex items-center gap-3 px-4 py-3 bg-amber-50 hover:bg-amber-100 border border-amber-100 rounded-2xl transition-colors group"
          >
            <div className="h-9 w-9 rounded-xl bg-amber-600 flex items-center justify-center">
              <ClipboardCheck className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">Nueva Nota</p>
              <p className="text-[11px] text-amber-600/70">Escribir nota clínica</p>
            </div>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's appointments */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Citas de hoy</h2>
            </div>
            <Link href="/agenda" className="text-xs text-indigo-600 hover:text-indigo-700">Ver agenda →</Link>
          </div>

          {todayApts.length === 0 ? (
            <EmptyState icon="📅" title="Sin citas programadas" description="Agenda la primera cita del día desde el calendario" actionLabel="Ir a Agenda" actionHref="/agenda" />
          ) : (
            <div className="space-y-3">
              {todayApts.map((apt: any) => (
                <AppointmentCard key={apt.id} appointment={apt} compact />
              ))}
            </div>
          )}
        </div>

        {/* Recent patients */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Pacientes recientes</h2>
            </div>
            <Link href="/patients" className="text-xs text-indigo-600 hover:text-indigo-700">Ver todos →</Link>
          </div>

          {recentPatients.length === 0 ? (
            <EmptyState icon="👥" title="Sin pacientes registrados" description="Comienza registrando a tu primer paciente" actionLabel="Registrar paciente" actionHref="/patients/new" />
          ) : (
            <div className="space-y-3">
              {recentPatients.map((p: any) => (
                <Link key={p.id} href={`/patients/${p.id}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm flex-shrink-0">
                    {p.first_name[0]}{p.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.first_name} {p.last_name}</p>
                    <StatusBadge type="patient" status={p.status} />
                  </div>
                  <span className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString("es-EC", { day: "numeric", month: "short" })}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}