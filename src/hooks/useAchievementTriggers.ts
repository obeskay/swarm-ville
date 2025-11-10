/**
 * Achievement Triggers Hook
 * Simplifies tracking achievement events and awarding XP with streak bonuses
 */

import { useCallback } from "react";
import { useAchievementStore } from "@/stores/achievementStore";
import { useAchievementSystem } from "./useAchievementSystem";
import type { GameEvent } from "@/types/achievements";
import { toast } from "sonner";

interface EventXPMapping {
  [key: string]: number;
}

// XP rewards for common game events
const EVENT_XP_MAP: EventXPMapping = {
  AGENT_SPAWNED: 10,
  SPACE_CREATED: 25,
  WORD_TAUGHT: 5,
  MISSION_COMPLETED: 50,
  FEATURE_DISCOVERED: 15,
  DAILY_LOGIN: 20,
};

export function useAchievementTriggers() {
  const store = useAchievementStore();
  const { trackEvent } = useAchievementSystem();

  const trackAgentSpawn = useCallback(async () => {
    try {
      const result = await trackEvent("AGENT_SPAWNED" as GameEvent, EVENT_XP_MAP.AGENT_SPAWNED);
      if (result.success) {
        await store.checkAndUnlockAchievements();
      }
    } catch (error) {
      console.error("Failed to track agent spawn:", error);
    }
  }, [trackEvent, store]);

  const trackSpaceCreated = useCallback(async () => {
    try {
      const result = await trackEvent("SPACE_CREATED" as GameEvent, EVENT_XP_MAP.SPACE_CREATED);
      if (result.success) {
        await store.checkAndUnlockAchievements();
      }
    } catch (error) {
      console.error("Failed to track space creation:", error);
    }
  }, [trackEvent, store]);

  const trackWordTaught = useCallback(
    async (wordCount: number = 1) => {
      try {
        const xpPerWord = EVENT_XP_MAP.WORD_TAUGHT;
        const totalXp = wordCount * xpPerWord;

        const result = await trackEvent("WORD_TAUGHT" as GameEvent, totalXp, {
          wordCount,
          timestamp: Date.now(),
        });

        if (result.success) {
          await store.updateStats({ totalWords: wordCount });
          await store.checkAndUnlockAchievements();
        }
      } catch (error) {
        console.error("Failed to track word teaching:", error);
      }
    },
    [trackEvent, store]
  );

  const trackMissionComplete = useCallback(
    async (missionName: string, xpReward: number = EVENT_XP_MAP.MISSION_COMPLETED) => {
      try {
        const result = await trackEvent("MISSION_COMPLETED" as GameEvent, xpReward, {
          missionName,
          completedAt: Date.now(),
        });

        if (result.success) {
          toast.success("Mission Complete!", {
            description: `+${result.totalXp} XP${
              result.streakBonus && result.streakBonus > 1
                ? ` (${Math.round((result.streakBonus - 1) * 100)}% streak bonus)`
                : ""
            }`,
            icon: "🎯",
            duration: 5000,
          });

          await store.checkAndUnlockAchievements();
        }
      } catch (error) {
        console.error("Failed to track mission completion:", error);
        toast.error("Failed to complete mission");
      }
    },
    [trackEvent, store]
  );

  const trackFeatureDiscovery = useCallback(
    async (featureName: string) => {
      try {
        const result = await trackEvent(
          "FEATURE_DISCOVERED" as GameEvent,
          EVENT_XP_MAP.FEATURE_DISCOVERED,
          { featureName, discoveredAt: Date.now() }
        );

        if (result.success) {
          toast.success(`🔍 Discovered: ${featureName}`, {
            description: `+${result.totalXp} XP`,
            icon: "✨",
            duration: 4000,
          });

          await store.checkAndUnlockAchievements();
        }
      } catch (error) {
        console.error("Failed to track feature discovery:", error);
      }
    },
    [trackEvent, store]
  );

  const trackDailyLogin = useCallback(async () => {
    try {
      const result = await trackEvent("DAILY_LOGIN" as GameEvent, EVENT_XP_MAP.DAILY_LOGIN, {
        loginAt: Date.now(),
      });

      if (result.success && result.streakBonus) {
        const streakDays = result.streak || 1;
        const bonusPercent = Math.round((result.streakBonus - 1) * 100);

        if (streakDays > 1) {
          toast.success(`🔥 ${streakDays} Day Streak!`, {
            description: `+${result.totalXp} XP (${bonusPercent}% bonus)`,
            icon: "🎉",
            duration: 5000,
          });
        } else {
          toast.success("Daily Login Bonus", {
            description: `+${result.totalXp} XP - Come back tomorrow to build your streak!`,
            icon: "🌟",
            duration: 4000,
          });
        }

        await store.checkAndUnlockAchievements();
      }
    } catch (error) {
      console.error("Failed to track daily login:", error);
    }
  }, [trackEvent, store]);

  const giveXP = useCallback(
    async (amount: number, reason: string) => {
      try {
        // For generic XP events without streak tracking
        await store.addXP(amount, reason);
        await store.checkAndUnlockAchievements();
      } catch (error) {
        console.error("Failed to give XP:", error);
      }
    },
    [store]
  );

  const trackCustomEvent = useCallback(
    async (event: GameEvent, xpReward: number = 0, metadata?: Record<string, unknown>) => {
      try {
        const result = await trackEvent(event, xpReward, metadata);

        if (result.success && xpReward > 0) {
          if (result.streakBonus && result.streakBonus > 1) {
            toast.success(
              `+${result.totalXp} XP with ${Math.round((result.streakBonus - 1) * 100)}% bonus!`,
              {
                icon: "⚡",
                duration: 3000,
              }
            );
          }

          await store.checkAndUnlockAchievements();
        }

        return result;
      } catch (error) {
        console.error("Failed to track custom event:", error);
        return { success: false };
      }
    },
    [trackEvent, store]
  );

  return {
    // Specific event trackers
    trackAgentSpawn,
    trackSpaceCreated,
    trackWordTaught,
    trackMissionComplete,
    trackFeatureDiscovery,
    trackDailyLogin,

    // Generic XP and event tracking
    giveXP,
    trackCustomEvent,

    // For direct access to the achievement system
    // (advanced usage)
    useAchievementSystem,
  };
}
