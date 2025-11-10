/**
 * Achievement Card
 * Beautiful cards for achievements with unlock animations
 */

import { motion } from "framer-motion";
import { Card } from "../ui/card";
import { Lock, Check, Sparkles } from "lucide-react";
import type { Achievement } from "@/lib/db/achievements";

interface AchievementCardProps {
  achievement: Achievement;
  unlocked: boolean;
  available?: boolean; // Can be unlocked now
  onClick?: () => void;
}

const rarityColors = {
  common: "from-gray-500 to-gray-600",
  rare: "from-blue-500 to-blue-600",
  epic: "from-purple-500 to-purple-600",
  legendary: "from-amber-500 to-amber-600",
};

const rarityBorders = {
  common: "border-gray-500/30",
  rare: "border-blue-500/30",
  epic: "border-purple-500/30",
  legendary: "border-amber-500/30",
};

const rarityGlow = {
  common: "",
  rare: "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
  epic: "shadow-[0_0_20px_rgba(168,85,247,0.4)]",
  legendary: "shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-pulse",
};

export function AchievementCard({
  achievement,
  unlocked,
  available = false,
  onClick,
}: AchievementCardProps) {
  const isInteractive = !unlocked && available;

  return (
    <motion.div
      whileHover={isInteractive ? { scale: 1.03, y: -2 } : {}}
      whileTap={isInteractive ? { scale: 0.98 } : {}}
      onClick={isInteractive ? onClick : undefined}
      className={isInteractive ? "cursor-pointer" : ""}
    >
      <Card
        variant={unlocked ? "elevated" : "default"}
        spacing="generous"
        className={`relative overflow-hidden transition-all duration-300 border-2 ${
          unlocked ? rarityBorders[achievement.rarity] : "border-transparent"
        } ${unlocked ? rarityGlow[achievement.rarity] : ""} ${
          !unlocked ? "opacity-60 grayscale" : ""
        }`}
      >
        {/* Rarity gradient header */}
        {unlocked && (
          <div
            className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${rarityColors[achievement.rarity]}`}
          />
        )}

        <div className="space-y-3">
          {/* Icon and Status */}
          <div className="flex items-start justify-between">
            <div className={`text-4xl ${!unlocked ? "filter grayscale opacity-50" : ""}`}>
              {achievement.icon}
            </div>

            {unlocked ? (
              <div className="p-1.5 rounded-full bg-green-500/20">
                <Check className="w-4 h-4 text-green-500" />
              </div>
            ) : available ? (
              <div className="p-1.5 rounded-full bg-primary/20 animate-pulse">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
            ) : (
              <div className="p-1.5 rounded-full bg-foreground/10">
                <Lock className="w-4 h-4 text-foreground/50" />
              </div>
            )}
          </div>

          {/* Title and Description */}
          <div>
            <h4 className="font-bold text-sm mb-1">{achievement.id}</h4>
            <p className="text-xs text-foreground/70 line-clamp-2">{achievement.description}</p>
          </div>

          {/* Rarity and XP */}
          <div className="flex items-center justify-between pt-2 border-t border-foreground/10">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  unlocked
                    ? `bg-gradient-to-r ${rarityColors[achievement.rarity]} text-white`
                    : "bg-foreground/10 text-foreground/50"
                }`}
              >
                {achievement.rarity.toUpperCase()}
              </span>
            </div>
            <div className="text-xs font-semibold text-primary">+{achievement.xpReward} XP</div>
          </div>

          {/* Unlock button (if available) */}
          {available && !unlocked && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClick}
              className="w-full mt-2 py-2 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-sm shadow-soft hover:shadow-elevated transition-all duration-200"
            >
              Claim Achievement
            </motion.button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
