/**
 * Achievement System TypeScript Bindings
 * Connects to Rust backend via Tauri IPC
 * Falls back to in-memory storage when Tauri is unavailable
 */

import type {
  Achievement,
  AchievementProgress,
  AchievementUnlock,
  AchievementAnalytics,
  AchievementRarity,
  AchievementCategory,
} from "../../types/achievements";

// Safely import invoke, handle case where Tauri is not available
let invoke: ((command: string, args?: any) => Promise<any>) | null = null;
let isTauriAvailable = false;

try {
  const tauriModule = require("@tauri-apps/api/core");
  invoke = tauriModule.invoke;
  isTauriAvailable = true;
} catch (e) {
  console.debug("Tauri not available, using in-memory achievement storage");
  invoke = null;
}

// Re-export types for convenience
export type {
  Achievement,
  AchievementProgress,
  AchievementUnlock,
  AchievementAnalytics,
  AchievementRarity,
  AchievementCategory,
};

// ============================================
// FALLBACK IN-MEMORY STORAGE
// ============================================

// When Tauri is not available, we use in-memory storage
const fallbackStorage = {
  achievements: new Map<string, Achievement>(),
  playerStats: new Map<string, PlayerStats>(),
  progress: new Map<string, AchievementProgress[]>(),
  unlocks: new Map<string, AchievementUnlock[]>(),
};

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

interface InitAchievementsRequest {
  achievements_json: string;
}

interface UpdateProgressRequest {
  achievement_id: string;
  progress: number;
  player_id?: string;
}

interface UnlockAchievementRequest {
  achievement_id: string;
  player_id?: string;
  context_json?: string;
}

interface AddXpRequest {
  amount: number;
  player_id?: string;
}

export interface PlayerStats {
  player_id: string;
  level: number;
  xp: number;
  total_xp_earned: number;
  achievements_unlocked: number;
  current_streak: number;
  longest_streak: number;
  last_login?: number;
  created_at: number;
  updated_at: number;
}

// ============================================
// HELPER FUNCTION FOR SAFE INVOKE
// ============================================

async function safeInvoke<T>(command: string, args?: any): Promise<T> {
  if (!invoke) {
    throw new Error(`Cannot execute Tauri command "${command}" - Tauri is not available`);
  }
  return (invoke as (command: string, args?: any) => Promise<T>)(command, args);
}

// ============================================
// ACHIEVEMENT DATABASE API
// ============================================

export class AchievementDatabaseAPI {
  /**
   * Initialize achievements in the database
   * Should be called once on app startup with all achievement definitions
   */
  async initAchievements(achievements: Achievement[]): Promise<string> {
    // If Tauri is not available, use fallback
    if (!invoke) {
      for (const achievement of achievements) {
        fallbackStorage.achievements.set(achievement.id, achievement);
      }
      return "OK";
    }

    const request: InitAchievementsRequest = {
      achievements_json: JSON.stringify(achievements),
    };
    return await safeInvoke<string>("init_achievements", { request });
  }

  /**
   * Get all achievements from database
   */
  async getAllAchievements(): Promise<Achievement[]> {
    // If Tauri is not available, use fallback
    if (!invoke) {
      return Array.from(fallbackStorage.achievements.values());
    }

    const responseJson = await safeInvoke<string>("get_all_achievements");
    return JSON.parse(responseJson);
  }

  /**
   * Get specific achievement by ID
   */
  async getAchievementById(achievementId: string): Promise<Achievement | null> {
    // If Tauri is not available, use fallback
    if (!invoke) {
      return fallbackStorage.achievements.get(achievementId) || null;
    }

    const responseJson = await safeInvoke<string>("get_achievement_by_id", {
      achievementId,
    });
    return JSON.parse(responseJson);
  }

  /**
   * Get all progress records for a player
   */
  async getPlayerProgress(playerId?: string): Promise<AchievementProgress[]> {
    // If Tauri is not available, use fallback
    if (!invoke) {
      const defaultPlayerId = playerId || "default_user";
      return fallbackStorage.progress.get(defaultPlayerId) || [];
    }

    const responseJson = await safeInvoke<string>("get_player_progress", {
      playerId,
    });
    return JSON.parse(responseJson);
  }

  /**
   * Update achievement progress
   */
  async updateProgress(
    achievementId: string,
    progress: number,
    playerId?: string
  ): Promise<AchievementProgress> {
    const request: UpdateProgressRequest = {
      achievement_id: achievementId,
      progress,
      player_id: playerId,
    };

    // If Tauri is not available, use fallback
    if (!invoke) {
      const defaultPlayerId = playerId || "default_user";
      const now = Date.now();
      const progressRecord: AchievementProgress = {
        id: `${achievementId}_${defaultPlayerId}`,
        achievementId,
        playerId: defaultPlayerId,
        progress,
        maxProgress: 100,
        unlocked: progress >= 100,
        unlockedAt: progress >= 100 ? now : undefined,
        startedAt: now,
        lastUpdatedAt: now,
      };
      let playerProgress = fallbackStorage.progress.get(defaultPlayerId) || [];
      const index = playerProgress.findIndex((p) => p.achievementId === achievementId);
      if (index >= 0) {
        playerProgress[index] = progressRecord;
      } else {
        playerProgress.push(progressRecord);
      }
      fallbackStorage.progress.set(defaultPlayerId, playerProgress);
      return progressRecord;
    }

    const responseJson = await safeInvoke<string>("update_achievement_progress", {
      request,
    });
    return JSON.parse(responseJson);
  }

