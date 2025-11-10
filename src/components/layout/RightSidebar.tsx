import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { ChevronLeft, ChevronRight, Bot, BarChart3, Activity, Plus } from "lucide-react";
import { useUIStore } from "../../stores/uiStore";
import { useSpaceStore } from "../../stores/spaceStore";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { cn } from "@/lib/utils";
import AgentSpawner from "../agents/AgentSpawner";

interface RightSidebarProps {
  spaceId?: string;
}

export function RightSidebar({ spaceId = "default" }: RightSidebarProps) {
  const rightSidebarCollapsed = useUIStore((state) => state.rightSidebarCollapsed);
  const toggleRightSidebar = useUIStore((state) => state.toggleRightSidebar);
  const { agents } = useSpaceStore();
  const [activeTab, setActiveTab] = useState("agents");
  const [showSpawner, setShowSpawner] = useState(false);

  const agentList = Array.from(agents.values());

  useHotkeys("mod+.", () => {
    toggleRightSidebar();
  });

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col sidebar-modern border-l">
        {/* Header */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-border/50">
          {!rightSidebarCollapsed && (
            <span className="font-semibold text-sm tracking-tight">Context</span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleRightSidebar}
                className="h-8 w-8 hover:bg-accent"
              >
                {rightSidebarCollapsed ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Toggle sidebar (Cmd+.)</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {rightSidebarCollapsed ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 relative hover:bg-accent"
                  onClick={toggleRightSidebar}
                >
                  <Bot className="h-5 w-5" />
                  {agentList.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {agentList.length}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Agents ({agentList.length})</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-accent">
                  <BarChart3 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Metrics</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-accent">
                  <Activity className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Activity</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-3">
              <TabsTrigger value="agents" className="flex-1">
                <Bot className="h-4 w-4 mr-2" />
                Agents
              </TabsTrigger>
              <TabsTrigger value="metrics" className="flex-1">
                <BarChart3 className="h-4 w-4 mr-2" />
                Metrics
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex-1">
                <Activity className="h-4 w-4 mr-2" />
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="agents" className="flex-1 flex flex-col mt-0">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {agentList.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                        <Bot className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <h4 className="font-semibold mb-2">No agents yet</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Agents help automate tasks
                      </p>
                      <Button onClick={() => setShowSpawner(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Agent
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {agentList.map((agent) => (
                          <div
                            key={agent.id}
                            className="card-minimal hover:shadow-md cursor-pointer group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-primary text-primary-foreground">
                                    {agent.avatar?.emoji || agent.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div
                                  className={cn(
                                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                                    "bg-emerald-500 dark:bg-emerald-400"
                                  )}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                                  {agent.name}
                                </div>
                                <div className="text-xs text-muted-foreground capitalize">
                                  {agent.role}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        size="default"
                        className="w-full"
                        variant="outline"
                        onClick={() => setShowSpawner(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Agent
                      </Button>
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="metrics" className="flex-1 flex flex-col mt-0">
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                    <BarChart3 className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Metrics coming soon</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="flex-1 flex flex-col mt-0">
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                    <Activity className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Activity feed coming soon</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Agent Spawner Modal - positioned absolutely with proper z-index */}
      {showSpawner && (
        <div className="fixed inset-0 z-50 pointer-events-auto">
          <AgentSpawner spaceId={spaceId} onClose={() => setShowSpawner(false)} />
        </div>
      )}
    </TooltipProvider>
  );
}
