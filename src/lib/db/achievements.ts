/**
 * Achievement System TypeScript Bindings
 * Connects to Rust backend via Tauri IPC
 */

import { invoke } from "@tauri-apps/api/core";
import type {
  Achievement,
  AchievementProgress,
  AchievementUnlock,
  AchievementAnalytics,
  AchievementRarity,
  AchievementCategory,
} from "../../types/achievements";

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
// ACHIEVEMENT DATABASE API
// ============================================

export class AchievementDatabaseAPI {
  /**
   * Initialize achievements in the database
   * Should be called once on app startup with all achievement definitions
   */
  async initAchievements(achievements: Achievement[]): Promise<string> {
    const request: InitAchievementsRequest = {
      achievements_json: JSON.stringify(achievements),
    };
    return await invoke<string>("init_achievements", { request });
  }

  /**
   * Get all achievements from database
   */
  async getAllAchievements(): Promise<Achievement[]> {
    const responseJson = await invoke<string>("get_all_achievements");
    return JSON.parse(responseJson);
  }

  /**
   * Get specific achievement by ID
   */
  async getAchievementById(achievementId: string): Promise<Achievement | null> {
    const responseJson = await invoke<string>("get_achievement_by_id", {
      achievementId,
    });
    return JSON.parse(responseJson);
  }

  /**
   * Get all progress records for a player
   */
  async getPlayerProgress(playerId?: string): Promise<AchievementProgress[]> {
    const responseJson = await invoke<string>("get_player_progress", {
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
    const responseJson = await invoke<string>("update_achievement_progress", {
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
    await invoke<string>("unlock_achievement", { request });
  }

  /**
   * Get player stats (level, XP, etc.)
   */
  async getPlayerStats(playerId?: string): Promise<PlayerStats> {
    const responseJson = await invoke<string>("get_player_stats", {
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
    const responseJson = await invoke<string>("add_xp", { request });
    return JSON.parse(responseJson);
  }

  /**
   * Get achievement analytics
   */
  async getAnalytics(playerId?: string): Promise<AchievementAnalytics> {
    const responseJson = await invoke<string>("get_achievement_analytics", {
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
    const responseJson = await invoke<string>("get_unlock_history", {
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
