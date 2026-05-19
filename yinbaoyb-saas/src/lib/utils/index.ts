// ============================================================
// Utilidades generales
// ============================================================
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge de clases Tailwind (shadcn pattern)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatear fecha en español
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

// Formatear hora
export function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${m} ${ampm}`;
}

// Iniciales de un nombre
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Display name
export function displayName(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return "Sin nombre";
  return [firstName, lastName].filter(Boolean).join(" ");
}

// Rol en español
export function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: "Super Administrador",
    director: "Director de Sede",
    coordinador: "Coordinador Clínico",
    terapeuta: "Terapeuta",
    admin: "Administrativo",
    paciente: "Paciente",
  };
  return labels[role] ?? role;
}

// Estado de paciente en español
export function patientStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    activo: "Activo",
    alta: "Dado de alta",
    abandonado: "Abandonó",
    lista_espera: "En lista de espera",
  };
  return labels[status] ?? status;
}

// Color de estado
export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    activo: "text-green-600 bg-green-50",
    alta: "text-blue-600 bg-blue-50",
    abandonado: "text-red-600 bg-red-50",
    lista_espera: "text-yellow-600 bg-yellow-50",
    programada: "text-blue-600 bg-blue-50",
    confirmada: "text-green-600 bg-green-50",
    completada: "text-gray-600 bg-gray-50",
    cancelada: "text-red-600 bg-red-50",
    no_asistio: "text-orange-600 bg-orange-50",
  };
  return colors[status] ?? "text-gray-600 bg-gray-50";
}