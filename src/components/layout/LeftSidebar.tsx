import { useHotkeys } from "react-hotkeys-hook";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { useUIStore } from "../../stores/uiStore";
import { useUserStore } from "../../stores/userStore";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { cn } from "@/lib/utils";

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
        <div className="h-12 px-4 flex items-center justify-between border-b border-border/50">
          {!leftSidebarCollapsed ? (
            <div className="flex items-center gap-3 flex-1">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {level}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Level {level}
                  </span>
                  <Badge variant="secondary" className="h-4 text-xs px-1.5">
                    {xp} / {xpToNextLevel()}
                  </Badge>
                </div>
                <Progress value={(xp / xpToNextLevel()) * 100} className="h-1 mt-1" />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center flex-1">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {level}
                </div>
                {activeMissions.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
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
