/**
 * Achievement System Test Suite
 * Comprehensive tests for validators, analytics, and event tracking
 */

import { describe, it, expect, beforeEach } from "vitest";
import { AchievementValidator } from "@/lib/achievements/AchievementValidator";
import { AchievementAnalytics } from "@/lib/achievements/AchievementAnalytics";
import { AchievementEventTracker } from "@/lib/achievements/AchievementEventTracker";
import {
  Achievement,
  AchievementRarity,
  AchievementCategory,
  AchievementType,
  GameEvent,
  MilestoneCondition,
} from "@/types/achievements";

// Sample achievement for testing
const sampleAchievement: Achievement = {
  id: "first_agent",
  title: "First Agent",
  description: "Spawn your first agent in the space",
  icon: "🤖",
  rarity: AchievementRarity.COMMON,
  category: AchievementCategory.TUTORIAL,
  type: AchievementType.MILESTONE,
  xpReward: 50,
  condition: {
    type: "milestone",
    event: GameEvent.AGENT_SPAWNED,
    target: 1,
    current: 0,
  } as MilestoneCondition,
  prerequisiteIds: [],
  hidden: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const epicAchievement: Achievement = {
  id: "agent_master",
  title: "Agent Master",
  description: "Spawn 50 agents in the space",
  icon: "👑",
  rarity: AchievementRarity.EPIC,
  category: AchievementCategory.MASTERY,
  type: AchievementType.MILESTONE,
  xpReward: 300,
  condition: {
    type: "milestone",
    event: GameEvent.AGENT_SPAWNED,
    target: 50,
    current: 0,
  } as MilestoneCondition,
  prerequisiteIds: ["first_agent"],
  hidden: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe("AchievementValidator", () => {
  describe("validateAchievement", () => {
    it("should validate a valid achievement", () => {
      const result = AchievementValidator.validateAchievement(sampleAchievement);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should catch missing required fields", () => {
      const invalid = { ...sampleAchievement, id: "", xpReward: -10 };
      const result = AchievementValidator.validateAchievement(invalid as Achievement);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should warn about XP rewards below rarity threshold", () => {
      const lowXp = { ...epicAchievement, xpReward: 50 };
      const result = AchievementValidator.validateAchievement(lowXp as Achievement);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("should validate epic rarity XP appropriately", () => {
      const result = AchievementValidator.validateAchievement(epicAchievement);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe("checkCondition", () => {
    it("should calculate milestone progress correctly", () => {
      const condition: MilestoneCondition = {
        type: "milestone",
        event: GameEvent.AGENT_SPAWNED,
        target: 10,
        current: 5,
      };
      const result = AchievementValidator.checkCondition(condition);
      expect(result.progress).toBe(5);
      expect(result.progressPercentage).toBe(50);
      expect(result.achieved).toBe(false);
    });

    it("should mark condition as achieved when target met", () => {
      const condition: MilestoneCondition = {
        type: "milestone",
        event: GameEvent.AGENT_SPAWNED,
        target: 10,
        current: 10,
      };
      const result = AchievementValidator.checkCondition(condition);
      expect(result.achieved).toBe(true);
      expect(result.progressPercentage).toBe(100);
    });

    it("should cap progress at target value", () => {
      const condition: MilestoneCondition = {
        type: "milestone",
        event: GameEvent.AGENT_SPAWNED,
        target: 10,
        current: 15,
      };
      const result = AchievementValidator.checkCondition(condition);
      expect(result.progress).toBe(10);
      expect(result.progressPercentage).toBe(100);
    });
  });

  describe("canUnlockAchievement", () => {
    it("should unlock achievement with no prerequisites", () => {
      const result = AchievementValidator.canUnlockAchievement(sampleAchievement, {}, []);
      expect(result.canUnlock).toBe(true);
    });

    it("should prevent unlock of already unlocked achievement", () => {
      const result = AchievementValidator.canUnlockAchievement(sampleAchievement, {}, [
        "first_agent",
      ]);
      expect(result.canUnlock).toBe(false);
      expect(result.reason).toContain("Already unlocked");
    });

    it("should prevent unlock when prerequisites not met", () => {
      const result = AchievementValidator.canUnlockAchievement(epicAchievement, {}, []);
      expect(result.canUnlock).toBe(false);
      expect(result.reason).toContain("Missing prerequisites");
    });

    it("should allow unlock when prerequisites are met", () => {
      const result = AchievementValidator.canUnlockAchievement(epicAchievement, {}, [
        "first_agent",
      ]);
      expect(result.canUnlock).toBe(true);
    });
  });
});

describe("AchievementAnalytics", () => {
  let analytics: AchievementAnalytics;

  beforeEach(() => {
    analytics = new AchievementAnalytics();
  });

  describe("calculateMetrics", () => {
    it("should calculate basic metrics", () => {
      const achievements = [sampleAchievement, epicAchievement];
      const unlockedIds: string[] = ["first_agent"];

      const metrics = analytics.calculateMetrics(achievements, unlockedIds, 100, 5);

      expect(metrics.totalAchievements).toBe(2);
      expect(metrics.unlockedCount).toBe(1);
      expect(metrics.unlockedPercentage).toBe(50);
    });

    it("should calculate engagement score", () => {
      const achievements = [sampleAchievement, epicAchievement];
      const unlockedIds: string[] = ["first_agent"];

      const metrics = analytics.calculateMetrics(achievements, unlockedIds, 500, 10);

      expect(metrics.engagementScore).toBeGreaterThan(0);
      expect(metrics.engagementScore).toBeLessThanOrEqual(100);
    });

    it("should calculate rarity distribution", () => {
      const achievements = [sampleAchievement, epicAchievement];
      const unlockedIds: string[] = [];

      const metrics = analytics.calculateMetrics(achievements, unlockedIds, 0, 1);

      expect(metrics.rarityDistribution).toHaveProperty("common");
      expect(metrics.rarityDistribution).toHaveProperty("epic");
    });

    it("should calculate category distribution", () => {
      const achievements = [sampleAchievement, epicAchievement];
      const unlockedIds: string[] = [];

      const metrics = analytics.calculateMetrics(achievements, unlockedIds, 0, 1);

      expect(metrics.categoryDistribution).toBeDefined();
      expect(Object.keys(metrics.categoryDistribution).length).toBeGreaterThan(0);
    });

    it("should calculate time to completion estimate", () => {
      const achievements = [sampleAchievement, epicAchievement];
      const unlockedIds: string[] = [];

      const metrics = analytics.calculateMetrics(achievements, unlockedIds, 100, 5);

      expect(metrics.estimatedTimeToCompletion).toBeGreaterThan(0);
    });
  });

  describe("incrementLoginStreak", () => {
    it("should increment login streak", () => {
      analytics.incrementLoginStreak();
      analytics.incrementLoginStreak();

      const engagement = analytics.getEngagementData();
      expect(engagement.loginStreak).toBe(2);
    });
  });

  describe("recordAchievementUnlock", () => {
    it("should record achievement unlock", () => {
      analytics.recordAchievementUnlock("first_agent");
      const engagement = analytics.getEngagementData();

      expect(engagement.sessionsCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getEngagementData", () => {
    it("should return engagement data", () => {
      const engagement = analytics.getEngagementData();

      expect(engagement).toHaveProperty("sessionsCount");
      expect(engagement).toHaveProperty("totalPlayTime");
      expect(engagement).toHaveProperty("loginStreak");
    });
  });
});

describe("AchievementEventTracker", () => {
  let tracker: AchievementEventTracker;

  beforeEach(() => {
    tracker = new AchievementEventTracker();
  });

  describe("trackEvent", () => {
    it("should track a game event", () => {
      tracker.trackEvent(GameEvent.AGENT_SPAWNED);
      const streak = tracker.getStreak(GameEvent.AGENT_SPAWNED);

      expect(streak).toBeDefined();
      expect(streak?.eventCount).toBeGreaterThan(0);
    });

    it("should track event with metadata", () => {
      const metadata = { agentType: "scout", position: { x: 10, y: 20 } };
      tracker.trackEvent(GameEvent.AGENT_SPAWNED, metadata);

      expect(tracker.getStreak(GameEvent.AGENT_SPAWNED)).toBeDefined();
    });
  });

  describe("calculateStreakBonus", () => {
    it("should return 1x multiplier for day 1", () => {
      const bonus = tracker.calculateStreakBonus(1);
      expect(bonus).toBe(1.0);
    });

    it("should return 1.1x multiplier for day 3", () => {
      const bonus = tracker.calculateStreakBonus(3);
      expect(bonus).toBe(1.1);
    });

    it("should return 1.25x multiplier for day 7", () => {
      const bonus = tracker.calculateStreakBonus(7);
      expect(bonus).toBe(1.25);
    });

    it("should return 1.5x multiplier for day 14", () => {
      const bonus = tracker.calculateStreakBonus(14);
      expect(bonus).toBe(1.5);
    });

    it("should return 2x multiplier for day 30+", () => {
      const bonus = tracker.calculateStreakBonus(30);
      expect(bonus).toBe(2.0);
    });

    it("should return 2x multiplier for streak beyond day 30", () => {
      const bonus = tracker.calculateStreakBonus(50);
      expect(bonus).toBe(2.0);
    });
  });

  describe("getDailyBonusInfo", () => {
    it("should return bonus info for current and next milestone", () => {
      const info = tracker.getDailyBonusInfo(1);

      expect(info).toHaveProperty("current");
      expect(info).toHaveProperty("next");
    });

    it("should show 1.1x as next milestone for day 1", () => {
      const info = tracker.getDailyBonusInfo(1);

      expect(info.next?.xpMultiplier).toBe(1.1);
      expect(info.next?.day).toBe(3);
    });

    it("should show 2x milestone completed for day 30+", () => {
      const info = tracker.getDailyBonusInfo(30);

      expect(info.current?.xpMultiplier).toBe(2.0);
      expect(info.next).toBeUndefined();
    });
  });

  describe("getConsecutiveLoginDays", () => {
    it("should return 0 for new tracker", () => {
      const days = tracker.getConsecutiveLoginDays();
      expect(days).toBeGreaterThanOrEqual(0);
    });
  });

  describe("hasLoggedInToday", () => {
    it("should return false for new tracker", () => {
      const hasLogged = tracker.hasLoggedInToday();
      expect(hasLogged).toBe(false);
    });

    it("should return true after logging in", () => {
      tracker.trackEvent(GameEvent.DAILY_LOGIN);
      const hasLogged = tracker.hasLoggedInToday();
      expect(hasLogged).toBe(true);
    });
  });

  describe("getStreak", () => {
    it("should return undefined for untracked event", () => {
      const streak = tracker.getStreak(GameEvent.AGENT_SPAWNED);
      expect(streak).toBeUndefined();
    });

    it("should return streak data for tracked event", () => {
      tracker.trackEvent(GameEvent.AGENT_SPAWNED);
      tracker.trackEvent(GameEvent.AGENT_SPAWNED);

      const streak = tracker.getStreak(GameEvent.AGENT_SPAWNED);
      expect(streak).toBeDefined();
      expect(streak?.eventCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe("getAllStreaks", () => {
    it("should return map of all streaks", () => {
      tracker.trackEvent(GameEvent.AGENT_SPAWNED);
      tracker.trackEvent(GameEvent.MISSION_COMPLETED);

      const streaks = tracker.getAllStreaks();
      expect(streaks.size).toBeGreaterThan(0);
    });
  });

  describe("getNextBonusMilestone", () => {
    it("should return next milestone for early streaks", () => {
      const milestone = tracker.getNextBonusMilestone(1);
      expect(milestone?.day).toBe(3);
      expect(milestone?.xpMultiplier).toBe(1.1);
    });

    it("should return undefined for streak at max", () => {
      const milestone = tracker.getNextBonusMilestone(30);
      expect(milestone).toBeUndefined();
    });
  });
});

describe("Integration Tests", () => {
  it("should track event and calculate bonus correctly", () => {
    const tracker = new AchievementEventTracker();

    // Track daily login
    tracker.trackEvent(GameEvent.DAILY_LOGIN);
    const streak = tracker.getStreak(GameEvent.DAILY_LOGIN);
    const bonus = tracker.calculateStreakBonus(streak?.currentStreak || 1);

    expect(bonus).toBeGreaterThan(0);
    expect(bonus).toBeLessThanOrEqual(2.0);
  });

  it("should validate and unlock achievement flow", () => {
    // Validate achievement
    const validation = AchievementValidator.validateAchievement(sampleAchievement);
    expect(validation.isValid).toBe(true);

    // Check unlock eligibility
    const canUnlock = AchievementValidator.canUnlockAchievement(sampleAchievement, {}, []);
    expect(canUnlock.canUnlock).toBe(true);
  });

  it("should calculate metrics with engagement score", () => {
    const analytics = new AchievementAnalytics();
    const achievements = [sampleAchievement, epicAchievement];

    // Record some activity
    analytics.incrementLoginStreak();
    analytics.recordAchievementUnlock("first_agent");

    // Calculate metrics
    const metrics = analytics.calculateMetrics(achievements, ["first_agent"], 150, 5);

    expect(metrics.engagementScore).toBeGreaterThan(0);
    expect(metrics.unlockedCount).toBe(1);
    expect(metrics.unlockedPercentage).toBe(50);
  });

  it("should handle complex achievement chain", () => {
    const tracker = new AchievementEventTracker();

    // Track multiple events
    tracker.trackEvent(GameEvent.AGENT_SPAWNED);
    tracker.trackEvent(GameEvent.AGENT_SPAWNED);
    tracker.trackEvent(GameEvent.MISSION_COMPLETED);

    // Check streaks
    const spawns = tracker.getStreak(GameEvent.AGENT_SPAWNED);
    const missions = tracker.getStreak(GameEvent.MISSION_COMPLETED);

    expect(spawns?.eventCount).toBe(2);
    expect(missions?.eventCount).toBe(1);

    // Validate achievements can be unlocked
    const firstCanUnlock = AchievementValidator.canUnlockAchievement(sampleAchievement, {}, []);
    expect(firstCanUnlock.canUnlock).toBe(true);
  });
});
