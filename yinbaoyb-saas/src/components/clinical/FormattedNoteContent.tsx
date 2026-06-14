"use client";

import React from "react";
import { 
  ClipboardCheck, 
  Eye, 
  TrendingUp, 
  Home, 
  MessageSquare, 
  Target, 
  Activity, 
  CalendarDays, 
  Check, 
  ChevronRight,
  Sparkles,
  Heart
} from "lucide-react";

interface NoteSection {
  title: string;
  icon: React.ReactNode;
  bulletIcon: React.ReactNode;
  colorClass: string;
  items: string[];
  text: string;
}

export function parseNoteContent(content: string): NoteSection[] {
  if (!content) return [];
  
  // Limpiar el pie de firma o timestamp si existe
  const mainContent = content.split(/\n\s*---\s*\n/)[0] || content;

  // Iconos y colores personalizados
  const iconSize = "h-4 w-4";
  const bulletSize = "h-3.5 w-3.5 flex-shrink-0 mt-0.5";

  const sectionsConfig = [
    { 
      key: "Tareas Realizadas", 
      title: "Tareas Realizadas", 
      icon: <ClipboardCheck className={`${iconSize} text-teal-600`} />,
      bullet: <Check className={`${bulletSize} text-teal-500`} />,
      bg: "bg-gradient-to-br from-teal-50/80 to-teal-50/30 border-teal-150 text-teal-950" 
    },
    { 
      key: "Observaciones", 
      title: "Observaciones", 
      icon: <Eye className={`${iconSize} text-blue-600`} />,
      bullet: <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5 ml-1 mr-1" />,
      bg: "bg-gradient-to-br from-blue-50/80 to-blue-50/30 border-blue-150 text-blue-950" 
    },
    { 
      key: "Avances / Resultados", 
      title: "Avances / Resultados", 
      icon: <TrendingUp className={`${iconSize} text-emerald-600`} />,
      bullet: <Sparkles className={`${bulletSize} text-emerald-500`} />,
      bg: "bg-gradient-to-br from-emerald-50/80 to-emerald-50/30 border-emerald-150 text-emerald-950" 
    },
    { 
      key: "Avances / Resultados y Logros", 
      title: "Avances y Logros", 
      icon: <TrendingUp className={`${iconSize} text-emerald-600`} />,
      bullet: <Sparkles className={`${bulletSize} text-emerald-500`} />,
      bg: "bg-gradient-to-br from-emerald-50/80 to-emerald-50/30 border-emerald-150 text-emerald-950" 
    },
    { 
      key: "Recomendaciones para Casa", 
      title: "Recomendaciones para Casa", 
      icon: <Home className={`${iconSize} text-amber-600`} />,
      bullet: <Heart className={`${bulletSize} text-amber-500 fill-amber-500/10`} />,
      bg: "bg-gradient-to-br from-amber-50/80 to-amber-50/30 border-amber-150 text-amber-950" 
    },
    // Formato SOAP
    { 
      key: "Subjetivo", 
      title: "Subjetivo (S)", 
      icon: <MessageSquare className={`${iconSize} text-purple-600`} />,
      bullet: <ChevronRight className={`${bulletSize} text-purple-400`} />,
      bg: "bg-gradient-to-br from-purple-50/80 to-purple-50/30 border-purple-150 text-purple-950" 
    },
    { 
      key: "Objetivo", 
      title: "Objetivo (O)", 
      icon: <Target className={`${iconSize} text-sky-600`} />,
      bullet: <Check className={`${bulletSize} text-sky-500`} />,
      bg: "bg-gradient-to-br from-sky-50/80 to-sky-50/30 border-sky-150 text-sky-950" 
    },
    { 
      key: "Evaluación", 
      title: "Evaluación (A)", 
      icon: <Activity className={`${iconSize} text-indigo-600`} />,
      bullet: <Sparkles className={`${bulletSize} text-indigo-500`} />,
      bg: "bg-gradient-to-br from-indigo-50/80 to-indigo-50/30 border-indigo-150 text-indigo-950" 
    },
    { 
      key: "Plan", 
      title: "Plan (P)", 
      icon: <CalendarDays className={`${iconSize} text-rose-600`} />,
      bullet: <ChevronRight className={`${bulletSize} text-rose-450`} />,
      bg: "bg-gradient-to-br from-rose-50/80 to-rose-50/30 border-rose-150 text-rose-950" 
    },
  ];

  const parsedSections: NoteSection[] = [];
  
  // Expresión regular para buscar encabezados del tipo **Título:**
  const regex = /\*\*([^*:]+):\*\*/g;
  let match;
  const matches: { title: string; index: number; length: number }[] = [];
  
  while ((match = regex.exec(mainContent)) !== null) {
    matches.push({
      title: match[1].trim(),
      index: match.index,
      length: match[0].length
    });
  }
  
  if (matches.length === 0) {
    // Si no tiene la estructura de negrita de títulos, devolvemos todo en una sección general
    return [{
      title: "Evolución de Sesión",
      icon: <Activity className="h-4 w-4 text-slate-500" />,
      bulletIcon: <span className="h-1.5 w-1.5 rounded-full bg-slate-400 flex-shrink-0 mt-1.5 ml-1 mr-1" />,
      colorClass: "bg-gradient-to-br from-slate-50/80 to-slate-50/30 border-slate-150 text-slate-900",
      items: [],
      text: mainContent.trim()
    }];
  }
  
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    const startPos = current.index + current.length;
    const endPos = next ? next.index : mainContent.length;
    const sectionText = mainContent.substring(startPos, endPos).trim();
    
    // Configuración correspondiente
    const config = sectionsConfig.find(c => c.key.toLowerCase() === current.title.toLowerCase()) || {
      title: current.title,
      icon: <Activity className="h-4 w-4 text-slate-500" />,
      bullet: <span className="h-1.5 w-1.5 rounded-full bg-slate-400 flex-shrink-0 mt-1.5 ml-1 mr-1" />,
      bg: "bg-gradient-to-br from-slate-50/80 to-slate-50/30 border-slate-150 text-slate-900"
    };
    
    // Dividir en renglones y limpiar bullets (*, -, •)
    const lines = sectionText.split("\n").map(l => l.trim()).filter(Boolean);
    const items: string[] = [];
    
    lines.forEach(line => {
      if (line.startsWith("-") || line.startsWith("*") || line.startsWith("•")) {
        const itemContent = line.replace(/^[-*•\s]+/, "").trim();
        if (itemContent) items.push(itemContent);
      } else {
        items.push(line);
      }
    });

    parsedSections.push({
      title: config.title,
      icon: config.icon,
      bulletIcon: config.bullet,
      colorClass: config.bg,
      items: items,
      text: sectionText
    });
  }
  
  return parsedSections;
}

