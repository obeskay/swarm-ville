import { useHotkeys } from "react-hotkeys-hook";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { useUIStore } from "../../stores/uiStore";
import { useUserStore } from "../../stores/userStore";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";

export function LeftSidebar() {
  const leftSidebarCollapsed = useUIStore((state) => state.leftSidebarCollapsed);
  const toggleLeftSidebar = useUIStore((state) => state.toggleLeftSidebar);
  const missions = useUserStore((state) => state.missions);
  const { level, xp, xpToNextLevel } = useUserStore();

  // Keyboard shortcut: Cmd/Ctrl+B
  useHotkeys("mod+b", () => {
    toggleLeftSidebar();
  });

  const activeMissions = Object.values(missions).filter((m) => !m.completed);

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col bg-card">
        {/* Compact Header with Level */}
        <div className="h-14 px-4 py-3 flex items-center justify-between border-b border-border/50">
          {!leftSidebarCollapsed ? (
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-xs">
                  {level}
                </div>
                <span className="text-sm font-semibold text-foreground">Level {level}</span>
              </div>
              <div className="flex items-center gap-2 px-1">
                <Progress value={(xp / xpToNextLevel()) * 100} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground font-medium min-w-[28px] text-right">
                  {Math.round((xp / xpToNextLevel()) * 100)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center flex-1">
              <div className="relative">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-xs">
                  {level}
                </div>
                {activeMissions.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {activeMissions.length}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLeftSidebar}
                className="h-8 w-8 hover:bg-accent"
              >
                {leftSidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Toggle missions (⌘B)</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Collapsed state - just icons */}
        {leftSidebarCollapsed && (
          <div className="flex-1 flex items-center justify-center py-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 hover:bg-accent"
                  onClick={toggleLeftSidebar}
                >
                  <Zap className="h-5 w-5 text-primary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{activeMissions.length} active missions</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Expanded state - mission count only */}
        {!leftSidebarCollapsed && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <p className="text-2xl font-bold mb-1">{activeMissions.length}</p>
              <p className="text-xs text-muted-foreground">
                {activeMissions.length === 1 ? "Active Mission" : "Active Missions"}
              </p>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