  /**
   * Unlock an achievement
   */
  async unlockAchievement(
    achievementId: string,
    context?: Record<string, unknown>,
    playerId?: string
  ): Promise<void> {
    const request: UnlockAchievementRequest = {
      achievement_id: achievementId,
      player_id: playerId,
      context_json: context ? JSON.stringify(context) : undefined,
    };

    // If Tauri is not available, use fallback
    if (!invoke) {
      const defaultPlayerId = playerId || "default_user";
      const unlock: AchievementUnlock = {
        id: `${achievementId}_${defaultPlayerId}_${Date.now()}`,
        achievementId,
        playerId: defaultPlayerId,
        unlockedAt: Date.now(),
        context: context,
      };
      let unlocks = fallbackStorage.unlocks.get(defaultPlayerId) || [];
      unlocks.push(unlock);
      fallbackStorage.unlocks.set(defaultPlayerId, unlocks);
      return;
    }

    await safeInvoke<string>("unlock_achievement", { request });
  }

  /**
   * Get player stats (level, XP, etc.)
   */
  async getPlayerStats(playerId?: string): Promise<PlayerStats> {
    // If Tauri is not available, use fallback
    if (!invoke) {
      const defaultPlayerId = playerId || "default_user";
      let stats = fallbackStorage.playerStats.get(defaultPlayerId);

      if (!stats) {
        stats = {
          player_id: defaultPlayerId,
          level: 1,
          xp: 0,
          total_xp_earned: 0,
          achievements_unlocked: 0,
          current_streak: 0,
          longest_streak: 0,
          created_at: Date.now(),
          updated_at: Date.now(),
        };
        fallbackStorage.playerStats.set(defaultPlayerId, stats);
      }

      return stats;
    }

    const responseJson = await safeInvoke<string>("get_player_stats", {
      playerId,
    });
    return JSON.parse(responseJson);
  }

  /**
   * Add XP to player
   */
  async addXp(amount: number, playerId?: string): Promise<PlayerStats> {
    const request: AddXpRequest = {
      amount,
      player_id: playerId,
    };

    // If Tauri is not available, use fallback
    if (!invoke) {
      const defaultPlayerId = playerId || "default_user";
      let stats = fallbackStorage.playerStats.get(defaultPlayerId);

      if (!stats) {
        stats = {
          player_id: defaultPlayerId,
          level: 1,
          xp: 0,
          total_xp_earned: 0,
          achievements_unlocked: 0,
          current_streak: 0,
          longest_streak: 0,
          created_at: Date.now(),
          updated_at: Date.now(),
        };
      }

      stats.xp += amount;
      stats.total_xp_earned += amount;
      stats.level = Math.floor(stats.total_xp_earned / 1000) + 1;
      stats.updated_at = Date.now();

      fallbackStorage.playerStats.set(defaultPlayerId, stats);
      return stats;
    }

    const responseJson = await safeInvoke<string>("add_xp", { request });
    return JSON.parse(responseJson);
  }

  /**
   * Get achievement analytics
   */
  async getAnalytics(playerId?: string): Promise<AchievementAnalytics> {
    // If Tauri is not available, use fallback
    if (!invoke) {
      const defaultPlayerId = playerId || "default_user";
      const unlocks = fallbackStorage.unlocks.get(defaultPlayerId) || [];
      const totalCount = fallbackStorage.achievements.size;
      const unlockedCount = unlocks.length;

      const rarityDistribution: Record<AchievementRarity, number> = {
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
      };

      const categoryDistribution: Record<AchievementCategory, number> = {
        tutorial: 0,
        creation: 0,
        collaboration: 0,
        mastery: 0,
        discovery: 0,
        social: 0,
        speed: 0,
        collection: 0,
        hidden: 0,
      };

      return {
        totalAchievements: totalCount,
        unlockedAchievements: unlockedCount,
        unlockPercentage: totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0,
        rarityDistribution,
        rarityUnlockRates: { common: 0, rare: 0, epic: 0, legendary: 0 },
        categoryDistribution,
        categoryProgress: categoryDistribution,
        engagementScore: 0,
        averageTimeToUnlock: 0,
        recentUnlocks: [],
        currentStreak: 0,
        longestStreak: 0,
      };
    }

    const responseJson = await safeInvoke<string>("get_achievement_analytics", {
      playerId,
    });
    const data = JSON.parse(responseJson) as {
      totalCount: number;
      unlockedCount: number;
      unlockPercentage: number;
      rarityDistribution: Record<AchievementRarity, number>;
    };

    // Transform to match frontend type
    const rarityUnlockRates: Record<AchievementRarity, number> = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };

