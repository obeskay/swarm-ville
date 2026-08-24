/**
 * Ultra-clean AI output parser & formatter.
 * Converts raw markdown/technical blobs into concise, human-digestible highlights.
 */

export interface FormattedSummary {
  headline: string;
  verdict?: "pass" | "revise" | "in_progress";
  points: string[];
  cleanPreview: string;
}

export const formatAgentOutput = (rawText: string, agentRole?: string): FormattedSummary => {
  if (!rawText || typeof rawText !== "string") {
    return {
      headline: "En espera de actividad...",
      points: ["El agente se encuentra listo para recibir instrucciones."],
      cleanPreview: "Listo."
    };
  }

  const clean = rawText
    .replace(/^```[\w]*\n?/gm, "")
    .replace(/```$/gm, "")
    .trim();

  // Check for Socrates review verdict
  let verdict: FormattedSummary["verdict"] = undefined;
  if (/VERDICT:\s*PASS/i.test(clean)) verdict = "pass";
  else if (/VERDICT:\s*REVISE/i.test(clean)) verdict = "revise";

  // Extract bullet points or numbered lists
  const rawLines = clean.split("\n");
  const extractedBullets: string[] = [];

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/VERDICT:/i.test(trimmed)) continue;

    // Matches bullets: - item, * item, 1. item, or bold headers
    if (/^[-*•]\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed)) {
      const cleanBullet = trimmed
        .replace(/^[-*•\d+.)]\s+/, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .trim();
      if (cleanBullet.length > 5 && cleanBullet.length < 160) {
        extractedBullets.push(cleanBullet);
      }
    } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      const header = trimmed.replace(/\*\*/g, "").trim();
      if (header.length > 3 && header.length < 80) {
        extractedBullets.push(header);
      }
    }
  }

  // Fallback if no explicit bullets found: grab first 2 meaningful sentences
  if (extractedBullets.length === 0) {
    const sentences = clean
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .split(/[.\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10 && !/VERDICT/i.test(s));
    extractedBullets.push(...sentences.slice(0, 3));
  }

  const headline =
    verdict === "pass"
      ? "✅ Revisión Aprobada · Listo para Desplegar"
      : verdict === "revise"
      ? "🔄 Ajustes Solicitados por el Revisor"
      : agentRole
      ? `Trabajo completado por ${agentRole}`
      : "Progreso de la Tarea";

  return {
    headline,
    verdict,
    points: extractedBullets.slice(0, 4),
    cleanPreview: extractedBullets[0] || clean.slice(0, 120)
  };
};
