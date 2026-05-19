// ============================================================
// API Route: /api/parent/ai-summary
// Genera un resumen con IA del progreso del niño basándose en
// las notas clínicas registradas por los terapeutas.
// Usa OllamaCloud (gemma3:4b) con la API key del servidor.
// ============================================================
import { NextResponse } from "next/server";

const OLLAMA_URL = "https://ollama.com/api/chat";
const OLLAMA_MODEL = "gemma3:4b";

const SYSTEM_PROMPT = `Eres un psicólogo clínico experto en terapia infantil y del desarrollo. Tu rol es analizar las notas clínicas registradas por los terapeutas y generar un resumen comprensible para los padres o acudientes del paciente.

REGLAS ESTRICTAS:
- Habla siempre en primera persona del plural ("hemos observado", "notamos", "consideramos").
- NUNCA emitas un diagnóstico. Solo consolida los avances, progresos y observaciones registrados.
- Sé empático, cálido y profesional. Los padres necesitan sentirse tranquilos y comprendidos.
- Organiza la información de forma clara: resumen general, avances positivos, áreas de trabajo, y recomendaciones generales.
- Si hay puntuaciones de progreso (progress_score), menciona la tendencia (mejorando, estable, etc.).
- No inventes información que no esté en las notas. Solo analiza lo registrado.
- Responde SIEMPRE en español.
- Limita tu respuesta a un máximo de 400 palabras.
- No uses markdown, responde en texto plano con saltos de línea para separar secciones.`;

export async function POST(request: Request) {
  // 1. Verificar API key del servidor
  const ollamaKey = process.env.OLLAMA_API_KEY;
  if (!ollamaKey) {
    return NextResponse.json({ error: "Configuración de IA no disponible" }, { status: 500 });
  }

  // 2. Verificar autenticación del usuario
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

  // 3. Verificar que es padre
  const profileRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${userData.id}&select=role,first_name`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${userToken}` } }
  );
  const profiles = await profileRes.json();
  if (!profiles?.[0] || profiles[0].role !== "padre") {
    return NextResponse.json({ error: "Acceso restringido a padres" }, { status: 403 });
  }

  // 4. Obtener hijos vinculados (parent_patients)
  const linksRes = await fetch(
    `${supabaseUrl}/rest/v1/parent_patients?parent_id=eq.${userData.id}&select=patient_id`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${userToken}` } }
  );
  const links = await linksRes.json();
  if (!links || links.length === 0) {
    return NextResponse.json({
      summary: "Aún no tenemos registros clínicos vinculados a tu cuenta. Contacta al centro terapéutico para más información."
    });
  }

  const patientIds = links.map((l: any) => l.patient_id);

  // 5. Obtener datos del paciente
  const patientRes = await fetch(
    `${supabaseUrl}/rest/v1/patients?id=in.(${patientIds.join(",")}))&select=first_name,last_name,primary_diagnosis,status`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${userToken}` } }
  );
  const patients = await patientRes.json();

  // 6. Obtener las últimas 15 notas clínicas (suficientes para un análisis significativo)
  const notesRes = await fetch(
    `${supabaseUrl}/rest/v1/clinical_notes?patient_id=in.(${patientIds.join(",")})&order=created_at.desc&limit=15&select=format,subjective,objective,assessment,plan,behavior,intervention,response,data,mood,content,tasks_assigned,next_objective,progress_score,created_at`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${userToken}` } }
  );
  const notes = await notesRes.json();

  if (!notes || notes.length === 0) {
    return NextResponse.json({
      summary: "Aún no se han registrado notas clínicas para tu hijo/a. El terapeuta comenzará a documentar el progreso después de las primeras sesiones."
    });
  }

  // 7. Construir el contexto para la IA
  const patientInfo = Array.isArray(patients) && patients.length > 0
    ? patients.map((p: any) => `Paciente: ${p.first_name} ${p.last_name} | Diagnóstico: ${p.primary_diagnosis || "No especificado"} | Estado: ${p.status}`).join("\n")
    : "Información del paciente no disponible";

  const notesContext = notes.map((n: any, i: number) => {
    const date = new Date(n.created_at).toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" });
    const fields: string[] = [`Fecha: ${date}`, `Formato: ${n.format}`];

    if (n.progress_score) fields.push(`Puntuación de progreso: ${n.progress_score}/10`);
    if (n.subjective) fields.push(`Subjetivo: ${n.subjective}`);
    if (n.objective) fields.push(`Objetivo: ${n.objective}`);
    if (n.assessment) fields.push(`Evaluación: ${n.assessment}`);
    if (n.plan) fields.push(`Plan: ${n.plan}`);
    if (n.behavior) fields.push(`Conducta: ${n.behavior}`);
    if (n.intervention) fields.push(`Intervención: ${n.intervention}`);
    if (n.response) fields.push(`Respuesta: ${n.response}`);
    if (n.mood) fields.push(`Estado de ánimo: ${n.mood}`);
    if (n.content) fields.push(`Contenido: ${n.content}`);
    if (n.tasks_assigned) fields.push(`Tareas asignadas: ${n.tasks_assigned}`);
    if (n.next_objective) fields.push(`Próximo objetivo: ${n.next_objective}`);

    return `--- Nota ${i + 1} ---\n${fields.join("\n")}`;
  }).join("\n\n");

  const userMessage = `Analiza los siguientes reportes clínicos y genera un resumen para los padres del paciente.

INFORMACIÓN DEL PACIENTE:
${patientInfo}

NOTAS CLÍNICAS (de la más reciente a la más antigua):
${notesContext}

Genera un resumen empático, claro y organizado para los padres. Recuerda: no diagnostiques, solo consolida avances y observaciones.`;

  // 8. Llamar a OllamaCloud
  try {
    const aiResponse = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ollamaKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("OllamaCloud error:", aiResponse.status, errText);
      return NextResponse.json({
        error: "No se pudo generar el análisis en este momento. Intenta más tarde."
      }, { status: 502 });
    }

    const aiData = await aiResponse.json();

    // OllamaCloud responde con { message: { content: "..." } }
    const summary = aiData?.message?.content
      || aiData?.choices?.[0]?.message?.content
      || "No se pudo extraer el resumen de la IA.";

    return NextResponse.json({
      summary,
      notesAnalyzed: notes.length,
      generatedAt: new Date().toISOString(),
    });

  } catch (err: any) {
    console.error("AI fetch error:", err);
    return NextResponse.json({
      error: "Error de conexión con el servicio de IA. Intenta más tarde."
    }, { status: 502 });
  }
}
