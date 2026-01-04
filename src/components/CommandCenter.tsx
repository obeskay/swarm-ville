import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import { useAgentSwarm, Agent, ProviderType } from "../hooks/useAgentSwarm";
import { ConnectionOverlay } from "./ConnectionOverlay";
import {
  Play,
  Square,
  Trash2,
  Terminal,
  Users,
  Zap,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from "lucide-react";

// Provider icons and labels
const PROVIDER_META: Record<string, { icon: React.ElementType; label: string }> = {
  claude: { icon: Sparkles, label: "Claude" },
  cursor: { icon: Terminal, label: "Cursor" },
  codex: { icon: Zap, label: "Codex" },
  "gemini-cli": { icon: Sparkles, label: "Gemini" },
  opencode: { icon: Terminal, label: "OpenCode" },
  antigravity: { icon: Zap, label: "Antigravity" },
  auto: { icon: Zap, label: "Auto Select" },
};

const PRESET_TASKS = [
  { label: "Build Login Form", value: "Build a login form with email/password validation" },
  { label: "Create REST API", value: "Create a REST API endpoint for user management" },
  { label: "Add Dark Mode", value: "Implement dark mode toggle with theme persistence" },
  { label: "Write Tests", value: "Write unit tests for the authentication module" },
  { label: "Code Review", value: "Review the codebase for security vulnerabilities" },
];

function AgentCard({ agent }: { agent: Agent }) {
  const statusConfig = {
    spawning: { color: "bg-blue-500", label: "Spawning", icon: Loader2 },
    working: { color: "bg-yellow-500", label: "Working", icon: Zap },
    completed: { color: "bg-green-500", label: "Done", icon: CheckCircle2 },
    error: { color: "bg-red-500", label: "Error", icon: XCircle },
  };

  const config = statusConfig[agent.status];
  const Icon = config.icon;
  const lastMessage = agent.messages[agent.messages.length - 1];

  const roleColors: Record<string, string> = {
    researcher: "text-purple-400",
    designer: "text-pink-400",
    frontend_developer: "text-blue-400",
    code_reviewer: "text-green-400",
    backend_developer: "text-orange-400",
    tester: "text-cyan-400",
  };

  return (
    <div className="p-3 rounded-lg bg-background/50 border border-border/50 hover:border-border transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full ${config.color}/20 flex items-center justify-center`}>
          <Icon
            className={`w-4 h-4 ${config.color.replace("bg-", "text-")} ${agent.status === "spawning" || agent.status === "working" ? "animate-spin" : ""}`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium text-sm ${roleColors[agent.role] || "text-foreground"}`}>
              {agent.name}
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {config.label}
            </Badge>
          </div>
          {lastMessage && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{lastMessage}</p>
          )}
        </div>
      </div>
      {agent.status === "working" && (
        <Progress value={undefined} className="mt-2 h-1 animate-pulse" />
      )}
    </div>
  );
}

function LogEntry({ message, agentName }: { message: string; agentName: string }) {
  return (
    <div className="flex gap-2 text-xs py-1.5 border-b border-border/30 last:border-0">
      <span className="text-muted-foreground font-mono w-16 shrink-0">{agentName}</span>
      <span className="text-foreground/80">{message}</span>
    </div>
  );
}

export function CommandCenter() {
  const [provider, setProvider] = useState<ProviderType>("auto");
  const [taskDescription, setTaskDescription] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState("agents");
  const logEndRef = useRef<HTMLDivElement>(null);

  const { agents, providers, isConnected, isSpawning, spawnAgents, clearAgents, reconnect } =
    useAgentSwarm();

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agents]);

  const handleSpawn = async () => {
    if (!taskDescription.trim()) {
      toast.error("Please describe a task");
      return;
    }

    if (!isConnected) {
      toast.error("Not connected to server", {
        description: "Start server with: pnpm run ws",
      });
      return;
    }

    const success = await spawnAgents({
      task: taskDescription,
      provider,
    });

    if (success) {
      toast.success("Swarm Deployed!", {
        description: `4 agents are now working on your task`,
        icon: <Sparkles className="w-4 h-4" />,
      });
      setActiveTab("agents");
    }
  };

  const workingCount = agents.filter((a) => a.status === "working").length;
  const completedCount = agents.filter((a) => a.status === "completed").length;
  const totalProgress =
    agents.length > 0
      ? Math.round(((completedCount + workingCount * 0.5) / agents.length) * 100)
      : 0;

  // Collect all logs
  const allLogs = agents.flatMap((agent) =>
    agent.messages.map((msg) => ({ message: msg, agentName: agent.name }))
  );

  return (
    <>
      {/* Connection overlay when offline */}
      <ConnectionOverlay isConnected={isConnected} onRetry={reconnect} />

      <Card className="absolute top-3 right-3 w-80 bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl z-50 overflow-hidden">
        {/* Header */}
        <div
          className="px-4 py-3 border-b border-border/50 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Terminal className="w-5 h-5 text-primary" />
                {agents.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-sm">Command Center</h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {isConnected ? (
                    <>
                      <Wifi className="w-3 h-3 text-green-500" />
                      <span>Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-red-500" />
                      <span>Offline</span>
                    </>
                  )}
                  {agents.length > 0 && (
                    <>
                      <span className="text-border">|</span>
                      <Users className="w-3 h-3" />
                      <span>{agents.length} agents</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>

          {/* Progress bar when agents are working */}
          {agents.length > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{totalProgress}%</span>
              </div>
              <Progress value={totalProgress} className="h-1.5" />
            </div>
          )}
        </div>

        {/* Expandable content */}
        {isExpanded && (
          <div className="p-4 space-y-4">
            {/* Task input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Task</label>
                <Select value="" onValueChange={(v) => setTaskDescription(v)}>
                  <SelectTrigger className="w-24 h-6 text-[10px]">
                    <SelectValue placeholder="Presets" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_TASKS.map((task) => (
                      <SelectItem key={task.label} value={task.value} className="text-xs">
                        {task.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Describe what you want to build..."
                className="min-h-20 text-sm resize-none"
              />
            </div>

            {/* Provider selection - dynamic based on detected providers */}
            <div className="flex gap-2">
              <Select value={provider} onValueChange={(v) => setProvider(v as ProviderType)}>
                <SelectTrigger className="flex-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3" />
                      <span>Auto (Best for Role)</span>
                    </div>
                  </SelectItem>
                  {providers.map((p) => {
                    const meta = PROVIDER_META[p] || { icon: Terminal, label: p };
                    const Icon = meta.icon;
                    return (
                      <SelectItem key={p} value={p}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-3 h-3" />
                          <span>{meta.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Button
                onClick={handleSpawn}
                disabled={isSpawning || !taskDescription.trim() || !isConnected}
                className="gap-2"
              >
                {isSpawning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Deploy
              </Button>
            </div>

            <Separator />

            {/* Tabs for agents/logs */}
            {agents.length > 0 && (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full h-8">
                  <TabsTrigger value="agents" className="flex-1 text-xs gap-1">
                    <Users className="w-3 h-3" />
                    Agents
                  </TabsTrigger>
                  <TabsTrigger value="logs" className="flex-1 text-xs gap-1">
                    <Terminal className="w-3 h-3" />
                    Logs
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="agents" className="mt-2">
                  <ScrollArea className="h-48">
                    <div className="space-y-2 pr-2">
                      {agents.map((agent) => (
                        <AgentCard key={agent.id} agent={agent} />
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="logs" className="mt-2">
                  <ScrollArea className="h-48">
                    <div className="font-mono text-xs pr-2">
                      {allLogs.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No logs yet...</p>
                      ) : (
                        <>
                          {allLogs.map((log, i) => (
                            <LogEntry key={i} {...log} />
                          ))}
                          <div ref={logEndRef} />
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            )}

            {/* Actions */}
            {agents.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs gap-1"
                  onClick={clearAgents}
                >
                  <Trash2 className="w-3 h-3" />
                  Clear All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs gap-1"
                  onClick={() => {
                    agents.forEach((a) => {
                      if (a.status === "working") {
                        // Stop would be called here
                      }
                    });
                  }}
                >
                  <Square className="w-3 h-3" />
                  Stop All
                </Button>
              </div>
            )}

            {/* Help text */}
            <p className="text-[10px] text-muted-foreground text-center">
              {!isConnected
                ? "Start server: pnpm run ws"
                : agents.length === 0
                  ? "WASD to move | Deploy agents to start"
                  : `${workingCount} working | ${completedCount} completed`}
            </p>
          </div>
        )}
      </Card>
    </>
  );
}
