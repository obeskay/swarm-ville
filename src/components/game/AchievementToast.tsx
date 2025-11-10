/**
 * Enhanced Achievement Toast with Animations
 * Uses shadcn/ui colors and smooth animation sequences
 */

import { useEffect, useState } from "react";
import { Trophy, X, Sparkles } from "lucide-react";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import { cn } from "@/lib/utils";
import type { Achievement, AchievementRarity } from "@/types/achievements";

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
  autoDismissDelay?: number;
  variant?: AchievementRarity;
}

// shadcn/ui color mappings for rarities
const RARITY_COLORS: Record<
  AchievementRarity,
  {
    bg: string;
    border: string;
    text: string;
    glow: string;
  }
> = {
  common: {
    bg: "bg-slate-50 dark:bg-slate-950",
    border: "border-slate-200 dark:border-slate-800",
    text: "text-slate-900 dark:text-slate-50",
    glow: "shadow-sm",
  },
  rare: {
    bg: "bg-blue-50 dark:bg-blue-950",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-900 dark:text-blue-50",
    glow: "shadow-blue-200 dark:shadow-blue-900 shadow-lg",
  },
  epic: {
    bg: "bg-purple-50 dark:bg-purple-950",
    border: "border-purple-200 dark:border-purple-800",
    text: "text-purple-900 dark:text-purple-50",
    glow: "shadow-purple-300 dark:shadow-purple-900 shadow-xl",
  },
  legendary: {
    bg: "bg-amber-50 dark:bg-amber-950",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-900 dark:text-amber-50",
    glow: "shadow-amber-400 dark:shadow-amber-900 shadow-2xl",
  },
};

const RARITY_ANIMATION: Record<AchievementRarity, string> = {
  common: "animate-in fade-in slide-in-from-right-4 duration-300",
  rare: "animate-in fade-in slide-in-from-right-4 duration-400 ease-out",
  epic: "animate-in fade-in zoom-in-50 slide-in-from-bottom-8 duration-500 ease-out",
  legendary: "animate-in fade-in zoom-in-75 duration-600 ease-out spin-in-90",
};

const EXIT_ANIMATION = "animate-out fade-out slide-out-to-right-4 duration-300";

export function AchievementToast({
  achievement,
  onDismiss,
  autoDismissDelay = 5000,
  variant = achievement.rarity,
}: AchievementToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [showParticles, setShowParticles] = useState(variant === "legendary");

  const colors = RARITY_COLORS[variant];
  const progressPercent = variant === "legendary" ? 100 : 75;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onDismiss, 300);
    }, autoDismissDelay);

    return () => clearTimeout(timer);
  }, [autoDismissDelay, onDismiss]);

  return (
    <>
      <Card
        className={cn(
          "w-96 p-4 border-2 transition-all",
          colors.bg,
          colors.border,
          colors.text,
          colors.glow,
          isExiting ? EXIT_ANIMATION : RARITY_ANIMATION[variant]
        )}
      >
        <div className="flex items-start gap-4">
          {/* Icon with animation */}
          <div
            className={cn(
              "text-3xl flex-shrink-0 transition-all duration-500",
              variant === "legendary" && "animate-bounce"
            )}
          >
            {achievement.icon || "🎯"}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header with close button */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm leading-tight">{achievement.title}</h4>
                {variant !== "common" && (
                  <Sparkles
                    className={cn(
                      "w-3.5 h-3.5",
                      variant === "rare" && "text-blue-500",
                      variant === "epic" && "text-purple-500",
                      variant === "legendary" && "text-amber-500"
                    )}
                  />
                )}
              </div>
              <button
                onClick={() => {
                  setIsExiting(true);
                  setTimeout(onDismiss, 300);
                }}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors opacity-60 hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs opacity-75 mb-3 line-clamp-1">{achievement.description}</p>

            {/* Progress section */}
            <div className="space-y-2">
              {variant !== "legendary" && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="opacity-70">Progress</span>
                    <span className="font-semibold">{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-1.5" />
                </>
              )}

              {/* XP Reward */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">Unlocked!</span>
                </div>
                <span
                  className={cn(
                    "text-xs font-bold",
                    variant === "common" && "text-slate-600 dark:text-slate-400",
                    variant === "rare" && "text-blue-600 dark:text-blue-400",
                    variant === "epic" && "text-purple-600 dark:text-purple-400",
                    variant === "legendary" && "text-amber-600 dark:text-amber-400"
                  )}
                >
                  +{achievement.xpReward} XP
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Particle effect for legendary */}
      {showParticles && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-amber-400 rounded-full animate-in fade-out"
              style={{
                left: `${50 + Math.random() * 20 - 10}%`,
                top: `${50 + Math.random() * 20 - 10}%`,
                animation: `float-up 2s ease-out forwards`,
                animationDelay: `${i * 0.1}s`,
                opacity: 0.8,
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes float-up {
          0% {
            opacity: 0.8;
            transform: translateY(0) translateX(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) translateX(${Math.random() * 40 - 20}px);
          }
        }
      `}</style>
    </>
  );
}

interface AchievementToastContainerProps {
  achievements: Achievement[];
  onDismiss: (id: string) => void;
}

export function AchievementToastContainer({
  achievements,
  onDismiss,
}: AchievementToastContainerProps) {
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {achievements.map((achievement) => (
        <div key={achievement.id} className="pointer-events-auto">
          <AchievementToast
            achievement={achievement}
            onDismiss={() => onDismiss(achievement.id)}
            variant={achievement.rarity}
          />
        </div>
      ))}
    </div>
  );
}
