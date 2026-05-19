"use client";

// ============================================================
// Skeleton Loaders — Instant visual feedback while data loads
// Eliminates the "white flash" or spinner delay  
// ============================================================

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-40 bg-slate-200 rounded-lg" />
          <div className="h-4 w-64 bg-slate-100 rounded mt-2" />
        </div>
        <div className="h-8 w-24 bg-slate-100 rounded-lg" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-slate-100 rounded-xl" />
              <div className="h-4 w-16 bg-slate-100 rounded" />
            </div>
            <div className="h-8 w-20 bg-slate-200 rounded-lg" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
            <div className="h-5 w-36 bg-slate-200 rounded-lg" />
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="h-10 w-10 bg-slate-200 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-20 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 bg-slate-200 rounded-lg" />
        <div className="h-9 w-32 bg-slate-100 rounded-xl" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex gap-4 p-4 border-b border-slate-100 bg-slate-50/50">
          {[...Array(cols)].map((_, i) => (
            <div key={i} className="h-4 flex-1 bg-slate-200 rounded" />
          ))}
        </div>
        {/* Rows */}
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-50 last:border-0">
            {[...Array(cols)].map((_, j) => (
              <div key={j} className="h-4 flex-1 bg-slate-100 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgendaSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 bg-slate-200 rounded-lg" />
        <div className="flex gap-2">
          <div className="h-9 w-9 bg-slate-100 rounded-xl" />
          <div className="h-9 w-32 bg-slate-200 rounded-xl" />
          <div className="h-9 w-9 bg-slate-100 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="text-center">
            <div className="h-4 w-8 bg-slate-200 rounded mx-auto mb-2" />
            <div className="h-24 bg-white border border-slate-100 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
