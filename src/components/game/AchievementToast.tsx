import { useEffect, useState } from "react";
import { Trophy, X } from "lucide-react";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import { cn } from "@/lib/utils";

interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  total: number;
  xpReward: number;
  icon?: string;
}

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
  autoDismissDelay?: number;
}

export function AchievementToast({
  achievement,
  onDismiss,
  autoDismissDelay = 5000
}: AchievementToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const progressPercent = (achievement.progress / achievement.total) * 100;
  const isCompleted = achievement.progress >= achievement.total;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onDismiss, 300);
    }, autoDismissDelay);

    return () => clearTimeout(timer);
  }, [autoDismissDelay, onDismiss]);

  return (
    <Card
      className={cn(
        "w-80 p-3 shadow-lg border-2 transition-all duration-300",
        isCompleted ? "border-primary bg-primary/5" : "border-border",
        isExiting
          ? "translate-x-full opacity-0"
          : "translate-x-0 opacity-100"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">
          {achievement.icon || "🎯"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-sm leading-tight">
              {achievement.title}
            </h4>
            <button
              onClick={() => {
                setIsExiting(true);
                setTimeout(onDismiss, 300);
              }}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
            {achievement.description}
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {achievement.progress} / {achievement.total}
              </span>
              {isCompleted && (
                <span className="text-primary font-semibold">
                  +{achievement.xpReward} XP
                </span>
              )}
            </div>
            <Progress value={progressPercent} className="h-1" />
          </div>
        </div>
      </div>
    </Card>
  );
}

interface AchievementToastContainerProps {
  achievements: Achievement[];
  onDismiss: (id: string) => void;
}

export function AchievementToastContainer({
  achievements,
  onDismiss
}: AchievementToastContainerProps) {
  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {achievements.map((achievement) => (
        <div key={achievement.id} className="pointer-events-auto">
          <AchievementToast
            achievement={achievement}
            onDismiss={() => onDismiss(achievement.id)}
          />
        </div>
      ))}
    </div>
  );
}
