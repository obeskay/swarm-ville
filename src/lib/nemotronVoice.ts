import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentId } from "../types";

export type VoiceIntentType =
  | "SUMMON_ALL"
  | "SUMMON_AGENT"
  | "CHAT_AGENT"
  | "PLANT_IDEA"
  | "START_GOAL"
  | "STOP_RUN"
  | "UNKNOWN";

export interface ParsedVoiceIntent {
  intent: VoiceIntentType;
  targetAgentId?: AgentId;
  targetAgentName?: string;
  cleanGoal?: string;
  rawText: string;
}

const AGENT_KEYWORDS: Array<{ keyword: string; id: AgentId; name: string }> = [
  { keyword: "atlas", id: "planner", name: "Atlas" },
  { keyword: "planner", id: "planner", name: "Atlas" },
  { keyword: "arquitecto", id: "planner", name: "Atlas" },
  { keyword: "neo", id: "builder", name: "Neo" },
  { keyword: "builder", id: "builder", name: "Neo" },
  { keyword: "constructor", id: "builder", name: "Neo" },
  { keyword: "socrates", id: "reviewer", name: "Socrates" },
  { keyword: "reviewer", id: "reviewer", name: "Socrates" },
  { keyword: "revisor", id: "reviewer", name: "Socrates" },
  { keyword: "vanguard", id: "verifier", name: "Vanguard" },
  { keyword: "verifier", id: "verifier", name: "Vanguard" },
  { keyword: "verificador", id: "verifier", name: "Vanguard" },
  { keyword: "seguridad", id: "verifier", name: "Vanguard" },
  { keyword: "alexandria", id: "archivist", name: "Alexandria" },
  { keyword: "archivist", id: "archivist", name: "Alexandria" },
  { keyword: "archivista", id: "archivist", name: "Alexandria" },
  { keyword: "memoria", id: "archivist", name: "Alexandria" }
];

/**
 * Nemotron Speech & Intent Parser:
 * Cleans disfluencies and extracts structured commands from spoken sentences.
 */
export const parseNemotronIntent = (rawText: string): ParsedVoiceIntent => {
  const clean = rawText
    .trim()
    .toLowerCase()
    .replace(/[¿?¡!.,;]/g, "");

  // 1. Stop command
  if (clean === "detener" || clean === "alto" || clean === "stop" || clean.startsWith("detener enjambre")) {
    return { intent: "STOP_RUN", rawText };
  }

  // 2. Summon All / All-hands
  if (
    clean.includes("reunir a todos") ||
    clean.includes("llama a todos") ||
    clean.includes("reunir aldea") ||
    clean.includes("todos vengan") ||
    clean.includes("all hands") ||
    clean.includes("reúne a la aldea")
  ) {
    return { intent: "SUMMON_ALL", rawText };
  }

  // 3. Plant Idea / New plot
  if (
    clean.includes("sembrar idea") ||
    clean.includes("nuevo proyecto") ||
    clean.includes("crear plot") ||
    clean.includes("sembrar plot") ||
    clean === "sembrar" ||
    clean === "nueva idea"
  ) {
    return { intent: "PLANT_IDEA", rawText };
  }

  // 4. Chat with agent or Summon specific agent
  for (const info of AGENT_KEYWORDS) {
    if (clean.includes(info.keyword)) {
      if (
        clean.includes("llama a") ||
        clean.includes("llamar a") ||
        clean.includes("ven ") ||
        clean.includes("trae a") ||
        clean.startsWith(`llama `)
      ) {
        return {
          intent: "SUMMON_AGENT",
          targetAgentId: info.id,
          targetAgentName: info.name,
          rawText
        };
      }

      if (
        clean.includes("hablar con") ||
        clean.includes("platicar con") ||
        clean.includes("chatear con") ||
        clean.includes("preguntar a")
      ) {
        return {
          intent: "CHAT_AGENT",
          targetAgentId: info.id,
          targetAgentName: info.name,
          rawText
        };
      }
    }
  }

  // 5. Goal / Objective for the swarm
  // Strip leading conversational triggers like "quiero que", "crea", "haz", "diseña"
  const cleanGoal = rawText
    .replace(/^(oye|por favor|hey|quiero que|necesito que)\s+/i, "")
    .trim();

  return {
    intent: cleanGoal.length > 3 ? "START_GOAL" : "UNKNOWN",
    cleanGoal: cleanGoal.length > 3 ? cleanGoal : undefined,
    rawText
  };
};

/** Plays a soft tactile sound cue via WebAudio */
const playAudioCue = (freq = 640, duration = 0.08) => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Silent fallback
  }
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: {
    resultIndex: number;
    results: {
      length: number;
      [index: number]: {
        isFinal: boolean;
        0: { transcript: string };
      };
    };
  }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

export const useNemotronVoice = (onFinalTranscript?: (transcript: string, intent: ParsedVoiceIntent) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const isSupported = typeof window !== "undefined" && Boolean(
    (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
    (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  );

  const stopAudioMeter = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setVolume(0);
  }, []);

  const startAudioMeter = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setVolume(Math.min(1, avg / 80));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch {
      // Meter optional
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Safe ignore
      }
    }
    stopAudioMeter();
    setIsListening(false);
    playAudioCue(480, 0.07);
  }, [stopAudioMeter]);

  const startListening = useCallback((options?: { lang?: string }) => {
    setError(null);
    if (!isSupported) {
      setError("Reconocimiento de voz no soportado en este navegador.");
      return;
    }

    try {
      const SpeechRecognitionCtor = (
        (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
        (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition
      );
      if (!SpeechRecognitionCtor) return;

      const recognition = new SpeechRecognitionCtor();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = options?.lang || (navigator.language.startsWith("es") ? "es-MX" : "en-US");

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript("");
        playAudioCue(720, 0.09);
        void startAudioMeter();
      };

      recognition.onresult = (event) => {
        let currentText = "";
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          currentText += res[0].transcript;
          if (res.isFinal) isFinal = true;
        }

        setTranscript(currentText);

        if (isFinal) {
          const parsed = parseNemotronIntent(currentText);
          onFinalTranscript?.(currentText, parsed);
        }
      };

      recognition.onerror = (event) => {
        setError(`Error de voz: ${event.error}`);
        stopListening();
      };

      recognition.onend = () => {
        setIsListening(false);
        stopAudioMeter();
      };

      recognition.start();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar micrófono");
      setIsListening(false);
      stopAudioMeter();
    }
  }, [isSupported, onFinalTranscript, startAudioMeter, stopAudioMeter, stopListening]);

  const toggleListening = useCallback((options?: { lang?: string }) => {
    if (isListening) stopListening();
    else startListening(options);
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      stopAudioMeter();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Safe cleanup
        }
      }
    };
  }, [stopAudioMeter]);

  return {
    isListening,
    transcript,
    volume,
    isSupported,
    error,
    startListening,
    stopListening,
    toggleListening
  };
};
