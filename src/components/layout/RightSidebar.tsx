import { useState, useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { ChevronLeft, ChevronRight, Bot, BarChart3, Activity, Plus, Zap, DollarSign, Clock } from "lucide-react";
import { useUIStore } from "../../stores/uiStore";
import { useSpaceStore } from "../../stores/spaceStore";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { cn } from "@/lib/utils";
import AgentSpawner from "../agents/AgentSpawner";
import { agentMetrics } from "../../lib/agents/AgentMetrics";

interface RightSidebarProps {
  spaceId?: string;
}

export function RightSidebar({ spaceId = "default" }: RightSidebarProps) {
  const rightSidebarCollapsed = useUIStore((state) => state.rightSidebarCollapsed);
  const toggleRightSidebar = useUIStore((state) => state.toggleRightSidebar);
  const { agents } = useSpaceStore();
  const [activeTab, setActiveTab] = useState("agents");
  const [showSpawner, setShowSpawner] = useState(false);
  const [metrics, setMetrics] = useState(agentMetrics.getAllMetrics());
  const [activityLog, setActivityLog] = useState<Array<{ id: string; type: string; message: string; timestamp: Date }>>([]);

  const agentList = Array.from(agents.values());

  // Update metrics
  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(agentMetrics.getAllMetrics());
    };
    const unsubscribe = agentMetrics.subscribe(updateMetrics);
    return unsubscribe;
  }, []);

  // Mock activity log
  useEffect(() => {
    const handleAgentActivity = (event: CustomEvent) => {
      const { agentId, action, details } = event.detail;
      const agent = agentList.find(a => a.id === agentId);
      setActivityLog(prev => [{
        id: `${Date.now()}-${Math.random()}`,
        type: action,
        message: `${agent?.name || 'Agent'} ${details || action}`,
        timestamp: new Date()
      }, ...prev].slice(0, 50));
    };

    window.addEventListener('agent-activity', handleAgentActivity as EventListener);
    return () => window.removeEventListener('agent-activity', handleAgentActivity as EventListener);
  }, [agentList]);

  useHotkeys("mod+.", () => {
    toggleRightSidebar();
  });

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col border-l border-border/50">
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
                    <div className="text-center py-16 px-4 animate-fade-in-up">
                      <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 shadow-sm">
                        <Bot className="w-8 h-8 text-primary" />
                      </div>
                      <h4 className="font-semibold text-base mb-2">No agents yet</h4>
                      <p className="text-sm text-muted-foreground mb-6 max-w-[200px] mx-auto leading-relaxed">
                        Agents help automate tasks and boost productivity
                      </p>
                      <Button
                        onClick={() => setShowSpawner(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Agent
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 stagger-children">
                        {agentList.map((agent) => (
                          <Card
                            key={agent.id}
                            variant="minimal"
                            padding="default"
                            className="cursor-pointer group"
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
                          </Card>
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
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <Card variant="minimal" padding="default">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs text-muted-foreground">Total Tokens</span>
                      </div>
                      <div className="text-lg font-bold">{agentMetrics.getTotalTokens().toLocaleString()}</div>
                    </Card>
                    <Card variant="minimal" padding="default">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-muted-foreground">Total Cost</span>
                      </div>
                      <div className="text-lg font-bold">${agentMetrics.getTotalCost().toFixed(4)}</div>
                    </Card>
                  </div>

                  {/* Per-Agent Metrics */}
                  {metrics.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                        <BarChart3 className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No agent activity yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Per Agent</h4>
                      {metrics.map((metric) => (
                        <Card key={metric.agentId} variant="flat" padding="default">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-sm truncate">{metric.agentName}</div>
                            <Badge variant="outline" className="text-xs">{metric.totalCalls} calls</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <div className="text-muted-foreground mb-1">Tokens</div>
                              <div className="font-semibold">{metric.totalTokensUsed.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground mb-1">Cost</div>
                              <div className="font-semibold">${metric.estimatedCost.toFixed(4)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground mb-1">Avg RT</div>
                              <div className="font-semibold">{metric.avgResponseTime.toFixed(0)}ms</div>
                            </div>
                          </div>
                          {metric.failedCalls > 0 && (
                            <div className="mt-2 text-xs text-red-500">⚠ {metric.failedCalls} failed</div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="activity" className="flex-1 flex flex-col mt-0">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  {activityLog.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                        <Activity className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No activity yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Agent actions will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {activityLog.map((log) => (
                        <Card key={log.id} variant="flat" padding="sm" className="text-xs">
                          <div className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm truncate">{log.message}</div>
                              <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{formatRelativeTime(log.timestamp)}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
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

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
