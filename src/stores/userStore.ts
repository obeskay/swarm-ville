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

export interface Mission {
  id: string;
  title: string;
  description: string;
  progress: number;
  total: number;
  goal: number;
  completed: boolean;
  active: boolean;
  icon: string;
  xpReward: number;
}

interface UserState {
  hasCompletedOnboarding: boolean;
  settings: UserSettings;
  detectedCLIs: string[];
  missions: Mission[];
  level: number;
  xp: number;
  balance: number;

  // Actions
  setOnboardingComplete: (complete: boolean) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  setDetectedCLIs: (clis: string[]) => void;
  updateMissionProgress: (missionId: string, progress: number) => void;
  xpToNextLevel: () => number;
  addXP: (amount: number) => void;
  addBalance: (amount: number) => void;
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

const defaultMissions: Mission[] = [
  {
    id: "first-steps",
    title: "First Steps",
    description: "Move around your space using WASD or click",
    progress: 1,
    total: 5,
    goal: 5,
    completed: false,
    active: true,
    icon: "🚶",
    xpReward: 100,
  },
  {
    id: "create-agent",
    title: "Create Your First Agent",
    description: "Bring your first AI agent to life",
    progress: 0,
    total: 1,
    goal: 1,
    completed: false,
    active: true,
    icon: "🤖",
    xpReward: 250,
  },
  {
    id: "talk-to-agent",
    title: "Talk to Your Agent",
    description: "Have your first conversation with an AI agent",
    progress: 0,
    total: 1,
    goal: 1,
    completed: false,
    active: true,
    icon: "💬",
    xpReward: 200,
  },
];

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      hasCompletedOnboarding: false,
      settings: defaultSettings,
      detectedCLIs: [],
      missions: defaultMissions,
      level: 4,
      xp: 75,
      balance: 10.0,

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

      updateMissionProgress: (missionId, progress) =>
        set((state) => ({
          missions: state.missions.map((mission) =>
            mission.id === missionId
              ? {
                  ...mission,
                  progress,
                  completed: progress >= mission.total,
                }
              : mission
          ),
        })),

      xpToNextLevel: () => {
        const { level } = get();
        return level * 100;
      },

      addXP: (amount) =>
        set((state) => {
          const newXP = state.xp + amount;
          const nextLevel = state.xpToNextLevel();
          if (newXP >= nextLevel) {
            return {
              xp: newXP - nextLevel,
              level: state.level + 1,
            };
          }
          return { xp: newXP };
        }),

      addBalance: (amount) =>
        set((state) => ({
          balance: state.balance + amount,
        })),
    }),
    {
      name: "swarmville-user-store",
    }
  )
);
