/**
 * Achievement & Progression System TypeScript Bindings
 * Next-level gamification with real-time updates
 */

import { invoke } from "@tauri-apps/api/core";

// ============================================
// TYPES
// ============================================

export interface UserProgress {
  user_id: string;
  xp: number;
  level: number;
  completed_missions: string[];
  achievements: string[];
  last_active: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  xp_reward: number;
  category: "social" | "creation" | "exploration" | "learning" | "mastery";
  requirements: AchievementRequirement[];
}

export interface AchievementRequirement {
  type: "xp" | "level" | "missions" | "agents" | "words" | "spaces";
  value: number;
  description: string;
}

export interface Mission {
  id: string;
  name: string;
  description: string;
  xp_reward: number;
  difficulty: "easy" | "medium" | "hard" | "expert";
  category: "tutorial" | "daily" | "weekly" | "special";
  steps: MissionStep[];
  prerequisites: string[]; // Mission IDs that must be completed first
}

export interface MissionStep {
  id: string;
  description: string;
  completed: boolean;
}

export interface LevelInfo {
  level: number;
  current_xp: number;
  xp_for_current_level: number;
  xp_for_next_level: number;
  progress_percentage: number;
}

// ============================================
// ACHIEVEMENT API
// ============================================

export class AchievementAPI {
  /**
   * Get user progress (auto-creates if doesn't exist)
   */
  async getUserProgress(userId: string): Promise<UserProgress> {
    return await invoke<UserProgress>("get_user_progress", { userId });
  }

  /**
   * Update user progress manually
   */
  async updateUserProgress(progress: UserProgress): Promise<void> {
    await invoke("update_user_progress", { progress });
  }

  /**
   * Add XP to user (auto-levels up at 1000 XP per level)
   */
  async addXP(userId: string, xpAmount: number): Promise<UserProgress> {
    return await invoke<UserProgress>("add_xp", { userId, xpAmount });
  }

  /**
   * Complete a mission
   */
  async completeMission(userId: string, missionId: string): Promise<UserProgress> {
    return await invoke<UserProgress>("complete_mission", { userId, missionId });
  }

  /**
   * Unlock an achievement
   */
  async unlockAchievement(userId: string, achievementId: string): Promise<UserProgress> {
    return await invoke<UserProgress>("unlock_achievement", { userId, achievementId });
  }

  /**
   * Calculate level info from XP
   */
  calculateLevelInfo(xp: number): LevelInfo {
    const level = Math.floor(xp / 1000) + 1;
    const xp_for_current_level = (level - 1) * 1000;
    const xp_for_next_level = level * 1000;
    const current_xp = xp - xp_for_current_level;
    const progress_percentage = (current_xp / 1000) * 100;

    return {
      level,
      current_xp,
      xp_for_current_level,
      xp_for_next_level,
      progress_percentage,
    };
  }

  /**
   * Check if achievement requirements are met
   */
  checkAchievementRequirements(
    achievement: Achievement,
    progress: UserProgress,
    stats: {
      totalAgents?: number;
      totalWords?: number;
      totalSpaces?: number;
    }
  ): boolean {
    return achievement.requirements.every((req) => {
      switch (req.type) {
        case "xp":
          return progress.xp >= req.value;
        case "level":
          return progress.level >= req.value;
        case "missions":
          return progress.completed_missions.length >= req.value;
        case "agents":
          return (stats.totalAgents || 0) >= req.value;
        case "words":
          return (stats.totalWords || 0) >= req.value;
        case "spaces":
          return (stats.totalSpaces || 0) >= req.value;
        default:
          return false;
      }
    });
  }

  /**
   * Get XP reward for rarity
   */
  getXPForRarity(rarity: Achievement["rarity"]): number {
    const rewards = {
      common: 100,
      rare: 250,
      epic: 500,
      legendary: 1000,
    };
    return rewards[rarity];
  }

  /**
   * Get available (unlockable but not yet unlocked) achievements
   */
  getAvailableAchievements(
    allAchievements: Achievement[],
    progress: UserProgress,
    stats: {
      totalAgents?: number;
      totalWords?: number;
      totalSpaces?: number;
    }
  ): Achievement[] {
    return allAchievements.filter(
      (achievement) =>
        !progress.achievements.includes(achievement.id) &&
        this.checkAchievementRequirements(achievement, progress, stats)
    );
  }

  /**
   * Get locked (not yet unlockable) achievements
   */
  getLockedAchievements(
    allAchievements: Achievement[],
    progress: UserProgress,
    stats: {
      totalAgents?: number;
      totalWords?: number;
      totalSpaces?: number;
    }
  ): Achievement[] {
    return allAchievements.filter(
      (achievement) =>
        !progress.achievements.includes(achievement.id) &&
        !this.checkAchievementRequirements(achievement, progress, stats)
    );
  }

  /**
   * Get unlocked achievements
   */
  getUnlockedAchievements(
    allAchievements: Achievement[],
    progress: UserProgress
  ): Achievement[] {
    return allAchievements.filter((achievement) =>
      progress.achievements.includes(achievement.id)
    );
  }

  /**
   * Calculate achievement completion percentage
   */
  getCompletionPercentage(allAchievements: Achievement[], progress: UserProgress): number {
    if (allAchievements.length === 0) return 0;
    return (progress.achievements.length / allAchievements.length) * 100;
  }
}

// Singleton instance
export const achievementAPI = new AchievementAPI();
