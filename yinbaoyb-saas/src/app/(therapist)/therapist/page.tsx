"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/components/providers/SessionProvider";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { KPICard } from "@/features/dashboard/components/KPICard";
import { AppointmentCard } from "@/features/appointments/components/AppointmentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TutorialModal } from "@/components/ui/TutorialModal";
import { InteractiveTour, type TourStep } from "@/components/ui/InteractiveTour";
import { getDashboardStats, getTodayAppointments, getRecentPatients, getScaleAlerts, type DashboardStats } from "@/lib/data/queries";
import {
  Users,
  CalendarDays,
  ClipboardCheck,
  AlertTriangle,
  Clock,
  Activity,
} from "lucide-react";

const TOUR_STEPS: TourStep[] = [
  {
    target: "#tour-therapist-header",
    title: "🩺 ¡Bienvenido/a, Terapeuta!",
    content: "Este es tu panel clínico diario. Todo lo que necesitas para tu jornada se encuentra aquí concentrado de manera limpia.",
    placement: "bottom"
  },
  {
    target: "#tour-therapist-kpis",
    title: "📊 Tus Métricas Clínicas",
    content: "Monitorea de forma directa cuántos pacientes activos tienes a tu cargo, tus citas de hoy, notas evolutivas por firmar y alertas críticas de riesgo clínico.",
    placement: "bottom"
  },
  {
    target: "#tour-therapist-appointments",
    title: "📅 Agenda del Día",
    content: "Revisa cronológicamente los pacientes que vas a recibir hoy. Puedes dar clic a cualquier cita para ver detalles e iniciar la sesión.",
    placement: "top"
  },
  {
    target: "#tour-therapist-patients",
    title: "👥 Tus Pacientes Asignados",
    content: "El listado rápido de niños que tienes bajo tu tratamiento directo, indicando su motivo de consulta y estado.",
    placement: "top"
  },
  {
    target: "#tour-therapist-alerts",
    title: "⚠️ Alertas Clínicas Importantes",
    content: "Esta sección te mostrará en color rojo a aquellos pacientes cuyos tutores han completado test de escalas psicométricas (PHQ-9, GAD-7) y han arrojado un riesgo clínico alto.",
    placement: "top"
  },
  {
    target: "#tour-therapist-summary",
    title: "📈 Resumen Semanal",
    content: "Lleva el control de tus objetivos clínicos: citas realizadas en la semana, tus firmas completadas y la suma total de alertas activas.",
    placement: "top"
  }
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
}

