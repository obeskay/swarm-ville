import type { AgentArchetype, AgentId } from "../types";

export const AGENT_ARCHETYPES: AgentArchetype[] = [
  {
    id: "planner",
    name: "Atlas",
    role: "Architect & Planner",
    zone: "plan",
    accent: "#d9a05b",
    sheet: "char_atlas",
    tagline: "Breaks complex chaos into 5 crisp steps.",
    description: "Visionary orchestrator who structures product requirements, tracks milestones, and prevents scope creep.",
    personality: "Strategic, calm, structured, always thinking 3 steps ahead.",
    systemPrompt: "You are Atlas, the Strategic Architect of SwarmVille. You provide structured plans, clear priorities, and crisp roadmaps with zero fluff.",
    quickPrompts: [
      "¿En qué estás trabajando ahora?",
      "Dame un plan de 3 pasos para un MVP",
      "¿Cómo priorizamos las tareas de hoy?",
      "Propón una arquitectura simple y limpia"
    ]
  },
  {
    id: "builder",
    name: "Neo",
    role: "Full-Stack Builder",
    zone: "build",
    accent: "#8fbf8a",
    sheet: "char_neo",
    tagline: "Turns blueprints into working production code.",
    description: "Master craftsperson who writes robust types, responsive components, and minimal-diff implementations.",
    personality: "Pragmatic, energetic, focused on execution, loves clean abstractions.",
    systemPrompt: "You are Neo, the Master Builder of SwarmVille. You write surgical, minimal, working code and explain technical decisions concisely.",
    quickPrompts: [
      "¿Qué tecnologías recomiendas para este plot?",
      "Escribe un snippet para conectar la API",
      "¿Cómo optimizar el rendimiento del build?",
      "Construyamos el componente principal"
    ]
  },
  {
    id: "reviewer",
    name: "Socrates",
    role: "Code Reviewer & Critic",
    zone: "review",
    accent: "#d98878",
    sheet: "char_socrates",
    tagline: "Hunts bugs, edge cases, and over-engineering.",
    description: "Socratic evaluator who asks the hard questions, finds subtle race conditions, and guards code simplicity.",
    personality: "Inquisitive, sharp, constructive, anti-slop champion.",
    systemPrompt: "You are Socrates, the Code Reviewer of SwarmVille. You evaluate edge cases, question unneeded complexity, and champion minimal clean code.",
    quickPrompts: [
      "Revisa la lógica y busca posibles fallos",
      "¿Dónde hay sobre-ingeniería en este diseño?",
      "¿Qué casos extremos no estamos contemplando?",
      "Dame feedback crítico sobre esta idea"
    ]
  },
  {
    id: "verifier",
    name: "Vanguard",
    role: "Security & QA Verifier",
    zone: "review",
    accent: "#c9a2d4",
    sheet: "char_vanguard",
    tagline: "Guarantees tests pass and security holds.",
    description: "Impenetrable shield who checks input validation, test coverage, and deployment readiness.",
    personality: "Vigilant, meticulous, reliable, protective.",
    systemPrompt: "You are Vanguard, the Verifier & Guardian of SwarmVille. You ensure security, test correctness, and bulletproof reliability.",
    quickPrompts: [
      "Verifica si el sistema está listo para producción",
      "¿Qué pruebas unitarias son indispensables?",
      "Audita posibles vulnerabilidades de seguridad",
      "Comprueba el estado de salud de la aldea"
    ]
  },
  {
    id: "archivist",
    name: "Alexandria",
    role: "Memory & Knowledge Keeper",
    zone: "memory",
    accent: "#7fa8d4",
    sheet: "char_alexandria",
    tagline: "Remembers every run, lesson, and decision.",
    description: "Historian and documentation specialist who synthesizes retrospectives and maintains the village knowledge base.",
    personality: "Wise, articulate, reflective, keeper of institutional memory.",
    systemPrompt: "You are Alexandria, the Archivist of SwarmVille. You distill insights, maintain documentation, and remind the team of past lessons.",
    quickPrompts: [
      "¿Qué aprendimos del último run?",
      "Resume la historia de este proyecto",
      "Genera un changelog para este release",
      "Consulta el archivo de decisiones"
    ]
  }
];

export const getArchetype = (id: AgentId | string): AgentArchetype => {
  return AGENT_ARCHETYPES.find((a) => a.id === id) ?? AGENT_ARCHETYPES[0];
};

/**
 * Generates an instant in-character smart response for conversational dialogue.
 */
export const generateAgentResponse = (
  agent: AgentArchetype,
  userMessage: string,
  projectName?: string
): string => {
  const q = userMessage.toLowerCase().trim();
  const target = projectName ? `para «${projectName}»` : "para la aldea";

  if (q.includes("haciendo") || q.includes("trabajando") || q.includes("estado")) {
    switch (agent.id) {
      case "planner":
        return `Estoy trazando el mapa de hitos ${target}. Las prioridades están claras y el siguiente paso es conectar el backend con el UI.`;
      case "builder":
        return `Estoy ensamblando los componentes y afinando las transiciones ${target}. ¡El código fluye limpio y sin dependencias innecesarias!`;
      case "reviewer":
        return `Estoy auditando la modularidad y eliminando duplicidades ${target}. Todo se ve sólido, con diffs mínimos.`;
      case "verifier":
        return `Ejecutando verificaciones de tipos y suites de pruebas ${target}. 0 fallos detectados hasta el momento.`;
      case "archivist":
        return `Indexando los registros de ejecución y artefactos generados ${target}. La memoria histórica está sincronizada.`;
      default:
        return `Estoy enfocado en optimizar el flujo ${target}.`;
    }
  }

  if (q.includes("plan") || q.includes("mvp") || q.includes("pasos") || q.includes("roadmap")) {
    return `📋 **Plan Ágil (3 Pasos)**:\n1. **Core Loop**: Definir contrato de datos y estado mínimo.\n2. **UI Reactiva**: Montar vista con feedback táctil inmediato.\n3. **Verificación & Ship**: Probar en local y desplegar release.`;
  }

  if (q.includes("código") || q.includes("snippet") || q.includes("componente") || q.includes("tecnología")) {
    return `⚡ Para mantenerlo ligero y escalable:\n- Usa TypeScript estricto con interfaces claras.\n- Mantén el estado local antes de crear stores globales.\n- Aplica CSS container queries para total adaptabilidad.`;
  }

  if (q.includes("revisa") || q.includes("fallo") || q.includes("crítica") || q.includes("sobre-ingeniería")) {
    return `🔍 **Revisión de Calidad**:\n- ¿Necesitamos esta abstracción hoy? Si no, YAGNI.\n- Validación estricta en los límites de entrada.\n- Verificado: sin fugas de memoria ni listeners huérfanos.`;
  }

  if (q.includes("seguridad") || q.includes("producción") || q.includes("pruebas")) {
    return `🛡️ **Pre-Flight Check**:\n- TypeScript check: PASS (0 errores).\n- Sanitización de entradas activa.\n- Listo para desplegar con total confianza.`;
  }

  if (q.includes("aprendimos") || q.includes("archivo") || q.includes("historia") || q.includes("resumen")) {
    return `📜 **Registro de la Aldea**:\n- Cada iteración rápida ahorra horas de debate.\n- El código más rápido y mantenible es el que nunca tuviste que escribir.`;
  }

  return `Entendido. Como ${agent.role}, mi prioridad es asegurar que avancemos rápido y con la más alta calidad técnica. ¿Quieres que ejecute esta acción ahora mismo?`;
};
