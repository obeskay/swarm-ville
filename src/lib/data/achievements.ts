/**
 * Achievement & Mission Catalog
 * Comprehensive gamification system
 */

import type { Achievement, Mission } from "@/lib/db/achievements";

// ============================================
// ACHIEVEMENTS
// ============================================

export const ACHIEVEMENTS: Achievement[] = [
  // ========== SOCIAL ACHIEVEMENTS ==========
  {
    id: "first_agent",
    name: "First Steps",
    description: "Spawn your very first agent",
    icon: "👶",
    rarity: "common",
    xp_reward: 100,
    category: "social",
    requirements: [
      { type: "agents", value: 1, description: "Create 1 agent" },
    ],
  },
  {
    id: "agent_collector",
    name: "Agent Collector",
    description: "Manage a team of 5 agents",
    icon: "👥",
    rarity: "rare",
    xp_reward: 250,
    category: "social",
    requirements: [
      { type: "agents", value: 5, description: "Create 5 agents" },
    ],
  },
  {
    id: "swarm_master",
    name: "Swarm Master",
    description: "Command a swarm of 25 agents",
    icon: "🐝",
    rarity: "epic",
    xp_reward: 500,
    category: "social",
    requirements: [
      { type: "agents", value: 25, description: "Create 25 agents" },
    ],
  },
  {
    id: "legion_commander",
    name: "Legion Commander",
    description: "Lead an army of 100 agents",
    icon: "⚔️",
    rarity: "legendary",
    xp_reward: 1000,
    category: "social",
    requirements: [
      { type: "agents", value: 100, description: "Create 100 agents" },
    ],
  },

  // ========== CREATION ACHIEVEMENTS ==========
  {
    id: "first_space",
    name: "World Builder",
    description: "Create your first space",
    icon: "🌍",
    rarity: "common",
    xp_reward: 100,
    category: "creation",
    requirements: [
      { type: "spaces", value: 1, description: "Create 1 space" },
    ],
  },
  {
    id: "space_architect",
    name: "Space Architect",
    description: "Design 10 unique spaces",
    icon: "🏛️",
    rarity: "rare",
    xp_reward: 250,
    category: "creation",
    requirements: [
      { type: "spaces", value: 10, description: "Create 10 spaces" },
    ],
  },
  {
    id: "universe_creator",
    name: "Universe Creator",
    description: "Build 50 interconnected spaces",
    icon: "🌌",
    rarity: "epic",
    xp_reward: 500,
    category: "creation",
    requirements: [
      { type: "spaces", value: 50, description: "Create 50 spaces" },
    ],
  },

  // ========== LEARNING ACHIEVEMENTS ==========
  {
    id: "first_word",
    name: "Language Pioneer",
    description: "Teach your first word",
    icon: "📖",
    rarity: "common",
    xp_reward: 100,
    category: "learning",
    requirements: [
      { type: "words", value: 1, description: "Teach 1 word" },
    ],
  },
  {
    id: "vocabulary_builder",
    name: "Vocabulary Builder",
    description: "Teach 50 words",
    icon: "📚",
    rarity: "rare",
    xp_reward: 250,
    category: "learning",
    requirements: [
      { type: "words", value: 50, description: "Teach 50 words" },
    ],
  },
  {
    id: "language_master",
    name: "Language Master",
    description: "Teach 200 words",
    icon: "🎓",
    rarity: "epic",
    xp_reward: 500,
    category: "learning",
    requirements: [
      { type: "words", value: 200, description: "Teach 200 words" },
    ],
  },
  {
    id: "lexicon_legend",
    name: "Lexicon Legend",
    description: "Teach 1000 words",
    icon: "🧠",
    rarity: "legendary",
    xp_reward: 1000,
    category: "learning",
    requirements: [
      { type: "words", value: 1000, description: "Teach 1000 words" },
    ],
  },

  // ========== MASTERY ACHIEVEMENTS ==========
  {
    id: "level_5",
    name: "Novice",
    description: "Reach level 5",
    icon: "⭐",
    rarity: "common",
    xp_reward: 100,
    category: "mastery",
    requirements: [
      { type: "level", value: 5, description: "Reach level 5" },
    ],
  },
  {
    id: "level_10",
    name: "Apprentice",
    description: "Reach level 10",
    icon: "⭐⭐",
    rarity: "rare",
    xp_reward: 250,
    category: "mastery",
    requirements: [
      { type: "level", value: 10, description: "Reach level 10" },
    ],
  },
  {
    id: "level_25",
    name: "Expert",
    description: "Reach level 25",
    icon: "⭐⭐⭐",
    rarity: "epic",
    xp_reward: 500,
    category: "mastery",
    requirements: [
      { type: "level", value: 25, description: "Reach level 25" },
    ],
  },
  {
    id: "level_50",
    name: "Master",
    description: "Reach level 50",
    icon: "💎",
    rarity: "legendary",
    xp_reward: 1000,
    category: "mastery",
    requirements: [
      { type: "level", value: 50, description: "Reach level 50" },
    ],
  },

  // ========== EXPLORATION ACHIEVEMENTS ==========
  {
    id: "mission_starter",
    name: "Mission Starter",
    description: "Complete 5 missions",
    icon: "🎯",
    rarity: "common",
    xp_reward: 100,
    category: "exploration",
    requirements: [
      { type: "missions", value: 5, description: "Complete 5 missions" },
    ],
  },
  {
    id: "quest_seeker",
    name: "Quest Seeker",
    description: "Complete 25 missions",
    icon: "🗺️",
    rarity: "rare",
    xp_reward: 250,
    category: "exploration",
    requirements: [
      { type: "missions", value: 25, description: "Complete 25 missions" },
    ],
  },
  {
    id: "mission_master",
    name: "Mission Master",
    description: "Complete 100 missions",
    icon: "🏆",
    rarity: "epic",
    xp_reward: 500,
    category: "exploration",
    requirements: [
      { type: "missions", value: 100, description: "Complete 100 missions" },
    ],
  },
];

