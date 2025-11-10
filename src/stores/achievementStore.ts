/**
 * Achievement & Progression Store
 * Real-time gamification with intelligent tracking
 */

import { create } from "zustand";
import {
  achievementAPI,
  type UserProgress,
  type LevelInfo,
  type Achievement,
  type Mission,
} from "@/lib/db/achievements";
import { ACHIEVEMENTS, MISSIONS, getAvailableMissions } from "@/lib/data/achievements";
import { toast } from "sonner";

interface AchievementNotification {
  id: string;
  type: "achievement" | "level_up" | "mission_complete" | "xp_gained";
  title: string;
  description: string;
  icon: string;
  timestamp: number;
}

interface AchievementStore {
  // State
  userId: string;
  progress: UserProgress | null;
  levelInfo: LevelInfo | null;
  loading: boolean;
  error: string | null;

  // Notifications
  notifications: AchievementNotification[];
  pendingUnlocks: string[]; // Achievement IDs waiting to be unlocked

  // Stats (for achievement requirements)
  stats: {
    totalAgents: number;
    totalWords: number;
    totalSpaces: number;
  };

  // Actions
  setUserId: (userId: string) => Promise<void>;
  loadProgress: () => Promise<void>;
  addXP: (amount: number, reason?: string) => Promise<void>;
  completeMission: (missionId: string) => Promise<void>;
  unlockAchievement: (achievementId: string) => Promise<void>;
  checkAndUnlockAchievements: () => Promise<void>;
  updateStats: (stats: Partial<AchievementStore["stats"]>) => void;
  clearNotifications: () => void;
  dismissNotification: (id: string) => void;

  // Computed getters
  getUnlockedAchievements: () => Achievement[];
  getAvailableAchievements: () => Achievement[];
  getLockedAchievements: () => Achievement[];
  getAvailableMissions: () => Mission[];
  getCompletedMissions: () => Mission[];
  getCompletionPercentage: () => number;
}

