// ============================================================
// KPICard — Tarjeta de KPI reutilizable
// ============================================================

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface KPICardProps {
  name: string;
  value: number;
  sub?: string;
  icon: LucideIcon;
  color: string;
  href: string;
}

export function KPICard({ name, value, sub, icon: Icon, color, href }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        href={href}
        className="block bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{name}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
    </Link>
    </motion.div>
  );
}
