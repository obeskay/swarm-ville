/**
 * Analytics Dashboard
 * Comprehensive metrics and engagement tracking
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "../ui/card";
import { useAchievementSystem } from "@/hooks/useAchievementSystem";
import {
  TrendingUp,
  Flame,
  Target,
  Award,
  Zap,
  Calendar,
  Activity,
  BarChart3,
  PieChart,
  Clock,
} from "lucide-react";
import type { AchievementMetrics } from "@/lib/achievements/AchievementAnalytics";

interface MetricCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtext?: string;
}

export function AnalyticsDashboard() {
  const { getMetrics, getStreaks, getNextMilestone, state } = useAchievementSystem();
  const [metrics, setMetrics] = useState<AchievementMetrics | null>(null);
  const [metricCards, setMetricCards] = useState<MetricCard[]>([]);

  useEffect(() => {
    const currentMetrics = getMetrics();
    setMetrics(currentMetrics);

    if (currentMetrics) {
      const cards: MetricCard[] = [
        {
          label: "Engagement Score",
          value: Math.round(currentMetrics.engagementScore),
          icon: <Activity className="w-5 h-5" />,
          color: "from-purple-500 to-purple-600",
          subtext: "/100 - Overall engagement level",
        },
        {
          label: "Achievements",
          value: `${currentMetrics.unlockedCount}/${currentMetrics.totalAchievements}`,
          icon: <Trophy className="w-5 h-5" />,
          color: "from-amber-500 to-amber-600",
          subtext: `${currentMetrics.unlockedPercentage.toFixed(1)}% complete`,
        },
        {
          label: "Daily XP",
          value: currentMetrics.dailyXpEarned,
          icon: <Zap className="w-5 h-5" />,
          color: "from-cyan-500 to-cyan-600",
          subtext: `earned today`,
        },
        {
          label: "Login Streak",
          value: currentMetrics.currentStreak || 0,
          icon: <Flame className="w-5 h-5" />,
          color: "from-red-500 to-red-600",
          subtext: "consecutive days",
        },
        {
          label: "Weekly XP",
          value: currentMetrics.weeklyXpEarned.toLocaleString(),
          icon: <TrendingUp className="w-5 h-5" />,
          color: "from-green-500 to-green-600",
          subtext: "last 7 days",
        },
        {
          label: "Time to Completion",
          value: Math.round(currentMetrics.estimatedTimeToCompletion),
          icon: <Clock className="w-5 h-5" />,
          color: "from-blue-500 to-blue-600",
          subtext: "estimated hours",
        },
      ];

      setMetricCards(cards);
    }
  }, []);

  if (!metrics) {
    return <div className="text-center py-12 text-foreground/50">Loading analytics...</div>;
  }

  const nextMilestone = getNextMilestone();
  const streaks = getStreaks();

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card variant="elevated" padding="lg" className="h-full">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground/70 mb-1">{metric.label}</div>
                  <div className="text-3xl font-bold text-foreground">
                    {typeof metric.value === "number" ? Math.round(metric.value) : metric.value}
                  </div>
                  {metric.subtext && (
                    <div className="text-xs text-foreground/50 mt-2">{metric.subtext}</div>
                  )}
                </div>
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${metric.color} flex items-center justify-center text-white`}
                >
                  {metric.icon}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Engagement Score Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card variant="yellow" padding="lg">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Engagement Score Breakdown
          </h3>
          <div className="space-y-4">
            {/* Completion */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Achievement Completion</span>
                <span className="text-sm font-bold text-primary">
                  {metrics.unlockedPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-background/50 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary to-primary/70 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.unlockedPercentage}%` }}
                />
              </div>
            </div>

            {/* Daily XP Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Daily XP Progress</span>
                <span className="text-sm font-bold text-cyan-500">{metrics.dailyXpEarned} XP</span>
              </div>
              <div className="w-full bg-background/50 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((metrics.dailyXpEarned / 100) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Streak Progress */}
            {(metrics.currentStreak || 0) > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Login Streak</span>
                  <span className="text-sm font-bold text-red-500">
                    🔥 {metrics.currentStreak} days
                  </span>
                </div>
                <div className="w-full bg-background/50 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-red-500 to-orange-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((metrics.currentStreak / 30) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Rarity Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card variant="blue" padding="lg">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary" />
            Achievement Rarity Distribution
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(metrics.rarityDistribution).map(([rarity, count]) => (
              <div
                key={rarity}
                className="p-3 rounded-lg bg-background/30 text-center hover:bg-background/50 transition-colors"
              >
                <div className="text-2xl font-bold text-primary capitalize">{count}</div>
                <div className="text-xs text-foreground/70 mt-1 capitalize">{rarity}</div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Category Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card variant="elevated" padding="lg">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Achievement Categories
          </h3>
          <div className="space-y-3">
            {Object.entries(metrics.categoryDistribution)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium capitalize">{category}</span>
                    <span className="text-xs font-bold text-primary">{count}</span>
                  </div>
                  <div className="w-full bg-background/50 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary to-primary/70 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(count / Math.max(...Object.values(metrics.categoryDistribution))) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </motion.div>

      {/* Next Milestone */}
      {nextMilestone && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card variant="yellow" padding="lg">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Next Streak Milestone
            </h3>
            <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
              <div>
                <div className="text-sm font-medium text-foreground/70 mb-1">
                  Day {nextMilestone.streak}
                </div>
                <div className="text-2xl font-bold text-primary">
                  {(nextMilestone.xpMultiplier * 100).toFixed(0)}% XP Bonus
                </div>
                <div className="text-xs text-foreground/70 mt-1">
                  {nextMilestone.daysUntil} more days to reach this milestone
                </div>
              </div>
              <div className="text-4xl">{nextMilestone.daysUntil === 0 ? "✨" : "🎯"}</div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Event Streaks */}
      {streaks.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card variant="elevated" padding="lg">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" />
              Event Streaks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from(streaks.entries())
                .sort(([, a], [, b]) => (b.currentStreak || 0) - (a.currentStreak || 0))
                .slice(0, 6)
                .map(([event, streak]) => (
                  <div
                    key={event}
                    className="p-4 rounded-lg bg-background/30 hover:bg-background/50 transition-colors"
                  >
                    <div className="text-sm font-medium text-foreground/70 mb-2 capitalize">
                      {event.replace(/_/g, " ").toLowerCase()}
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {streak.currentStreak || 0}
                        </div>
                        <div className="text-xs text-foreground/70">streak</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-amber-500">
                          {streak.longestStreak || 0}
                        </div>
                        <div className="text-xs text-foreground/70">best</div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Time Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card variant="blue" padding="lg">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Time Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-background/30">
              <div className="text-sm font-medium text-foreground/70 mb-2">
                Average Time Per Achievement
              </div>
              <div className="text-2xl font-bold text-primary">
                {metrics.averageTimeToUnlock
                  ? `${(metrics.averageTimeToUnlock / 60).toFixed(1)}h`
                  : "N/A"}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-background/30">
              <div className="text-sm font-medium text-foreground/70 mb-2">XP Rate This Week</div>
              <div className="text-2xl font-bold text-green-500">
                {metrics.weeklyXpEarned.toLocaleString()} XP
              </div>
            </div>
            <div className="p-4 rounded-lg bg-background/30">
              <div className="text-sm font-medium text-foreground/70 mb-2">Completion ETA</div>
              <div className="text-2xl font-bold text-cyan-500">
                {metrics.estimatedTimeToCompletion
                  ? metrics.estimatedTimeToCompletion.toFixed(1)
                  : "?"}{" "}
                hrs
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

// Helper icon (Trophy was not imported)
function Trophy(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
      <path d="M6 9a6 6 0 0 0 12 0" />
      <path d="M9 14h6v8a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-8Z" />
    </svg>
  );
}
