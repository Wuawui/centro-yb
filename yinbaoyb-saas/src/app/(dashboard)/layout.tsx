"use client";

import { DashboardLayout } from "@/components/layout";
import { ToastProvider } from "@/components/ui/Toast";
import { ADMIN_NAV } from "@/lib/constants";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <DashboardLayout navItems={ADMIN_NAV} colorScheme="indigo" brand={{ name: "CentroYB", initials: "YB" }}>
        {children}
      </DashboardLayout>
    </ToastProvider>
  );
}