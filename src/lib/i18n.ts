/**
 * Every visible string lives here, in two languages. A dictionary and one
 * function is all this needs; a library would be more code than the strings.
 */

type Lang = "es" | "en";

const es = {
  "status.online": "En línea",
  "status.connecting": "Conectando…",
  "status.offline": "Sin conexión",

  "command.placeholder": "¿Qué quieres que construya tu agente?",
  "command.submit": "Dejar mi agente",
  "command.queued": "Tu agente entró en la fila",
  "command.started": "Tu agente se puso a trabajar",
  "command.drag": "Arrástrame al mapa",
  "command.needIdea": "Escribe tu idea primero",
  "command.suggest.1": "Una página web para mi cafetería",
  "command.suggest.2": "Una app para dividir gastos entre amigos",
  "command.suggest.3": "Un plan de contenidos para mi negocio",

  "board.title": "Tablón",
  "board.empty": "Nadie ha dejado un agente todavía. Sé la primera persona.",
  "board.back": "Apoyar",
  "board.backed": "Apoyada",
  "board.cancel": "Quitar",
  "board.working": "Trabajando",
  "board.by": "de {name}",
  "board.you": "tú",
  "agent.of": "Agente de {name}",

  "phase.plan": "planea",
  "phase.build": "construye",
  "phase.review": "revisa",
  "phase.verify": "verifica",
  "phase.archive": "guarda",
  "role.planner": "Planificador",
  "role.builder": "Constructor",
  "role.reviewer": "Revisor",
  "role.verifier": "Verificador",
  "role.archivist": "Archivista",
  "agent.idle": "Descansando",
  "agent.working": "Trabajando",
  "agent.nothing": "Todavía no ha hecho nada en esta corrida.",
  "agent.archive": "Abrir la memoria",

  "run.working": "{name} {phase}",
  "run.done": "Listo",
  "run.failed": "Algo falló",
  "run.stopped": "Detenido",
  "run.result": "Ver resultado",
  "run.details": "Detalle",
  "run.stop": "Detener",
  "run.revised": "Corregido {n} {n, plural, one {vez} other {veces}}",
  "run.step.working": "Trabajando…",
  "run.raw": "Ver texto completo",
  "run.builtPage": "Construyó una página completa",
  "run.pass": "Aprobado",
  "run.revise": "Con ajustes",

  "result.title": "Tu agente terminó",
  "result.preview": "Vista previa",
  "result.summary": "Resumen",
  "result.publish": "Publicar enlace",
  "result.copied": "Enlace copiado",
  "result.download": "Descargar",
  "result.publishFailed": "No se pudo publicar",

  "call.join": "Hablar",
  "call.leave": "Salir",
  "call.mic": "Micrófono",
  "call.cam": "Cámara",
  "call.listener": "Sin cámara: entras como oyente",
  "call.full": "La sala está llena ({n} personas)",
  "call.people": "En línea: {n}",

  "settings.title": "Ajustes",
  "settings.name": "Tu nombre",
  "settings.color": "Tu color",
  "settings.provider": "Modelo",
  "settings.language": "Idioma",
  "settings.needs": "necesita {what}",

  "memory.title": "Memoria",
  "memory.search": "Buscar en la memoria",
  "memory.empty": "Aún no hay nada guardado.",
  "memory.emptyHint": "Cuando un agente termine, Alexandria guarda una nota aquí.",
  "memory.loading": "Leyendo…",
  "memory.none": "Nada coincide.",

  "zone.plan": "Plan",
  "zone.build": "Construir",
  "zone.review": "Revisar",
  "zone.memory": "Memoria",
  "zone.commons": "Sala común",
  "zone.lobby": "Recepción",

  "hint.move": "Camina con WASD o toca el suelo. Entra a la sala común para hablar.",
  "guest": "Invitado",
  "close": "Cerrar",

  "error.goal_too_short": "Cuéntale un poco más a tu agente",
  "error.queue_full": "La fila está llena, prueba en un rato",
  "error.too_many_jobs": "Ya tienes dos agentes esperando",
  "error.not_your_run": "Solo quien lo dejó puede detenerlo",
  "error.rate_limited": "Demasiado rápido, espera un momento",
  "error.generic": "Algo salió mal"
} as const;

export type Key = keyof typeof es;

