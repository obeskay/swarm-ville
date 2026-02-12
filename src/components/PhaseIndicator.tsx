/**
 * PhaseIndicator - PLAN/ACT/REFLECT Visualization
 * Inspired by AgentBoard
 *
 * Shows the current phase of agent activity with visual feedback.
 */

import { useState, useEffect, useCallback } from "react";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { cn } from "../lib/utils";
import {
  Brain,
  Zap,
  Eye,
  RotateCcw,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export type Phase = "IDLE" | "PLANNING" | "ACTING" | "REFLECTING" | "COMPLETED";

interface PhaseConfig {
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  pulseColor: string;
}

const PHASE_CONFIG: Record<Phase, PhaseConfig> = {
  IDLE: {
    label: "Idle",
    description: "Waiting for task",
    icon: RotateCcw,
    color: "text-slate-400",
    bgColor: "bg-slate-500/20",
    pulseColor: "bg-slate-400",
  },
  PLANNING: {
    label: "Planning",
    description: "Agents analyzing task and creating strategy",
    icon: Brain,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    pulseColor: "bg-purple-400",
  },
  ACTING: {
    label: "Acting",
    description: "Agents executing tasks and generating code",
    icon: Zap,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    pulseColor: "bg-yellow-400",
  },
  REFLECTING: {
    label: "Reflecting",
    description: "Agents reviewing results and improving",
    icon: Eye,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    pulseColor: "bg-cyan-400",
  },
  COMPLETED: {
    label: "Completed",
    description: "All tasks finished successfully",
    icon: CheckCircle2,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    pulseColor: "bg-green-400",
  },
};

interface PhaseIndicatorProps {
  currentPhase: Phase;
  phaseProgress?: number; // 0-100 for current phase
  cycleCount?: number;
  autoCycle?: boolean;
  onPhaseChange?: (phase: Phase) => void;
  className?: string;
  compact?: boolean;
}

// Hook to manage phase cycling
export function usePhaseCycler() {
  const [phase, setPhase] = useState<Phase>("IDLE");
  const [progress, setProgress] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const startCycle = useCallback(() => {
    setPhase("PLANNING");
    setProgress(0);
    setIsRunning(true);
  }, []);

  const stopCycle = useCallback(() => {
    setPhase("IDLE");
    setProgress(0);
    setIsRunning(false);
  }, []);

  const completeCycle = useCallback(() => {
    setPhase("COMPLETED");
    setIsRunning(false);
  }, []);

  const nextPhase = useCallback(() => {
    setPhase((prev) => {
      const phases: Phase[] = ["PLANNING", "ACTING", "REFLECTING"];
      const currentIndex = phases.indexOf(prev);
      if (currentIndex === -1) return prev;

      const nextIndex = (currentIndex + 1) % phases.length;

      // If we're completing a full cycle (returning to PLANNING)
      if (nextIndex === 0) {
        setCycleCount((c) => c + 1);
      }

      return phases[nextIndex];
    });
    setProgress(0);
  }, []);

  const setPhaseProgress = useCallback((value: number) => {
    setProgress(Math.min(100, Math.max(0, value)));
  }, []);

  return {
    phase,
    progress,
    cycleCount,
    isRunning,
    startCycle,
    stopCycle,
    completeCycle,
    nextPhase,
    setPhaseProgress,
    setPhase,
  };
}

export function PhaseIndicator({
  currentPhase,
  phaseProgress = 0,
  cycleCount = 0,
  className = "",
  compact = false,
}: PhaseIndicatorProps) {
  const config = PHASE_CONFIG[currentPhase];
  const Icon = config.icon;

  // All phases for the timeline
  const phases: Phase[] = ["PLANNING", "ACTING", "REFLECTING"];
  const phaseIndex = phases.indexOf(currentPhase);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center",
          config.bgColor
        )}>
          {currentPhase === "ACTING" || currentPhase === "PLANNING" ? (
            <Loader2 className={cn("w-3 h-3 animate-spin", config.color)} />
          ) : (
            <Icon className={cn("w-3 h-3", config.color)} />
          )}
        </div>
        <span className={cn("text-xs font-medium", config.color)}>
          {config.label}
        </span>
        {cycleCount > 0 && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            Cycle {cycleCount}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main Phase Display */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "relative w-10 h-10 rounded-xl flex items-center justify-center",
          config.bgColor,
          "transition-all duration-300"
        )}>
          {/* Pulse animation for active phases */}
          {(currentPhase === "ACTING" || currentPhase === "PLANNING" || currentPhase === "REFLECTING") && (
            <div className={cn(
              "absolute inset-0 rounded-xl animate-ping opacity-30",
              config.pulseColor
            )} />
          )}
          {currentPhase === "ACTING" || currentPhase === "PLANNING" ? (
            <Loader2 className={cn("w-5 h-5 animate-spin relative z-10", config.color)} />
          ) : (
            <Icon className={cn("w-5 h-5 relative z-10", config.color)} />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-bold", config.color)}>
              {config.label}
            </span>
            {cycleCount > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Cycle {cycleCount}
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">{config.description}</p>
        </div>
      </div>

      {/* Progress Bar */}
      {currentPhase !== "IDLE" && currentPhase !== "COMPLETED" && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Phase Progress</span>
            <span>{Math.round(phaseProgress)}%</span>
          </div>
          <Progress value={phaseProgress} className="h-1.5" />
        </div>
      )}

      {/* Phase Timeline */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Cycle Progress</span>
        </div>
        <div className="flex items-center gap-1">
          {phases.map((phase, index) => {
            const phaseCfg = PHASE_CONFIG[phase];
            const isActive = phase === currentPhase;
            const isPast = phaseIndex > index;
            const PhaseIcon = phaseCfg.icon;

            return (
              <div key={phase} className="flex-1 flex items-center">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                    isActive ? phaseCfg.bgColor : isPast ? "bg-primary/30" : "bg-muted/30"
                  )}
                >
                  <PhaseIcon
                    className={cn(
                      "w-3 h-3",
                      isActive
                        ? phaseCfg.color
                        : isPast
                          ? "text-primary"
                          : "text-muted-foreground/50"
                    )}
                  />
                </div>
                {index < phases.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-1",
                      isPast ? "bg-primary/50" : "bg-muted/30"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between text-[9px] text-muted-foreground/70">
          {phases.map((phase) => (
            <span key={phase} className="flex-1 text-center">
              {PHASE_CONFIG[phase].label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Default export for the main component
export default PhaseIndicator;
