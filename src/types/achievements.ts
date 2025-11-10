/**
 * Comprehensive Achievement System Types
 * Defines all achievement-related interfaces and types
 */

// ============================================
// CORE ACHIEVEMENT TYPES
// ============================================

export enum AchievementRarity {
  COMMON = 'common',       // 50 XP, easy to unlock
  RARE = 'rare',           // 150 XP, requires effort
  EPIC = 'epic',           // 300 XP, challenging
  LEGENDARY = 'legendary'  // 500 XP, extremely rare
}

export enum AchievementCategory {
  TUTORIAL = 'tutorial',
  CREATION = 'creation',
  COLLABORATION = 'collaboration',
  MASTERY = 'mastery',
  DISCOVERY = 'discovery',
  SOCIAL = 'social',
  SPEED = 'speed',
  COLLECTION = 'collection',
  HIDDEN = 'hidden'
}

export enum AchievementType {
  MILESTONE = 'milestone',     // Complete X of Y
  STREAK = 'streak',           // Do X for Y consecutive days
  DISCOVERY = 'discovery',     // Find hidden features
  MASTERY = 'mastery',         // Reach skill levels
  SOCIAL = 'social',           // Collaborate with agents
  SPEED = 'speed',             // Complete tasks quickly
  COLLECTION = 'collection'    // Unlock all in a set
}

// ============================================
// ACHIEVEMENT CONDITION TYPES
// ============================================

export interface MilestoneCondition {
  type: 'milestone';
  event: GameEvent;
  target: number;
  current: number;
}

export interface StreakCondition {
  type: 'streak';
  event: GameEvent;
  consecutiveDays: number;
  currentStreak: number;
  lastActivityDate?: number; // Unix timestamp
}

export interface DiscoveryCondition {
  type: 'discovery';
  feature: string;
  discovered: boolean;
}

export interface MasteryCondition {
  type: 'mastery';
  skill: string;
  level: MasteryLevel;
  currentLevel: MasteryLevel;
}

export interface SpeedCondition {
  type: 'speed';
  task: string;
  timeLimitMs: number;
  startTime?: number;
  completed: boolean;
}

export interface CollectionCondition {
  type: 'collection';
  category: string;
  required: string[];
  unlocked: string[];
}

export type AchievementCondition =
  | MilestoneCondition
  | StreakCondition
  | DiscoveryCondition
  | MasteryCondition
  | SpeedCondition
  | CollectionCondition;

// ============================================
// GAME EVENTS
// ============================================

export enum GameEvent {
  // Agent Events
  AGENT_SPAWNED = 'agent_spawned',
  AGENT_DELETED = 'agent_deleted',
  AGENT_CONVERSATION = 'agent_conversation',
  AGENT_ROLE_CHANGED = 'agent_role_changed',

  // Space Events
  SPACE_CREATED = 'space_created',
  SPACE_NAVIGATED = 'space_navigated',
  SPACE_CUSTOMIZED = 'space_customized',
  TILE_MOVED = 'tile_moved',

  // Language Events
  WORD_TAUGHT = 'word_taught',
  WORD_USED = 'word_used',
  MASTERY_REACHED = 'mastery_reached',

  // Tutorial Events
  TUTORIAL_STEP_COMPLETED = 'tutorial_step_completed',
  TUTORIAL_COMPLETED = 'tutorial_completed',

  // Feature Discovery
  STT_USED = 'stt_used',
  LANGUAGE_PANEL_OPENED = 'language_panel_opened',
  SETTINGS_OPENED = 'settings_opened',

  // Daily Events
  DAILY_LOGIN = 'daily_login',
  DAILY_MISSION_COMPLETED = 'daily_mission_completed',

  // Collaboration
  MULTI_AGENT_TASK = 'multi_agent_task',
  AGENT_PROXIMITY_ACTIVATED = 'agent_proximity_activated',

  // Performance
  QUICK_RESPONSE = 'quick_response',
  FAST_SPAWN = 'fast_spawn',

  // General
  MISSION_COMPLETED = 'mission_completed',
  LEVEL_UP = 'level_up'
}

export enum MasteryLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
  MASTER = 'master'
}

// ============================================
// ACHIEVEMENT DEFINITION
// ============================================

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji or icon name

  category: AchievementCategory;
  rarity: AchievementRarity;
  type: AchievementType;

  xpReward: number;
  hidden: boolean;

  condition: AchievementCondition;
  prerequisiteIds?: string[]; // Must unlock these first

  // Metadata
  hint?: string; // For hidden achievements
  createdAt: number;
  updatedAt: number;
}

// ============================================
// ACHIEVEMENT PROGRESS
// ============================================

export interface AchievementProgress {
  id: string;
  achievementId: string;
  playerId: string;

  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: number;

  // Tracking
  startedAt: number;
  lastUpdatedAt: number;

  // Context
  metadata?: Record<string, unknown>;
}

// ============================================
// ACHIEVEMENT UNLOCK RECORD
// ============================================

export interface AchievementUnlock {
  id: string;
  playerId: string;
  achievementId: string;
  unlockedAt: number;