    const categoryDistribution: Record<AchievementCategory, number> = {
      tutorial: 0,
      creation: 0,
      collaboration: 0,
      mastery: 0,
      discovery: 0,
      social: 0,
      speed: 0,
      collection: 0,
      hidden: 0,
    };

    const categoryProgress: Record<AchievementCategory, number> = {
      tutorial: 0,
      creation: 0,
      collaboration: 0,
      mastery: 0,
      discovery: 0,
      social: 0,
      speed: 0,
      collection: 0,
      hidden: 0,
    };

    return {
      totalAchievements: data.totalCount,
      unlockedAchievements: data.unlockedCount,
      unlockPercentage: data.unlockPercentage,
      rarityDistribution: data.rarityDistribution,
      rarityUnlockRates,
      categoryDistribution,
      categoryProgress,
      engagementScore: 0,
      averageTimeToUnlock: 0,
      recentUnlocks: [],
      currentStreak: 0,
      longestStreak: 0,
    };
  }

  /**
   * Get unlock history
   */
  async getUnlockHistory(playerId?: string): Promise<AchievementUnlock[]> {
    // If Tauri is not available, use fallback
    if (!invoke) {
      const defaultPlayerId = playerId || "default_user";
      return fallbackStorage.unlocks.get(defaultPlayerId) || [];
    }

    const responseJson = await safeInvoke<string>("get_unlock_history", {
      playerId,
    });
    return JSON.parse(responseJson);
  }

  /**
   * Get user progress (combines stats and achievements)
   */
  async getUserProgress(playerId?: string): Promise<UserProgress> {
    const stats = await this.getPlayerStats(playerId);
    const unlockedAchievements = await this.getUnlockHistory(playerId);
    const progress = playerStatsToUserProgress(stats);
    progress.achievements = unlockedAchievements.map((u) => u.achievementId || "");
    return progress;
  }

  /**
   * Complete a mission (for store compatibility)
   */
  async completeMission(playerId: string): Promise<UserProgress> {
    // Award XP for mission completion
    const newStats = await this.addXp(1000, playerId); // Default 1000 XP per mission
    const progress = playerStatsToUserProgress(newStats);
    const unlockedAchievements = await this.getUnlockHistory(playerId);
    progress.achievements = unlockedAchievements.map((u) => u.achievementId || "");
    return progress;
  }

  /**
   * Get available achievements (not yet unlocked)
   */
  getAvailableAchievements(allAchievements: Achievement[], progress: UserProgress): Achievement[] {
    return allAchievements.filter((a) => !progress.achievements.includes(a.id) && !a.hidden);
  }

  /**
   * Get unlocked achievements
   */
  getUnlockedAchievements(allAchievements: Achievement[], progress: UserProgress): Achievement[] {
    return allAchievements.filter((a) => progress.achievements.includes(a.id));
  }

  /**
   * Get locked achievements
   */
  getLockedAchievements(allAchievements: Achievement[], progress: UserProgress): Achievement[] {
    return allAchievements.filter((a) => !progress.achievements.includes(a.id) && a.hidden);
  }
}

// Singleton instance
export const achievementDB = new AchievementDatabaseAPI();

// Export the class for type inference
export const achievementAPI = achievementDB;

// Extended player progress type for UI consumption
export interface UserProgress {
  playerId: string;
  level: number;
  xp: number;
  currentXp: number;
  achievements: string[];
  completedMissions: string[];
  totalXpEarned: number;
  achievementsUnlocked: number;
  currentStreak: number;
  longestStreak: number;
}

export interface LevelInfo {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  progressPercentage: number;
}

// Helper function to convert PlayerStats to UserProgress
export function playerStatsToUserProgress(stats: PlayerStats): UserProgress {
  return {
    playerId: stats.player_id,
    level: stats.level,
    xp: stats.xp,
    currentXp: stats.xp % 1000, // XP in current level
    achievements: [], // Will be populated by store
    completedMissions: [], // Will be populated by store
    totalXpEarned: stats.total_xp_earned,
    achievementsUnlocked: stats.achievements_unlocked,
    currentStreak: stats.current_streak,
    longestStreak: stats.longest_streak,
  };
}

// Helper function to calculate level info
export function calculateLevelInfo(xp: number): LevelInfo {
  const level = Math.floor(xp / 1000) + 1;
  const currentXp = xp % 1000;
  const nextLevelXp = 1000;
  const progressPercentage = (currentXp / nextLevelXp) * 100;

  return {
    level,
    currentXp,
    nextLevelXp,
    progressPercentage,
  };
}
