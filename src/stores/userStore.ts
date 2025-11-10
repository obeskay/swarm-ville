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
  isInitialized: boolean;

  // Actions
  setOnboardingComplete: (complete: boolean) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  setDetectedCLIs: (clis: string[]) => void;
  updateMissionProgress: (missionId: string, progress: number) => void;
  xpToNextLevel: () => number;
  addXP: (amount: number) => void;
  addBalance: (amount: number) => void;
  initializePlayerStats: () => void;
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
    progress: 0,
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
    active: false,
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
    active: false,
    icon: "💬",
    xpReward: 200,
  },
];

// Validation helper for persisted user stats
function validateUserStats(data: any): boolean {
  try {
    if (!data || typeof data !== "object") return false;

    // Check required fields
    if (typeof data.level !== "number" || data.level < 1) return false;
    if (typeof data.xp !== "number" || data.xp < 0) return false;
    if (typeof data.balance !== "number" || data.balance < 0) return false;
    if (!Array.isArray(data.missions) || data.missions.length === 0) return false;

    // Validate missions structure
    for (const mission of data.missions) {
      if (!mission.id || !mission.title || typeof mission.progress !== "number") {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      hasCompletedOnboarding: false,
      settings: defaultSettings,
      detectedCLIs: [],
      missions: defaultMissions,
      level: 1,
      xp: 0,
      balance: 50.0,
      isInitialized: false,
      initializePlayerStats: () => {
        const state = get();

        // If already initialized, skip
        if (state.isInitialized) return;

        try {
          // Check if we have persisted data
          const hasPersistedData = state.level !== 1 || state.xp !== 0 || state.balance !== 50.0;

          if (hasPersistedData) {
            // Returning user - validate persisted data
            const isValid = validateUserStats({
              level: state.level,
              xp: state.xp,
              balance: state.balance,
              missions: state.missions,
            });

            if (!isValid) {
              console.warn("Corrupted user data detected, resetting to defaults");
              set({
                level: 1,
                xp: 0,
                balance: 50.0,
                missions: defaultMissions,
                isInitialized: true,
              });
              return;
            }
          } else {
            // New user - ensure clean defaults
            set({
              level: 1,
              xp: 0,
              balance: 50.0,
              missions: defaultMissions,
            });
          }

          // Mark as initialized
          set({ isInitialized: true });
        } catch (error) {
          console.error("Error during player stats initialization:", error);
          // Fall back to defaults
          set({
            level: 1,
            xp: 0,
            balance: 50.0,
            missions: defaultMissions,
            isInitialized: true,
          });
        }
      },

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
