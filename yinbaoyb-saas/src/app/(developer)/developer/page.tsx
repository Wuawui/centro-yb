"use client";

import { useEffect, useState } from "react";
import { getAllTenants, toggleTenantStatus, createNewTenant } from "./actions";
import { Building2, Plus, Zap, CheckCircle2, XCircle, MoreVertical, CreditCard } from "lucide-react";
import { TutorialModal } from "@/components/ui/TutorialModal";
import { InteractiveTour, type TourStep } from "@/components/ui/InteractiveTour";

const TOUR_STEPS: TourStep[] = [
  {
    target: "#tour-dev-header",
    title: "🛠️ Panel Global del SaaS",
    content: "¡Te damos la bienvenida a tu centro de control de desarrollador! Aquí monitoreas y administras a todas las clínicas del país que usan tu software.",
    placement: "bottom"
  },
  {
    target: "#tour-dev-actions",
    title: "🚀 Acciones de Licencias",
    content: "Usa el botón 'Nueva Instancia' para registrar un consultorio en 1 segundo o abre el manual rápido con 'Tutorial'.",
    placement: "bottom"
  },
  {
    target: "#tour-dev-table",
    title: "📋 Listado de Instancias",
    content: "Audita qué centros terapéuticos están utilizando tu software, qué planes tienen suscritos (Básico, Profesional, Avanzado) y su estado actual.",
    placement: "top"
  }
];

export default function DeveloperPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", slug: "", plan: "basico", adminEmail: "", adminName: "", adminPassword: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    loadTenants();
  }, []);

  async function loadTenants() {
    setLoading(true);
    const data = await getAllTenants();
    setTenants(data);
    setLoading(false);
  }

  async function handleToggleStatus(id: string, currentStatus: boolean) {
    if (!confirm(`¿Estás seguro de que deseas ${currentStatus ? "SUSPENDER" : "ACTIVAR"} este centro?`)) return;
    try {
      await toggleTenantStatus(id, !currentStatus);
      await loadTenants();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      await createNewTenant(formData);
      setShowCreateModal(false);
      setFormData({ name: "", slug: "", plan: "basico", adminEmail: "", adminName: "", adminPassword: "" });
      await loadTenants();
    } catch (err: any) {
      setError(err.message);
    }
    setIsSubmitting(false);
  }

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "avanzado": return <span className="px-2.5 py-1 text-xs font-semibold bg-orange-500/20 text-orange-400 rounded-full border border-orange-500/30 flex items-center gap-1.5"><Zap className="w-3 h-3"/> Avanzado ($45/m)</span>;
      case "profesional": return <span className="px-2.5 py-1 text-xs font-semibold bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">Profesional ($22/m)</span>;
      default: return <span className="px-2.5 py-1 text-xs font-semibold bg-neutral-800 text-neutral-300 rounded-full border border-neutral-700">Básico ($13/m)</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div id="tour-dev-header">
          <h1 className="text-3xl font-bold tracking-tight">Centros Terapéuticos</h1>
          <p className="text-neutral-400 mt-1">Gestión global de clientes e instancias SaaS.</p>
        </div>
        <div id="tour-dev-actions" className="flex items-center gap-3">
          <button 
            onClick={() => setShowTutorial(true)}
            className="flex items-center gap-2 bg-neutral-800 text-neutral-200 border border-neutral-700 px-4 py-2.5 rounded-xl font-medium hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            📖 Tutorial
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl font-medium hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Nueva Instancia
          </button>
        </div>
      </div>

      {/* Tenants Table */}
      <div id="tour-dev-table" className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-950/50 border-b border-neutral-800 text-neutral-400">
              <tr>
                <th className="px-6 py-4 font-medium">Centro / Instancia</th>
                <th className="px-6 py-4 font-medium">Plan Suscrito</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium">Ingresado</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    Cargando instancias de la base de datos...
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    No hay centros terapéuticos registrados.
                  </td>
                </tr>
              ) : (
                tenants.map(tenant => (
                  <tr key={tenant.id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-neutral-400" />
                        </div>
                        <div>
                          <div className="font-medium text-neutral-100">{tenant.name}</div>
                          <div className="text-neutral-500 text-xs">/slug: {tenant.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getPlanBadge(tenant.plan)}
                    </td>
                    <td className="px-6 py-4">
                      {tenant.active ? (
                         <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium bg-emerald-400/10 px-2 py-1 rounded-md w-fit">
                           <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                         </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-400 text-xs font-medium bg-red-400/10 px-2 py-1 rounded-md w-fit">
                           <XCircle className="w-3.5 h-3.5" /> Suspendido
                         </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-neutral-400">
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {tenant.active ? (
                          <button 
                            onClick={() => handleToggleStatus(tenant.id, true)}
                            className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                          >
                            Suspender
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleToggleStatus(tenant.id, false)}
                            className="text-xs px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors border border-emerald-500/20"
                          >
                            Activar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-neutral-800/60">
              <h2 className="text-xl font-bold">Crear Nueva Instancia</h2>
              <p className="text-sm text-neutral-400 mt-1">Registra un nuevo centro terapéutico en la plataforma.</p>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Nombre del Centro</label>
                  <input 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')})}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600"
                    placeholder="Ej. Centro Logros"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Identificador URL (Slug)</label>
                  <div className="flex items-center">
                    <span className="bg-neutral-800 text-neutral-500 px-3 py-2.5 text-sm border border-r-0 border-neutral-800 rounded-l-xl">centro-yb.com/</span>
                    <input 
                      required 
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-r-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
                      placeholder="logros"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Plan de Suscripción</label>
                  <select 
                    value={formData.plan}
                    onChange={(e) => setFormData({...formData, plan: e.target.value})}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
                  >
                    <option value="basico">Básico - $13/m (Esencia Digital)</option>
                    <option value="profesional">Profesional - $22/m (SaaS + Pasarela + Dominio)</option>
                    <option value="avanzado">Avanzado - $45/m (Todo + IA Bot + Automatizaciones)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">Nombre Dueño</label>
                    <input required value={formData.adminName} onChange={(e) => setFormData({...formData, adminName: e.target.value})} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm" placeholder="Juan Pérez" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">Email Administrador</label>
                    <input required type="email" value={formData.adminEmail} onChange={(e) => setFormData({...formData, adminEmail: e.target.value})} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-600" placeholder="admin@ejemplo.com" />
                  </div>
                </div>

                <div>
                   <label className="block text-xs font-medium text-neutral-400 mb-1.5">Contraseña Inicial (Para que el cliente ingrese)</label>
                   <input required type="text" value={formData.adminPassword} onChange={(e) => setFormData({...formData, adminPassword: e.target.value})} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-600" placeholder="Ej. Logros2026!" />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-800/60 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 border border-neutral-700 hover:bg-neutral-800 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-white hover:bg-neutral-200 text-black rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Creando..." : "Registrar Centro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <TutorialModal role="developer" isOpen={showTutorial} onClose={() => setShowTutorial(false)} onStartTour={() => setShowTour(true)} />
      <InteractiveTour steps={TOUR_STEPS} isOpen={showTour} onClose={() => setShowTour(false)} accentColor="neutral-800" />
    </div>
  );
}