const en: Record<Key, string> = {
  "status.online": "Online",
  "status.connecting": "Connecting…",
  "status.offline": "Offline",

  "command.placeholder": "What should your agent build?",
  "command.submit": "Leave my agent",
  "command.queued": "Your agent joined the line",
  "command.started": "Your agent got to work",
  "command.drag": "Drag me onto the map",
  "command.needIdea": "Write your idea first",
  "command.suggest.1": "A website for my coffee shop",
  "command.suggest.2": "An app to split expenses with friends",
  "command.suggest.3": "A content plan for my business",

  "board.title": "Board",
  "board.empty": "Nobody has left an agent yet. Be the first.",
  "board.back": "Back",
  "board.backed": "Backed",
  "board.cancel": "Remove",
  "board.working": "Working",
  "board.by": "by {name}",
  "board.you": "you",
  "agent.of": "{name}'s agent",

  "phase.plan": "plans",
  "phase.build": "builds",
  "phase.review": "reviews",
  "phase.verify": "verifies",
  "phase.archive": "files it away",
  "role.planner": "Planner",
  "role.builder": "Builder",
  "role.reviewer": "Reviewer",
  "role.verifier": "Verifier",
  "role.archivist": "Archivist",
  "agent.idle": "Resting",
  "agent.working": "Working",
  "agent.nothing": "Nothing yet in this run.",
  "agent.archive": "Open the memory",

  "run.working": "{name} {phase}",
  "run.done": "Done",
  "run.failed": "Something failed",
  "run.stopped": "Stopped",
  "run.result": "See result",
  "run.details": "Details",
  "run.stop": "Stop",
  "run.revised": "Revised {n} {n, plural, one {time} other {times}}",
  "run.step.working": "Working…",
  "run.raw": "Show full text",
  "run.builtPage": "Built a complete page",
  "run.pass": "Approved",
  "run.revise": "Needs changes",

  "result.title": "Your agent finished",
  "result.preview": "Preview",
  "result.summary": "Summary",
  "result.publish": "Publish link",
  "result.copied": "Link copied",
  "result.download": "Download",
  "result.publishFailed": "Could not publish",

  "call.join": "Talk",
  "call.leave": "Leave",
  "call.mic": "Microphone",
  "call.cam": "Camera",
  "call.listener": "No camera: joining as a listener",
  "call.full": "The room is full ({n} people)",
  "call.people": "Online: {n}",

  "settings.title": "Settings",
  "settings.name": "Your name",
  "settings.color": "Your color",
  "settings.provider": "Model",
  "settings.language": "Language",
  "settings.needs": "needs {what}",

  "memory.title": "Memory",
  "memory.search": "Search the memory",
  "memory.empty": "Nothing saved yet.",
  "memory.emptyHint": "When an agent finishes, Alexandria writes a note here.",
  "memory.loading": "Reading…",
  "memory.none": "Nothing matches.",

  "zone.plan": "Plan",
  "zone.build": "Build",
  "zone.review": "Review",
  "zone.memory": "Memory",
  "zone.commons": "Commons",
  "zone.lobby": "Lobby",

  "hint.move": "Walk with WASD or tap the floor. Step into the commons to talk.",
  "guest": "Guest",
  "close": "Close",

  "error.goal_too_short": "Tell your agent a little more",
  "error.queue_full": "The line is full, try again in a bit",
  "error.too_many_jobs": "You already have two agents waiting",
  "error.not_your_run": "Only whoever left it can stop it",
  "error.rate_limited": "Too fast, wait a moment",
  "error.generic": "Something went wrong"
};

const LANG_STORAGE = "swarm-ville.lang";
const dictionaries: Record<Lang, Record<Key, string>> = { es, en };

const detect = (): Lang => {
  try {
    const saved = window.localStorage.getItem(LANG_STORAGE);
    if (saved === "es" || saved === "en") return saved;
  } catch {
    // Storage can be blocked; the browser language is a fine fallback.
  }
  return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
};

let lang: Lang = detect();

export const getLang = () => lang;

/** Persists the choice; callers reload state that captured old strings. */
export const setLang = (next: Lang) => {
  lang = next;
  try {
    window.localStorage.setItem(LANG_STORAGE, next);
  } catch {
    // The choice still applies for this session.
  }
};

const plural = (template: string, n: number) =>
  template.replace(/\{n, plural, one \{([^}]*)\} other \{([^}]*)\}\}/g, (_, one: string, other: string) =>
    n === 1 ? one : other
  );

export const t = (key: Key, vars: Record<string, string | number> = {}): string => {
  let text = dictionaries[lang][key];
  if (typeof vars.n === "number") text = plural(text, vars.n);
  return text.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? ""));
};

/** A server error code is a stable string; anything unknown reads as a generic failure. */
export const errorText = (code: string) => {
  const key = `error.${code}` as Key;
  return key in es ? t(key) : t("error.generic");
};
