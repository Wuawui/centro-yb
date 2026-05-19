"use client";

import { DashboardLayout } from "@/components/layout";
import { ToastProvider } from "@/components/ui/Toast";
import { THERAPIST_NAV } from "@/lib/constants";

export default function TherapistGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <DashboardLayout navItems={THERAPIST_NAV} colorScheme="teal" brand={{ name: "CentroYB", initials: "CY" }}>
        {children}
      </DashboardLayout>
    </ToastProvider>
  );
}