  context?: {
    level?: number;
    totalAgents?: number;
    totalSpaces?: number;
    timeSpent?: number; // ms since app start
    [key: string]: unknown;
  };
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export enum NotificationType {
  ACHIEVEMENT_PROGRESS = 'achievement_progress',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  LEVEL_UP = 'level_up',
  XP_GAINED = 'xp_gained',
  MISSION_COMPLETED = 'mission_completed'
}

export interface AchievementNotification {
  id: string;
  type: NotificationType;
  priority: 'low' | 'medium' | 'high' | 'critical';

  // Content
  title: string;
  description?: string;
  icon?: string;

  // Achievement specific
  achievement?: Achievement;
  progress?: number;
  maxProgress?: number;
  xpGained?: number;
  newLevel?: number;

  // Display
  autoDismissMs: number;
  dismissible: boolean;
  showProgress: boolean;

  // State
  createdAt: number;
  dismissedAt?: number;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface AchievementAnalytics {
  // Overall stats
  totalAchievements: number;
  unlockedAchievements: number;
  unlockPercentage: number;

  // By rarity
  rarityDistribution: Record<AchievementRarity, number>;
  rarityUnlockRates: Record<AchievementRarity, number>;

  // By category
  categoryDistribution: Record<AchievementCategory, number>;
  categoryProgress: Record<AchievementCategory, number>;

  // Engagement
  engagementScore: number; // 0-100
  averageTimeToUnlock: number; // ms
  fastestUnlock?: AchievementUnlock;
  recentUnlocks: AchievementUnlock[];

  // Streaks
  currentStreak: number;
  longestStreak: number;

  // Predictions
  nextLikelyAchievement?: Achievement;
  estimatedTimeToNext?: number; // ms
}

export interface ProgressInsight {
  achievement: Achievement;
  currentProgress: number;
  maxProgress: number;
  percentage: number;
  estimatedTimeToComplete?: number; // ms
  blockedBy?: string[]; // Prerequisite achievement IDs
}

// ============================================
// EVENT TRACKING
// ============================================

export interface TrackedEvent {
  event: GameEvent;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface EventBatch {
  events: TrackedEvent[];
  playerId: string;
  batchedAt: number;
}

// ============================================
// STORE STATE TYPES
// ============================================

export interface AchievementState {
  // Core data
  achievements: Achievement[];
  progress: Record<string, AchievementProgress>; // Key: achievementId
  unlocks: AchievementUnlock[];

  // Notifications
  notifications: AchievementNotification[];
  notificationQueue: AchievementNotification[];

  // Player stats
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXpEarned: number;

  // Tracking
  eventQueue: TrackedEvent[];
  lastEventProcessedAt: number;

  // Analytics cache
  analytics?: AchievementAnalytics;
  lastAnalyticsCalculated?: number;

  // Settings
  enableNotifications: boolean;
  enableSounds: boolean;
  enableCelebrations: boolean;

  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  lastSyncedAt?: number;
}

// ============================================
// ACTION PAYLOADS
// ============================================

export interface TrackEventPayload {
  event: GameEvent;
  metadata?: Record<string, unknown>;
}

export interface UpdateProgressPayload {
  achievementId: string;
  progress: number;
  force?: boolean; // Skip condition checks
}

export interface UnlockAchievementPayload {
  achievementId: string;
  context?: Record<string, unknown>;
}

export interface ShowNotificationPayload {
  notification: Omit<AchievementNotification, 'id' | 'createdAt'>;
}

// ============================================
// UTILITY TYPES
// ============================================

export type AchievementFilter = {
  category?: AchievementCategory;
  rarity?: AchievementRarity;
  unlocked?: boolean;
  showHidden?: boolean;
};

export type AchievementSort =
  | 'rarity-desc'
  | 'rarity-asc'
  | 'progress-desc'
  | 'progress-asc'
  | 'unlock-date-desc'
  | 'unlock-date-asc'
  | 'alphabetical';

export interface AchievementQuery {
  filter?: AchievementFilter;
  sort?: AchievementSort;
  search?: string;
  limit?: number;
  offset?: number;
}

// ============================================
// CONSTANTS
// ============================================

export const RARITY_XP_REWARDS: Record<AchievementRarity, number> = {
  [AchievementRarity.COMMON]: 50,
  [AchievementRarity.RARE]: 150,
  [AchievementRarity.EPIC]: 300,
  [AchievementRarity.LEGENDARY]: 500
};

export const MASTERY_THRESHOLDS: Record<MasteryLevel, number> = {
  [MasteryLevel.BEGINNER]: 0,
  [MasteryLevel.INTERMEDIATE]: 10,
  [MasteryLevel.ADVANCED]: 30,
  [MasteryLevel.EXPERT]: 60,
  [MasteryLevel.MASTER]: 100
};

export const NOTIFICATION_AUTO_DISMISS_MS: Record<AchievementRarity, number> = {
  [AchievementRarity.COMMON]: 3000,
  [AchievementRarity.RARE]: 5000,
  [AchievementRarity.EPIC]: 7000,
  [AchievementRarity.LEGENDARY]: 10000
};

export const MAX_VISIBLE_NOTIFICATIONS = 3;
export const EVENT_BATCH_INTERVAL_MS = 1000;
export const ANALYTICS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
