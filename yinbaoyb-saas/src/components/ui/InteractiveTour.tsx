"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Sparkles, AlertCircle } from "lucide-react";

export interface TourStep {
  target: string; // CSS selector (e.g. '#tour-kpis')
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
}

interface InteractiveTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  accentColor?: string; // Tailwind color class, e.g., 'indigo-600'
}

export function InteractiveTour({ steps, isOpen, onClose, accentColor = "indigo-600" }: InteractiveTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [elementFound, setElementFound] = useState(true);

  const activeStep = steps[currentStep];

  // Recalculate size and scroll on step change or window resize
  const updateRect = () => {
    if (!isOpen || !activeStep) return;

    const element = document.querySelector(activeStep.target);
    if (element) {
      // Scroll to element smoothly
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      
      // Delay slightly to allow scroll to complete for perfect coordinates
      setTimeout(() => {
        const bounds = element.getBoundingClientRect();
        setRect(bounds);
        setElementFound(true);
      }, 300);
    } else {
      setRect(null);
      setElementFound(false);
      console.warn(`Tour target not found: ${activeStep.target}`);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      updateRect();
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
  }, [isOpen]);

  useEffect(() => {
    updateRect();
  }, [currentStep, isOpen]);

  useEffect(() => {
    const handleResize = () => {
      updateRect();
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", updateRect, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", updateRect);
    };
  }, [currentStep, isOpen]);

  if (!isOpen || steps.length === 0) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Tooltip coordinates logic
  const getTooltipStyle = () => {
    if (!rect) {
      // Fallback: Center of the screen
      return {
        position: "fixed" as const,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 110,
      };
    }

    const placement = activeStep.placement || "bottom";
    const gap = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 180; // approximate

    let top = 0;
    let left = 0;

    if (placement === "bottom") {
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
    } else if (placement === "top") {
      top = rect.top - tooltipHeight - gap;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
    } else if (placement === "left") {
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.left - tooltipWidth - gap;
    } else if (placement === "right") {
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.right + gap;
    }

    // Boundary collision checks (keep within screen margins)
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
    top = Math.max(80, Math.min(top, window.innerHeight - tooltipHeight - 16));

    return {
      position: "fixed" as const,
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      zIndex: 110,
    };
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] overflow-hidden pointer-events-none">
        {/* SVG overlay with rounded cutout hole around target */}
        {rect && (
          <svg className="fixed inset-0 w-full h-full pointer-events-auto">
            <defs>
              <mask id="tour-cutout-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <rect
                  x={rect.left - 8}
                  y={rect.top - 8}
                  width={rect.width + 16}
                  height={rect.height + 16}
                  rx="16"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(15, 23, 42, 0.7)"
              mask="url(#tour-cutout-mask)"
              className="transition-all duration-300 ease-out"
            />
          </svg>
        )}

        {/* Global blur backdrop fallback if target is missing */}
        {!rect && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-auto flex items-center justify-center" />
        )}

        {/* Tooltip Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={getTooltipStyle()}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 pointer-events-auto flex flex-col gap-4 relative overflow-hidden"
        >
          {/* Accent colored line top */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-${accentColor}`} />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Target Not Found Warning */}
          {!elementFound && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg w-fit font-medium mb-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Elemento no encontrado en pantalla</span>
            </div>
          )}

          {/* Header */}
          <div className="space-y-1 pr-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500 animate-spin" /> Step {currentStep + 1} of {steps.length}
            </span>
            <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">{activeStep.title}</h3>
          </div>

          {/* Body */}
          <p className="text-xs text-slate-600 leading-relaxed flex-1 overflow-y-auto max-h-[100px] custom-scrollbar">
            {activeStep.content}
          </p>

          {/* Footer actions */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-2">
            <button
              onClick={onClose}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              Omitir
            </button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleNext}
                className={`px-4 py-1.5 bg-${accentColor} hover:opacity-90 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer`}
              >
                <span>{currentStep === steps.length - 1 ? "Terminar" : "Siguiente"}</span>
                {currentStep < steps.length - 1 && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
