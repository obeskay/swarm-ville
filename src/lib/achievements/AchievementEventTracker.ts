/**
 * Achievement Event Tracker
 * Tracks game events and manages streak counters for achievements
 */

import type { GameEvent } from "@/types/achievements";

export interface EventLog {
  event: GameEvent;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastEventDate: number; // Unix timestamp (midnight)
  eventCount: number;
}

export interface DailyBonus {
  day: number;
  xpMultiplier: number;
  description: string;
}

const DAILY_BONUSES: DailyBonus[] = [
  { day: 1, xpMultiplier: 1.0, description: "First day" },
  { day: 3, xpMultiplier: 1.1, description: "3 day streak" },
  { day: 7, xpMultiplier: 1.25, description: "Week long streak!" },
  { day: 14, xpMultiplier: 1.5, description: "2 weeks!" },
  { day: 30, xpMultiplier: 2.0, description: "Monthly legend" },
];

export class AchievementEventTracker {
  private eventLogs: EventLog[] = [];
  private streaks: Map<GameEvent, StreakData> = new Map();
  private dailyEventCount: Map<string, number> = new Map(); // Date string -> count

  /**
   * Track a game event
   */
  trackEvent(event: GameEvent, metadata?: Record<string, unknown>): void {
    const eventLog: EventLog = {
      event,
      timestamp: Date.now(),
      metadata,
    };

    this.eventLogs.push(eventLog);
    this.updateStreakForEvent(event);
    this.updateDailyCount();
  }

  /**
   * Update streak data for an event
   */
  private updateStreakForEvent(event: GameEvent): void {
    const today = this.getMidnightTimestamp(Date.now());
    let streak = this.streaks.get(event);

    if (!streak) {
      streak = {
        currentStreak: 1,
        longestStreak: 1,
        lastEventDate: today,
        eventCount: 1,
      };
    } else {
      const lastEventMidnight = this.getMidnightTimestamp(streak.lastEventDate);
      const daysSinceLastEvent = (today - lastEventMidnight) / (24 * 60 * 60 * 1000);

      if (daysSinceLastEvent <= 1) {
        // Same day or next day
        if (daysSinceLastEvent === 0) {
          // Same day, just increment count
          streak.eventCount++;
        } else {
          // Next day, increment streak
          streak.currentStreak++;
          streak.eventCount = 1;
        }
      } else {
        // Streak broken
        streak.currentStreak = 1;
        streak.eventCount = 1;
      }

      streak.lastEventDate = today;
      streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
    }

    this.streaks.set(event, streak);
  }

  /**
   * Update daily event count
   */
  private updateDailyCount(): void {
    const today = new Date().toISOString().split("T")[0];
    const count = this.dailyEventCount.get(today) || 0;
    this.dailyEventCount.set(today, count + 1);
  }

  /**
   * Get midnight timestamp for a given date
   */
  private getMidnightTimestamp(timestamp: number): number {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }

  /**
   * Get streak data for an event
   */
  getStreak(event: GameEvent): StreakData | undefined {
    return this.streaks.get(event);
  }

  /**
   * Get all event streaks
   */
  getAllStreaks(): Map<GameEvent, StreakData> {
    return new Map(this.streaks);
  }

  /**
   * Calculate XP bonus based on streak
   */
  calculateStreakBonus(currentStreak: number): number {
    // Find matching bonus tier
    for (let i = DAILY_BONUSES.length - 1; i >= 0; i--) {
      if (currentStreak >= DAILY_BONUSES[i].day) {
        return DAILY_BONUSES[i].xpMultiplier;
      }
    }
    return 1.0;
  }

  /**
   * Get next bonus milestone
   */
  getNextBonusMilestone(currentStreak: number): DailyBonus | undefined {
    for (const bonus of DAILY_BONUSES) {
      if (bonus.day > currentStreak) {
        return bonus;
      }
    }
    return undefined;
  }

  /**
   * Get daily bonus info
   */
  getDailyBonusInfo(currentStreak: number): {
    current: DailyBonus | null;
    next: DailyBonus | undefined;
  } {
    let current: DailyBonus | null = null;
    for (let i = DAILY_BONUSES.length - 1; i >= 0; i--) {
      if (currentStreak >= DAILY_BONUSES[i].day) {
        current = DAILY_BONUSES[i];
        break;
      }
    }

    const next = this.getNextBonusMilestone(currentStreak);

    return { current, next };
  }

  /**
   * Get today's event count
   */
  getTodayEventCount(): number {
    const today = new Date().toISOString().split("T")[0];
    return this.dailyEventCount.get(today) || 0;
  }

  /**
   * Get recent events
   */
  getRecentEvents(count: number = 10): EventLog[] {
    return this.eventLogs.slice(-count).reverse();
  }

  /**
   * Get event count for a specific date range
   */
  getEventCountInRange(startDate: number, endDate: number): number {
    return this.eventLogs.filter((log) => log.timestamp >= startDate && log.timestamp <= endDate)
      .length;
  }

  /**
   * Get event frequency (events per day over last N days)
   */
  getEventFrequency(days: number = 7): number {
    const now = Date.now();
    const startDate = now - days * 24 * 60 * 60 * 1000;
    const eventCount = this.getEventCountInRange(startDate, now);
    return eventCount / days;
  }

  /**
   * Check if user logged in today
   */
  hasLoggedInToday(): boolean {
    const today = new Date().toISOString().split("T")[0];
    return this.dailyEventCount.has(today);
  }

  /**
   * Get consecutive days logged in
   */
  getConsecutiveLoginDays(): number {
    let consecutive = 0;
    let currentDate = new Date();

    while (true) {
      const dateStr = currentDate.toISOString().split("T")[0];
      if (!this.dailyEventCount.has(dateStr)) {
        break;
      }
      consecutive++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return consecutive;
  }

  /**
   * Clear old event logs (keep last N days)
   */
  clearOldLogs(daysToKeep: number = 30): void {
    const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    this.eventLogs = this.eventLogs.filter((log) => log.timestamp >= cutoffTime);
  }
}
