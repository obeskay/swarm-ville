import { Wallet, Plus, Sparkles, Zap, Bot } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { InfoBadge } from "../ui/info-badge";
import { StatusIndicator } from "../ui/status-indicator";
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
import { useState, useEffect } from "react";
import SpriteGeneratorDialog from "../ai/SpriteGeneratorDialog";
import { SpaceCreationDialog } from "../space/SpaceCreationDialog";
import { useToolbarUIConfig } from "@/hooks/useUIConfig";
import { useThemeConfig } from "@/hooks/useThemeConfig";
import { useToolbarConfig } from "@/hooks/useLayoutConfig";

export function TopToolbar() {
  const { currentSpaceId, spaces, agents } = useSpaceStore();
  const { balance = 0, missions } = useUserStore();
  const { leftSidebarCollapsed, rightSidebarCollapsed, toggleLeftSidebar, toggleRightSidebar } =
    useUIStore();
  const { setUserId, updateStats } = useAchievementStore();
  const toolbarUI = useToolbarUIConfig();
  const theme = useThemeConfig();
  const toolbarLayout = useToolbarConfig();
  const currentSpace = spaces.find((s) => s.id === currentSpaceId);
  const agentCount = agents.size;
  const activeMissionsCount = Object.values(missions).filter((m) => !m.completed).length;
  const [showSpriteGenerator, setShowSpriteGenerator] = useState(false);
  const [showSpaceCreation, setShowSpaceCreation] = useState(false);

  // Initialize achievement system
  useEffect(() => {
    setUserId("default_user").catch((err) => {
      console.warn("Achievement system not available:", err);
    });
  }, [setUserId]);

  // Update achievement stats when agents/spaces change
  useEffect(() => {
    updateStats({
      totalAgents: agentCount,
      totalSpaces: spaces.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentCount, spaces.length]);

  const handleCreateNewSpace = () => {
    setShowSpaceCreation(true);
  };

  return (
    <TooltipProvider>
      <div
        style={{
          height: `${toolbarLayout.height}px`,
          backgroundColor: toolbarUI.backgroundColor,
          borderBottomColor: toolbarUI.borderBottomColor,
          borderBottomWidth: 1,
        }}
        className="px-4 flex items-center justify-between"
      >
        {/* Left Section: Space Info + Missions Toggle */}
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

          {currentSpace && (
            <div className="flex items-center gap-2">
              <h1
                style={{
                  color: toolbarUI.logoColor,
                  fontSize: `${toolbarUI.logoFontSize}px`,
                  fontWeight: toolbarUI.logoFontWeight,
                }}
              >
                {toolbarUI.logoText}
              </h1>
              <span style={{ color: theme.colors.text.dark.tertiary }}>•</span>
              <span style={{ color: theme.colors.text.dark.secondary, fontSize: "12px" }}>
                {currentSpace.name}
              </span>
            </div>
          )}
        </div>

        {/* Right Section: Stats + Actions */}
        <div className="flex items-center gap-2">
          {/* Agent Count with status indicator */}
          {currentSpace && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <InfoBadge
                    variant="default"
                    size="sm"
                    icon={
                      <StatusIndicator
                        variant={agentCount > 0 ? "online" : "idle"}
                        size="sm"
                        showDot={true}
                        label=""
                      />
                    }
                    label={agentCount === 1 ? "agent" : "agents"}
                    value={agentCount}
                  />
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
              <div>
                <InfoBadge
                  variant="primary"
                  size="sm"
                  icon={<Wallet className="h-3.5 w-3.5 text-primary" />}
                  value={`$${balance.toFixed(2)}`}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Agent credits</p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-4 mx-1" />

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

      {/* Space Creation Dialog */}
      {showSpaceCreation && (
        <SpaceCreationDialog open={showSpaceCreation} onClose={() => setShowSpaceCreation(false)} />
      )}

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
