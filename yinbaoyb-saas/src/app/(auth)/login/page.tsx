"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BrainCircuit, ShieldCheck, MapPin } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      document.cookie = "sb-role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/";
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-[family-name:var(--font-inter)] selection:bg-yellow-500/30">
      {/* ───────────────────────────────────────────────────────── */}
      {/* LEFT PANEL : BRANDING (Hidden on Mobile) */}
      {/* ───────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex w-1/2 bg-[#111827] text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/4" />

        {/* Top Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EAB308] to-[#CA8A04] flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight font-[family-name:var(--font-outfit)]">YinbaoYB</span>
        </div>

        {/* Main Brand Copy */}
        <div className="space-y-8 relative z-10 max-w-lg mb-12">
          <h1 className="text-6xl font-extrabold leading-[1.1] tracking-tight font-[family-name:var(--font-outfit)]">
            Evolución <br />
            <span className="text-[#EAB308]">Clínica.</span>
          </h1>
          
          <div className="space-y-4">
            <p className="text-lg font-medium text-slate-200">
              En YinbaoYB centralizamos Historias Clínicas, Agendas y Automatización IA para tu Centro Terapéutico.
            </p>
            <p className="text-slate-400 text-sm leading-relaxed border-l-2 border-slate-700 pl-4 py-1 italic">
              "No entregamos solo un software, brindamos un ecosistema digital inteligente que potencia la evolución de tus pacientes y libera tu tiempo administrativo."
            </p>
          </div>

          <p className="text-slate-300 font-medium">
            Visítanos: <a href="https://yinbaoyb.com" target="_blank" rel="noopener noreferrer" className="text-[#EAB308] hover:text-yellow-400 underline underline-offset-4 decoration-yellow-500/30 transition-colors">yinbaoyb.com</a>
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-4">
            <span className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800/50 text-xs font-bold text-slate-300 tracking-wider">
              HISTORIAS CLÍNICAS
            </span>
            <span className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800/50 text-xs font-bold text-slate-300 tracking-wider">
              AGENDAMIENTO IA
            </span>
            <span className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800/50 text-xs font-bold text-slate-300 tracking-wider">
              MÚLTIPLES SEDES
            </span>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium relative z-10">
          <MapPin className="w-4 h-4 text-red-500" />
          Portoviejo, Manabí, Ecuador
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────── */}
      {/* RIGHT PANEL : LOGIN FORM */}
      {/* ───────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 min-h-[100dvh] flex flex-col justify-start lg:justify-center items-center px-6 py-10 md:px-12 bg-white relative">
        {/* Mobile Header (Only visible on small screens) */}
        <div className="lg:hidden mb-10 w-full flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#EAB308] to-[#CA8A04] flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <BrainCircuit className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 font-[family-name:var(--font-outfit)]">YinbaoYB</span>
        </div>

        <div className="w-full max-w-md space-y-10">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 font-[family-name:var(--font-outfit)]">
              Inicio de sesión
            </h2>
            <p className="mt-3 text-[15px] text-slate-500 leading-relaxed font-medium">
              Accede al sistema de gestión interno de YinbaoYB para administrar las operaciones y agendas SaaS.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Status Messages */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm font-medium text-red-600 flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                {error}
              </div>
            )}
            {message && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm font-medium text-emerald-700 flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                {message}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block textxs font-bold text-slate-700 uppercase tracking-widest text-[11px]">
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-slate-200 text-slate-900 focus:ring-0 focus:border-[#111827] transition-colors font-medium text-[15px] placeholder:text-slate-400 placeholder:font-normal"
                  placeholder="director@centro.com"
                />
              </div>

              <div className="space-y-1.5 relative">
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-widest text-[11px]">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-slate-200 text-slate-900 focus:ring-0 focus:border-[#111827] transition-colors font-medium text-[15px] placeholder:text-slate-400 placeholder:font-normal tracking-[0.2em]"
                  placeholder="••••••••"
                />
                {/* Fake Eye Icon matching design */}
                <div className="absolute right-2 top-8 text-slate-400 cursor-pointer hover:text-slate-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#111827] focus:ring-[#111827] cursor-pointer" 
                />
                <span className="text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors">Recordarme</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative overflow-hidden bg-[#111827] text-white py-4 rounded-xl text-sm font-bold hover:bg-black transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-black/10 group mt-4!"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4 text-white/70" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Procesando...
                </span>
              ) : (
                <>
                  <span className="relative z-10">Ingresar</span>
                  <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Support Footer */}
        <div className="w-full mt-auto lg:mt-16 pt-12 lg:pt-0 flex justify-center items-center">
          <div className="flex flex-wrap justify-center items-center gap-2 lg:gap-4 text-xs lg:text-[13px] font-bold text-slate-500">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-yellow-500" /> ¿Problemas?</span>
            <Link href="https://wa.me/593986189965" target="_blank" className="hover:text-black transition-colors">WhatsApp</Link>
            <span className="text-slate-300">|</span>
            <Link href="mailto:soporte@yinbaoyb.com" className="hover:text-black transition-colors">Email</Link>
          </div>
        </div>

      </div>
    </div>
  );
}