/**
 * Achievement Triggers Hook
 * Simplifies tracking achievement events and awarding XP
 */

import { useCallback } from "react";
import { useAchievementStore } from "@/stores/achievementStore";
import { toast } from "sonner";

export function useAchievementTriggers() {
  const { addXP, updateStats } = useAchievementStore();

  const trackAgentSpawn = useCallback(async () => {
    try {
      await addXP(10, "Agent spawned");
    } catch (error) {
      console.error("Failed to track agent spawn:", error);
    }
  }, [addXP]);

  const trackSpaceCreated = useCallback(async () => {
    try {
      await addXP(25, "Space created");
    } catch (error) {
      console.error("Failed to track space creation:", error);
    }
  }, [addXP]);

  const trackWordTaught = useCallback(async (wordCount: number = 1) => {
    try {
      const xp = wordCount * 5;
      await addXP(xp, `${wordCount} word${wordCount > 1 ? "s" : ""} taught`);

      // Update stats for achievement checking
      updateStats({ totalWords: wordCount });
    } catch (error) {
      console.error("Failed to track word teaching:", error);
    }
  }, [addXP, updateStats]);

  const trackMissionComplete = useCallback(async (missionName: string, xpReward: number) => {
    try {
      await addXP(xpReward, `Mission: ${missionName}`);
      toast.success("Mission Complete!", {
        description: `+${xpReward} XP`,
        icon: "🎯",
      });
    } catch (error) {
      console.error("Failed to track mission completion:", error);
    }
  }, [addXP]);

  const trackFeatureDiscovery = useCallback(async (featureName: string) => {
    try {
      await addXP(15, `Discovered: ${featureName}`);
    } catch (error) {
      console.error("Failed to track feature discovery:", error);
    }
  }, [addXP]);

  const trackDailyLogin = useCallback(async () => {
    try {
      await addXP(20, "Daily login");
    } catch (error) {
      console.error("Failed to track daily login:", error);
    }
  }, [addXP]);

  const giveXP = useCallback(async (amount: number, reason: string) => {
    try {
      await addXP(amount, reason);
    } catch (error) {
      console.error("Failed to give XP:", error);
    }
  }, [addXP]);

  return {
    trackAgentSpawn,
    trackSpaceCreated,
    trackWordTaught,
    trackMissionComplete,
    trackFeatureDiscovery,
    trackDailyLogin,
    giveXP,
  };
}
