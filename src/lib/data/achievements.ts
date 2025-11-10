/**
 * Achievement & Mission Catalog
 * Uses the achievement types from src/types/achievements.ts
 */

import type { Achievement } from "@/types/achievements";
import { ALL_ACHIEVEMENTS } from "@/data/achievements";

// Re-export all achievements from the main source
export { ALL_ACHIEVEMENTS as ACHIEVEMENTS };

// Helper: Get achievement by ID
export function getAchievementById(id: string): Achievement | undefined {
  return ALL_ACHIEVEMENTS.find((a) => a.id === id);
}

// Helper: Filter by rarity
export function getAchievementsByRarity(
  rarity: "common" | "rare" | "epic" | "legendary"
): Achievement[] {
  return ALL_ACHIEVEMENTS.filter((a) => a.rarity === rarity);
}

// Helper: Get common achievements only
export function getCommonAchievements(): Achievement[] {
  return ALL_ACHIEVEMENTS.filter((a) => a.rarity === "common");
}

// Helper: Get hidden achievements
export function getHiddenAchievements(): Achievement[] {
  return ALL_ACHIEVEMENTS.filter((a) => a.hidden);
}

// ============================================
// MISSIONS (temporary - will be migrated to gameStore)
// ============================================

// This is a temporary mission structure for backward compatibility
// Future: migrate all missions to gameStore
export const DEFAULT_MISSIONS = [
  {
    id: "first_steps",
    title: "First Steps",
    description: "Move around your space using WASD or click",
    icon: "🚶",
    xpReward: 100,
    completed: false,
    progress: 0,
    maxProgress: 5,
    category: "tutorial" as const,
  },
  {
    id: "spawn_first_agent",
    title: "Create Your First Agent",
    description: "Bring your first AI agent to life",
    icon: "🤖",
    xpReward: 250,
    completed: false,
    progress: 0,
    maxProgress: 1,
    category: "tutorial" as const,
  },
  {
    id: "chat_with_agent",
    title: "Talk to Your Agent",
    description: "Have your first conversation with an AI agent",
    icon: "💬",
    xpReward: 200,
    completed: false,
    progress: 0,
    maxProgress: 1,
    category: "tutorial" as const,
  },
  {
    id: "build_team",
    title: "Build Your Team",
    description: "Create 3 different agents with different roles",
    icon: "👥",
    xpReward: 500,
    completed: false,
    progress: 0,
    maxProgress: 3,
    category: "creation" as const,
  },
  {
    id: "first_project",
    title: "Start Your First Project",
    description: "Create a real software project with your agents",
    icon: "🚀",
    xpReward: 1000,
    completed: false,
    progress: 0,
    maxProgress: 1,
    category: "creation" as const,
  },
];

export type Mission = (typeof DEFAULT_MISSIONS)[number];

// Helper: Get available missions
export function getAvailableMissions(): Mission[] {
  return DEFAULT_MISSIONS;
}

// Alias for backward compatibility
export const MISSIONS = DEFAULT_MISSIONS;
