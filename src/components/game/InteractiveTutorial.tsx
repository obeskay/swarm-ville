/**
 * Interactive tutorial that teaches by doing
 * Shows contextual hints and celebrates progress
 */

import { useEffect, useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  MousePointer2,
  Sparkles,
  Users,
} from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  highlight?: string; // Element to highlight
  position: "center" | "bottom" | "top" | "left" | "right";
  canSkip: boolean;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to SwarmVille!",
    description:
      "A magical place where AI agents work together to build real software. Let's get started!",
    icon: <Sparkles className="w-6 h-6 text-yellow-500" />,
    position: "center",
    canSkip: true,
  },
  {
    id: "movement_wasd",
    title: "Move Around",
    description: "Use WASD keys or arrow keys to walk around your space",
    icon: (
      <div className="flex gap-1">
        <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center">
          <ArrowUp className="w-4 h-4" />
        </div>
        <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </div>
        <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center">
          <ArrowDown className="w-4 h-4" />
        </div>
        <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    ),
    position: "bottom",
    canSkip: false,
  },
  {
    id: "movement_click",
    title: "Click to Move",
    description: "You can also click anywhere to walk there automatically",
    icon: <MousePointer2 className="w-6 h-6 text-blue-500" />,
    position: "bottom",
    canSkip: false,
  },
  {
    id: "spawn_agent",
    title: "Create Your First Agent",
    description:
      "Click the 'Add Agent' button in the bottom-right to create your first AI teammate",
    icon: <Users className="w-6 h-6 text-green-500" />,
    highlight: ".agent-panel",
    position: "right",
    canSkip: false,
  },
];

export function InteractiveTutorial() {
  const { tutorialStep, tutorialCompleted, setTutorialStep, completeTutorial } =
    useGameStore();
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (tutorialCompleted) {
      setVisible(false);
      return;
    }

    // Show tutorial after a brief delay
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [tutorialCompleted]);

  useEffect(() => {
    setCurrentStep(tutorialStep);
  }, [tutorialStep]);

  if (!visible || tutorialCompleted || currentStep >= TUTORIAL_STEPS.length) {
    return null;
  }

  const step = TUTORIAL_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep + 1 >= TUTORIAL_STEPS.length) {
      completeTutorial();
      setVisible(false);
    } else {
      setTutorialStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    completeTutorial();
    setVisible(false);
  };

  const getPositionClasses = () => {
    switch (step.position) {
      case "center":
        return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
      case "bottom":
        return "bottom-24 left-1/2 -translate-x-1/2";
      case "top":
        return "top-24 left-1/2 -translate-x-1/2";
      case "left":
        return "left-24 top-1/2 -translate-y-1/2";
      case "right":
        return "right-24 top-1/2 -translate-y-1/2";
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-background/80 z-40 animate-in fade-in duration-300" />

      {/* Tutorial Card */}
      <Card
        className={`
          fixed ${getPositionClasses()} z-50
          bg-background/98 backdrop-blur-md shadow-2xl
          border-2 border-primary/30
          max-w-md
          animate-in slide-in-from-bottom-4 fade-in duration-500
        `}
      >
        <div className="p-6">
          {/* Icon and Progress */}
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              {step.icon}
            </div>
            <div className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {TUTORIAL_STEPS.length}
            </div>
          </div>

          {/* Title and Description */}
          <h2 className="text-xl font-bold mb-2">{step.title}</h2>
          <p className="text-muted-foreground mb-6">{step.description}</p>

          {/* Progress Bar */}
          <div className="mb-6 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%`,
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {step.canSkip && (
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex-1"
              >
                Skip Tutorial
              </Button>
            )}
            <Button onClick={handleNext} className="flex-1">
              {currentStep + 1 >= TUTORIAL_STEPS.length
                ? "Let's Go!"
                : "Next"}
            </Button>
          </div>

          {/* Keyboard Hint */}
          {step.id === "movement_wasd" && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground text-center mb-2">
                Try it now! Move around with:
              </div>
              <div className="flex justify-center gap-4">
                <div className="text-xs">
                  <kbd className="px-2 py-1 bg-background rounded border text-xs">
                    W
                  </kbd>
                  <kbd className="px-2 py-1 bg-background rounded border text-xs">
                    A
                  </kbd>
                  <kbd className="px-2 py-1 bg-background rounded border text-xs">
                    S
                  </kbd>
                  <kbd className="px-2 py-1 bg-background rounded border text-xs">
                    D
                  </kbd>
                </div>
                <div className="text-xs text-muted-foreground">or</div>
                <div className="text-xs">
                  <kbd className="px-2 py-1 bg-background rounded border text-xs">
                    ↑
                  </kbd>
                  <kbd className="px-2 py-1 bg-background rounded border text-xs">
                    ←
                  </kbd>
                  <kbd className="px-2 py-1 bg-background rounded border text-xs">
                    ↓
                  </kbd>
                  <kbd className="px-2 py-1 bg-background rounded border text-xs">
                    →
                  </kbd>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Highlight Arrow for specific elements */}
      {step.highlight && (
        <div className="fixed bottom-36 right-12 z-50 animate-bounce">
          <div className="w-16 h-16 text-primary">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="drop-shadow-lg"
            >
              <path d="M7.33 24l-2.83-2.829 9.339-9.175-9.339-9.167 2.83-2.829 12.17 11.996z" />
            </svg>
          </div>
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-bold text-primary bg-background px-3 py-1 rounded-full shadow-lg border-2 border-primary">
            Click here!
          </div>
        </div>
      )}
    </>
  );
}
