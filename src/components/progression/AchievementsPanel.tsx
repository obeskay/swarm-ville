/**
 * Achievements Panel
 * Complete achievement tracking and management
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { AchievementCard } from "./AchievementCard";
import { useAchievementStore } from "@/stores/achievementStore";
import { ACHIEVEMENTS } from "@/lib/data/achievements";
import type { Achievement } from "@/lib/db/achievements";
import { Trophy, Search, Filter, X } from "lucide-react";

export function AchievementsPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRarity, setFilterRarity] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showLocked, setShowLocked] = useState(true);

  const {
    getUnlockedAchievements,
    getAvailableAchievements,
    getLockedAchievements,
    getCompletionPercentage,
    unlockAchievement,
  } = useAchievementStore();

  const unlockedAchievements = getUnlockedAchievements();
  const availableAchievements = getAvailableAchievements();
  const lockedAchievements = getLockedAchievements();
  const completionPercentage = getCompletionPercentage();

  // Filter achievements
  let displayAchievements: Array<{
    achievement: Achievement;
    status: "available" | "unlocked" | "locked";
  }> = [
    ...availableAchievements.map((a) => ({ achievement: a, status: "available" as const })),
    ...unlockedAchievements.map((a) => ({ achievement: a, status: "unlocked" as const })),
  ];

  if (showLocked) {
    displayAchievements.push(
      ...lockedAchievements.map((a) => ({ achievement: a, status: "locked" as const }))
    );
  }

  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    displayAchievements = displayAchievements.filter(
      ({ achievement }) =>
        achievement.id.toLowerCase().includes(query) ||
        achievement.description.toLowerCase().includes(query)
    );
  }

  // Apply rarity filter
  if (filterRarity) {
    displayAchievements = displayAchievements.filter(
      ({ achievement }) => achievement.rarity === filterRarity
    );
  }

  // Apply category filter
  if (filterCategory) {
    displayAchievements = displayAchievements.filter(
      ({ achievement }) => achievement.category === filterCategory
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <Card variant="yellow" padding="lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
              <Trophy className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Achievements</h2>
              <p className="text-sm text-foreground/70">
                {unlockedAchievements.length} of {ACHIEVEMENTS.length} unlocked
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-4xl font-bold text-primary">
              {Math.floor(completionPercentage)}%
            </div>
            <div className="text-xs text-foreground/70">Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 relative h-3 bg-background/50 rounded-full overflow-hidden shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-full"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-background/30 text-center">
            <div className="text-lg font-bold text-green-500">{availableAchievements.length}</div>
            <div className="text-xs text-foreground/70">Available</div>
          </div>
          <div className="p-3 rounded-lg bg-background/30 text-center">
            <div className="text-lg font-bold text-blue-500">{unlockedAchievements.length}</div>
            <div className="text-xs text-foreground/70">Unlocked</div>
          </div>
          <div className="p-3 rounded-lg bg-background/30 text-center">
            <div className="text-lg font-bold text-foreground/50">{lockedAchievements.length}</div>
            <div className="text-xs text-foreground/70">Locked</div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card variant="elevated" padding="lg">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
            <Input
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-foreground/50 hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={filterRarity === null ? "default" : "outline"}
              onClick={() => setFilterRarity(null)}
            >
              All Rarities
            </Button>
            {["common", "rare", "epic", "legendary"].map((rarity) => (
              <Button
                key={rarity}
                size="sm"
                variant={filterRarity === rarity ? "default" : "outline"}
                onClick={() => setFilterRarity(rarity)}
              >
                {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={filterCategory === null ? "default" : "outline"}
              onClick={() => setFilterCategory(null)}
            >
              All Categories
            </Button>
            {["social", "creation", "exploration", "learning", "mastery"].map((category) => (
              <Button
                key={category}
                size="sm"
                variant={filterCategory === category ? "default" : "outline"}
                onClick={() => setFilterCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>

          <Button
            size="sm"
            variant={showLocked ? "default" : "outline"}
            onClick={() => setShowLocked(!showLocked)}
            className="w-full"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showLocked ? "Hide Locked" : "Show Locked"}
          </Button>
        </div>
      </Card>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {displayAchievements.map(({ achievement, status }) => (
            <motion.div
              key={achievement.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <AchievementCard
                achievement={achievement}
                unlocked={status === "unlocked"}
                available={status === "available"}
                onClick={() => status === "available" && unlockAchievement(achievement.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {displayAchievements.length === 0 && (
        <div className="text-center py-12 text-foreground/50">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">No achievements found matching your filters.</p>
        </div>
      )}
    </div>
  );
}