export default function FormattedNoteContent({ content }: { content: string }) {
  const sections = parseNoteContent(content);
  
  // Extraer el pie de firma/fecha de registro del delimitador ---
  const parts = content.split(/\n\s*---\s*\n/);
  const trailer = parts[1] ? parts[1].trim().replace(/^\*/, "").replace(/\*$/, "") : null;

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section, idx) => (
          <div 
            key={idx} 
            className={`p-4 rounded-xl border ${section.colorClass} flex flex-col shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.005]`}
          >
            {/* Encabezado de la Sección */}
            <div className="flex items-center gap-2.5 mb-3 font-bold text-xs uppercase tracking-wider border-b border-black/5 pb-2 font-outfit">
              {section.icon}
              <span>{section.title}</span>
            </div>

            {/* Lista o Texto Libre */}
            {section.items.length > 0 ? (
              <ul className="space-y-2 flex-1">
                {section.items.map((item, iIdx) => (
                  <li key={iIdx} className="text-xs leading-relaxed flex items-start gap-2.5 text-slate-700">
                    {section.bulletIcon}
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs leading-relaxed text-slate-700 font-medium flex-1 whitespace-pre-wrap">
                {section.text}
              </p>
            )}
          </div>
        ))}
      </div>
      {trailer && (
        <p className="text-[10px] text-slate-400 font-semibold italic text-right border-t border-slate-100 pt-2.5 pr-1 font-outfit">
          {trailer}
        </p>
      )}
    </div>
  );
}
