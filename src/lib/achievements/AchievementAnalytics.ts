/**
 * Achievement Analytics
 * Tracks and analyzes achievement engagement metrics
 */

import type { Achievement } from "@/types/achievements";

export interface AchievementMetrics {
  totalAchievements: number;
  unlockedCount: number;
  unlockedPercentage: number;
  averageTimeToUnlock: number; // in minutes
  rarityDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  estimatedTimeToCompletion: number; // in hours
  engagementScore: number; // 0-100
  dailyXpEarned: number;
  weeklyXpEarned: number;
  currentStreak: number;
}

export interface UserEngagement {
  lastActivityTime: number;
  sessionsCount: number;
  totalPlayTime: number; // in minutes
  averageSessionDuration: number; // in minutes
  loginStreak: number;
  levelUpCount: number;
}

export interface AchievementSnapshot {
  achievementId: string;
  unlockedAt?: number; // Unix timestamp
  unlockedProgress: number;
  estimatedTimeToUnlock: number; // in minutes
}

export class AchievementAnalytics {
  private snapshots: Map<string, AchievementSnapshot> = new Map();
  private userEngagement: UserEngagement = {
    lastActivityTime: Date.now(),
    sessionsCount: 0,
    totalPlayTime: 0,
    averageSessionDuration: 0,
    loginStreak: 0,
    levelUpCount: 0,
  };

  /**
   * Calculate comprehensive achievement metrics
   */
  calculateMetrics(
    achievements: Achievement[],
    unlockedIds: string[],
    userXp: number,
    userLevel: number
  ): AchievementMetrics {
    const unlockedCount = unlockedIds.length;
    const totalAchievements = achievements.length;
    const unlockedPercentage = (unlockedCount / totalAchievements) * 100;

    // Calculate rarity distribution
    const rarityDistribution = this.calculateRarityDistribution(achievements, unlockedIds);

    // Calculate category distribution
    const categoryDistribution = this.calculateCategoryDistribution(achievements, unlockedIds);

    // Calculate engagement score (0-100)
    const engagementScore = this.calculateEngagementScore(unlockedPercentage, userLevel);

    // Calculate daily XP (simplified - assume user has been active)
    const dailyXpEarned = Math.floor(userXp / Math.max(1, userLevel));

    // Estimate time to completion
    const estimatedTimeToCompletion = this.estimateTimeToCompletion(
      achievements,
      unlockedCount,
      totalAchievements
    );

    return {
      totalAchievements,
      unlockedCount,
      unlockedPercentage: Math.round(unlockedPercentage),
      averageTimeToUnlock: this.calculateAverageTimeToUnlock(),
      rarityDistribution,
      categoryDistribution,
      estimatedTimeToCompletion,
      engagementScore,
      dailyXpEarned,
      weeklyXpEarned: dailyXpEarned * 7,
      currentStreak: this.userEngagement.loginStreak,
    };
  }

  /**
   * Calculate rarity distribution of unlocked achievements
   */
  private calculateRarityDistribution(
    achievements: Achievement[],
    unlockedIds: string[]
  ): Record<string, number> {
    const distribution = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };

    achievements.forEach((achievement) => {
      if (unlockedIds.includes(achievement.id)) {
        const rarity = achievement.rarity as keyof typeof distribution;
        if (rarity in distribution) {
          distribution[rarity]++;
        }
      }
    });

    return distribution;
  }

  /**
   * Calculate category distribution
   */
  private calculateCategoryDistribution(
    achievements: Achievement[],
    unlockedIds: string[]
  ): Record<string, number> {
    const distribution: Record<string, number> = {};

    achievements.forEach((achievement) => {
      const category = achievement.category;
      if (!distribution[category]) {
        distribution[category] = 0;
      }
      if (unlockedIds.includes(achievement.id)) {
        distribution[category]++;
      }
    });

    return distribution;
  }

  /**
   * Calculate engagement score based on multiple factors
   */
  private calculateEngagementScore(unlockedPercentage: number, userLevel: number): number {
    // Components of engagement score:
    // 1. Achievement completion (40%)
    // 2. User level (30%)
    // 3. Login streak (20%)
    // 4. Session frequency (10%)

    const completionScore = Math.min(unlockedPercentage / 100, 1) * 40;
    const levelScore = Math.min(userLevel / 50, 1) * 30; // Assume max level ~50
    const streakScore = Math.min(this.userEngagement.loginStreak / 30, 1) * 20;
    const sessionScore = Math.min(this.userEngagement.sessionsCount / 100, 1) * 10;

    return Math.round(completionScore + levelScore + streakScore + sessionScore);
  }

  /**
   * Calculate average time to unlock achievements
   */
  private calculateAverageTimeToUnlock(): number {
    if (this.snapshots.size === 0) return 0;

    let totalTime = 0;
    let count = 0;

    this.snapshots.forEach((snapshot) => {
      if (snapshot.unlockedAt) {
        totalTime += snapshot.estimatedTimeToUnlock;
        count++;
      }
    });

    return count > 0 ? Math.round(totalTime / count) : 0;
  }

  /**
   * Estimate time to completion for all achievements
   */
  private estimateTimeToCompletion(
    achievements: Achievement[],
    unlockedCount: number,
    totalCount: number
  ): number {
    const remainingCount = totalCount - unlockedCount;

    // Assume average 30 minutes per achievement
    // Adjust for rarity (legendary takes longer)
    const legendaryCount = achievements.filter(
      (a) => a.rarity === "legendary" && !this.snapshots.has(a.id)
    ).length;

    const averageTimePerAchievement = 30 + legendaryCount * 20;
    return (remainingCount * averageTimePerAchievement) / 60; // Convert to hours
  }

  /**
   * Record achievement unlock
   */
  recordAchievementUnlock(achievementId: string): void {
    const snapshot = this.snapshots.get(achievementId);
    if (snapshot) {
      snapshot.unlockedAt = Date.now();
    }
  }

  /**
   * Track user activity
   */
  trackActivity(): void {
    this.userEngagement.lastActivityTime = Date.now();
  }

  /**
   * Increment session count
   */
  startSession(): void {
    this.userEngagement.sessionsCount++;
  }

  /**
   * Update session duration
   */
  endSession(durationMinutes: number): void {
    this.userEngagement.totalPlayTime += durationMinutes;
    this.userEngagement.averageSessionDuration =
      this.userEngagement.totalPlayTime / this.userEngagement.sessionsCount;
  }

  /**
   * Increment login streak
   */
  incrementLoginStreak(): void {
    this.userEngagement.loginStreak++;
  }

  /**
   * Reset login streak
   */
  resetLoginStreak(): void {
    this.userEngagement.loginStreak = 0;
  }

  /**
   * Record level up
   */
  recordLevelUp(): void {
    this.userEngagement.levelUpCount++;
  }

  /**
   * Get user engagement data
   */
  getEngagementData(): UserEngagement {
    return { ...this.userEngagement };
  }

  /**
   * Get achievement snapshot
   */
  getSnapshot(achievementId: string): AchievementSnapshot | undefined {
    return this.snapshots.get(achievementId);
  }
}
