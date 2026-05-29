import React from "react";

interface BearLogoProps {
  className?: string;
  strokeWidth?: number; // Mantenido para total compatibilidad con el compilador de TypeScript
}

export function BearLogo({ className = "w-10 h-10", strokeWidth }: BearLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="YB Logo"
      className={`${className} select-none`}
      style={{ objectFit: "contain" }}
    />
  );
}
