"use client";

import { DashboardLayout } from "@/components/layout";
import { ToastProvider } from "@/components/ui/Toast";
import { PARENT_NAV } from "@/lib/constants";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DashboardLayout navItems={PARENT_NAV} colorScheme="emerald" brand={{ name: "CentroYB", initials: "CY" }}>
        {children}
      </DashboardLayout>
    </ToastProvider>
  );
}