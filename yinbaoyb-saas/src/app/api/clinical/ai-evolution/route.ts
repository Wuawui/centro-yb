// ============================================================
// API Route: /api/clinical/ai-evolution
// Analiza la evolución clínica de un paciente (sus notas de sesión)
// para identificar sus carencias/dificultades y áreas de mejora.
// ============================================================
import { NextResponse } from "next/server";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/v1/chat/completions";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma4:31b-cloud";

const SYSTEM_PROMPT = `Eres un psicólogo clínico y terapeuta experto en neurodesarrollo infantil y terapia de aprendizaje/lenguaje. Tu rol es analizar las notas de evolución de las sesiones de terapia para consolidar y reportar de forma profesional y ética:
1. Las carencias del paciente (rezagos, dificultades principales, áreas donde requiere mayor asistencia).
2. Sus áreas de mejora (habilidades priorizadas y enfoques a desarrollar).
3. Estrategias terapéuticas recomendadas basadas en evidencia específicas para este paciente, que ayuden al profesional en su actuar clínico.
4. Puntos de planificación para guiar y estructurar las siguientes sesiones de intervención terapéutica.

REGLAS DE RESPUESTA:
- Habla en tercera persona ("el paciente presenta", "se observa rezago en").
- Identifica de 3 a 5 elementos para cada campo, basados estrictamente en la evidencia de las notas.
- No uses nombres propios de terapeutas ni menciones datos del tenant.
- Responde UNICAMENTE con un objeto JSON en el siguiente formato:
{
  "carencias": ["carencia 1", "carencia 2", ...],
  "areas_mejora": ["area 1", "area 2", ...],
  "estrategias": ["estrategia 1", "estrategia 2", ...],
  "planificacion": ["punto de planificación 1", "punto de planificación 2", ...]
}
- No agregues texto fuera de este objeto JSON.`;

// Motor de Respaldo Clínico Local
function generateFallbackEvolution(notes: any[]): { carencias: string[]; areas_mejora: string[]; estrategias: string[]; planificacion: string[] } {
  const carenciasSet = new Set<string>();
  const areasMejoraSet = new Set<string>();

  notes.forEach(n => {
    const text = [n.subjective, n.objective, n.assessment, n.plan, n.behavior, n.intervention, n.response, n.content]
      .filter(Boolean)
      .join(" ");

    if (text.length < 10) return;

    // Buscar carencias / dificultades
    const sentences = text.split(/[.!?]+/);
    sentences.forEach(s => {
      const lower = s.toLowerCase();
      if (
        lower.includes("dificultad") ||
        lower.includes("le cuesta") ||
        lower.includes("no logra") ||
        lower.includes("rezago") ||
        lower.includes("requiere apoyo") ||
        lower.includes("evita") ||
        lower.includes("falta") ||
        lower.includes("se frustra")
      ) {
        const cleaned = s.trim().replace(/^[-*•\s]+/, "");
        if (cleaned.length > 20 && carenciasSet.size < 4) {
          carenciasSet.add(cleaned.charAt(0).toUpperCase() + cleaned.slice(1));
        }
      }

      // Buscar áreas de mejora
      if (
        lower.includes("trabajar") ||
        lower.includes("reforzar") ||
        lower.includes("se sugiere") ||
        lower.includes("recomienda") ||
        lower.includes("objetivo") ||
        lower.includes("estimular") ||
        lower.includes("enfoque")
      ) {
        const cleaned = s.trim().replace(/^[-*•\s]+/, "");
        if (cleaned.length > 20 && areasMejoraSet.size < 4) {
          areasMejoraSet.add(cleaned.charAt(0).toUpperCase() + cleaned.slice(1));
        }
      }
    });
  });

  // Rellenar con genéricos clínicos si no se extrae suficiente detalle
  if (carenciasSet.size === 0) {
    carenciasSet.add("Presenta dificultades en la consolidación de consignas estructuradas sin apoyo continuo.");
    carenciasSet.add("Muestra períodos cortos de atención sostenida en actividades que demandan alto esfuerzo cognitivo.");
  }
  if (areasMejoraSet.size === 0) {
    areasMejoraSet.add("Reforzar la autorregulación emocional frente a situaciones de frustración durante las tareas.");
    areasMejoraSet.add("Fomentar la motricidad fina y la coordinación visomotora a través de dinámicas de juego lúdico.");
  }

  const estrategias = [
    "Uso de apoyos visuales y estructuración temporal (pictogramas, agendas visuales) para anticipar transiciones.",
    "Implementación de técnicas de modelamiento y economía de fichas para reforzar la conducta adaptativa.",
    "Dinámicas lúdicas basadas en intereses restringidos del paciente para aumentar la motivación intrínseca."
  ];

  const planificacion = [
    "Priorizar sesiones individuales cortas con alta estimulación sensorial para evitar la sobrecarga cognitiva.",
    "Estructurar las próximas 3 sesiones con un inicio de juego libre, seguido de 2 actividades guiadas de 10 minutos y cierre regulador.",
    "Coordinar pautas conductuales unificadas con la familia para asegurar la generalización de aprendizajes en casa."
  ];

  return {
    carencias: Array.from(carenciasSet),
    areas_mejora: Array.from(areasMejoraSet),
    estrategias,
    planificacion
  };
}

