// ============================================================
// LoadingSpinner — Reemplaza 15+ copias del spinner SVG
// ============================================================

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function LoadingSpinner({ size = "md", color = "text-indigo-600", className = "" }: LoadingSpinnerProps) {
  return (
    <svg
      className={`animate-spin ${sizeMap[size]} ${color} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

interface PageLoadingProps {
  text?: string;
  color?: string;
}

export function PageLoading({ text = "Cargando...", color = "text-indigo-600" }: PageLoadingProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <LoadingSpinner size="lg" color={color} className="mx-auto mb-3" />
        <p className="text-gray-500 text-sm">{text}</p>
      </div>
    </div>
  );
}
