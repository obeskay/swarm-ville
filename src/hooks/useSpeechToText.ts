import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useUserStore } from "../stores/userStore";
import { useAgentStore } from "../stores/agentStore";
import { useSpaceStore } from "../stores/spaceStore";
import { TranscriptionResult, Message } from "../lib/types";

interface UseSpeechToTextOptions {
  onTranscription?: (text: string) => void;
  onError?: (error: string) => void;
  autoSendToNearestAgent?: boolean;
}

const PROXIMITY_RADIUS = 5;
const TILE_SIZE = 32;

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const { settings } = useUserStore();
  const { addMessage, setAgentState } = useAgentStore();
  const { userPosition, agents } = useSpaceStore();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const hotkeyRef = useRef<boolean>(false);

  useEffect(() => {
    let unlistenTranscript: (() => void) | null = null;
    let unlistenError: (() => void) | null = null;

    const setupListeners = async () => {
      try {
        // Only setup listeners if in Tauri context
        if (!window.__TAURI_IPC__) {
          console.log(
            "[useSpeechToText] Running in dev mode, skipping STT setup",
          );
          return;
        }

        unlistenTranscript = await listen<TranscriptionResult>(
          "stt_transcript",
          (event) => {
            const text = event.payload.text;
            setTranscript(text);
            options.onTranscription?.(text);

            // Auto-send to nearest agent if enabled
            if (options.autoSendToNearestAgent) {
              const nearestAgent = getNearestAgent();
              if (nearestAgent) {
                sendToAgent(nearestAgent.id, text);
              }
            }
          },
        );

        unlistenError = await listen<{ error: string }>(
          "stt_error",
          (event) => {
            options.onError?.(event.payload.error);
          },
        );
      } catch (error) {
        console.error("Failed to setup STT listeners:", error);
      }
    };

    setupListeners();

    // Handle hotkey
    const handleKeyDown = (e: KeyboardEvent) => {
      const hotkey = settings.sttHotkey.toLowerCase();
      const isCtrlSpace =
        hotkey === "control+space" && e.ctrlKey && e.code === "Space";
      const isCmdSpace =
        hotkey === "command+space" && e.metaKey && e.code === "Space";

      if ((isCtrlSpace || isCmdSpace) && !isRecording) {
        e.preventDefault();
        hotkeyRef.current = true;
        startRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (hotkeyRef.current) {
        hotkeyRef.current = false;
        stopRecording();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      unlistenTranscript?.();
      unlistenError?.();
    };
  }, [settings.sttHotkey, options, isRecording]);

  const getNearestAgent = (): { id: string; distance: number } | null => {
    let nearest: { id: string; distance: number } | null = null;

    agents.forEach((agent) => {
      const dx = userPosition.x - agent.position.x;
      const dy = userPosition.y - agent.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= PROXIMITY_RADIUS) {
        if (!nearest || distance < nearest.distance) {
          nearest = { id: agent.id, distance };
        }
      }
    });

    return nearest;
  };

  const sendToAgent = (agentId: string, text: string) => {
    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      agentId,
      role: "user",
      content: text,
      timestamp: Date.now(),
      metadata: {
        stt: true,
        proximity: true,
      },
    };

    addMessage(agentId, userMessage);
    setAgentState(agentId, "thinking");
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      await invoke("start_stt", {
        model: settings.whisperModel,
      });
    } catch (error) {
      console.error("Failed to start recording:", error);
      setIsRecording(false);
      options.onError?.(
        error instanceof Error ? error.message : "Failed to start recording",
      );
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await invoke("stop_stt");
    } catch (error) {
      console.error("Failed to stop recording:", error);
      options.onError?.(
        error instanceof Error ? error.message : "Failed to stop recording",
      );
    }
  };

  return {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    getNearestAgent,
  };
}
