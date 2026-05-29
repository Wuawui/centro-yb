"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/components/providers/SessionProvider";
import { createClient } from "@/lib/supabase/client";
import { 
  BrainCircuit, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  FileText, 
  Users, 
  ArrowRight, 
  ChevronRight, 
  Menu, 
  X, 
  LogOut,
  Sparkles,
  PhoneCall,
  Globe,
  Server
} from "lucide-react";
import Link from "next/link";
import { BearLogo } from "@/components/ui/BearLogo";

export default function Home() {
  const { user, role, loading } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      tag: "LA SOLUCIÓN",
      title1: "Un solo sistema.",
      title2: "Todo bajo control.",
      desc: "YB centraliza historias clínicas, terapeutas, agendas, portal de padres e Inteligencia Artificial en una plataforma diseñada exclusivamente para centros terapéuticos.",
      color: "from-[#A5B4FC] to-[#C084FC]"
    },
    {
      tag: "EXPEDIENTE CLÍNICO",
      title1: "Historias clínicas SOAP.",
      title2: "Evoluciones en segundos.",
      desc: "Redacta el progreso diario de los niños en formatos SOAP, BIRP o DAP. Guarda firmas digitales y mantén el cumplimiento de normativas de salud de forma segura.",
      color: "from-[#2DD4BF] to-[#34D399]"
    },
    {
      tag: "MOTOR DE AGENDAS",
      title1: "Control de citas.",
      title2: "Agendas sin conflictos.",
      desc: "Asigna turnos, supervisa las horas de tus terapeutas en tiempo real y reduce las inasistencias de pacientes mediante recordatorios automáticos de citas.",
      color: "from-[#38BDF8] to-[#60A5FA]"
    },
    {
      tag: "PORTAL DE PADRES",
      title1: "Padres tranquilos.",
      title2: "Evolución compartida.",
      desc: "Un canal seguro para que los acudientes consulten el progreso del niño, revisen reportes cargados y mantengan un seguimiento activo fuera del centro.",
      color: "from-[#F472B6] to-[#FB7185]"
    },
    {
      tag: "INTEGRACIÓN CON IA",
      title1: "Reportes empáticos.",
      title2: "Redactados con IA.",
      desc: "La Inteligencia Artificial lee tus notas SOAP complejas y genera resúmenes sencillos, empáticos y profesionales listos para enviar a las familias.",
      color: "from-[#FBBF24] to-[#FB923C]"
    }
  ];

  // Slideshow auto-play effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 5);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = "sb-role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.reload();
  };

  // Determinar la redirección del panel según el rol del usuario
  const getDashboardLink = () => {
    if (role === "padre") return "/parent";
    if (role === "terapeuta") return "/therapist";
    return "/dashboard";
  };

  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-inter)] text-slate-700 selection:bg-teal-500/30 relative">
      
      {/* ───────────────────────────────────────────────────────── */}
      {/* HEADER / NAVBAR */}
      {/* ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-2.5 group select-none">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center shadow-md shadow-teal-700/20 drop-shadow-logo transition-transform group-hover:scale-105 duration-300">
              <BearLogo className="w-7.5 h-7.5 text-white" strokeWidth={5} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 font-[family-name:var(--font-outfit)]">YB</span>
              <span className="text-[9px] font-bold text-teal-800 tracking-wider uppercase">Portal Clínico</span>
            </div>
          </Link>

          {/* Desktop Navigation links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#caracteristicas" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Características</a>
            <a href="#precios" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Precios</a>
          </nav>

          {/* Desktop Action buttons */}
          <div className="hidden md:flex items-center gap-4">
            {loading ? (
              <div className="h-9 w-20 bg-slate-100 animate-pulse rounded-lg" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <Link
                  href={getDashboardLink()}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-950 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-[0.97]"
                >
                  <span>Ir a mi Panel</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={signingOut}
                  className="inline-flex items-center justify-center h-10 w-10 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-[0.95]"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors px-3 py-2"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-900 hover:bg-slate-950 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-[0.97]"
                >
                  Empezar Gratis
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-650 hover:text-slate-900 rounded-lg focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 px-6 py-6 space-y-4 animate-[slideDown_0.2s_ease-out]">
            <a 
              href="#caracteristicas" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-slate-600 hover:text-slate-900"
            >
              Características
            </a>
            <a 
              href="#precios" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-slate-600 hover:text-slate-900"
            >
              Precios
            </a>
            <hr className="border-slate-100" />
            <div className="space-y-3 pt-2">
              {loading ? (
                <div className="h-10 w-full bg-slate-100 animate-pulse rounded-xl" />
              ) : user ? (
                <>
                  <Link
                    href={getDashboardLink()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white font-bold rounded-xl"
                  >
                    <span>Ir a mi Panel</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                    disabled={signingOut}
                    className="flex items-center justify-center gap-2 w-full py-3 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4.5 h-4.5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center py-3 text-slate-600 font-bold hover:text-slate-900"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center py-3 bg-slate-900 text-white font-bold rounded-xl"
                  >
                    Empezar Gratis
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ───────────────────────────────────────────────────────── */}
      {/* HERO SECTION */}
      {/* ───────────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden bg-gradient-to-b from-[#F7FCFA] to-white">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-400/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/3 translate-x-1/3 animate-glow-emerald" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-450/5 rounded-full blur-[100px] pointer-events-none translate-y-1/3 -translate-x-1/3 animate-glow-teal" />

        <div className="max-w-5xl mx-auto px-6 text-center space-y-8 relative z-10">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-teal-800 bg-teal-50 border border-teal-100/60 shadow-sm select-none">
            <ShieldCheck className="w-4 h-4 text-teal-750" />
            <span>PLATAFORMA DE GESTIÓN CLÍNICA EN LA NUBE</span>
          </div>

          {/* Headline */}
          <h1 className="text-[44px] sm:text-[54px] lg:text-[66px] font-extrabold leading-[1.05] tracking-tight text-slate-900 font-[family-name:var(--font-outfit)]">
            Página Web Oficial + Sistema de <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-teal-700 to-teal-800 bg-clip-text text-transparent">Gestión para tu Centro Terapéutico</span>
          </h1>

          {/* Subheadline with high-impact clinical highlight */}
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-550 leading-relaxed font-medium">
            YB le entrega el software SaaS centralizado para historias clínicas y agendas y, además, <span className="inline-block text-teal-850 font-bold bg-teal-50 border border-teal-150/40 px-2.5 py-0.5 rounded-lg shadow-sm">le creamos la página web oficial de su centro terapéutico</span>. Obtenga la combinación ideal para captar pacientes por internet y controlar su negocio desde un solo lugar.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="https://wa.me/593986189965"
              target="_blank"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-4 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-xl shadow-lg shadow-slate-950/10 active:scale-[0.98] transition-all"
            >
              <span>Solicitar Demostración</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <a
              href="#precios"
              className="inline-flex items-center justify-center w-full sm:w-auto px-7 py-4 bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50/50 text-slate-700 font-bold rounded-xl active:scale-[0.98] transition-all"
            >
              Consultar Planes
            </a>
          </div>

          {/* Dual Pillars High-Impact Callout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-12 text-left">
            
            {/* Pillar 1: Página Web */}
            <div className="bg-white/70 backdrop-blur-md border border-teal-100/80 rounded-3xl p-6.5 shadow-[0_15px_30px_-5px_rgba(14,111,98,0.02)] hover:border-teal-250 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-teal-600 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-bl-2xl shadow-sm">
                ¡INCLUIDA EN TU PLAN!
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-1">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                  <Globe className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-lg font-bold text-slate-900 font-[family-name:var(--font-outfit)]">
                    1. Tu Página Web Oficial
                  </h3>
                  <p className="text-xs font-bold text-teal-750 tracking-wider uppercase">Portal Público de Captación</p>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    Diseñamos y publicamos el sitio web oficial de tu centro. Ideal para mostrar servicios, especialistas, ubicación y permitir **auto-agendamiento directo** de citas por los pacientes 24/7.
                  </p>
                  <ul className="space-y-1.5 pt-2 text-xs font-semibold text-slate-600">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                      <span>Dominio propio o subdominio integrado</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                      <span>Diseño premium adaptado a tu logotipo e identidad</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                      <span>Posicionamiento SEO en Google para tu ciudad</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Pillar 2: Sistema SaaS */}
            <div className="bg-white/70 backdrop-blur-md border border-teal-100/80 rounded-3xl p-6.5 shadow-[0_15px_30px_-5px_rgba(14,111,98,0.02)] hover:border-teal-250 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-bl-2xl shadow-sm">
                SISTEMA INCLUIDO
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-1">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-150 text-slate-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                  <Server className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-lg font-bold text-slate-900 font-[family-name:var(--font-outfit)]">
                    2. Software Clínico y de Gestión
                  </h3>
                  <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">Plataforma Interna en la Nube</p>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    El cerebro administrativo y terapéutico. Controla las agendas de terapeutas, expedientes médicos, fichas SOAP de evolución y ofrece un portal exclusivo de progreso para los padres.
                  </p>
                  <ul className="space-y-1.5 pt-2 text-xs font-semibold text-slate-600">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                      <span>Historias Clínicas SOAP digitales con firma</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                      <span>Módulos de agendamiento y turnos inteligentes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                      <span>Portal de Padres para seguimiento de evoluciones</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────── */}
      {/* MAC-STYLE DEMO SLIDESHOW / "VIDEO" PRESENTATION */}
      {/* ───────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#F8FAFC] border-t border-b border-slate-100 relative">
        {/* Glow clinical space lights */}
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[350px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        
        <div className="max-w-5xl mx-auto px-6 space-y-10 relative z-10">
          
          {/* Section Header */}
          <div className="text-center space-y-3.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-teal-850 bg-teal-50 border border-teal-100/60 shadow-sm select-none">
              <Sparkles className="w-3.5 h-3.5 text-teal-700 animate-pulse" />
              <span>SISTEMA EN ACCIÓN</span>
            </div>
            <h2 className="text-[34px] sm:text-[40px] font-extrabold tracking-tight text-slate-900 leading-tight font-[family-name:var(--font-outfit)]">
              Un Solo Sistema. Todo Bajo Control.
            </h2>
            <p className="max-w-2xl mx-auto text-base text-slate-500 font-medium">
              Explore cómo YB simplifica la operación diaria, conecta a las familias y automatiza tus reportes con Inteligencia Artificial.
            </p>
          </div>

          {/* Simulated macOS Window Player */}
          <div className="w-full bg-[#080E21] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-teal-950/5 relative">
            
            {/* macOS Window Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#050917] border-b border-slate-900 select-none">
              {/* Colored Dots */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
              </div>
              
              {/* Window Title */}
              <div className="text-[11px] font-bold text-slate-500 tracking-wider font-mono">
                YB — Presentación
              </div>
              
              {/* Spacer for centering */}
              <div className="w-14" />
            </div>

            {/* Presentation Content Area */}
            <div className="relative min-h-[380px] sm:min-h-[400px] flex flex-col justify-between p-8 sm:p-12 text-center transition-all duration-500">
              
              {/* Slide Content with keyframe transition */}
              <div className="space-y-6 sm:space-y-8 flex-1 flex flex-col justify-center animate-[fadeIn_0.5s_ease-out]">
                
                {/* Section Tag */}
                <div className="text-[11px] sm:text-xs font-bold text-teal-400 tracking-[0.2em] uppercase select-none">
                  {slides[currentSlide].tag}
                </div>

                {/* Main Headline */}
                <h3 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold leading-[1.1] tracking-tight text-white font-[family-name:var(--font-outfit)]">
                  {slides[currentSlide].title1} <br className="hidden sm:inline" />
                  <span className={`bg-gradient-to-r ${slides[currentSlide].color} bg-clip-text text-transparent`}>
                    {slides[currentSlide].title2}
                  </span>
                </h3>

                {/* Subtext */}
                <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed font-medium">
                  {slides[currentSlide].desc}
                </p>

              </div>

              {/* Bottom Controls Bar */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-900/60 select-none">
                
                {/* Horizontal Progress Pill Selectors */}
                <div className="flex items-center gap-2">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
                        currentSlide === index ? "w-8 bg-teal-500" : "w-2 bg-slate-800 hover:bg-slate-700"
                      }`}
                      aria-label={`Ir a diapositiva ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Slide Number Counter */}
                <div className="text-xs sm:text-sm font-mono font-bold text-slate-500 tracking-widest">
                  {`0${currentSlide + 1} / 0${slides.length}`}
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ───────────────────────────────────────────────────────── */}
      {/* SYSTEM CAPABILITIES (FEATURES) */}
      {/* ───────────────────────────────────────────────────────── */}
      <section id="caracteristicas" className="py-20 bg-white border-t border-slate-100 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          
          {/* Section Header */}
          <div className="text-center space-y-3">
            <h2 className="text-[34px] sm:text-[40px] font-extrabold tracking-tight text-slate-900 leading-tight font-[family-name:var(--font-outfit)]">
              Capacidades del Sistema
            </h2>
            <p className="max-w-2xl mx-auto text-base text-slate-500 leading-relaxed font-medium">
              Nuestra arquitectura en la nube permite un acceso continuo y seguro a la información crítica de su negocio desde cualquier dispositivo.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-slate-50/50 hover:bg-slate-50/90 border border-slate-100/80 hover:border-teal-250 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 text-teal-750 flex items-center justify-center mb-5 transition-transform group-hover:scale-105 duration-300">
                <Calendar className="w-5.5 h-5.5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 font-[family-name:var(--font-outfit)]">Motor de Agendas</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Calendario visual interactivo para la asignación, supervisión y control del estado de las citas y horarios de terapeutas en tiempo real.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50/50 hover:bg-slate-50/90 border border-slate-100/80 hover:border-teal-250 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 text-teal-750 flex items-center justify-center mb-5 transition-transform group-hover:scale-105 duration-300">
                <FileText className="w-5.5 h-5.5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 font-[family-name:var(--font-outfit)]">Historias Clínicas</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Control estricto de expedientes y redacción de evolución clínica en formatos SOAP, BIRP, DAP y libre con firma digital inalterable.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50/50 hover:bg-slate-50/90 border border-slate-100/80 hover:border-teal-250 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center mb-5 transition-transform group-hover:scale-105 duration-300">
                <Users className="w-5.5 h-5.5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 font-[family-name:var(--font-outfit)]">Portal de Padres</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Panel exclusivo para que las familias realicen un seguimiento activo de la evolución del niño, consulten citas y completen escalas.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50/50 hover:bg-slate-50/90 border border-slate-100/80 hover:border-teal-250 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-5 transition-transform group-hover:scale-105 duration-300">
                <BrainCircuit className="w-5.5 h-5.5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 font-[family-name:var(--font-outfit)]">Automatización IA</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Módulo inteligente integrado para la redacción automática de resúmenes de evolución empáticos y claros para los padres a partir de las notas.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────── */}
      {/* CORPORATE PRICING MATRIX */}
      {/* ───────────────────────────────────────────────────────── */}
      <section id="precios" className="py-20 bg-slate-50/50 border-t border-slate-100 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          
          {/* Section Header */}
          <div className="text-center space-y-3">
            <h2 className="text-[34px] sm:text-[40px] font-extrabold tracking-tight text-slate-900 leading-tight font-[family-name:var(--font-outfit)]">
              Estructura de Precios Corporativos
            </h2>
            <p className="max-w-2xl mx-auto text-base text-slate-500 leading-relaxed font-medium">
              Seleccione el plan de licenciamiento que mejor se adapte a la escala operativa de su centro terapéutico.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Plan 1: Prueba Gratuita */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-[family-name:var(--font-outfit)]">Prueba Gratuita</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Evaluación de la plataforma durante 7 días sin compromiso comercial.</p>
                </div>
                
                <div className="py-2">
                  <span className="text-[34px] font-extrabold text-slate-900 font-[family-name:var(--font-outfit)]">Gratis</span>
                  <span className="text-sm font-semibold text-slate-500">/ 7 días</span>
                </div>
                
                <hr className="border-slate-100" />
                
                <ul className="space-y-3.5 text-sm font-semibold text-slate-650">
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-teal-700 flex-shrink-0" />
                    <span>Acceso completo por 7 días</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-teal-700 flex-shrink-0" />
                    <span>Gestión de base de pacientes y acudientes</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-teal-700 flex-shrink-0" />
                    <span>Módulo de historias clínicas básico</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-teal-700 flex-shrink-0" />
                    <span>Calendario Visual de Citas y Turnos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-teal-700 flex-shrink-0" />
                    <span>1 usuario administrador (Director)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-teal-700 flex-shrink-0" />
                    <span>Despliegue y activación manual</span>
                  </li>
                </ul>
              </div>
              
              <a
                href="https://wa.me/593986189965?text=Hola%2C%20me%20interesa%20probar%20el%20plan%20de%20*Prueba%20Gratuita%20(7%20d%C3%ADas)*%20de%20YB.%20%C2%BFPodr%C3%ADan%20ayudarme%20a%20activar%20mi%20portal%20de%20demostraci%C3%B3n%3F"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 flex items-center justify-center w-full py-3.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 font-bold rounded-xl active:scale-[0.98] transition-all"
              >
                Probar 7 días gratis
              </a>
            </div>

            {/* Plan 2: Profesional */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-[family-name:var(--font-outfit)]">Profesional</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Para establecimientos que requieren control total de su operación diaria.</p>
                </div>
                
                <div className="py-2">
                  <span className="text-[34px] font-extrabold text-slate-900 font-[family-name:var(--font-outfit)]">$22</span>
                  <span className="text-sm font-semibold text-slate-500">/ mes</span>
                </div>
                
                <hr className="border-slate-100" />
                
                <ul className="space-y-3.5 text-sm font-semibold text-slate-650">
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-teal-700 flex-shrink-0" />
                    <span>Creación de Página Web Oficial del Centro</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-teal-700 flex-shrink-0" />
                    <span>Plataforma SaaS en la nube completa</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-teal-700 flex-shrink-0" />
                    <span>Módulo de Fichas Clínicas y Citas</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-teal-700 flex-shrink-0" />
                    <span>Base de datos de Pacientes e Historial</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-teal-700 flex-shrink-0" />
                    <span>Control de Cuestionarios y Escalas Clínicas</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-teal-700 flex-shrink-0" />
                    <span>Configurador de Horarios de Terapeutas</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-teal-700 flex-shrink-0" />
                    <span>Acceso concurrente hasta 5 usuarios</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-teal-700 flex-shrink-0" />
                    <span>Soporte técnico prioritario (SLA)</span>
                  </li>
                </ul>
              </div>
              
              <a
                href="https://wa.me/593986189965?text=Hola%2C%20me%20interesa%20adquirir%20el%20plan%20*Profesional%20(%2422%2Fmes)*%20de%20YB.%20Me%20gustar%C3%ADa%20incluir%20el%20Sitio%20Web%20Oficial%20y%20el%20Sistema%20Cl%C3%ADnico.%20%C2%BFCu%C3%A1les%20son%20los%20pasos%20a%20seguir%3F"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 flex items-center justify-center w-full py-3.5 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-xl shadow-md active:scale-[0.98] transition-all"
              >
                Empezar con Profesional
              </a>
            </div>

            {/* Plan 3: Avanzado (Recomendado/Premium) */}
            <div className="bg-white border-2 border-teal-600 rounded-3xl p-8 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
              {/* Recommended Badge */}
              <div className="absolute top-0 right-0 bg-teal-700 text-white text-[9px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                Recomendado
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-[family-name:var(--font-outfit)]">Avanzado</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Para grupos terapéuticos orientados a la automatización y escalabilidad de élite.</p>
                </div>
                
                <div className="py-2">
                  <span className="text-[34px] font-extrabold text-slate-900 font-[family-name:var(--font-outfit)]">$45</span>
                  <span className="text-sm font-semibold text-slate-500">/ mes</span>
                </div>
                
                <hr className="border-slate-100" />
                
                <ul className="space-y-3.5 text-sm font-semibold text-slate-650">
                  <li className="flex items-center gap-2.5">
                    <Sparkles className="w-4.5 h-4.5 text-teal-700 flex-shrink-0 animate-pulse" />
                    <span className="font-bold text-slate-800">Todas las funciones de Licencia Profesional</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-teal-700 flex-shrink-0" />
                    <span>Módulo de IA de Evolución Clínico Integrado (Ilimitado)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-teal-700 flex-shrink-0" />
                    <span>Accesos y usuarios concurrentes ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-teal-700 flex-shrink-0" />
                    <span>Conexión con WhatsApp Business del Centro</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-teal-700 flex-shrink-0" />
                    <span>Panel administrativo multi-sede</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-teal-700 flex-shrink-0" />
                    <span>Asistencia técnica y operativa 24/7</span>
                  </li>
                </ul>
              </div>
              
              <a
                href="https://wa.me/593986189965?text=Hola%2C%20me%20interesa%20adquirir%20el%20plan%20*Avanzado%20(%2445%2Fmes)*%20de%20YB.%20Me%20gustar%C3%ADa%20contar%20con%20todas%20las%20integraciones%20de%20IA%20ilimitadas%2C%20p%C3%A1gina%20web%20y%20conexi%C3%B3n%20con%20WhatsApp.%20%C2%BFPodr%C3%ADan%20asesorarme%3F"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 flex items-center justify-center w-full py-3.5 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white font-bold rounded-xl shadow-md active:scale-[0.98] transition-all"
              >
                Empezar con Avanzado
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────── */}
      {/* FOOTER */}
      {/* ───────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Left Brand */}
          <div className="flex items-center gap-2.5 select-none">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center shadow-md shadow-teal-700/25">
              <BearLogo className="w-6.5 h-6.5 text-white" strokeWidth={5} />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-base font-bold text-white tracking-tight font-[family-name:var(--font-outfit)]">YB</span>
              <span className="text-[8px] font-bold text-teal-400 tracking-wider uppercase">Tecnología de Evolución</span>
            </div>
          </div>

          {/* Center copyright */}
          <div className="text-xs text-center font-medium text-slate-500">
            © 2026 YB Software. Desarrollado con tecnología de vanguardia.
          </div>

          {/* Right Corporate Portal and Contact */}
          <div className="flex items-center gap-6 text-xs font-bold">
            <a href="https://yinbaoyb.web.app/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Portal Corporativo</a>
            <span className="text-slate-700">|</span>
            <Link href="https://wa.me/593986189965" target="_blank" className="hover:text-white transition-colors flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-teal-500" />
              Soporte y Contacto
            </Link>
          </div>

        </div>
      </footer>

    </div>
  );
}