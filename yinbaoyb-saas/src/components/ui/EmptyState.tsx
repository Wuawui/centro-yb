// ============================================================
// EmptyState — Estado vacío reutilizable
// ============================================================

import Link from "next/link";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/50 rounded-2xl border border-slate-200/50 border-dashed p-10 text-center flex flex-col items-center justify-center min-h-[200px]"
    >
      <div className="text-4xl mb-4 opacity-80">{icon}</div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 inline-flex items-center gap-2"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button
          onClick={onAction}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 inline-flex items-center gap-2"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
