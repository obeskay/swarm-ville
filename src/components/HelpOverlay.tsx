import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { X, Keyboard, Mouse, Info } from "lucide-react";

interface ShortcutProps {
  keys: string[];
  description: string;
}

function Shortcut({ keys, description }: ShortcutProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{description}</span>
      <div className="flex gap-1">
        {keys.map((key, i) => (
          <kbd
            key={i}
            className="px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}

export function HelpOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" || (e.key === "h" && !e.ctrlKey && !e.metaKey)) {
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Hide hint after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  if (!isOpen) {
    return showHint ? (
      <div className="absolute bottom-3 right-3 z-40 animate-in fade-in slide-in-from-bottom-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs bg-card/80 backdrop-blur"
          onClick={() => setIsOpen(true)}
        >
          <Keyboard className="w-3 h-3" />
          Press ? for help
        </Button>
      </div>
    ) : null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-md p-6 m-4 shadow-2xl border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">SwarmVille Help</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Movement */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Keyboard className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Movement</h3>
            </div>
            <div className="pl-6 space-y-0.5">
              <Shortcut keys={["W", "A", "S", "D"]} description="Move player" />
              <Shortcut keys={["Arrow Keys"]} description="Alternative movement" />
            </div>
          </div>

          <Separator />

          {/* Camera */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Mouse className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Camera</h3>
            </div>
            <div className="pl-6 space-y-0.5">
              <Shortcut keys={["Click Minimap"]} description="Jump to location" />
              <Shortcut keys={["F"]} description="Follow player" />
            </div>
          </div>

          <Separator />

          {/* General */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">General</h3>
            </div>
            <div className="pl-6 space-y-0.5">
              <Shortcut keys={["?"]} description="Toggle this help" />
              <Shortcut keys={["Esc"]} description="Close dialogs" />
            </div>
          </div>

          <Separator />

          {/* Agent info */}
          <div className="p-3 rounded-lg bg-muted/50">
            <h3 className="text-sm font-medium mb-2">Agent Roles</h3>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-purple-400 border-purple-400/30">
                Researcher
              </Badge>
              <Badge variant="outline" className="text-pink-400 border-pink-400/30">
                Designer
              </Badge>
              <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                Developer
              </Badge>
              <Badge variant="outline" className="text-green-400 border-green-400/30">
                Reviewer
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Each agent specializes in different tasks and works autonomously to complete your
              request.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            SwarmVille - AI Agent Collaboration Environment
          </p>
        </div>
      </Card>
    </div>
  );
}
