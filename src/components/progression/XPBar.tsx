/**
 * XP Bar with Level Progression
 * Real-time animated progress tracking
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../ui/card";
import { Sparkles, TrendingUp } from "lucide-react";
import { useAchievementStore } from "@/stores/achievementStore";

interface XPBarProps {
  variant?: "compact" | "expanded";
  className?: string;
}

export function XPBar({ variant = "compact", className = "" }: XPBarProps) {
  const { progress, levelInfo } = useAchievementStore();
  const [prevXP, setPrevXP] = useState(0);
  const [isLevelingUp, setIsLevelingUp] = useState(false);

  useEffect(() => {
    if (progress && levelInfo) {
      if (progress.level > Math.floor(prevXP / 1000) + 1) {
        setIsLevelingUp(true);
        setTimeout(() => setIsLevelingUp(false), 2000);
      }
      setPrevXP(progress.xp);
    }
  }, [progress, levelInfo, prevXP]);

  if (!progress || !levelInfo) {
    return null;
  }

  if (variant === "compact") {
    return (
      <div className={`relative ${className}`}>
        <AnimatePresence>
          {isLevelingUp && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 z-50"
            >
              <div className="bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg font-bold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-pulse" />
                Level {progress.level}!
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Card variant="elevated" className="overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2">
            {/* Level Badge */}
            <div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold shadow-sm">
              {progress.level}
            </div>

            {/* Progress Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span>Level {progress.level}</span>
                <span className="text-foreground/70">{levelInfo.currentXp} / 1000 XP</span>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2 bg-background/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${levelInfo.progressPercentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-full"
                >
                  {/* Shine effect */}
                  <div
                    className="absolute inset-0 animate-shimmer"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, var(--foreground-20) 50%, transparent 100%)",
                    }}
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Expanded variant
  return (
    <div className={`relative ${className}`}>
      <AnimatePresence>
        {isLevelingUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{
              opacity: 1,
              scale: [0.5, 1.2, 1],
              rotate: [-10, 10, 0],
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute -top-16 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground px-8 py-4 rounded-2xl shadow-lg">
              <div className="text-center">
                <div className="text-sm font-semibold opacity-90">Level Up!</div>
                <div className="text-3xl font-bold flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                  {progress.level}
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Card variant="yellow" padding="lg" className="overflow-hidden">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground shadow-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold">{progress.level}</div>
                  <div className="text-xs opacity-90">LVL</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold">Level {progress.level}</h3>
                <p className="text-sm text-foreground/70">{levelInfo.currentXp} / 1,000 XP</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {Math.floor(levelInfo.progressPercentage)}%
              </div>
              <div className="text-xs text-foreground/70 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Progress
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="relative h-4 bg-background/50 rounded-full overflow-hidden shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-full shadow-sm"
              >
                {/* Animated shine */}
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 w-1/3"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, var(--foreground-30) 50%, transparent 100%)",
                  }}
                />
              </motion.div>
            </div>

            <div className="flex justify-between text-xs text-foreground/60">
              <span>Level {progress.level}</span>
              <span>Next: Level {progress.level + 1}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-[calc(var(--radius)*0.66)] bg-background/30 text-center">
              <div className="text-lg font-bold text-primary">{progress.xp.toLocaleString()}</div>
              <div className="text-xs text-foreground/70">Total XP</div>
            </div>
            <div className="p-3 rounded-[calc(var(--radius)*0.66)] bg-background/30 text-center">
              <div className="text-lg font-bold text-primary">{progress.achievements.length}</div>
              <div className="text-xs text-foreground/70">Achievements</div>
            </div>
            <div className="p-3 rounded-[calc(var(--radius)*0.66)] bg-background/30 text-center">
              <div className="text-lg font-bold text-primary">
                {progress.completedMissions.length}
              </div>
              <div className="text-xs text-foreground/70">Missions</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
