import { Wallet, Plus, Sparkles } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useSpaceStore } from "../../stores/spaceStore";
import { useUserStore } from "../../stores/userStore";
import { cn } from "@/lib/utils";
import { useState } from "react";
import SpriteGeneratorDialog from "../ai/SpriteGeneratorDialog";

export function TopToolbar() {
  const { currentSpaceId, spaces, agents, addSpace } = useSpaceStore();
  const { balance = 0 } = useUserStore();
  const currentSpace = spaces.find((s) => s.id === currentSpaceId);
  const agentCount = agents.size;
  const [showSpriteGenerator, setShowSpriteGenerator] = useState(false);

  const handleCreateNewSpace = () => {
    const newSpaceId = crypto.randomUUID();
    addSpace({
      id: newSpaceId,
      name: `Space ${new Date().toLocaleTimeString()}`,
      ownerId: "local-user",
      dimensions: { width: 80, height: 80 },
      tileset: { floor: "grass", theme: "modern" },
      tilemap: undefined,
      agents: [],
      settings: { proximityRadius: 5, maxAgents: 10, snapToGrid: true },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  return (
    <TooltipProvider>
      <div className="h-12 px-4 flex items-center justify-between bg-card">
        {/* Left Section: Space Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-base tracking-tight">SwarmVille</h1>
          </div>

          {currentSpace && (
            <>
              <div className="w-px h-4 bg-border/30" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {currentSpace.name}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right Section: Stats + Actions */}
        <div className="flex items-center gap-2">
          {/* Agent Count */}
          {currentSpace && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border/40 hover:border-border/60 transition-all">
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      agentCount > 0
                        ? "bg-emerald-500 dark:bg-emerald-400"
                        : "bg-muted-foreground/30"
                    )}
                  />
                  <span className="text-sm font-medium tabular-nums">{agentCount}</span>
                  <span className="text-xs text-muted-foreground">
                    {agentCount === 1 ? "agent" : "agents"}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Active agents in space</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Balance */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 hover:border-primary/30 transition-all">
                <Wallet className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  ${balance.toFixed(4)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Agent credits</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-border/30 mx-1" />

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleCreateNewSpace}>
                <Plus className="h-4 w-4 mr-2" />
                New Space
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowSpriteGenerator(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Sprite
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>

      {/* Sprite Generator Dialog */}
      {showSpriteGenerator && (
        <SpriteGeneratorDialog
          onClose={() => setShowSpriteGenerator(false)}
          onSpriteGenerated={() => setShowSpriteGenerator(false)}
        />
      )}
    </TooltipProvider>
  );
}
