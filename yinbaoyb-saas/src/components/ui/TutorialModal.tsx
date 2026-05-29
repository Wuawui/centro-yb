"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, Sparkles, Calendar, Users, ClipboardCopy, Lock, ShieldCheck, Heart } from "lucide-react";

interface TutorialModalProps {
  role: "admin" | "therapist" | "parent" | "developer";
  isOpen: boolean;
  onClose: () => void;
  onStartTour?: () => void;
}

export function TutorialModal({ role, isOpen, onClose, onStartTour }: TutorialModalProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (!isOpen) return null;

  // Color schemes based on role
  const themes = {
    admin: {
      primary: "indigo",
      text: "text-indigo-600 border-indigo-600 bg-indigo-50",
      buttonBg: "bg-indigo-600 hover:bg-indigo-700",
      accent: "indigo-500",
    },
    therapist: {
      primary: "teal",
      text: "text-teal-600 border-teal-600 bg-teal-50",
      buttonBg: "bg-teal-600 hover:bg-teal-700",
      accent: "teal-500",
    },
    parent: {
      primary: "emerald",
      text: "text-emerald-600 border-emerald-600 bg-emerald-50",
      buttonBg: "bg-emerald-600 hover:bg-emerald-700",
      accent: "emerald-500",
    },
    developer: {
      primary: "neutral",
      text: "text-neutral-200 border-neutral-700 bg-neutral-800",
      buttonBg: "bg-white hover:bg-neutral-200 text-black",
      accent: "neutral-500",
    },
  };

  const currentTheme = themes[role] || themes.admin;

  const content = {
    admin: [
      {
        title: "🔑 Bienvenido, Administrador",
        subtitle: "Gestión global y flujo de trabajo de la clínica",
        icon: ShieldCheck,
        steps: [
          {
            title: "1. El Dashboard Principal",
            desc: "Visualiza de un vistazo los KPIs críticos del centro: pacientes activos, citas agendadas de hoy, alertas clínicas y notas de evolución sin firmar.",
          },
          {
            title: "2. Registro Inteligente de Pacientes",
            desc: "Agrega niños desde 'Pacientes' > 'Nuevo Paciente'. Completa los campos y vincula el correo del padre tutor. Esto le dará acceso inmediato a su propio Portal de Padres.",
          },
          {
            title: "3. Nómina de Terapeutas",
            desc: "Registra profesionales de la salud, define su especialidad y asígnales un color único. Este color te permitirá identificar rápidamente quién atiende cada sesión en la Agenda.",
          },
        ],
      },
      {
        title: "📅 Agenda Global & Calendario",
        subtitle: "Coordinación horaria sin fricciones",
        icon: Calendar,
        steps: [
          {
            title: "1. Vistas y Filtros Dinámicos",
            desc: "Filtra la agenda por terapeuta para despejar la pantalla, o cambia la vista a Día, Semana o Mes para coordinar los consultorios.",
          },
          {
            title: "2. Conflictos de Horario",
            desc: "El sistema comprueba en tiempo real si el terapeuta está disponible. Si intentas agendar a la misma hora para el mismo profesional, verás una alerta roja impidiendo el solapamiento.",
          },
          {
            title: "3. Comandos de WhatsApp",
            desc: "Si usas el Bot de WhatsApp, puedes consultar tu agenda enviando `/citas` o `/pacientes` desde tu teléfono sin abrir la laptop.",
          },
        ],
      },
      {
        title: "⚖️ Auditoría & Operaciones",
        subtitle: "Garantizar la calidad del servicio clínico",
        icon: BookOpen,
        steps: [
          {
            title: "1. Auditoría de Notas de Evolución",
            desc: "En 'Clínico' puedes revisar qué terapeutas han completado sus notas y cuáles están sin firmar. Esto asegura que la evolución de cada niño quede registrada formalmente.",
          },
          {
            title: "2. Gestión de Usuarios y Accesos",
            desc: "Crea cuentas de acceso seguro para secretarias, terapeutas o directores de sede asignándoles roles granulares en 'Usuarios'.",
          },
          {
            title: "3. Respaldos y Configuración",
            desc: "Realiza copias de seguridad de los datos desde 'Respaldo' y personaliza los costos de terapias en la pestaña de 'Configuración'.",
          },
        ],
      },
    ],
    therapist: [
      {
        title: "🩺 Práctica Clínica Diaria",
        subtitle: "Tu día a día en el consultorio",
        icon: BookOpen,
        steps: [
          {
            title: "1. Tu Dashboard de Inicio",
            desc: "Al ingresar verás tus citas del día, cuántos pacientes activos tienes a tu cargo y un contador rápido de notas clínicas que te faltan firmar.",
          },
          {
            title: "2. Tu Agenda Personal",
            desc: "En 'Mi Agenda' verás únicamente tus horas de consulta organizadas de forma limpia. Puedes dar clic a cualquier bloque para ver detalles del paciente.",
          },
          {
            title: "3. Fichas de Pacientes",
            desc: "En 'Pacientes' puedes consultar los antecedentes clínicos, fecha de nacimiento, diagnóstico de derivación y datos de emergencia de los niños.",
          },
        ],
      },
      {
        title: "📝 Redacción de Evolución",
        subtitle: "Formatos clínicos estructurados y firma",
        icon: ClipboardCopy,
        steps: [
          {
            title: "1. Registrar Sesión",
            desc: "Haz clic en 'Registrar evolución'. El sistema abrirá un formulario de 4 bloques (Tareas, Observaciones, Resultados y Recomendaciones). Al guardarlo, se crea una nota libre estructurada.",
          },
          {
            title: "2. Firma Electrónica Obligatoria",
            desc: "Toda evolución debe firmarse por ley profesional. Filtra por 'Sin firmar' y presiona el botón 'Firmar' para validar formalmente el registro clínico de la sesión.",
          },
          {
            title: "3. Alertas de Escalas",
            desc: "Si aplicas evaluaciones como PHQ-9 o GAD-7 y el menor obtiene un puntaje elevado, verás una tarjeta roja en tu panel alertando 'Riesgo Clínico'.",
          },
        ],
      },
    ],
    parent: [
      {
        title: "👦 El Portal de tu Hijo",
        subtitle: "Acompañamiento familiar transparente",
        icon: Heart,
        steps: [
          {
            title: "1. Inicio del Portal",
            desc: "Te damos la bienvenida con una frase motivacional diaria. Verás de forma destacada cuándo es la próxima cita del niño y quién es su terapeuta asignado.",
          },
          {
            title: "2. Perfil del Niño",
            desc: "En 'Perfil del Niño' puedes auditar los datos de tu hijo, su diagnóstico principal asignado y los números de contacto de emergencia registrados.",
          },
          {
            title: "3. Agenda de Citas",
            desc: "En la pestaña 'Citas' revisa el calendario de sesiones agendadas para que nunca olvides una cita, así como las asistencias del mes.",
          },
        ],
      },
      {
        title: "✨ Evolución con Inteligencia Artificial",
        subtitle: "Comprende el progreso en tu propio lenguaje",
        icon: Sparkles,
        steps: [
          {
            title: "1. Evolución IA",
            desc: "Sabemos que las notas del terapeuta son técnicas. Por eso, nuestra IA analiza todo el historial de sesiones y te redacta un resumen empático y comprensible.",
          },
          {
            title: "2. Recomendaciones en Casa",
            desc: "El resumen de IA te destacará las tareas, juegos y reforzadores sugeridos por el terapeuta para que continúes estimulando a tu hijo en el hogar.",
          },
          {
            title: "3. Escalas y Evaluaciones",
            desc: "En 'Evaluaciones' verás los resultados de los test psicométricos del niño con gráficas interactivas que muestran si está en nivel de riesgo Bajo, Moderado o Alto.",
          },
        ],
      },
    ],
    developer: [
      {
        title: "🛠️ Consola God-Mode (SaaS)",
        subtitle: "Gestión de instancias multi-inquilino",
        icon: Lock,
        steps: [
          {
            title: "1. Registrar Nuevo Centro",
            desc: "Haz clic en 'Nueva Instancia' y completa el formulario. El sistema creará el tenant, la base de datos aislada, cargará las escalas psicométricas por defecto y creará los accesos para el dueño en 1 segundo.",
          },
          {
            title: "2. Control de Estados y Pago",
            desc: "Asigna planes de facturación (Básico, Profesional, Avanzado). Monitorea el estado de activación de cada clínica.",
          },
          {
            title: "3. Bloqueo de Acceso (Suspender)",
            desc: "En caso de mora de la suscripción mensual, presiona 'Suspender' para denegar el acceso a toda la clínica de manera temporal, protegiendo sus datos.",
          },
        ],
      },
    ],
  };

  const tabs = content[role] || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white rounded-3xl border border-slate-200/80 w-full max-w-2xl shadow-glass flex flex-col overflow-hidden max-h-[85vh]"
        >
          {/* Header */}
          <div className={`p-6 bg-gradient-to-r ${
            role === "admin" ? "from-indigo-600 to-indigo-700" :
            role === "therapist" ? "from-teal-600 to-teal-700" :
            role === "parent" ? "from-emerald-600 to-emerald-700" :
            "from-neutral-800 to-neutral-900"
          } text-white flex justify-between items-start relative`}>
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span className="text-xs uppercase tracking-widest font-semibold opacity-80">Manual de Inducción</span>
              </div>
              <h2 className="text-xl font-bold mt-1">Guía del Usuario CentroYB</h2>
              <p className="text-xs opacity-90 mt-1">Descubre cómo navegar y sacarle el máximo partido a tu rol.</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors focus:outline-none"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Navigation tabs */}
          {tabs.length > 1 && (
            <div className="flex bg-slate-50 border-b border-slate-200/50 px-4 py-2 overflow-x-auto gap-2">
              {tabs.map((tab, idx) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(idx)}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                      activeTab === idx
                        ? `bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] ${
                            role === "admin" ? "text-indigo-600 border border-slate-200" :
                            role === "therapist" ? "text-teal-600 border border-slate-200" :
                            "text-emerald-600 border border-slate-200"
                          }`
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    {tab.title.split(",")[0] || tab.title}
                  </button>
                );
              })}
            </div>
          )}

          {/* Body content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-bold text-slate-800">{tabs[activeTab]?.title}</h3>
                <p className="text-xs text-slate-500 font-medium">{tabs[activeTab]?.subtitle}</p>
              </div>

              <div className="space-y-4 pt-2">
                {tabs[activeTab]?.steps.map((step, sIdx) => (
                  <div key={sIdx} className="flex gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0 ${
                      role === "admin" ? "bg-indigo-600" :
                      role === "therapist" ? "bg-teal-600" :
                      role === "parent" ? "bg-emerald-600" :
                      "bg-neutral-800"
                    }`}>
                      {sIdx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{step.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200/50 flex justify-between items-center">
            {onStartTour ? (
              <button
                onClick={() => {
                  onClose();
                  onStartTour();
                }}
                className={`px-4 py-2 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                  role === "admin" ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100" :
                  role === "therapist" ? "bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100" :
                  role === "parent" ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" :
                  "bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700"
                }`}
              >
                🚀 Iniciar Tour Interactivo
              </button>
            ) : (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Desarrollado por YinbaoYB 🦞</span>
            )}
            <button
              onClick={onClose}
              className={`px-5 py-2 text-white font-medium rounded-xl text-xs shadow-sm transition-all focus:outline-none hover:shadow-md cursor-pointer ${currentTheme.buttonBg}`}
            >
              ¡Entendido!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
