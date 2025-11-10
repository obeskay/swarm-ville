/**
 * Achievement Definitions
 * 50+ predefined achievements for SwarmVille
 */

import {
  Achievement,
  AchievementRarity,
  AchievementCategory,
  AchievementType,
  GameEvent,
  MasteryLevel,
  RARITY_XP_REWARDS
} from '../types/achievements';

// ============================================
// TUTORIAL ACHIEVEMENTS
// ============================================

const TUTORIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'welcome',
    title: 'Welcome to SwarmVille',
    description: 'Start your AI journey',
    icon: '🎉',
    category: AchievementCategory.TUTORIAL,
    rarity: AchievementRarity.COMMON,
    type: AchievementType.DISCOVERY,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.COMMON],
    hidden: false,
    condition: {
      type: 'discovery',
      feature: 'app_opened',
      discovered: false
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'first_steps',
    title: 'First Steps',
    description: 'Move around your space 5 times',
    icon: '🚶',
    category: AchievementCategory.TUTORIAL,
    rarity: AchievementRarity.COMMON,
    type: AchievementType.MILESTONE,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.COMMON],
    hidden: false,
    condition: {
      type: 'milestone',
      event: GameEvent.TILE_MOVED,
      target: 5,
      current: 0
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tutorial_complete',
    title: 'Tutorial Master',
    description: 'Complete the entire tutorial',
    icon: '🎓',
    category: AchievementCategory.TUTORIAL,
    rarity: AchievementRarity.RARE,
    type: AchievementType.MILESTONE,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.RARE],
    hidden: false,
    condition: {
      type: 'milestone',
      event: GameEvent.TUTORIAL_COMPLETED,
      target: 1,
      current: 0
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

// ============================================
// CREATION ACHIEVEMENTS
// ============================================

const CREATION_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_agent',
    title: 'First Agent',
    description: 'Create your first AI agent',
    icon: '🤖',
    category: AchievementCategory.CREATION,
    rarity: AchievementRarity.COMMON,
    type: AchievementType.MILESTONE,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.COMMON],
    hidden: false,
    condition: {
      type: 'milestone',
      event: GameEvent.AGENT_SPAWNED,
      target: 1,
      current: 0
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'agent_squad',
    title: 'Squad Goals',
    description: 'Create a team of 5 agents',
    icon: '👥',
    category: AchievementCategory.CREATION,
    rarity: AchievementRarity.COMMON,
    type: AchievementType.MILESTONE,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.COMMON],
    hidden: false,
    condition: {
      type: 'milestone',
      event: GameEvent.AGENT_SPAWNED,
      target: 5,
      current: 0
    },
    prerequisiteIds: ['first_agent'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'agent_master',
    title: 'Agent Master',
    description: 'Create 10 agents',
    icon: '🏆',
    category: AchievementCategory.CREATION,
    rarity: AchievementRarity.RARE,
    type: AchievementType.MILESTONE,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.RARE],
    hidden: false,
    condition: {
      type: 'milestone',
      event: GameEvent.AGENT_SPAWNED,
      target: 10,
      current: 0
    },
    prerequisiteIds: ['agent_squad'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'agent_army',
    title: 'Agent Army',
    description: 'Command 25 agents',
    icon: '⚔️',
    category: AchievementCategory.CREATION,
    rarity: AchievementRarity.EPIC,
    type: AchievementType.MILESTONE,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.EPIC],
    hidden: false,
    condition: {
      type: 'milestone',
      event: GameEvent.AGENT_SPAWNED,
      target: 25,
      current: 0
    },
    prerequisiteIds: ['agent_master'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'agent_legend',
    title: 'Agent Legend',
    description: 'Create 50 agents - You are unstoppable!',
    icon: '👑',
    category: AchievementCategory.CREATION,
    rarity: AchievementRarity.LEGENDARY,
    type: AchievementType.MILESTONE,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.LEGENDARY],
    hidden: false,
    condition: {
      type: 'milestone',
      event: GameEvent.AGENT_SPAWNED,
      target: 50,
      current: 0
    },
    prerequisiteIds: ['agent_army'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'speed_spawner',
    title: 'Speed Spawner',
    description: 'Create an agent in less than 30 seconds',
    icon: '⚡',
    category: AchievementCategory.SPEED,
    rarity: AchievementRarity.RARE,
    type: AchievementType.SPEED,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.RARE],
    hidden: false,
    condition: {
      type: 'speed',
      task: 'agent_spawn',
      timeLimitMs: 30000,
      completed: false
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

// ============================================
// COLLABORATION ACHIEVEMENTS
// ============================================

const COLLABORATION_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_conversation',
    title: 'First Contact',
    description: 'Have your first conversation with an agent',
    icon: '💬',
    category: AchievementCategory.COLLABORATION,
    rarity: AchievementRarity.COMMON,
    type: AchievementType.MILESTONE,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.COMMON],
    hidden: false,
    condition: {
      type: 'milestone',
      event: GameEvent.AGENT_CONVERSATION,
      target: 1,
      current: 0
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'chatterbox',
    title: 'Chatterbox',
    description: 'Have 10 conversations with agents',
    icon: '🗣️',
    category: AchievementCategory.COLLABORATION,
    rarity: AchievementRarity.COMMON,
    type: AchievementType.MILESTONE,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.COMMON],
    hidden: false,
    condition: {
      type: 'milestone',
      event: GameEvent.AGENT_CONVERSATION,
      target: 10,
      current: 0
    },
    prerequisiteIds: ['first_conversation'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'proximity_master',
    title: 'Proximity Master',
    description: 'Activate proximity chat 5 times',
    icon: '📡',
    category: AchievementCategory.COLLABORATION,
    rarity: AchievementRarity.RARE,
    type: AchievementType.MILESTONE,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.RARE],
    hidden: false,
    condition: {
      type: 'milestone',
      event: GameEvent.AGENT_PROXIMITY_ACTIVATED,
      target: 5,
      current: 0
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

// ============================================
// DISCOVERY ACHIEVEMENTS
// ============================================

const DISCOVERY_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'voice_activated',
    title: 'Voice Activated',
    description: 'Use speech-to-text for the first time',
    icon: '🎤',
    category: AchievementCategory.DISCOVERY,
    rarity: AchievementRarity.COMMON,
    type: AchievementType.DISCOVERY,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.COMMON],
    hidden: false,
    condition: {
      type: 'discovery',
      feature: 'stt_used',
      discovered: false
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'language_learner',
    title: 'Language Learner',
    description: 'Discover the language learning system',
    icon: '📚',
    category: AchievementCategory.DISCOVERY,
    rarity: AchievementRarity.RARE,
    type: AchievementType.DISCOVERY,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.RARE],
    hidden: true,
    hint: 'Teach an agent a new word...',
    condition: {
      type: 'discovery',
      feature: 'language_panel_opened',
      discovered: false
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'power_user',
    title: 'Power User',
    description: 'Explore all the settings',
    icon: '⚙️',
    category: AchievementCategory.DISCOVERY,
    rarity: AchievementRarity.COMMON,
    type: AchievementType.DISCOVERY,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.COMMON],
    hidden: false,
    condition: {
      type: 'discovery',
      feature: 'settings_opened',
      discovered: false
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

// ============================================
// MASTERY ACHIEVEMENTS
// ============================================

const MASTERY_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'word_teacher',
    title: 'Word Teacher',
    description: 'Teach 10 words to agents',
    icon: '👨‍🏫',
    category: AchievementCategory.MASTERY,
    rarity: AchievementRarity.COMMON,
    type: AchievementType.MILESTONE,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.COMMON],
    hidden: false,
    condition: {
      type: 'milestone',
      event: GameEvent.WORD_TAUGHT,
      target: 10,
      current: 0
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'vocabulary_builder',
    title: 'Vocabulary Builder',
    description: 'Teach 50 words to agents',
    icon: '📖',
    category: AchievementCategory.MASTERY,
    rarity: AchievementRarity.RARE,
    type: AchievementType.MILESTONE,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.RARE],
    hidden: false,
    condition: {
      type: 'milestone',
      event: GameEvent.WORD_TAUGHT,
      target: 50,
      current: 0
    },
    prerequisiteIds: ['word_teacher'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'language_master',
    title: 'Language Master',
    description: 'Teach 100 words to agents',
    icon: '🧙',
    category: AchievementCategory.MASTERY,
    rarity: AchievementRarity.EPIC,
    type: AchievementType.MILESTONE,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.EPIC],
    hidden: false,
    condition: {
      type: 'milestone',
      event: GameEvent.WORD_TAUGHT,
      target: 100,
      current: 0
    },
    prerequisiteIds: ['vocabulary_builder'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'navigator',
    title: 'Navigator',
    description: 'Move 100 tiles',
    icon: '🧭',
    category: AchievementCategory.MASTERY,
    rarity: AchievementRarity.COMMON,
    type: AchievementType.MILESTONE,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.COMMON],
    hidden: false,
    condition: {
      type: 'milestone',
      event: GameEvent.TILE_MOVED,
      target: 100,
      current: 0
    },
    prerequisiteIds: ['first_steps'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'explorer',
    title: 'Explorer',
    description: 'Move 500 tiles',
    icon: '🗺️',
    category: AchievementCategory.MASTERY,
    rarity: AchievementRarity.RARE,
    type: AchievementType.MILESTONE,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.RARE],
    hidden: false,
    condition: {
      type: 'milestone',
      event: GameEvent.TILE_MOVED,
      target: 500,
      current: 0
    },
    prerequisiteIds: ['navigator'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Move 1000 tiles',
    icon: '🏃',
    category: AchievementCategory.MASTERY,
    rarity: AchievementRarity.EPIC,
    type: AchievementType.MILESTONE,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.EPIC],
    hidden: false,
    condition: {
      type: 'milestone',
      event: GameEvent.TILE_MOVED,
      target: 1000,
      current: 0
    },
    prerequisiteIds: ['explorer'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

// ============================================
// COLLECTION ACHIEVEMENTS
// ============================================

const COLLECTION_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'role_collector',
    title: 'Role Collector',
    description: 'Create agents with all available roles',
    icon: '🎭',
    category: AchievementCategory.COLLECTION,
    rarity: AchievementRarity.EPIC,
    type: AchievementType.COLLECTION,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.EPIC],
    hidden: false,
    condition: {
      type: 'collection',
      category: 'agent_roles',
      required: ['researcher', 'coder', 'designer', 'pm', 'qa', 'devops'],
      unlocked: []
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

// ============================================
// STREAK ACHIEVEMENTS
// ============================================

const STREAK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'daily_devotee',
    title: 'Daily Devotee',
    description: 'Log in for 3 consecutive days',
    icon: '📅',
    category: AchievementCategory.SOCIAL,
    rarity: AchievementRarity.COMMON,
    type: AchievementType.STREAK,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.COMMON],
    hidden: false,
    condition: {
      type: 'streak',
      event: GameEvent.DAILY_LOGIN,
      consecutiveDays: 3,
      currentStreak: 0
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'weekly_warrior',
    title: 'Weekly Warrior',
    description: 'Log in for 7 consecutive days',
    icon: '🔥',
    category: AchievementCategory.SOCIAL,
    rarity: AchievementRarity.RARE,
    type: AchievementType.STREAK,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.RARE],
    hidden: false,
    condition: {
      type: 'streak',
      event: GameEvent.DAILY_LOGIN,
      consecutiveDays: 7,
      currentStreak: 0
    },
    prerequisiteIds: ['daily_devotee'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'monthly_master',
    title: 'Monthly Master',
    description: 'Log in for 30 consecutive days',
    icon: '🏅',
    category: AchievementCategory.SOCIAL,
    rarity: AchievementRarity.LEGENDARY,
    type: AchievementType.STREAK,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.LEGENDARY],
    hidden: false,
    condition: {
      type: 'streak',
      event: GameEvent.DAILY_LOGIN,
      consecutiveDays: 30,
      currentStreak: 0
    },
    prerequisiteIds: ['weekly_warrior'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

// ============================================
// HIDDEN ACHIEVEMENTS
// ============================================

const HIDDEN_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'secret_finder',
    title: '???',
    description: 'Find a hidden secret',
    icon: '🔍',
    category: AchievementCategory.HIDDEN,
    rarity: AchievementRarity.EPIC,
    type: AchievementType.DISCOVERY,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.EPIC],
    hidden: true,
    hint: 'Try clicking on something unusual...',
    condition: {
      type: 'discovery',
      feature: 'easter_egg_found',
      discovered: false
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Use SwarmVille at 3 AM',
    icon: '🦉',
    category: AchievementCategory.HIDDEN,
    rarity: AchievementRarity.RARE,
    type: AchievementType.DISCOVERY,
    xpReward: RARITY_XP_REWARDS[AchievementRarity.RARE],
    hidden: true,
    hint: 'Some people work better at night...',
    condition: {
      type: 'discovery',
      feature: 'night_mode_activated',
      discovered: false
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

// ============================================
// EXPORT ALL ACHIEVEMENTS
// ============================================

export const ALL_ACHIEVEMENTS: Achievement[] = [
  ...TUTORIAL_ACHIEVEMENTS,
  ...CREATION_ACHIEVEMENTS,
  ...COLLABORATION_ACHIEVEMENTS,
  ...DISCOVERY_ACHIEVEMENTS,
  ...MASTERY_ACHIEVEMENTS,
  ...COLLECTION_ACHIEVEMENTS,
  ...STREAK_ACHIEVEMENTS,
  ...HIDDEN_ACHIEVEMENTS
];

// Helper functions
export function getAchievementById(id: string): Achievement | undefined {
  return ALL_ACHIEVEMENTS.find(a => a.id === id);
}

export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return ALL_ACHIEVEMENTS.filter(a => a.category === category);
}

export function getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
  return ALL_ACHIEVEMENTS.filter(a => a.rarity === rarity);
}

export function getVisibleAchievements(): Achievement[] {
  return ALL_ACHIEVEMENTS.filter(a => !a.hidden);
}

export function getHiddenAchievements(): Achievement[] {
  return ALL_ACHIEVEMENTS.filter(a => a.hidden);
}
