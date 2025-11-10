/**
 * Progression Dashboard
 * Comprehensive achievement and progression management
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { XPBar } from "./XPBar";
import { AchievementsPanel } from "./AchievementsPanel";
import { MissionTracker } from "./MissionTracker";
import { AchievementNotifications } from "./AchievementNotifications";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { StreakDisplay } from "./StreakDisplay";
import { useAchievementStore } from "@/stores/achievementStore";
import { useAchievementSystem } from "@/hooks/useAchievementSystem";
import { Trophy, Target, BarChart3, X, TrendingUp, Zap, Star, Award, Flame } from "lucide-react";

type View = "overview" | "achievements" | "missions" | "analytics" | "streaks";

export function ProgressionDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<View>("overview");

  const {
    setUserId,
    progress,
    levelInfo,
    getUnlockedAchievements,
    getAvailableMissions,
    getCompletionPercentage,
  } = useAchievementStore();

  const achievementSystem = useAchievementSystem();

  useEffect(() => {
    setUserId("default_user"); // TODO: Get from auth
  }, [setUserId]);

  // Track daily login once on mount
  useEffect(() => {
    achievementSystem.trackDailyLogin();
  }, []);

  const unlockedAchievements = getUnlockedAchievements();
  const availableMissions = getAvailableMissions();
  const completionPercentage = getCompletionPercentage();

  if (!progress || !levelInfo) {
    return null;
  }

  return (
    <>
      {/* Floating Progress Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-30 p-4 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-elevated hover:shadow-lg transition-all duration-200"
      >
        <Trophy className="w-6 h-6" />
      </motion.button>

      {/* Achievement Notifications */}
      <AchievementNotifications />

      {/* Full Dashboard Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-soft">
                    <Trophy className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Progression</h1>
                    <p className="text-sm text-foreground/70">
                      Track your achievements and missions
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="shrink-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <Button
                  variant={activeView === "overview" ? "default" : "outline"}
                  onClick={() => setActiveView("overview")}
                  className="shrink-0"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Overview
                </Button>
                <Button
                  variant={activeView === "achievements" ? "default" : "outline"}
                  onClick={() => setActiveView("achievements")}
                  className="shrink-0"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Achievements
                </Button>
                <Button
                  variant={activeView === "missions" ? "default" : "outline"}
                  onClick={() => setActiveView("missions")}
                  className="shrink-0"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Missions
                </Button>
                <Button
                  variant={activeView === "streaks" ? "default" : "outline"}
                  onClick={() => setActiveView("streaks")}
                  className="shrink-0"
                >
                  <Flame className="w-4 h-4 mr-2" />
                  Streaks
                </Button>
                <Button
                  variant={activeView === "analytics" ? "default" : "outline"}
                  onClick={() => setActiveView("analytics")}
                  className="shrink-0"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </div>

              {/* View Content */}
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {activeView === "overview" && (
                  <div className="space-y-6">
                    {/* XP Bar */}
                    <XPBar variant="expanded" />

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card variant="elevated" spacing="generous">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-amber-500" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold">{unlockedAchievements.length}</div>
                            <div className="text-sm text-foreground/70">Achievements</div>
                          </div>
                        </div>
                      </Card>

                      <Card variant="elevated" spacing="generous">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Target className="w-6 h-6 text-green-500" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold">
                              {progress.completedMissions.length}
                            </div>
                            <div className="text-sm text-foreground/70">Missions Complete</div>
                          </div>
                        </div>
                      </Card>

                      <Card variant="elevated" spacing="generous">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Zap className="w-6 h-6 text-blue-500" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold">{progress.xp.toLocaleString()}</div>
                            <div className="text-sm text-foreground/70">Total XP</div>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Recent Achievements */}
                    <Card variant="yellow" spacing="generous">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 text-primary" />
                        Recent Unlocks
                      </h3>
                      {unlockedAchievements.length > 0 ? (
                        <div className="space-y-2">
                          {unlockedAchievements.slice(0, 5).map((achievement) => (
                            <div
                              key={achievement.id}
                              className="flex items-center gap-3 p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors"
                            >
                              <div className="text-2xl">{achievement.icon}</div>
                              <div className="flex-1">
                                <div className="font-semibold text-sm">{achievement.id}</div>
                                <div className="text-xs text-foreground/70">
                                  {achievement.description}
                                </div>
                              </div>
                              <div className="text-xs font-semibold text-primary">
                                +{achievement.xpReward} XP
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-foreground/50 text-sm">
                          No achievements unlocked yet. Start exploring!
                        </div>
                      )}
                    </Card>

                    {/* Available Missions */}
                    <Card variant="blue" spacing="generous">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Available Missions
                      </h3>
                      {availableMissions.length > 0 ? (
                        <div className="space-y-2">
                          {availableMissions.slice(0, 5).map((mission) => (
                            <div
                              key={mission.id}
                              className="flex items-center gap-3 p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors"
                            >
                              <div className="flex-1">
                                <div className="font-semibold text-sm">{mission.title}</div>
                                <div className="text-xs text-foreground/70">
                                  {mission.description}
                                </div>
                              </div>
                              <div className="text-xs font-semibold text-primary">
                                +{mission.xpReward} XP
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-foreground/50 text-sm">
                          All missions completed! Check back later.
                        </div>
                      )}
                      {availableMissions.length > 5 && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setActiveView("missions")}
                          className="w-full mt-4"
                        >
                          View All Missions
                        </Button>
                      )}
                    </Card>
                  </div>
                )}

                {activeView === "achievements" && <AchievementsPanel />}

                {activeView === "missions" && <MissionTracker />}

                {activeView === "streaks" && <StreakDisplay />}

                {activeView === "analytics" && <AnalyticsDashboard />}
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
