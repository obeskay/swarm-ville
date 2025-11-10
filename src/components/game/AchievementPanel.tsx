/**
 * Achievement Panel Component
 * Browse, filter, and view detailed achievements
 */

import { useState } from "react";
import { Search, Filter, Trophy, Lock, Unlock } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import type { Achievement, AchievementCategory } from "@/types/achievements";

interface AchievementPanelProps {
  achievements: Achievement[];
  unlockedIds: Set<string>;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<AchievementCategory, {
  bg: string;
  text: string;
  badge: string;
}> = {
  tutorial: { bg: "bg-blue-50 dark:bg-blue-950", text: "text-blue-900 dark:text-blue-50", badge: "bg-blue-200 dark:bg-blue-800" },
  creation: { bg: "bg-green-50 dark:bg-green-950", text: "text-green-900 dark:text-green-50", badge: "bg-green-200 dark:bg-green-800" },
  collaboration: { bg: "bg-purple-50 dark:bg-purple-950", text: "text-purple-900 dark:text-purple-50", badge: "bg-purple-200 dark:bg-purple-800" },
  mastery: { bg: "bg-amber-50 dark:bg-amber-950", text: "text-amber-900 dark:text-amber-50", badge: "bg-amber-200 dark:bg-amber-800" },
  discovery: { bg: "bg-pink-50 dark:bg-pink-950", text: "text-pink-900 dark:text-pink-50", badge: "bg-pink-200 dark:bg-pink-800" },
  social: { bg: "bg-cyan-50 dark:bg-cyan-950", text: "text-cyan-900 dark:text-cyan-50", badge: "bg-cyan-200 dark:bg-cyan-800" },
  speed: { bg: "bg-red-50 dark:bg-red-950", text: "text-red-900 dark:text-red-50", badge: "bg-red-200 dark:bg-red-800" },
  collection: { bg: "bg-indigo-50 dark:bg-indigo-950", text: "text-indigo-900 dark:text-indigo-50", badge: "bg-indigo-200 dark:bg-indigo-800" },
  hidden: { bg: "bg-gray-50 dark:bg-gray-950", text: "text-gray-900 dark:text-gray-50", badge: "bg-gray-200 dark:bg-gray-800" }
};

export function AchievementPanel({
  achievements,
  unlockedIds,
  onClose
}: AchievementPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | null>(null);
  const [showLocked, setShowLocked] = useState(true);

  // Filter achievements
  const filtered = achievements.filter(a => {
    if (!showLocked && !unlockedIds.has(a.id)) return false;
    if (selectedCategory && a.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
    }
    return true;
  });

  // Group by rarity
  const byRarity = {
    legendary: filtered.filter(a => a.rarity === "legendary"),
    epic: filtered.filter(a => a.rarity === "epic"),
    rare: filtered.filter(a => a.rarity === "rare"),
    common: filtered.filter(a => a.rarity === "common")
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Achievements</h2>
                <p className="text-sm opacity-90">
                  {unlockedIds.size} of {achievements.length} unlocked
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-300"
              style={{ width: `${(unlockedIds.size / achievements.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-100 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-400"
            />
          </div>

          {/* Category filters */}
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              className="text-xs"
            >
              <Filter className="w-3 h-3 mr-1" />
              All
            </Button>
            {Object.entries(CATEGORY_COLORS).map(([cat, colors]) => (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat as AchievementCategory)}
                className={cn("text-xs capitalize", selectedCategory === cat && colors.text)}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Toggle locked */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowLocked(!showLocked)}
            className="text-xs w-fit"
          >
            {showLocked ? <Unlock className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
            {showLocked ? "Hide Locked" : "Show All"}
          </Button>
        </div>

        {/* Achievement Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {Object.entries(byRarity).map(([rarity, items]) => (
            items.length > 0 && (
              <div key={rarity}>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-3 capitalize">
                  {rarity === "legendary" && "🏆 Legendary"}
                  {rarity === "epic" && "⚡ Epic"}
                  {rarity === "rare" && "💎 Rare"}
                  {rarity === "common" && "✨ Common"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((achievement) => {
                    const isUnlocked = unlockedIds.has(achievement.id);
                    const colors = CATEGORY_COLORS[achievement.category];

                    return (
                      <div
                        key={achievement.id}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer group",
                          "hover:shadow-lg hover:-translate-y-1",
                          isUnlocked
                            ? `${colors.bg} ${colors.text} border-current/30`
                            : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-3xl group-hover:animate-bounce">
                            {isUnlocked ? achievement.icon : "🔒"}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">
                              {achievement.title}
                            </h4>
                            <p className="text-xs opacity-75">
                              {achievement.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={cn("text-xs font-bold px-2 py-1 rounded", colors.badge)}>
                                {achievement.rarity}
                              </span>
                              <span className="text-xs opacity-70">
                                +{achievement.xpReward} XP
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No achievements match your filters</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
