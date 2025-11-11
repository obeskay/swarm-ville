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
  calculateLevelInfo,
} from "@/lib/db/achievements";
import {
  ACHIEVEMENTS,
  MISSIONS,
  getAvailableMissions,
  type Mission,
} from "@/lib/data/achievements";
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
  progress: {
    playerId: "default_user",
    level: 1,
    xp: 0,
    currentXp: 0,
    achievements: [],
    completedMissions: [],
    totalXpEarned: 0,
    achievementsUnlocked: 0,
    currentStreak: 0,
    longestStreak: 0,
  },
  levelInfo: {
    level: 1,
    currentXp: 0,
    nextLevelXp: 1000,
    progressPercentage: 0,
  },
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
      const stats = await achievementAPI.getPlayerStats(userId);
      const progress: UserProgress = {
        playerId: stats.player_id,
        level: stats.level,
        xp: stats.xp,
        currentXp: stats.xp % 1000,
        achievements: [],
        completedMissions: [],
        totalXpEarned: stats.total_xp_earned,
        achievementsUnlocked: stats.achievements_unlocked,
        currentStreak: stats.current_streak,
        longestStreak: stats.longest_streak,
      };
      const levelInfo = calculateLevelInfo(stats.xp);
      set({ progress, levelInfo, loading: false });

      // Check for any achievements that should be unlocked
      await get().checkAndUnlockAchievements();
    } catch (error) {
      console.error("Error setting user ID:", error);
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
      const levelInfo = calculateLevelInfo(progress.currentXp);
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
    if (!progress) {
      console.error("Cannot add XP: No progress found");
      return;
    }

    const oldLevel = progress.level;

    set({ loading: true });
    try {
      console.log(
        `[Achievement] Adding ${amount} XP for user ${userId}, reason: ${reason || "none"}`
      );
      const stats = await achievementAPI.addXp(amount, userId);

      // Update progress from returned stats
      const newProgress: UserProgress = {
        playerId: stats.player_id,
        level: stats.level,
        xp: stats.xp,
        currentXp: stats.xp,
        achievements: progress.achievements,
        completedMissions: progress.completedMissions,
        totalXpEarned: stats.total_xp_earned,
        achievementsUnlocked: stats.achievements_unlocked,
        currentStreak: stats.current_streak,
        longestStreak: stats.longest_streak,
      };
      const levelInfo = calculateLevelInfo(stats.xp);
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
      console.error("[Achievement] Failed to add XP:", {
        error,
        userId,
        amount,
        reason,
      });
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      set({
        error: errorMessage,
        loading: false,
      });
      toast.error("Failed to award XP");
    }
  },

  completeMission: async (missionId: string) => {
    const { userId, progress } = get();
    if (!progress) return;

    set({ loading: true });
    try {
      const mission = MISSIONS.find((m) => m.id === missionId);
      if (!mission) return;

      const stats = await achievementAPI.addXp(mission.xpReward, userId);
      const levelInfo = calculateLevelInfo(stats.xp);
      set({
        progress: { ...progress, xp: stats.xp, currentXp: stats.xp, level: stats.level },
        levelInfo,
        loading: false,
      });

      const notification: AchievementNotification = {
        id: `mission_${Date.now()}`,
        type: "mission_complete",
        title: "Mission Complete!",
        description: mission.title,
        icon: "🎯",
        timestamp: Date.now(),
      };
      set((state) => ({ notifications: [notification, ...state.notifications] }));

      toast.success(`Mission Complete: ${mission.title}`, {
        description: `+${mission.xpReward} XP`,
        icon: "🎯",
        duration: 5000,
      });

      // Check for newly unlockable achievements
      await get().checkAndUnlockAchievements();
    } catch (error) {
      console.error("Failed to complete mission:", error);
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
      await achievementAPI.unlockAchievement(achievementId, undefined, userId);
      const newProgress = await achievementAPI.getUserProgress(userId);
      const levelInfo = calculateLevelInfo(newProgress.currentXp);
      set({ progress: newProgress, levelInfo, loading: false });

      const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
      if (achievement) {
        const notification: AchievementNotification = {
          id: `achievement_${Date.now()}`,
          type: "achievement",
          title: "Achievement Unlocked!",
          description: achievement.id,
          icon: achievement.icon,
          timestamp: Date.now(),
        };
        set((state) => ({ notifications: [notification, ...state.notifications] }));

        toast.success(`Achievement Unlocked: ${achievement.id}`, {
          description: `${achievement.description} • +${achievement.xpReward} XP`,
          icon: achievement.icon,
          duration: 7000,
        });

        // Award XP
        await get().addXP(achievement.xpReward, achievement.id);
      }
    } catch (error) {
      console.error("Failed to unlock achievement:", error);
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

    // Get all achievements and filter for available ones
    const allAchievements = await achievementAPI.getAllAchievements();
    const playerProgress = await achievementAPI.getPlayerProgress(get().userId);
    const unlockedIds = new Set(playerProgress.map((p) => p.achievementId));
    const available = allAchievements.filter((a) => !unlockedIds.has(a.id) && !a.hidden);

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
    const { progress } = get();
    if (!progress) return [];
    return achievementAPI.getAvailableAchievements(ACHIEVEMENTS, progress);
  },

  getLockedAchievements: () => {
    const { progress } = get();
    if (!progress) return [];
    return achievementAPI.getLockedAchievements(ACHIEVEMENTS, progress);
  },

  getAvailableMissions: () => {
    return getAvailableMissions();
  },

  getCompletedMissions: () => {
    const { progress } = get();
    if (!progress) return [];
    return MISSIONS.filter((m) => progress.completedMissions.includes(m.id));
  },

  getCompletionPercentage: () => {
    const { progress } = get();
    if (!progress) return 0;
    const unlockedCount = progress.achievements.length;
    const totalCount = ACHIEVEMENTS.length;
    return (unlockedCount / totalCount) * 100;
  },
}));
