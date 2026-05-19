"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ addToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2 max-w-sm">
        {toasts.map(toast => {
          const config = {
            success: { icon: CheckCircle, color: "bg-green-50 border-green-200 text-green-800", iconColor: "text-green-500" },
            error: { icon: AlertCircle, color: "bg-red-50 border-red-200 text-red-800", iconColor: "text-red-500" },
            warning: { icon: AlertTriangle, color: "bg-yellow-50 border-yellow-200 text-yellow-800", iconColor: "text-yellow-500" },
            info: { icon: Info, color: "bg-blue-50 border-blue-200 text-blue-800", iconColor: "text-blue-500" },
          }[toast.type];
          const Icon = config.icon;
          return (
            <div key={toast.id} className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg animate-in slide-in-from-right ${config.color}`}>
              <Icon className={`h-5 w-5 flex-shrink-0 ${config.iconColor}`} />
              <p className="text-sm flex-1">{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} className="flex-shrink-0 opacity-50 hover:opacity-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}