import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Sparkles, ArrowRight, Terminal, Users, Gamepad2, Zap } from "lucide-react";

interface WelcomeScreenProps {
  onComplete: () => void;
}

const FEATURES = [
  {
    icon: Users,
    title: "AI Agent Swarm",
    description: "Deploy multiple AI agents that work together on tasks",
  },
  {
    icon: Terminal,
    title: "Real CLI Integration",
    description: "Connects to Claude Code, Cursor, or runs in demo mode",
  },
  {
    icon: Gamepad2,
    title: "Interactive Office",
    description: "Walk around and watch your agents collaborate",
  },
  {
    icon: Zap,
    title: "Real-time Updates",
    description: "See agent progress with live status indicators",
  },
];

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < FEATURES.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <Card className="relative w-full max-w-lg m-4 overflow-hidden bg-card/80 backdrop-blur-xl border-border/50">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center border-b border-border/50">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">SwarmVille</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">AI Agent Collaboration</h1>
          <p className="text-sm text-muted-foreground">
            A virtual office where AI agents work together
          </p>
        </div>

        {/* Feature showcase */}
        <div className="px-8 py-6">
          <div className="relative">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = index === step;
              const isPast = index < step;

              return (
                <div
                  key={feature.title}
                  className={`
                    transition-all duration-300 ease-out
                    ${isActive ? "opacity-100" : "opacity-0 absolute inset-0"}
                    ${isPast ? "-translate-x-full" : isActive ? "" : "translate-x-full"}
                  `}
                >
                  {isActive && (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 animate-float">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                      <h2 className="text-lg font-semibold mb-2">{feature.title}</h2>
                      <p className="text-sm text-muted-foreground max-w-xs">
                        {feature.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-6">
            {FEATURES.map((_, index) => (
              <button
                key={index}
                onClick={() => setStep(index)}
                className={`
                  w-2 h-2 rounded-full transition-all
                  ${index === step ? "w-6 bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"}
                `}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 flex gap-3">
          <Button variant="ghost" onClick={handleSkip} className="flex-1">
            Skip
          </Button>
          <Button onClick={handleNext} className="flex-1 gap-2">
            {step === FEATURES.length - 1 ? (
              <>
                Get Started
                <Sparkles className="w-4 h-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>

        {/* Tips */}
        <div className="px-8 pb-6 border-t border-border/50 pt-4">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <Badge variant="outline" className="font-mono">
              WASD
            </Badge>
            <span>to move</span>
            <Badge variant="outline" className="font-mono">
              ?
            </Badge>
            <span>for help</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