export default function TherapistDashboardPage() {
  const supabase = createClient();
  const { profile, tenantId, user } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayApts, setTodayApts] = useState<any[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const loadData = useCallback(async () => {
    if (!tenantId || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [statsData, aptsData, patientsData, alertsData] = await Promise.all([
        getDashboardStats(supabase, tenantId, user.id),
        getTodayAppointments(supabase, tenantId, user.id),
        getRecentPatients(supabase, tenantId, user.id),
        getScaleAlerts(supabase, tenantId, user.id),
      ]);

      setStats(statsData);
      setTodayApts(aptsData);
      setRecentPatients(patientsData);
      setAlerts(alertsData);
    } catch (err) {
      console.error("Error loading dashboard:", err);
    }
    setLoading(false);
  }, [tenantId, user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <PageLoading text="Cargando mi dashboard..." color="text-teal-600" />;

  const kpis = [
    { name: "Mis pacientes", value: stats?.activePatients ?? 0, sub: "Asignados a ti", icon: Users, color: "bg-teal-50 text-teal-600", href: "/therapist/patients" },
    { name: "Citas hoy", value: stats?.todayAppointments ?? 0, sub: stats ? `${stats.weekAppointments} esta semana` : "", icon: CalendarDays, color: "bg-emerald-50 text-emerald-600", href: "/therapist/agenda" },
    { name: "Notas sin firmar", value: stats?.pendingNotes ?? 0, sub: "Pendientes de revisión", icon: ClipboardCheck, color: "bg-amber-50 text-amber-600", href: "/therapist/clinical" },
    { name: "Alertas clínicas", value: stats?.clinicalAlerts ?? 0, sub: "Escalas con riesgo", icon: AlertTriangle, color: "bg-red-50 text-red-600", href: "/therapist/clinical" },
  ];

  const tourSteps = alerts.length > 0
    ? TOUR_STEPS
    : TOUR_STEPS.filter(s => s.target !== "#tour-therapist-alerts");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div id="tour-therapist-header">
          <h1 className="text-2xl font-bold text-gray-900">{getGreeting()}, {profile?.first_name || "Terapeuta"} 👋</h1>
          <p className="text-sm text-gray-500 mt-1">Aquí tienes tu resumen del día</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowTutorial(true)}
            className="text-xs text-teal-600 hover:text-teal-700 font-semibold px-3 py-1.5 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors inline-flex items-center gap-1.5 border border-teal-100/50 cursor-pointer animate-pulse"
          >
            📖 Tutorial
          </button>
          <button onClick={loadData} className="text-xs text-teal-600 hover:text-teal-700 font-medium px-3 py-1.5 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors">↻ Actualizar</button>
        </div>
      </div>

      <div id="tour-therapist-kpis" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.name} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's appointments — READ ONLY */}
        <div id="tour-therapist-appointments" className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-teal-600" /><h2 className="text-lg font-semibold text-gray-900">Citas de hoy</h2></div>
            <Link href="/therapist/agenda" className="text-xs text-teal-600 hover:text-teal-700">Ver agenda →</Link>
          </div>
          {todayApts.length === 0 ? (
            <EmptyState icon="📋" title="Sin citas programadas para hoy" />
          ) : (
            <div className="space-y-3">
              {todayApts.map((apt: any) => (
                <AppointmentCard key={apt.id} appointment={apt} compact />
              ))}
            </div>
          )}
        </div>

        {/* My patients — READ ONLY */}
        <div id="tour-therapist-patients" className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><Activity className="h-5 w-5 text-teal-600" /><h2 className="text-lg font-semibold text-gray-900">Mis pacientes</h2></div>
            <Link href="/therapist/patients" className="text-xs text-teal-600 hover:text-teal-700">Ver todos →</Link>
          </div>
          {recentPatients.length === 0 ? (
            <EmptyState icon="👥" title="No tienes pacientes asignados" />
          ) : (
            <div className="space-y-3">
              {recentPatients.map((p: any) => (
                <Link key={p.id} href={`/therapist/patients/${p.id}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-semibold text-sm flex-shrink-0">{p.first_name[0]}{p.last_name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.first_name} {p.last_name}</p>
                    {p.reason_for_consultation && <p className="text-xs text-gray-500 truncate">{p.reason_for_consultation}</p>}
                    <StatusBadge type="patient" status={p.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clinical alerts */}
      {alerts.length > 0 && (
        <div id="tour-therapist-alerts" className="bg-white rounded-xl border border-red-200 p-6">
          <div className="flex items-center gap-2 mb-4"><AlertTriangle className="h-5 w-5 text-red-500" /><h2 className="text-lg font-semibold text-red-800">Alertas clínicas</h2></div>
          <div className="space-y-3">
            {alerts.map((alert: any) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-red-800">{alert.patients?.first_name} {alert.patients?.last_name}</p>
                  <p className="text-xs text-red-600">Escala {alert.scale_type} — Puntuación: {alert.total_score}</p>
                </div>
                <Link href="/therapist/clinical" className="text-xs text-red-700 hover:text-red-900 font-medium">Ver →</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div id="tour-therapist-summary" className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-100 p-6">
        <div className="flex items-center gap-3 mb-4"><Clock className="h-5 w-5 text-teal-600" /><h2 className="text-lg font-semibold text-teal-900">Mi resumen</h2></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center"><p className="text-2xl font-bold text-teal-700">{stats?.weekAppointments ?? 0}</p><p className="text-xs text-teal-600">Citas esta semana</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-teal-700">{stats?.pendingNotes ?? 0}</p><p className="text-xs text-teal-600">Notas pendientes</p></div>
          <div className="text-center"><p className={`text-2xl font-bold ${(stats?.clinicalAlerts ?? 0) > 0 ? "text-red-600" : "text-teal-700"}`}>{stats?.clinicalAlerts ?? 0}</p><p className="text-xs text-teal-600">Alertas clínicas</p></div>
        </div>
      </div>

      <TutorialModal role="therapist" isOpen={showTutorial} onClose={() => setShowTutorial(false)} onStartTour={() => setShowTour(true)} />
      <InteractiveTour steps={tourSteps} isOpen={showTour} onClose={() => setShowTour(false)} accentColor="teal-600" />
    </div>
  );
}