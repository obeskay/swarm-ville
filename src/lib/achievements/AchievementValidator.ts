/**
 * Achievement Validator
 * Validates achievement conditions and progress
 */

import type { Achievement, AchievementCondition } from "@/types/achievements";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AchievementCheckResult {
  achieved: boolean;
  progress: number;
  progressPercentage: number;
  message: string;
}

export class AchievementValidator {
  /**
   * Validate achievement structure
   */
  static validateAchievement(achievement: Achievement): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!achievement.id) errors.push("Missing achievement ID");
    if (!achievement.description) errors.push("Missing achievement description");
    if (!achievement.xpReward || achievement.xpReward < 0) {
      errors.push("Invalid XP reward: must be positive number");
    }
    if (!achievement.rarity) errors.push("Missing achievement rarity");
    if (!achievement.type) errors.push("Missing achievement type");
    if (!achievement.icon) warnings.push("Missing achievement icon");

    // Check rarity XP alignment
    const rarityXpMap = { common: 50, rare: 150, epic: 300, legendary: 500 };
    const expectedXp = rarityXpMap[achievement.rarity as keyof typeof rarityXpMap];
    if (achievement.xpReward < expectedXp * 0.75) {
      warnings.push(
        `XP reward (${achievement.xpReward}) is significantly below expected for ${achievement.rarity} rarity`
      );
    }

    // Check condition
    if (!achievement.condition) {
      errors.push("Achievement must have a condition");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if achievement condition is met
   */
  static checkCondition(condition: AchievementCondition): AchievementCheckResult {
    let progress = 0;
    let target = 1;
    let achieved = false;

    switch (condition.type) {
      case "milestone": {
        const mCond = condition as any;
        progress = mCond.current || 0;
        target = mCond.target || 1;
        achieved = progress >= target;
        break;
      }
      case "streak": {
        const sCond = condition as any;
        progress = sCond.currentStreak || 0;
        target = sCond.consecutiveDays || 1;
        achieved = progress >= target;
        break;
      }
      case "mastery": {
        const maCond = condition as any;
        achieved = maCond.currentLevel === maCond.level;
        progress = 1;
        target = 1;
        break;
      }
      case "discovery": {
        const dCond = condition as any;
        achieved = dCond.discovered || false;
        progress = achieved ? 1 : 0;
        target = 1;
        break;
      }
      case "speed": {
        const spCond = condition as any;
        achieved = spCond.completed || false;
        progress = achieved ? 1 : 0;
        target = 1;
        break;
      }
      case "collection": {
        const cCond = condition as any;
        progress = (cCond.unlocked || []).length;
        target = (cCond.required || []).length || 1;
        achieved = progress >= target;
        break;
      }
    }

    const progressPercentage = (Math.min(progress, target) / Math.max(target, 1)) * 100;

    let message = "";
    switch (condition.type) {
      case "milestone":
        message = `${progress}/${target} completed`;
        break;
      case "streak":
        message = `${progress}/${target} day streak`;
        break;
      case "mastery":
        message = `Mastery level reached`;
        break;
      case "collection":
        message = `${progress}/${target} items collected`;
        break;
      case "speed":
        message = achieved ? "Completed within time limit" : "In progress...";
        break;
      case "discovery":
        message = achieved ? "Feature discovered!" : "Not discovered";
        break;
      default:
        message = "Checking condition...";
    }

    return { achieved, progress, progressPercentage, message };
  }

  /**
   * Validate achievement unlock logic
   */
  static canUnlockAchievement(
    achievement: Achievement,
    userProgress: Record<string, unknown>,
    unlockedAchievements: string[]
  ): { canUnlock: boolean; reason?: string } {
    // Check if already unlocked
    if (unlockedAchievements.includes(achievement.id)) {
      return { canUnlock: false, reason: "Already unlocked" };
    }

    // Check prerequisites
    if (achievement.prerequisiteIds && achievement.prerequisiteIds.length > 0) {
      const notUnlocked = achievement.prerequisiteIds.filter(
        (prereq: string) => !unlockedAchievements.includes(prereq)
      );
      if (notUnlocked.length > 0) {
        return {
          canUnlock: false,
          reason: `Missing prerequisites: ${notUnlocked.join(", ")}`,
        };
      }
    }

    // For now, assume condition is met if prerequisites are satisfied
    // In a full implementation, you would check condition.current >= condition.target
    return { canUnlock: true };
  }
}
