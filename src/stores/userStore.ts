import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserSettings {
  theme: "light" | "dark" | "system";
  sttHotkey: string;
  sttMode: "push-to-talk" | "vad";
  whisperModel: "turbo" | "small" | "medium" | "large";
  microphoneDevice?: string;
  snapToGrid: boolean;
  showProximityCircles: boolean;
  showGrid: boolean;
}

interface UserState {
  hasCompletedOnboarding: boolean;
  settings: UserSettings;
  detectedCLIs: string[];

  // Actions
  setOnboardingComplete: (complete: boolean) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  setDetectedCLIs: (clis: string[]) => void;
}

const defaultSettings: UserSettings = {
  theme: "system",
  sttHotkey: "Control+Space",
  sttMode: "push-to-talk",
  whisperModel: "small",
  snapToGrid: true,
  showProximityCircles: true,
  showGrid: true,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      settings: defaultSettings,
      detectedCLIs: [],

      setOnboardingComplete: (complete) =>
        set({
          hasCompletedOnboarding: complete,
        }),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      setDetectedCLIs: (clis) =>
        set({
          detectedCLIs: clis,
        }),
    }),
    {
      name: "swarmville-user-store",
    }
  )
);
