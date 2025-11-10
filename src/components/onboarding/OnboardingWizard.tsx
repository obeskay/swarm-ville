import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Rocket, Gamepad2, Users, Zap } from "lucide-react";
import { useState, useEffect } from "react";

interface OnboardingWizardProps {
  onComplete: () => void;
}

export default function OnboardingWizard({
  onComplete,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(1);

  useEffect(() => {
    // Quick splash screen, then interactive tutorial takes over
    const timer = setTimeout(() => {
      onComplete();
    }, 500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-background to-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <Card className="w-full max-w-2xl relative z-10 border-2">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center text-center space-y-8">
            {/* Header */}
            <div className="flex flex-col items-center space-y-3">
              <div
                className={`w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-700 ${
                  step >= 1 ? "scale-100 opacity-100" : "scale-75 opacity-0"
                }`}
              >
                <Rocket className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                  SwarmVille
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Multi-agent collaborative workspace
                </p>
              </div>
            </div>

            {/* Feature Grid */}
            {step >= 1 && (
              <div className="grid grid-cols-3 gap-4 w-full opacity-0 animate-fadeIn">
                <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-muted/50">
                  <Gamepad2 className="w-6 h-6 text-primary" />
                  <span className="text-xs font-medium">WASD Control</span>
                </div>
                <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-muted/50">
                  <Users className="w-6 h-6 text-blue-500" />
                  <span className="text-xs font-medium">Real-time Sync</span>
                </div>
                <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-muted/50">
                  <Zap className="w-6 h-6 text-yellow-500" />
                  <span className="text-xs font-medium">AI Agents</span>
                </div>
              </div>
            )}

            {/* Description */}
            {step >= 1 && (
              <div className="space-y-3 opacity-0 animate-fadeIn">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Navigate with{" "}
                  <span className="font-semibold text-foreground">WASD</span>,
                  click to move, scroll to zoom. Collaborate in real-time with
                  other users and AI agents.
                </p>
              </div>
            )}

            {/* CTA Button */}
            <Button
              onClick={onComplete}
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 transition-all text-white font-semibold"
            >
              {step >= 1 ? "Enter Workspace" : "Loading..."}
            </Button>

            {/* Footer */}
            <p className="text-xs text-muted-foreground">
              💡 Space automatically created for you
            </p>
          </div>
        </CardContent>
      </Card>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}
