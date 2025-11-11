/**
 * Achievement Panel Component
 * Browse, filter, and view detailed achievements
 */

import { useState } from "react";
import { Search, Filter, Trophy, Lock, Unlock, X } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import type { Achievement, AchievementCategory } from "@/types/achievements";

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  exploration: { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-500" },
  combat: { bg: "bg-red-500/10", text: "text-red-700", border: "border-red-500" },
  social: { bg: "bg-purple-500/10", text: "text-purple-700", border: "border-purple-500" },
  progression: { bg: "bg-green-500/10", text: "text-green-700", border: "border-green-500" },
};

interface AchievementPanelProps {
  achievements: Achievement[];
  unlockedIds: Set<string>;
  onClose: () => void;
}

export function AchievementPanel({ achievements, unlockedIds, onClose }: AchievementPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | null>(null);
  const [showLocked, setShowLocked] = useState(true);

  // Filter achievements
  const filtered = achievements.filter((a) => {
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
    legendary: filtered.filter((a) => a.rarity === "legendary"),
    epic: filtered.filter((a) => a.rarity === "epic"),
    rare: filtered.filter((a) => a.rarity === "rare"),
    common: filtered.filter((a) => a.rarity === "common"),
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card
        variant="achievement"
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/70 p-6 text-primary-foreground">
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
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-primary-foreground/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary-foreground h-full transition-all duration-300"
              style={{ width: `${(unlockedIds.size / achievements.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card/50 p-4 border-b border-border space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground"
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
          {Object.entries(byRarity).map(
            ([rarity, items]) =>
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

                      return (
                        <Card
                          key={achievement.id}
                          variant={isUnlocked ? "flat" : "default"}
                          className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group opacity-90 hover:opacity-100"
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-3xl group-hover:animate-bounce flex-shrink-0">
                              {isUnlocked ? achievement.icon : "🔒"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm mb-1">{achievement.title}</h4>
                              <p className="text-xs opacity-75">{achievement.description}</p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge variant="category" className="text-xs capitalize">
                                  {achievement.category}
                                </Badge>
                                <span className="text-xs opacity-70">
                                  +{achievement.xpReward} XP
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )
          )}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">
                No achievements match your filters
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