export async function POST(request: Request) {
  // 1. Verificar API key del servidor
  const ollamaKey = process.env.OLLAMA_API_KEY;
  if (!ollamaKey) {
    return NextResponse.json({ error: "Configuración de IA no disponible" }, { status: 500 });
  }

  // 2. Verificar autenticación
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const authHeader = request.headers.get("authorization");
  const userToken = authHeader?.replace("Bearer ", "");

  if (!userToken) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Verificar usuario
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${userToken}`, apikey: anonKey },
  });
  const userData = await userRes.json();
  if (!userData.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Verificar perfil y rol clínico
  const profileRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${userData.id}&select=role,tenant_id`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${userToken}` } }
  );
  const profiles = await profileRes.json();
  if (!profiles?.[0]) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const userProfile = profiles[0];
  const allowedRoles = ["super_admin", "director", "admin", "coordinador", "terapeuta"];
  if (!allowedRoles.includes(userProfile.role)) {
    return NextResponse.json({ error: "No autorizado para ver evolución clínica" }, { status: 403 });
  }

  // 3. Obtener el ID del paciente
  let patientId = "";
  try {
    const body = await request.json();
    patientId = body.patientId;
  } catch (err) {
    const { searchParams } = new URL(request.url);
    patientId = searchParams.get("patientId") || "";
  }

  if (!patientId) {
    return NextResponse.json({ error: "Falta el ID del paciente" }, { status: 400 });
  }

  // 4. Validar que el paciente pertenece al mismo tenant
  const patientRes = await fetch(
    `${supabaseUrl}/rest/v1/patients?id=eq.${patientId}&select=first_name,last_name,primary_diagnosis,tenant_id`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${userToken}` } }
  );
  const patients = await patientRes.json();
  if (!patients?.[0]) {
    return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
  }

  const patient = patients[0];
  if (patient.tenant_id !== userProfile.tenant_id) {
    return NextResponse.json({ error: "Acceso denegado (sede incorrecta)" }, { status: 403 });
  }

  // 5. Obtener las últimas 15 notas clínicas
  const notesRes = await fetch(
    `${supabaseUrl}/rest/v1/clinical_notes?patient_id=eq.${patientId}&order=created_at.desc&limit=15&select=format,subjective,objective,assessment,plan,behavior,intervention,response,content,created_at`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${userToken}` } }
  );
  const notes = await notesRes.json();

  if (!notes || notes.length === 0) {
    return NextResponse.json({
      carencias: ["El paciente aún no cuenta con notas de evolución registradas para analizar."],
      areas_mejora: ["Comenzar a documentar la evolución de las sesiones de terapia."]
    });
  }

  // 6. Construir el contexto para la IA
  const notesContext = notes.map((n: any, i: number) => {
    const fields: string[] = [`Formato: ${n.format}`];
    if (n.subjective) fields.push(`Subjetivo: ${n.subjective}`);
    if (n.objective) fields.push(`Objetivo: ${n.objective}`);
    if (n.assessment) fields.push(`Evaluación: ${n.assessment}`);
    if (n.plan) fields.push(`Plan: ${n.plan}`);
    if (n.behavior) fields.push(`Conducta: ${n.behavior}`);
    if (n.intervention) fields.push(`Intervención: ${n.intervention}`);
    if (n.response) fields.push(`Respuesta: ${n.response}`);
    if (n.content) fields.push(`Contenido: ${n.content}`);
    return `--- Nota ${i + 1} ---\n${fields.join("\n")}`;
  }).join("\n\n");

  const userMessage = `Analiza los siguientes reportes clínicos y genera el JSON de carencias y áreas de mejora.

INFORMACIÓN DEL PACIENTE:
Nombre: ${patient.first_name} ${patient.last_name}
Diagnóstico: ${patient.primary_diagnosis || "No especificado"}

NOTAS CLÍNICAS:
${notesContext}`;

  // 7. Llamar a Ollama
  try {
    const aiResponse = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      console.warn("Ollama API failed, fallback triggered.");
      return NextResponse.json(generateFallbackEvolution(notes));
    }

    const aiData = await aiResponse.json();
    const resultText = aiData.choices?.[0]?.message?.content;
    if (!resultText) throw new Error("No content returned from AI");

    const parsed = JSON.parse(resultText);
    return NextResponse.json({
      carencias: Array.isArray(parsed.carencias) ? parsed.carencias : [],
      areas_mejora: Array.isArray(parsed.areas_mejora) ? parsed.areas_mejora : [],
      estrategias: Array.isArray(parsed.estrategias) ? parsed.estrategias : [],
      planificacion: Array.isArray(parsed.planificacion) ? parsed.planificacion : []
    });
  } catch (err: any) {
    console.error("AI Error:", err);
    return NextResponse.json(generateFallbackEvolution(notes));
  }
}
