import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-yellow-500/30">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">YinbaoYB <span className="text-white/50 font-normal">God-Mode</span></span>
          </div>
          
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/developer" className="text-white hover:text-yellow-400 transition-colors">Centros (Tenants)</Link>
            <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">Volver al SaaS</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
