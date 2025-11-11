/**
 * Game progression and gamification store
 * Tracks XP, levels, missions, achievements
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Mission {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  completed: boolean;
  progress: number;
  maxProgress: number;
  category: "tutorial" | "creation" | "collaboration" | "advanced";
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface Conversation {
  id: string;
  agentId: string;
  text: string;
  timestamp: number;
  expiresAt: number;
}

export interface GameState {
  // Player progression
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXpEarned: number;

  // Missions
  missions: Mission[];
  completedMissions: Set<string>;

  // Achievements
  achievements: Achievement[];
  unlockedAchievements: Set<string>;

  // Tutorial state
  tutorialStep: number;
  tutorialCompleted: boolean;

  // Conversations
  activeConversations: Conversation[];

  // Actions
  addXp: (amount: number, reason?: string) => void;
  completeMission: (missionId: string) => void;
  unlockAchievement: (achievementId: string) => void;
  setTutorialStep: (step: number) => void;
  completeTutorial: () => void;
  updateMissionProgress: (missionId: string, progress: number) => void;
  addConversation: (agentId: string, text: string) => void;
  removeConversation: (id: string) => void;
  cleanupExpiredConversations: () => void;
}

const INITIAL_MISSIONS: Mission[] = [
  {
    id: "first_steps",
    title: "First Steps",
    description: "Move around your space using WASD or click",
    icon: "🚶",
    xpReward: 100,
    completed: false,
    progress: 0,
    maxProgress: 5,
    category: "tutorial",
  },
  {
    id: "spawn_first_agent",
    title: "Create Your First Agent",
    description: "Bring your first AI agent to life",
    icon: "🤖",
    xpReward: 250,
    completed: false,
    progress: 0,
    maxProgress: 1,
    category: "tutorial",
  },
  {
    id: "chat_with_agent",
    title: "Talk to Your Agent",
    description: "Have your first conversation with an AI agent",
    icon: "💬",
    xpReward: 200,
    completed: false,
    progress: 0,
    maxProgress: 1,
    category: "tutorial",
  },
  {
    id: "build_team",
    title: "Build Your Team",
    description: "Create 3 different agents with different roles",
    icon: "👥",
    xpReward: 500,
    completed: false,
    progress: 0,
    maxProgress: 3,
    category: "creation",
  },
  {
    id: "first_project",
    title: "Start Your First Project",
    description: "Create a real software project with your agents",
    icon: "🚀",
    xpReward: 1000,
    completed: false,
    progress: 0,
    maxProgress: 1,
    category: "creation",
  },
];

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "welcome",
    title: "Welcome to SwarmVille",
    description: "Started your AI journey",
    icon: "🎉",
    rarity: "common",
  },
  {
    id: "agent_master",
    title: "Agent Master",
    description: "Created 10 agents",
    icon: "🏆",
    rarity: "rare",
  },
  {
    id: "speed_demon",
    title: "Speed Demon",
    description: "Moved 1000 tiles",
    icon: "⚡",
    rarity: "common",
  },
  {
    id: "collaboration_king",
    title: "Collaboration King",
    description: "Had 5 agents work together on a project",
    icon: "👑",
    rarity: "epic",
  },
  {
    id: "code_wizard",
    title: "Code Wizard",
    description: "Generated 10,000 lines of code with agents",
    icon: "🧙",
    rarity: "legendary",
  },
];

const calculateXpForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      level: 1,
      xp: 0,
      xpToNextLevel: calculateXpForLevel(1),
      totalXpEarned: 0,
      missions: INITIAL_MISSIONS,
      completedMissions: new Set(),
      achievements: ACHIEVEMENTS,
      unlockedAchievements: new Set(),
      tutorialStep: 0,
      tutorialCompleted: false,
      activeConversations: [],

      // Add XP and handle level ups
      addXp: (amount: number, reason?: string) => {
        const state = get();
        const newXp = state.xp + amount;
        const newTotalXp = state.totalXpEarned + amount;
        let newLevel = state.level;
        let remainingXp = newXp;

        // Show XP gain notification
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("xp-gained", {
              detail: { amount, reason, total: newXp },
            })
          );
        }

        // Check for level up
        while (remainingXp >= calculateXpForLevel(newLevel)) {
          remainingXp -= calculateXpForLevel(newLevel);
          newLevel++;

          // Trigger level up celebration
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("level-up", { detail: { level: newLevel } })
            );
          }
        }

        set({
          xp: remainingXp,
          level: newLevel,
          xpToNextLevel: calculateXpForLevel(newLevel),
          totalXpEarned: newTotalXp,
        });
      },

      // Complete mission
      completeMission: (missionId: string) => {
        const state = get();
        const mission = state.missions.find((m) => m.id === missionId);

        if (!mission || state.completedMissions.has(missionId)) {
          return;
        }

        const newCompletedMissions = new Set(state.completedMissions);
        newCompletedMissions.add(missionId);

        // Award XP
        state.addXp(mission.xpReward, mission.title);

        // Trigger mission complete event
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("mission-complete", {
              detail: { mission },
            })
          );
          // Also emit as activity
          window.dispatchEvent(
            new CustomEvent("agent-activity", {
              detail: {
                agentId: 'system',
                action: 'mission_completed',
                details: `completed mission: ${mission.title}`
              }
            })
          );
        }

        set({
          missions: state.missions.map((m) =>
            m.id === missionId ? { ...m, completed: true } : m
          ),
          completedMissions: newCompletedMissions,
        });
      },

      // Update mission progress
      updateMissionProgress: (missionId: string, progress: number) => {
        const state = get();
        const mission = state.missions.find((m) => m.id === missionId);

        if (!mission || mission.completed) {
          return;
        }

        const newProgress = Math.min(progress, mission.maxProgress);

        set({
          missions: state.missions.map((m) =>
            m.id === missionId ? { ...m, progress: newProgress } : m
          ),
        });

        // Auto-complete if progress reaches max
        if (newProgress >= mission.maxProgress) {
          state.completeMission(missionId);
        }
      },

      // Unlock achievement
      unlockAchievement: (achievementId: string) => {
        const state = get();

        if (state.unlockedAchievements.has(achievementId)) {
          return;
        }

        const achievement = state.achievements.find(
          (a) => a.id === achievementId
        );
        if (!achievement) {
          return;
        }

        const newUnlockedAchievements = new Set(state.unlockedAchievements);
        newUnlockedAchievements.add(achievementId);

        // Trigger achievement unlock event
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("achievement-unlocked", {
              detail: { achievement },
            })
          );
        }

        set({
          achievements: state.achievements.map((a) =>
            a.id === achievementId ? { ...a, unlockedAt: Date.now() } : a
          ),
          unlockedAchievements: newUnlockedAchievements,
        });

        // Award XP based on rarity
        const rarityXp = {
          common: 50,
          rare: 150,
          epic: 300,
          legendary: 500,
        };
        state.addXp(
          rarityXp[achievement.rarity],
          `Achievement: ${achievement.title}`
        );
      },

      // Tutorial control
      setTutorialStep: (step: number) => {
        set({ tutorialStep: step });
      },

      completeTutorial: () => {
        const state = get();
        set({ tutorialCompleted: true });
        state.addXp(500, "Completed Tutorial");
        state.unlockAchievement("welcome");
      },

      // Add conversation
      addConversation: (agentId: string, text: string) => {
        const state = get();
        const now = Date.now();
        const conversation: Conversation = {
          id: crypto.randomUUID(),
          agentId,
          text,
          timestamp: now,
          expiresAt: now + 10000, // 10 seconds
        };

        set({
          activeConversations: [...state.activeConversations, conversation],
        });

        // Auto-cleanup after 10 seconds
        setTimeout(() => {
          state.removeConversation(conversation.id);
        }, 10000);
      },

      // Remove conversation
      removeConversation: (id: string) => {
        const state = get();
        set({
          activeConversations: state.activeConversations.filter(
            (c) => c.id !== id
          ),
        });
      },

      // Cleanup expired conversations
      cleanupExpiredConversations: () => {
        const state = get();
        const now = Date.now();
        set({
          activeConversations: state.activeConversations.filter(
            (c) => c.expiresAt > now
          ),
        });
      },
    }),
    {
      name: "swarmville-game-storage",
      partialize: (state) => ({
        level: state.level,
        xp: state.xp,
        totalXpEarned: state.totalXpEarned,
        completedMissions: Array.from(state.completedMissions),
        unlockedAchievements: Array.from(state.unlockedAchievements),
        tutorialCompleted: state.tutorialCompleted,
        tutorialStep: state.tutorialStep,
        missions: state.missions,
      }),
    }
  )
);
