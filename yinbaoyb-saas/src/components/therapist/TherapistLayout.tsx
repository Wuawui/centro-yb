import { TherapistSidebar } from "./TherapistSidebar";
import { ToastProvider } from "@/components/ui/Toast";

export function TherapistLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <TherapistSidebar />
        <div className="lg:pl-64">
          <div className="lg:hidden h-14" />
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}