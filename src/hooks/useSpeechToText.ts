import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { useUserStore } from "../stores/userStore";
import { TranscriptionResult } from "../lib/types";

interface UseSpeechToTextOptions {
  onTranscription?: (text: string) => void;
  onError?: (error: string) => void;
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const { settings } = useUserStore();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const hotkeyRef = useRef<boolean>(false);

  useEffect(() => {
    let unlistenTranscript: (() => void) | null = null;
    let unlistenError: (() => void) | null = null;

    const setupListeners = async () => {
      try {
        unlistenTranscript = await listen<TranscriptionResult>(
          "stt_transcript",
          (event) => {
            const text = event.payload.text;
            setTranscript(text);
            options.onTranscription?.(text);
          }
        );

        unlistenError = await listen<{ error: string }>(
          "stt_error",
          (event) => {
            options.onError?.(event.payload.error);
          }
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

      if (isCtrlSpace || isCmdSpace) {
        e.preventDefault();
        hotkeyRef.current = true;
        startRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (hotkeyRef.current && (e.ctrlKey || e.metaKey)) {
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
  }, [settings.sttHotkey, options]);

  const startRecording = async () => {
    try {
      setIsRecording(true);
      await invoke("start_stt", {
        model: settings.whisperModel,
      });
    } catch (error) {
      console.error("Failed to start recording:", error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await invoke("stop_stt");
    } catch (error) {
      console.error("Failed to stop recording:", error);
    }
  };

  return {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
  };
}
