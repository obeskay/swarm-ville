import { Wallet, Plus, Sparkles, Zap, Bot, ChevronRight, ChevronLeft } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useSpaceStore } from "../../stores/spaceStore";
import { useUserStore } from "../../stores/userStore";
import { useUIStore } from "../../stores/uiStore";
import { useAchievementStore } from "../../stores/achievementStore";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import SpriteGeneratorDialog from "../ai/SpriteGeneratorDialog";

export function TopToolbar() {
  const { currentSpaceId, spaces, agents, addSpace } = useSpaceStore();
  const { balance = 0, level, xp, xpToNextLevel, missions } = useUserStore();
  const { leftSidebarCollapsed, rightSidebarCollapsed, toggleLeftSidebar, toggleRightSidebar } = useUIStore();
  const { progress, levelInfo, setUserId, updateStats } = useAchievementStore();
  const currentSpace = spaces.find((s) => s.id === currentSpaceId);
  const agentCount = agents.size;
  const activeMissionsCount = Object.values(missions).filter((m) => !m.completed).length;
  const [showSpriteGenerator, setShowSpriteGenerator] = useState(false);

  // Initialize achievement system
  useEffect(() => {
    setUserId("default_user");
  }, [setUserId]);

  // Update achievement stats when agents/spaces change
  useEffect(() => {
    updateStats({
      totalAgents: agentCount,
      totalSpaces: spaces.length,
    });
  }, [agentCount, spaces.length, updateStats]);

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
        {/* Left Section: Level, Space Info, Missions Toggle */}
        <div className="flex items-center gap-3">
          {/* Missions Toggle (when collapsed) */}
          {leftSidebarCollapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleLeftSidebar}
                  className="h-8 w-8 relative"
                >
                  <Zap className="h-4 w-4 text-primary" />
                  {activeMissionsCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                      {activeMissionsCount}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Missions (⌘B)</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Level Badge with XP */}
          {progress && levelInfo && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-xs shadow-sm">
                    {progress.level}
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-[60px]">
                    <div className="text-xs font-medium text-foreground/70 leading-none">
                      {levelInfo.currentXp} / 1000
                    </div>
                    <Progress value={levelInfo.progressPercentage} className="h-0.5 bg-background/50" />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Level {progress.level} - {Math.floor(levelInfo.progressPercentage)}% to next level</p>
              </TooltipContent>
            </Tooltip>
          )}

          {currentSpace && (
            <>
              <div className="w-px h-4 bg-border/30" />
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-sm tracking-tight">SwarmVille</h1>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs font-medium text-muted-foreground">
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

          {/* Right Sidebar Toggle (when collapsed) */}
          {rightSidebarCollapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleRightSidebar}
                  className="h-8 w-8 relative"
                >
                  <Bot className="h-4 w-4" />
                  {agentCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                      {agentCount}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Agents (⌘.)</p>
              </TooltipContent>
            </Tooltip>
          )}
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
