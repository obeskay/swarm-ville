/**
 * Mission Tracker
 * Quest and mission management with progress tracking
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { useAchievementStore } from "@/stores/achievementStore";
import type { Mission } from "@/lib/data/achievements";
import { Target, CheckCircle2, Trophy, Clock } from "lucide-react";

const categoryColors = {
  tutorial: "from-blue-500 to-blue-600",
  creation: "from-purple-500 to-purple-600",
  collaboration: "from-pink-500 to-pink-600",
  mastery: "from-orange-500 to-orange-600",
};

interface MissionCardProps {
  mission: Mission;
  completed: boolean;
  onComplete?: () => void;
}

function MissionCard({ mission, completed, onComplete }: MissionCardProps) {
  const progress = mission.progress > 0 ? (mission.progress / mission.maxProgress) * 100 : 0;

  return (
    <motion.div whileHover={{ y: -2 }} className="relative">
      <Card
        variant={completed ? "elevated" : "default"}
        padding="lg"
        className={`relative overflow-hidden transition-all duration-300 ${
          completed ? "opacity-75" : ""
        }`}
      >
        {/* Category gradient header */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${categoryColors[mission.category as keyof typeof categoryColors] || "from-gray-500 to-gray-600"}`}
        />

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${categoryColors[mission.category as keyof typeof categoryColors] || "from-gray-500 to-gray-600"} text-white`}
                >
                  {(mission.category as string).toUpperCase()}
                </span>
              </div>
              <h4 className="font-bold text-sm mb-1">{mission.title}</h4>
              <p className="text-xs text-foreground/70 line-clamp-2">{mission.description}</p>
            </div>

            {completed ? (
              <div className="shrink-0 p-2 rounded-full bg-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            ) : (
              <div className="shrink-0 text-lg font-bold text-primary">+{mission.xpReward} XP</div>
            )}
          </div>

          {/* Progress */}
          {!completed && mission.maxProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground/70">
                <span>Progress</span>
                <span>
                  {mission.progress} / {mission.maxProgress}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2 bg-background/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${categoryColors[mission.category as keyof typeof categoryColors] || "from-gray-500 to-gray-600"} rounded-full`}
                />
              </div>
            </div>
          )}

          {/* Complete Button */}
          {!completed && progress >= 100 && (
            <Button
              onClick={onComplete}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Complete Mission
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export function MissionTracker() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { getAvailableMissions, getCompletedMissions, completeMission } = useAchievementStore();

  const availableMissions = getAvailableMissions();
  const completedMissions = getCompletedMissions();

  // Filter missions by category
  let displayMissions = availableMissions;
  if (selectedCategory) {
    displayMissions = displayMissions.filter((m) => m.category === selectedCategory);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card variant="blue" padding="lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
              <Target className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Missions</h2>
              <p className="text-sm text-foreground/70">
                {availableMissions.length} available • {completedMissions.length} completed
              </p>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            size="sm"
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {["tutorial", "daily", "weekly", "special"].map((category) => (
            <Button
              key={category}
              size="sm"
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>
      </Card>

      {/* Mission List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Available Missions
        </h3>
        {displayMissions.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {displayMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                completed={false}
                onComplete={() => completeMission(mission.id)}
              />
            ))}
          </div>
        ) : (
          <Card variant="default" padding="lg" className="text-center">
            <div className="py-8 text-foreground/50">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">No missions available in this category.</p>
              <p className="text-xs mt-2">Check back later for new quests!</p>
            </div>
          </Card>
        )}
      </div>

      {/* Completed Missions */}
      {completedMissions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Completed Missions
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {completedMissions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} completed={true} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
