// ============================================================
// AppointmentCard — Card de cita reutilizable
// ============================================================

import {
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_TYPE_COLORS,
} from "@/lib/constants";
import { motion } from "framer-motion";

interface AppointmentCardProps {
  appointment: {
    id: string;
    start_time: string;
    end_time: string;
    type: string;
    status: string;
    notes?: string | null;
    patients?: { first_name: string; last_name: string } | null;
  };
  onClick?: () => void;
  compact?: boolean;
}

export function AppointmentCard({ appointment: apt, onClick, compact = false }: AppointmentCardProps) {
  const pName = apt.patients
    ? `${apt.patients.first_name} ${apt.patients.last_name}`
    : "Paciente";

  const statusColor = APPOINTMENT_STATUS_COLORS[apt.status] || "bg-gray-100 text-gray-600";
  const typeColor = APPOINTMENT_TYPE_COLORS[apt.type] || "bg-gray-100 text-gray-700";

  if (compact) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl border border-transparent hover:border-slate-200 transition-colors"
      >
        <div className="text-center min-w-[50px]">
          <p className="text-sm font-bold text-gray-900">{apt.start_time?.slice(0, 5)}</p>
          <p className="text-[10px] text-gray-400">{apt.end_time?.slice(0, 5)}</p>
        </div>
        <div className="h-8 w-0.5 bg-gray-200" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{pName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-gray-500">
              {APPOINTMENT_TYPE_LABELS[apt.type] || apt.type}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColor}`}>
              {APPOINTMENT_STATUS_LABELS[apt.status] || apt.status}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="bg-white rounded-2xl border border-slate-200/60 p-4 cursor-pointer shadow-sm hover:shadow-md transition-all"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="text-center min-w-[60px]">
          <p className="text-lg font-bold text-gray-900">{apt.start_time?.slice(0, 5)}</p>
          <p className="text-xs text-gray-500">{apt.end_time?.slice(0, 5)}</p>
        </div>
        <div className="h-10 w-0.5 bg-gray-200" />
        <div className="flex-1">
          <p className="font-medium text-gray-900">{pName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${typeColor}`}>
              {APPOINTMENT_TYPE_LABELS[apt.type] || apt.type}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColor}`}>
              {APPOINTMENT_STATUS_LABELS[apt.status] || apt.status}
            </span>
          </div>
        </div>
      </div>
      {apt.notes && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{apt.notes}</p>
        </div>
      )}
    </motion.div>
  );
}
