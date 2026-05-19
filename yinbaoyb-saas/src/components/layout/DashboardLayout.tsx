"use client";

import { Sidebar } from "./Sidebar";
import type { NavItem, ColorScheme } from "@/lib/constants";

// ============================================================
// DashboardLayout — Unified layout for admin, therapist, parent
// ============================================================

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems?: NavItem[];
  colorScheme?: ColorScheme;
  brand?: { name: string; initials: string };
}

export function DashboardLayout({
  children,
  navItems,
  colorScheme = "indigo",
  brand = { name: "CentroYB", initials: "YB" },
}: DashboardLayoutProps) {
  // Default nav imported lazily to avoid circular deps
  const items = navItems || [];

  return (
    <div className="min-h-screen bg-[var(--background)] overflow-x-hidden">
      <Sidebar navItems={items} colorScheme={colorScheme} brand={brand} />
      
      {/* Background ambient light effects (Soft Lavender / Teal blend) */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#f0f5ff]/50 via-transparent to-transparent -z-10 pointer-events-none" />

      <div className="lg:pl-72 transition-all duration-300 ease-in-out">
        {/* Mobile space */}
        <div className="lg:hidden h-16" />
        
        <main className="p-4 sm:p-8 lg:p-10 max-w-[1600px] mx-auto min-h-screen fade-in-up">
          {children}
        </main>
      </div>
    </div>
  );
}