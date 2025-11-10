import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import {
  Sparkles,
  Gamepad2,
  Target,
  Zap,
  Trophy,
  ChevronRight,
  Check
} from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  action: string;
  reward: number;
  icon: any;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "move",
    title: "Move Around",
    description: "Use WASD keys to walk around the space",
    action: "Move 10 steps",
    reward: 100,
    icon: Gamepad2
  },
  {
    id: "create-space",
    title: "Create Your World",
    description: "Click 'New Space' to create your own workspace",
    action: "Create a new space",
    reward: 250,
    icon: Sparkles
  },
  {
    id: "spawn-agent",
    title: "Summon AI Helper",
    description: "Click 'Add Agent' to bring an AI assistant to life",
    action: "Spawn your first agent",
    reward: 500,
    icon: Zap
  },
  {
    id: "assign-task",
    title: "Give a Mission",
    description: "Tell your agent what to build - they'll write real code!",
    action: "Assign a task to agent",
    reward: 1000,
    icon: Target
  }
];

interface TutorialSystemProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function TutorialSystem({ onComplete, onSkip }: TutorialSystemProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [totalXP, setTotalXP] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const step = TUTORIAL_STEPS[currentStep];
  const progress = (completedSteps.size / TUTORIAL_STEPS.length) * 100;

  const completeStep = () => {
    if (!completedSteps.has(step.id)) {
      setCompletedSteps(new Set([...completedSteps, step.id]));
      setTotalXP(totalXP + step.reward);
      setShowCelebration(true);

      setTimeout(() => {
        setShowCelebration(false);
        if (currentStep < TUTORIAL_STEPS.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          onComplete();
        }
      }, 2000);
    }
  };

  // Listen for game events to auto-progress tutorial
  useEffect(() => {
    const handleMoveEvent = () => {
      if (step.id === "move") completeStep();
    };

    const handleSpaceCreated = () => {
      if (step.id === "create-space") completeStep();
    };

    const handleAgentSpawned = () => {
      if (step.id === "spawn-agent") completeStep();
    };

    window.addEventListener("player-moved", handleMoveEvent);
    window.addEventListener("space-created", handleSpaceCreated);
    window.addEventListener("agent-spawned", handleAgentSpawned);

    return () => {
      window.removeEventListener("player-moved", handleMoveEvent);
      window.removeEventListener("space-created", handleSpaceCreated);
      window.removeEventListener("agent-spawned", handleAgentSpawned);
    };
  }, [step.id]);

  const Icon = step.icon;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Celebration overlay */}
      {showCelebration && (
        <div className="absolute inset-0 flex items-center justify-center z-60 pointer-events-none">
          <div className="text-8xl animate-bounce">🎉</div>
        </div>
      )}

      <Card className="w-full max-w-2xl shadow-2xl border-2 relative overflow-hidden">
        {/* Progress bar at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">
                  {step.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Step {currentStep + 1} of {TUTORIAL_STEPS.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                <Trophy className="w-4 h-4 mr-1" />
                {totalXP} XP
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 pb-6 space-y-6">
          {/* Description */}
          <div className="text-center space-y-2">
            <p className="text-lg text-muted-foreground">
              {step.description}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
              <Target className="w-4 h-4 text-primary" />
              <span className="font-semibold text-primary">{step.action}</span>
            </div>
          </div>

          {/* Visual progress */}
          <div className="grid grid-cols-4 gap-4 py-4">
            {TUTORIAL_STEPS.map((s, i) => {
              const StepIcon = s.icon;
              const isCompleted = completedSteps.has(s.id);
              const isCurrent = i === currentStep;

              return (
                <div
                  key={s.id}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                    isCurrent
                      ? "bg-primary/20 ring-2 ring-primary scale-110"
                      : isCompleted
                      ? "bg-green-500/20"
                      : "bg-muted/50 opacity-50"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted ? "bg-green-500" : isCurrent ? "bg-primary" : "bg-muted"
                  }`}>
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <StepIcon className={`w-5 h-5 ${isCurrent ? "text-white" : "text-muted-foreground"}`} />
                    )}
                  </div>
                  <span className="text-xs font-medium text-center">
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Reward preview */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span>Complete to earn <strong className="text-foreground">+{step.reward} XP</strong></span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onSkip}
              className="flex-1"
            >
              Skip Tutorial
            </Button>
            <Button
              onClick={completeStep}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90"
            >
              {completedSteps.has(step.id) ? "Next" : "Mark Complete"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
