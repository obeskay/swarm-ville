/**
 * Main game HUD showing level, XP, and active missions
 */

import { useEffect, useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { ChevronDown, ChevronUp, Trophy, Zap } from "lucide-react";

export function GameHUD() {
  const { level, xp, xpToNextLevel, missions } = useGameStore();
  const [showMissions, setShowMissions] = useState(true);

  const activeMissions = missions.filter((m) => !m.completed).slice(0, 3);
  const xpPercentage = (xp / xpToNextLevel) * 100;

  return (
    <>
      {/* Level and XP Bar - Top Left */}
      <div className="fixed top-6 left-6 z-20 select-none">
        <Card variant="yellow" spacing="generous" className="backdrop-blur-md min-w-[240px]">
          <div className="flex items-center gap-4">
            {/* Level Badge */}
            <div className="w-14 h-14 rounded-full bg-foreground flex items-center justify-center shadow-soft relative">
              <span className="text-xl font-bold text-background">
                {level}
              </span>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-foreground rounded-full flex items-center justify-center ring-2 ring-[hsl(var(--card-accent))]">
                <Zap className="w-3 h-3 text-background" fill="currentColor" />
              </div>
            </div>

            {/* XP Progress */}
            <div className="flex-1">
              <div className="text-sm font-medium mb-2">
                Level {level}
              </div>
              <div className="relative h-2.5 bg-foreground/10 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-foreground transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${xpPercentage}%` }}
                />
              </div>
              <div className="text-xs text-foreground/70 mt-2">
                {xp} / {xpToNextLevel} XP
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Missions - Left Side */}
      {activeMissions.length > 0 && (
        <div className="fixed left-6 top-36 z-20 select-none">
          <Card
            variant="blue"
            spacing="generous"
            innerCorners="topLeft"
            className="backdrop-blur-md overflow-hidden min-w-[320px]"
          >
            <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-foreground" />
                <h3 className="text-base font-semibold">Active Missions</h3>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowMissions(!showMissions)}
              >
                {showMissions ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>

            {showMissions && (
              <div className="mt-4 space-y-3">
                {activeMissions.map((mission) => (
                  <div
                    key={mission.id}
                    className="p-4 rounded-[calc(var(--radius)*0.66)] bg-background/50 hover:bg-background/70 transition-all shadow-soft"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl">{mission.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold mb-1">
                          {mission.title}
                        </div>
                        <div className="text-xs text-foreground/70">
                          {mission.description}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-2 bg-foreground/10 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-foreground transition-all duration-500 rounded-full"
                        style={{
                          width: `${(mission.progress / mission.maxProgress) * 100}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-foreground/70">
                        {mission.progress} / {mission.maxProgress}
                      </span>
                      <span className="text-xs font-semibold bg-foreground/10 px-2 py-1 rounded-full">
                        +{mission.xpReward} XP
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