export const useAchievementStore = create<AchievementStore>((set, get) => ({
  // Initial state
  userId: "default_user", // TODO: Get from auth
  progress: null,
  levelInfo: null,
  loading: false,
  error: null,

  notifications: [],
  pendingUnlocks: [],

  stats: {
    totalAgents: 0,
    totalWords: 0,
    totalSpaces: 0,
  },

  // Actions
  setUserId: async (userId: string) => {
    set({ userId, loading: true, error: null });
    try {
      const progress = await achievementAPI.getUserProgress(userId);
      const levelInfo = achievementAPI.calculateLevelInfo(progress.xp);
      set({ progress, levelInfo, loading: false });

      // Check for any achievements that should be unlocked
      await get().checkAndUnlockAchievements();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load progress",
        loading: false,
      });
    }
  },

  loadProgress: async () => {
    const { userId } = get();
    set({ loading: true, error: null });
    try {
      const progress = await achievementAPI.getUserProgress(userId);
      const levelInfo = achievementAPI.calculateLevelInfo(progress.xp);
      set({ progress, levelInfo, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load progress",
        loading: false,
      });
    }
  },

  addXP: async (amount: number, reason?: string) => {
    const { userId, progress } = get();
    if (!progress) return;

    const oldLevel = progress.level;

    set({ loading: true });
    try {
      const newProgress = await achievementAPI.addXP(userId, amount);
      const levelInfo = achievementAPI.calculateLevelInfo(newProgress.xp);
      set({ progress: newProgress, levelInfo, loading: false });

      // Show XP notification
      const notification: AchievementNotification = {
        id: `xp_${Date.now()}`,
        type: "xp_gained",
        title: `+${amount} XP`,
        description: reason || "Experience gained!",
        icon: "✨",
        timestamp: Date.now(),
      };
      set((state) => ({ notifications: [notification, ...state.notifications] }));

      toast.success(`+${amount} XP ${reason ? `• ${reason}` : ""}`, {
        icon: "✨",
      });

      // Check for level up
      if (newProgress.level > oldLevel) {
        const levelUpNotification: AchievementNotification = {
          id: `level_${Date.now()}`,
          type: "level_up",
          title: `Level ${newProgress.level}!`,
          description: `You reached level ${newProgress.level}!`,
          icon: "🎉",
          timestamp: Date.now(),
        };
        set((state) => ({
          notifications: [levelUpNotification, ...state.notifications],
        }));

        toast.success(`Level Up! You're now level ${newProgress.level}`, {
          icon: "🎉",
          duration: 5000,
        });
      }

      // Check for newly unlockable achievements
      await get().checkAndUnlockAchievements();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to add XP",
        loading: false,
      });
      toast.error("Failed to add XP");
    }
  },

  completeMission: async (missionId: string) => {
    const { userId } = get();
    set({ loading: true });
    try {
      const newProgress = await achievementAPI.completeMission(userId, missionId);
      const levelInfo = achievementAPI.calculateLevelInfo(newProgress.xp);
      set({ progress: newProgress, levelInfo, loading: false });

      const mission = MISSIONS.find((m) => m.id === missionId);
      if (mission) {
        const notification: AchievementNotification = {
          id: `mission_${Date.now()}`,
          type: "mission_complete",
          title: "Mission Complete!",
          description: mission.name,
          icon: "🎯",
          timestamp: Date.now(),
        };
        set((state) => ({ notifications: [notification, ...state.notifications] }));

        toast.success(`Mission Complete: ${mission.name}`, {
          description: `+${mission.xp_reward} XP`,
          icon: "🎯",
          duration: 5000,
        });

        // Award XP
        await get().addXP(mission.xp_reward, mission.name);
      }

      // Check for newly unlockable achievements
      await get().checkAndUnlockAchievements();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to complete mission",
        loading: false,
      });
      toast.error("Failed to complete mission");
    }
  },

  unlockAchievement: async (achievementId: string) => {
    const { userId, progress } = get();
    if (!progress) return;

    // Don't unlock if already unlocked
    if (progress.achievements.includes(achievementId)) return;

    set({ loading: true });
    try {
      const newProgress = await achievementAPI.unlockAchievement(userId, achievementId);
      const levelInfo = achievementAPI.calculateLevelInfo(newProgress.xp);
      set({ progress: newProgress, levelInfo, loading: false });

      const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
      if (achievement) {
        const notification: AchievementNotification = {
          id: `achievement_${Date.now()}`,
          type: "achievement",
          title: "Achievement Unlocked!",
          description: achievement.name,
          icon: achievement.icon,
          timestamp: Date.now(),
        };
        set((state) => ({ notifications: [notification, ...state.notifications] }));

        toast.success(`Achievement Unlocked: ${achievement.name}`, {
          description: `${achievement.description} • +${achievement.xp_reward} XP`,
          icon: achievement.icon,
          duration: 7000,
        });

        // Award XP
        await get().addXP(achievement.xp_reward, achievement.name);
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to unlock achievement",
        loading: false,
      });
      toast.error("Failed to unlock achievement");
    }
  },

  checkAndUnlockAchievements: async () => {
    const { progress, stats } = get();
    if (!progress) return;

    const available = achievementAPI.getAvailableAchievements(
      ACHIEVEMENTS,
      progress,
      stats
    );

    // Auto-unlock all available achievements
    for (const achievement of available) {
      if (!get().pendingUnlocks.includes(achievement.id)) {
        set((state) => ({
          pendingUnlocks: [...state.pendingUnlocks, achievement.id],
        }));
        await get().unlockAchievement(achievement.id);
        set((state) => ({
          pendingUnlocks: state.pendingUnlocks.filter((id) => id !== achievement.id),
        }));
      }
    }
  },

  updateStats: (newStats: Partial<AchievementStore["stats"]>) => {
    set((state) => ({
      stats: { ...state.stats, ...newStats },
    }));

    // Trigger achievement check when stats update
    get().checkAndUnlockAchievements();
  },

  clearNotifications: () => set({ notifications: [] }),

  dismissNotification: (id: string) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  // Computed getters
  getUnlockedAchievements: () => {
    const { progress } = get();
    if (!progress) return [];
    return achievementAPI.getUnlockedAchievements(ACHIEVEMENTS, progress);
  },

  getAvailableAchievements: () => {
    const { progress, stats } = get();
    if (!progress) return [];
    return achievementAPI.getAvailableAchievements(ACHIEVEMENTS, progress, stats);
  },

  getLockedAchievements: () => {
    const { progress, stats } = get();
    if (!progress) return [];
    return achievementAPI.getLockedAchievements(ACHIEVEMENTS, progress, stats);
  },

  getAvailableMissions: () => {
    const { progress } = get();
    if (!progress) return [];
    return getAvailableMissions(progress.completed_missions);
  },

  getCompletedMissions: () => {
    const { progress } = get();
    if (!progress) return [];
    return MISSIONS.filter((m) => progress.completed_missions.includes(m.id));
  },

  getCompletionPercentage: () => {
    const { progress } = get();
    if (!progress) return 0;
    return achievementAPI.getCompletionPercentage(ACHIEVEMENTS, progress);
  },
}));