// ============================================
// MISSIONS
// ============================================

export const MISSIONS: Mission[] = [
  // ========== TUTORIAL MISSIONS ==========
  {
    id: "tutorial_welcome",
    name: "Welcome to SwarmVille",
    description: "Get started with your first agent and space",
    xp_reward: 200,
    difficulty: "easy",
    category: "tutorial",
    prerequisites: [],
    steps: [
      { id: "create_space", description: "Create your first space", completed: false },
      { id: "spawn_agent", description: "Spawn your first agent", completed: false },
      { id: "move_agent", description: "Move your agent around", completed: false },
    ],
  },
  {
    id: "tutorial_language",
    name: "Teaching Language",
    description: "Learn how to teach words to your agents",
    xp_reward: 150,
    difficulty: "easy",
    category: "tutorial",
    prerequisites: ["tutorial_welcome"],
    steps: [
      { id: "open_language_panel", description: "Open the language panel", completed: false },
      { id: "teach_first_word", description: "Teach your first word", completed: false },
      { id: "add_associations", description: "Add word associations", completed: false },
    ],
  },
  {
    id: "tutorial_sprites",
    name: "Generating Sprites",
    description: "Create custom sprites with AI",
    xp_reward: 150,
    difficulty: "easy",
    category: "tutorial",
    prerequisites: ["tutorial_welcome"],
    steps: [
      { id: "open_sprite_dialog", description: "Open sprite generator", completed: false },
      { id: "generate_sprite", description: "Generate a custom sprite", completed: false },
      { id: "assign_to_agent", description: "Assign sprite to an agent", completed: false },
    ],
  },

  // ========== DAILY MISSIONS ==========
  {
    id: "daily_words",
    name: "Daily Vocabulary",
    description: "Teach 10 new words today",
    xp_reward: 100,
    difficulty: "easy",
    category: "daily",
    prerequisites: ["tutorial_language"],
    steps: [
      { id: "teach_10_words", description: "Teach 10 words", completed: false },
    ],
  },
  {
    id: "daily_agents",
    name: "Daily Recruitment",
    description: "Spawn 3 new agents today",
    xp_reward: 100,
    difficulty: "easy",
    category: "daily",
    prerequisites: ["tutorial_welcome"],
    steps: [
      { id: "spawn_3_agents", description: "Spawn 3 agents", completed: false },
    ],
  },
  {
    id: "daily_exploration",
    name: "Daily Exploration",
    description: "Create or visit 2 spaces today",
    xp_reward: 100,
    difficulty: "easy",
    category: "daily",
    prerequisites: ["tutorial_welcome"],
    steps: [
      { id: "visit_2_spaces", description: "Create or visit 2 spaces", completed: false },
    ],
  },

  // ========== WEEKLY MISSIONS ==========
  {
    id: "weekly_master_builder",
    name: "Weekly Master Builder",
    description: "Create 10 spaces this week",
    xp_reward: 500,
    difficulty: "medium",
    category: "weekly",
    prerequisites: [],
    steps: [
      { id: "create_10_spaces", description: "Create 10 spaces", completed: false },
    ],
  },
  {
    id: "weekly_language_guru",
    name: "Weekly Language Guru",
    description: "Teach 100 words this week",
    xp_reward: 500,
    difficulty: "medium",
    category: "weekly",
    prerequisites: [],
    steps: [
      { id: "teach_100_words", description: "Teach 100 words", completed: false },
    ],
  },
  {
    id: "weekly_swarm_builder",
    name: "Weekly Swarm Builder",
    description: "Spawn 50 agents this week",
    xp_reward: 500,
    difficulty: "hard",
    category: "weekly",
    prerequisites: [],
    steps: [
      { id: "spawn_50_agents", description: "Spawn 50 agents", completed: false },
    ],
  },

  // ========== SPECIAL MISSIONS ==========
  {
    id: "special_first_legend",
    name: "Path to Legend",
    description: "Unlock your first legendary achievement",
    xp_reward: 1000,
    difficulty: "expert",
    category: "special",
    prerequisites: [],
    steps: [
      { id: "unlock_legendary", description: "Unlock a legendary achievement", completed: false },
    ],
  },
  {
    id: "special_completionist",
    name: "Completionist",
    description: "Complete all tutorial missions",
    xp_reward: 750,
    difficulty: "medium",
    category: "special",
    prerequisites: ["tutorial_welcome", "tutorial_language", "tutorial_sprites"],
    steps: [
      { id: "complete_tutorials", description: "Complete all tutorials", completed: false },
    ],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getAchievementByRarity(rarity: Achievement["rarity"]): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.rarity === rarity);
}

export function getAchievementsByCategory(category: Achievement["category"]): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.category === category);
}

export function getMissionsByCategory(category: Mission["category"]): Mission[] {
  return MISSIONS.filter((m) => m.category === category);
}

export function getMissionsByDifficulty(difficulty: Mission["difficulty"]): Mission[] {
  return MISSIONS.filter((m) => m.difficulty === difficulty);
}

export function getAvailableMissions(completedMissionIds: string[]): Mission[] {
  return MISSIONS.filter((mission) => {
    // Mission not completed
    if (completedMissionIds.includes(mission.id)) return false;

    // Check prerequisites
    const hasPrerequisites = mission.prerequisites.every((prereq) =>
      completedMissionIds.includes(prereq)
    );

    return hasPrerequisites;
  });
}
