"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, MapPin, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { BearLogo } from "@/components/ui/BearLogo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="flex min-h-screen bg-gradient-to-tr from-teal-500/10 via-[#F3FAF8] to-white font-[family-name:var(--font-inter)] selection:bg-teal-500/30 items-center justify-center relative overflow-hidden p-6">
      {/* Glow clinical ambient lights in background */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-teal-400/10 rounded-full blur-[140px] pointer-events-none -translate-y-1/3 translate-x-1/3 animate-glow-emerald" />
      <div className="absolute bottom-0 left-0 w-[550px] h-[550px] bg-teal-450/10 rounded-full blur-[110px] pointer-events-none translate-y-1/3 -translate-x-1/3 animate-glow-teal" />

      {/* ───────────────────────────────────────────────────────── */}
      {/* CENTERED CLINICAL LOGIN CARD */}
      {/* ───────────────────────────────────────────────────────── */}
      <div className="w-full max-w-[480px] bg-white/95 backdrop-blur-md border border-slate-100/50 rounded-3xl p-8 md:p-10 shadow-[0_20px_50px_-10px_rgba(14,111,98,0.06)] relative z-10 space-y-6 animate-float-glass">
        
        {/* Header Section */}
        <div className="text-center space-y-3.5">
          {/* Emblema Clínico */}
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 items-center justify-center shadow-lg shadow-teal-700/25 drop-shadow-logo transition-transform hover:scale-105 duration-300">
            <BearLogo className="w-8.5 h-8.5 text-white" strokeWidth={5} />
          </div>
          
          <div className="space-y-1.5">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight font-[family-name:var(--font-outfit)]">
              Portal Terapéutico
            </h2>
            <p className="text-xs font-bold text-teal-800 tracking-wider uppercase">
              YB Evolución Clínica
            </p>
            <p className="text-[13px] text-slate-500 leading-relaxed font-medium pt-1">
              Accede al portal de tu centro terapéutico para revisar historias clínicas, reportes de evolución e interactuar con la IA de progreso.
            </p>
          </div>

          {/* Pastel Role Pills - Reassuring who this is for */}
          <div className="flex flex-wrap justify-center items-center gap-1.5 pt-1">
            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-sky-50 border border-sky-100 text-sky-700 tracking-wider select-none">
              PADRES / TUTORES
            </span>
            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-teal-50/60 border border-teal-100 text-teal-800 tracking-wider select-none">
              TERAPEUTAS
            </span>
            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-slate-50 border border-slate-150 text-slate-600 tracking-wider select-none">
              ADMINISTRACIÓN
            </span>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Status Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-150 rounded-xl text-sm font-semibold text-red-700 flex items-start gap-3 shadow-sm shadow-red-50/50">
              <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
              <span className="flex-1">{error}</span>
            </div>
          )}
          {message && (
            <div className="p-4 bg-teal-50 border border-teal-150 rounded-xl text-sm font-semibold text-teal-800 flex items-start gap-3 shadow-sm shadow-teal-50/50">
              <span className="w-2 h-2 rounded-full bg-teal-600 mt-1.5 flex-shrink-0" />
              <span className="flex-1">{message}</span>
            </div>
          )}

          {/* Inputs Encapsulados Clínicos */}
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-widest text-[10px]">
                Correo Electrónico
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-700 transition-colors">
                  <Mail className="w-4.5 h-4.5 stroke-[1.8]" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50/60 hover:bg-slate-50/90 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-teal-600 rounded-xl text-slate-900 focus:ring-4 focus:ring-teal-100/50 focus:outline-none transition-all duration-300 font-medium text-[15px] placeholder:text-slate-400 placeholder:font-normal"
                  placeholder="ejemplo@centro.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-widest text-[10px]">
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-700 transition-colors">
                  <Lock className="w-4.5 h-4.5 stroke-[1.8]" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50/60 hover:bg-slate-50/90 focus:bg-white border border-slate-200 hover:border-slate-300 focus:border-teal-600 rounded-xl text-slate-900 focus:ring-4 focus:ring-teal-100/50 focus:outline-none transition-all duration-300 font-medium text-[15px] placeholder:text-slate-400 placeholder:font-normal"
                  placeholder="••••••••"
                />
                {/* Eye Toggle button - REAL STATE REACTIVITY */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 inset-y-0 flex items-center text-slate-400 hover:text-teal-750 cursor-pointer transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 stroke-[1.8]" />
                  ) : (
                    <Eye className="w-5 h-5 stroke-[1.8]" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Checkbox and Forgot password */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4.5 h-4.5 rounded border-slate-300 text-teal-750 focus:ring-teal-600 cursor-pointer transition-all" 
              />
              <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-800 transition-colors select-none">Recordarme</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-slate-500 hover:text-teal-800 transition-colors select-none"
            >
              ¿Olvidó contraseña?
            </Link>
          </div>

          {/* Premium Clinical Teal Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full relative overflow-hidden bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white py-4 rounded-xl text-sm font-bold shadow-lg shadow-teal-700/10 active:scale-[0.98] transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed group mt-2 shimmer-active"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4 text-white/70" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Procesando acceso...
              </span>
            ) : (
              <>
                <span className="relative z-10 font-[family-name:var(--font-outfit)] tracking-wide">Ingresar al Portal</span>
                {/* Shimmer sweep layer */}
                <div className="shimmer-layer absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full pointer-events-none" />
              </>
            )}
          </button>
        </form>

        {/* Security and Compliance Footer */}
        <div className="space-y-4 pt-4 border-t border-slate-100 text-center">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-full select-none">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
            <span>Portal Clínico Cifrado y Seguro (HIPAA)</span>
          </div>
          
          <div className="flex justify-center items-center gap-3 text-xs font-bold text-slate-400">
            <Link href="https://wa.me/593986189965" target="_blank" className="text-slate-500 hover:text-teal-800 transition-colors">WhatsApp de Soporte</Link>
            <span className="text-slate-200">|</span>
            <Link href="mailto:soporte@yb.com" className="text-slate-500 hover:text-teal-800 transition-colors">Email</Link>
          </div>
        </div>
      </div>
      {/* Location info on bottom right */}
      <div className="absolute bottom-5 right-5 flex items-center gap-2 text-slate-400 text-xs font-semibold select-none">
        <MapPin className="w-3.5 h-3.5 text-teal-750" />
        Portoviejo, Manabí, Ecuador
      </div>
    </div>
  );
}