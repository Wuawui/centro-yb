// ============================================================
// StatusBadge — Badge reutilizable para estados
// ============================================================

import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPE_COLORS,
  APPOINTMENT_TYPE_LABELS,
  PATIENT_STATUS_CONFIG,
  NOTE_FORMAT_LABELS,
  NOTE_FORMAT_COLORS,
} from "@/lib/constants";

type BadgeType = "appointment-status" | "appointment-type" | "patient" | "note";

interface StatusBadgeProps {
  type: BadgeType;
  status: string;
  className?: string;
}

export function StatusBadge({ type, status, className = "" }: StatusBadgeProps) {
  let label = status;
  let color = "bg-gray-50 text-gray-600";

  switch (type) {
    case "appointment-status":
      label = APPOINTMENT_STATUS_LABELS[status] || status;
      color = APPOINTMENT_STATUS_COLORS[status] || color;
      break;
    case "appointment-type":
      label = APPOINTMENT_TYPE_LABELS[status] || status;
      color = APPOINTMENT_TYPE_COLORS[status] || color;
      break;
    case "patient":
      label = PATIENT_STATUS_CONFIG[status]?.label || status;
      color = PATIENT_STATUS_CONFIG[status]?.color || color;
      break;
    case "note":
      label = NOTE_FORMAT_LABELS[status] || status;
      color = NOTE_FORMAT_COLORS[status] || color;
      break;
  }

  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${color} ${className}`}>
      {label}
    </span>
  );
}
