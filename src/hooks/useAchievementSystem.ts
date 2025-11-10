/**
 * Enhanced Achievement System Hook
 * Comprehensive hook for achievement tracking, validation, and analytics
 */

import { useEffect, useCallback, useRef } from "react";
import { useAchievementStore } from "@/stores/achievementStore";
import { AchievementValidator } from "@/lib/achievements/AchievementValidator";
import {
  AchievementAnalytics,
  type AchievementMetrics,
} from "@/lib/achievements/AchievementAnalytics";
import {
  AchievementEventTracker,
  type StreakData,
} from "@/lib/achievements/AchievementEventTracker";
import type { Achievement, GameEvent } from "@/types/achievements";
import { toast } from "sonner";

interface AchievementSystemState {
  metrics: AchievementMetrics | null;
  streaks: Map<GameEvent, StreakData>;
  recentEvents: Array<{ event: GameEvent; timestamp: number }>;
  nextMilestone: { streak: number; xpMultiplier: number; description: string } | null;
}

export function useAchievementSystem() {
  const store = useAchievementStore();
  const analyticsRef = useRef(new AchievementAnalytics());
  const trackerRef = useRef(new AchievementEventTracker());
  const stateRef = useRef<AchievementSystemState>({
    metrics: null,
    streaks: new Map(),
    recentEvents: [],
    nextMilestone: null,
  });

  // Initialize system on mount
  useEffect(() => {
    initializeSystem();
  }, []);

  const initializeSystem = useCallback(async () => {
    try {
      if (!store.progress) {
        await store.loadProgress();
      }

      // Initialize analytics with current data
      const metrics = analyticsRef.current.calculateMetrics(
        store.getUnlockedAchievements(),
        store.progress?.achievements || [],
        store.progress?.xp || 0,
        store.progress?.level || 1
      );

      stateRef.current.metrics = metrics;

      // Log initialization
      console.log("🎮 Achievement system initialized", { metrics });
    } catch (error) {
      console.error("Failed to initialize achievement system:", error);
      toast.error("Failed to initialize achievement system");
    }
  }, [store]);

  /**
   * Track a game event with full validation and analytics
   */
  const trackEvent = useCallback(
    async (event: GameEvent, xpReward: number = 0, metadata?: Record<string, unknown>) => {
      try {
        // Track in event system
        trackerRef.current.trackEvent(event, metadata);

        // Update analytics
        analyticsRef.current.trackActivity();

        // Apply streak bonus
        const streak = trackerRef.current.getStreak(event);
        const streakBonus = trackerRef.current.calculateStreakBonus(streak?.currentStreak || 0);
        const totalXp = Math.floor(xpReward * streakBonus);

        // Award XP if applicable
        if (totalXp > 0) {
          await store.addXP(totalXp, `Event: ${event}`);

          // Show streak bonus notification if significant
          if (streakBonus > 1) {
            toast.success(`🔥 +${Math.round((streakBonus - 1) * 100)}% streak bonus!`, {
              description: `${streak?.currentStreak} day streak`,
              icon: "⚡",
            });
          }
        }

        // Check for newly unlockable achievements
        await store.checkAndUnlockAchievements();

        // Update metrics
        updateMetrics();

        return {
          success: true,
          totalXp,
          streakBonus,
          streak: streak?.currentStreak,
        };
      } catch (error) {
        console.error("Failed to track event:", error);
        toast.error("Failed to track event");
        return { success: false };
      }
    },
    [store]
  );

  /**
   * Track achievement unlock with full validation
   */
  const trackAchievementUnlock = useCallback(
    async (achievement: Achievement) => {
      try {
        // Validate achievement can be unlocked
        const validation = AchievementValidator.validateAchievement(achievement);
        if (!validation.isValid) {
          console.warn("Achievement validation failed:", validation.errors);
          return { success: false, errors: validation.errors };
        }

        // Unlock achievement
        await store.unlockAchievement(achievement.id);
        analyticsRef.current.recordAchievementUnlock(achievement.id);

        // Show celebration notification
        toast.success(`🏆 Achievement Unlocked: ${achievement.id}`, {
          description: `+${achievement.xpReward} XP • ${achievement.rarity}`,
          icon: achievement.icon,
          duration: 5000,
        });

        // Update metrics
        updateMetrics();

        return { success: true };
      } catch (error) {
        console.error("Failed to unlock achievement:", error);
        return { success: false, error };
      }
    },
    [store]
  );

  /**
   * Track daily login and update streaks
   */
  const trackDailyLogin = useCallback(async () => {
    try {
      const hasLoggedInToday = trackerRef.current.hasLoggedInToday();

      if (!hasLoggedInToday) {
        trackerRef.current.trackEvent("DAILY_LOGIN" as GameEvent);
        analyticsRef.current.incrementLoginStreak();

        const loginStreak = trackerRef.current.getConsecutiveLoginDays();
        const bonusInfo = trackerRef.current.getDailyBonusInfo(loginStreak);

        // Award daily login bonus
        const baseXp = 20;
        const streakBonus = trackerRef.current.calculateStreakBonus(loginStreak);
        const totalXp = Math.floor(baseXp * streakBonus);

        await store.addXP(totalXp, "Daily login bonus");

        // Show bonus milestone if reached
        if (bonusInfo.current) {
          toast.success(`🎁 Daily Bonus: ${bonusInfo.current.description}`, {
            description: `${loginStreak} day streak • +${totalXp} XP (x${streakBonus.toFixed(1)})`,
            icon: "🔥",
            duration: 5000,
          });
        }

        // Show next milestone progress
        if (bonusInfo.next) {
          const daysUntil = bonusInfo.next.day - loginStreak;
          console.log(
            `📈 Next milestone in ${daysUntil} days: ${bonusInfo.next.description} (x${bonusInfo.next.xpMultiplier})`
          );
        }

        updateMetrics();
      }
    } catch (error) {
      console.error("Failed to track daily login:", error);
    }
  }, [store]);

  /**
   * Get comprehensive achievement metrics
   */
  const getMetrics = useCallback((): AchievementMetrics | null => {
    return stateRef.current.metrics;
  }, []);

  /**
   * Get current streaks
   */
  const getStreaks = useCallback(() => {
    return trackerRef.current.getAllStreaks();
  }, []);

  /**
   * Get next bonus milestone
   */
  const getNextMilestone = useCallback(() => {
    const loginStreak = trackerRef.current.getConsecutiveLoginDays();
    const next = trackerRef.current.getNextBonusMilestone(loginStreak);
    if (next) {
      return {
        streak: next.day,
        xpMultiplier: next.xpMultiplier,
        description: next.description,
        daysUntil: next.day - loginStreak,
      };
    }
    return null;
  }, []);

  /**
   * Update all metrics
   */
  const updateMetrics = useCallback(() => {
    try {
      const metrics = analyticsRef.current.calculateMetrics(
        store.getUnlockedAchievements(),
        store.progress?.achievements || [],
        store.progress?.xp || 0,
        store.progress?.level || 1
      );

      stateRef.current.metrics = metrics;
      stateRef.current.streaks = trackerRef.current.getAllStreaks();
      stateRef.current.nextMilestone = getNextMilestone();
    } catch (error) {
      console.error("Failed to update metrics:", error);
    }
  }, [store, getNextMilestone]);

  /**
   * Get achievement validation result
   */
  const validateAchievement = useCallback((achievement: Achievement) => {
    return AchievementValidator.validateAchievement(achievement);
  }, []);

  /**
   * Check if achievement can be unlocked
   */
  const canUnlockAchievement = useCallback(
    (achievement: Achievement) => {
      const progressRecord: Record<string, unknown> = {};
      return AchievementValidator.canUnlockAchievement(
        achievement,
        progressRecord,
        store.progress?.achievements || []
      );
    },
    [store.progress]
  );

  return {
    // Actions
    trackEvent,
    trackAchievementUnlock,
    trackDailyLogin,
    updateMetrics,
    validateAchievement,
    canUnlockAchievement,

    // Getters
    getMetrics,
    getStreaks,
    getNextMilestone,

    // State
    state: stateRef.current,

    // Direct access to systems
    analytics: analyticsRef.current,
    tracker: trackerRef.current,
  };
}
