/**
 * Streak Display Component
 * Shows current streaks and daily bonus information
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { useAchievementSystem } from "@/hooks/useAchievementSystem";
import { Flame, Calendar, Gift, AlertCircle, CheckCircle2, Zap } from "lucide-react";
import type { StreakData } from "@/lib/achievements/AchievementEventTracker";

interface StreakStatus {
  event: string;
  currentStreak: number;
  longestStreak: number;
  isActive: boolean;
  nextBonus?: {
    day: number;
    multiplier: number;
    description: string;
    daysUntil: number;
  };
}

export function StreakDisplay() {
  const { tracker, getNextMilestone } = useAchievementSystem();
  const [streaks, setStreaks] = useState<StreakStatus[]>([]);
  const [loginStatus, setLoginStatus] = useState<{
    loggedInToday: boolean;
  }>({ loggedInToday: false });
  const [nextMilestone, setNextMilestone] = useState<any>(null);

  useEffect(() => {
    updateStreaks();
    const interval = setInterval(updateStreaks, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const updateStreaks = () => {
    if (!tracker) return;

    const allStreaks = tracker.getAllStreaks();
    const nextBonus = getNextMilestone();
    setNextMilestone(nextBonus);

    const streakStatuses: StreakStatus[] = Array.from(allStreaks.entries())
      .map(([event, data]) => ({
        event: event.replace(/_/g, " ").toLowerCase(),
        currentStreak: data.currentStreak || 0,
        longestStreak: data.longestStreak || 0,
        isActive: (data.currentStreak || 0) > 0,
        nextBonus: nextBonus
          ? {
              day: nextBonus.streak,
              multiplier: nextBonus.xpMultiplier,
              description: "Next milestone",
              daysUntil: nextBonus.daysUntil,
            }
          : undefined,
      }))
      .sort((a, b) => b.currentStreak - a.currentStreak);

    setStreaks(streakStatuses);

    // Check login status
    const hasLoggedInToday = tracker.hasLoggedInToday();
    setLoginStatus({
      loggedInToday: hasLoggedInToday,
    });
  };

  const getMilestoneIcon = (day: number): string => {
    const milestones: Record<number, string> = {
      1: "🌱",
      3: "🔥",
      7: "⭐",
      14: "💎",
      30: "👑",
    };
    return milestones[day] || "🎯";
  };

  return (
    <div className="space-y-6">
      {/* Daily Login Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
      >
        <Card variant="elevated" spacing="generous">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Daily Login
              </h3>
              <div className="mt-4">
                {loginStatus.loggedInToday ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="font-semibold text-green-600">Logged in today!</div>
                      <div className="text-sm text-foreground/70">
                        Come back tomorrow to extend your streak
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <div>
                      <div className="font-semibold text-amber-600">Log in today</div>
                      <div className="text-sm text-foreground/70">
                        Claim your daily bonus and build your streak
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Next Milestone Card */}
      {nextMilestone && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="yellow" spacing="generous">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Next Bonus Milestone
            </h3>
            <div className="p-6 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold mb-2">
                    {getMilestoneIcon(nextMilestone.streak)} Day {nextMilestone.streak}
                  </div>
                  <div className="text-2xl font-bold text-primary mb-2">
                    {(nextMilestone.xpMultiplier * 100).toFixed(0)}% XP Bonus
                  </div>
                  <div className="text-sm text-foreground/70">
                    {nextMilestone.daysUntil === 0
                      ? "🎉 You've reached this milestone!"
                      : `${nextMilestone.daysUntil} more ${nextMilestone.daysUntil === 1 ? "day" : "days"} to reach this reward`}
                  </div>
                </div>
                <div className="text-6xl opacity-50">⏰</div>
              </div>

              {/* Progress to next milestone */}
              {nextMilestone.daysUntil > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-foreground/70">Progress to milestone</span>
                    <span className="font-bold text-primary">
                      {nextMilestone.streak - nextMilestone.daysUntil}/{nextMilestone.streak}
                    </span>
                  </div>
                  <div className="w-full bg-background/30 rounded-full h-3">
                    <motion.div
                      className="bg-gradient-to-r from-primary to-primary/70 h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${((nextMilestone.streak - nextMilestone.daysUntil) / nextMilestone.streak) * 100}%`,
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Current Streaks */}
      {streaks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="blue" spacing="generous">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" />
              Active Streaks
            </h3>
            <div className="space-y-3">
              {streaks
                .filter((s) => s.isActive)
                .slice(0, 5)
                .map((streak, idx) => (
                  <motion.div
                    key={streak.event}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className="p-4 rounded-lg bg-gradient-to-r from-background/50 to-background/30 border border-primary/10 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold capitalize text-sm mb-1">{streak.event}</div>
                        <div className="text-xs text-foreground/70">
                          Best: {streak.longestStreak} | Personal Record
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-2xl font-bold text-primary">
                            {streak.currentStreak}
                          </span>
                          <span className="text-xl">🔥</span>
                        </div>
                        <div className="text-xs text-foreground/70">current</div>
                      </div>
                    </div>
                  </motion.div>
                ))}

              {streaks.filter((s) => s.isActive).length === 0 && (
                <div className="text-center py-8 text-foreground/50">
                  <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Start tracking events to build streaks</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Milestone Tracker */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card variant="elevated" spacing="generous">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Bonus Milestones
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { day: 1, multiplier: 1.0, icon: "🌱" },
              { day: 3, multiplier: 1.1, icon: "🔥" },
              { day: 7, multiplier: 1.25, icon: "⭐" },
              { day: 14, multiplier: 1.5, icon: "💎" },
              { day: 30, multiplier: 2.0, icon: "👑" },
            ].map((milestone) => {
              const isReached =
                nextMilestone && milestone.day <= nextMilestone.streak - nextMilestone.daysUntil;
              const isCurrent =
                nextMilestone &&
                milestone.day === nextMilestone.streak &&
                nextMilestone.daysUntil === 0;

              return (
                <motion.div
                  key={milestone.day}
                  className={`p-4 rounded-lg text-center transition-all ${
                    isCurrent
                      ? "bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary"
                      : isReached
                        ? "bg-green-500/10 border border-green-500/30"
                        : "bg-background/30 border border-foreground/10"
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-3xl mb-1">{milestone.icon}</div>
                  <div className="text-xs font-medium text-foreground/70 mb-1">
                    Day {milestone.day}
                  </div>
                  <div className="text-sm font-bold text-primary">
                    {(milestone.multiplier * 100).toFixed(0)}%
                  </div>
                  {isReached && <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mt-2" />}
                </motion.div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* Bonus Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card variant="yellow" spacing="generous">
          <h3 className="text-lg font-bold mb-4">💡 Streak Tips</h3>
          <ul className="space-y-2 text-sm text-foreground/80">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Log in every day to maintain your streak and earn up to 2x XP</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Different events have separate streaks - track multiple activities</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>
                Missing even one day resets your current streak, but your best record remains
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Focus on consistency - long streaks unlock higher XP multipliers</span>
            </li>
          </ul>
        </Card>
      </motion.div>
    </div>
  );
}
