/**
 * MetricsPanel - Cost/Token Dashboard
 * Inspired by AgentScope Studio
 *
 * Displays token usage, estimated costs, and activity heatmap.
 */

import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { ScrollArea } from "./ui/scroll-area";
import { ProjectManager, Run } from "../lib/ProjectManager";
import {
  Coins,
  Clock,
  Zap,
  Activity,
  TrendingUp,
  BarChart3,
  Timer,
  MessageSquare,
} from "lucide-react";

interface AgentActivity {
  id: string;
  name: string;
  messages: number;
  tokens: number;
  lastActive: number;
}

interface MetricsPanelProps {
  agents?: AgentActivity[];
  className?: string;
}

// Color scale for heatmap
function getHeatmapColor(intensity: number): string {
  // intensity: 0-1
  const colors = [
    "bg-slate-800",
    "bg-emerald-900/50",
    "bg-emerald-800/60",
    "bg-emerald-700/70",
    "bg-emerald-600/80",
    "bg-emerald-500",
    "bg-yellow-500/80",
    "bg-orange-500/80",
    "bg-red-500/80",
  ];
  const index = Math.min(Math.floor(intensity * colors.length), colors.length - 1);
  return colors[index];
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatCost(cost: number): string {
  if (cost < 0.01) return `$${(cost * 100).toFixed(2)}c`;
  return `$${cost.toFixed(3)}`;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-background/50 border border-border/30">
      <div className={`w-8 h-8 rounded-lg ${color}/20 flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${color.replace("bg-", "text-")}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold truncate">{value}</p>
        {subValue && <p className="text-[10px] text-muted-foreground">{subValue}</p>}
      </div>
    </div>
  );
}

function ActivityHeatmap({ agents }: { agents: AgentActivity[] }) {
  // Create a 7x24 grid (7 days, 24 hours) - simplified version
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Generate activity data (simulated - would be real data in production)
  const getActivity = (hour: number): number => {
    if (!agents || agents.length === 0) return 0;
    // Simulate higher activity during work hours
    const baseActivity = (hour >= 9 && hour <= 18) ? 0.5 : 0.1;
    const randomFactor = Math.random() * 0.5;
    return Math.min(1, baseActivity + randomFactor * agents.length / 4);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Activity Heatmap (24h)</span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">Less</span>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${getHeatmapColor(i / 4)}`} />
          ))}
          <span className="text-[10px] text-muted-foreground">More</span>
        </div>
      </div>
      <div className="flex gap-0.5 overflow-hidden rounded">
        {hours.map((hour) => (
          <div
            key={hour}
            className={`w-3 h-8 rounded-sm ${getHeatmapColor(getActivity(hour))}`}
            title={`${hour}:00 - ${hour + 1}:00`}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>
    </div>
  );
}

function AgentMetricsList({ agents }: { agents: AgentActivity[] }) {
  if (!agents || agents.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        No agent activity yet
      </p>
    );
  }

  const maxTokens = Math.max(...agents.map((a) => a.tokens), 1);

  return (
    <div className="space-y-2">
      {agents.map((agent) => (
        <div key={agent.id} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium truncate">{agent.name}</span>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {agent.messages}
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {agent.tokens.toLocaleString()}
              </span>
            </div>
          </div>
          <Progress value={(agent.tokens / maxTokens) * 100} className="h-1" />
        </div>
      ))}
    </div>
  );
}

function RunHistoryItem({ run }: { run: Run }) {
  const statusColors = {
    active: "bg-blue-500",
    completed: "bg-green-500",
    paused: "bg-yellow-500",
    error: "bg-red-500",
  };

  return (
    <div className="p-2 rounded-lg bg-background/30 border border-border/20">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium truncate">{run.name}</span>
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 ${statusColors[run.status].replace("bg-", "text-")}`}
        >
          {run.status}
        </Badge>
      </div>
      <p className="text-[10px] text-muted-foreground line-clamp-1">{run.task}</p>
      {run.metrics && (
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
          <span>{run.metrics.totalTokens.toLocaleString()} tokens</span>
          <span>{formatCost(run.metrics.estimatedCost)}</span>
          <span>{run.agentCount} agents</span>
        </div>
      )}
    </div>
  );
}

export function MetricsPanel({ agents = [], className = "" }: MetricsPanelProps) {
  const [stats, setStats] = useState(ProjectManager.getStatistics());
  const [runHistory, setRunHistory] = useState<Run[]>([]);
  const [currentRun, setCurrentRun] = useState<Run | null>(null);

  useEffect(() => {
    const updateStats = () => {
      setStats(ProjectManager.getStatistics());
      setRunHistory(ProjectManager.getRunHistory().slice(0, 5));
      setCurrentRun(ProjectManager.getCurrentRun());
    };

    updateStats();
    const unsubscribe = ProjectManager.subscribe(updateStats);
    return unsubscribe;
  }, []);

  // Calculate current session metrics
  const sessionTokens = currentRun?.metrics?.totalTokens || 0;
  const sessionCost = currentRun?.metrics?.estimatedCost || 0;
  const sessionDuration = currentRun
    ? Date.now() - currentRun.createdAt
    : 0;

  // Calculate messages per minute
  const totalMessages = agents.reduce((sum, a) => sum + a.messages, 0);
  const messagesPerMinute = sessionDuration > 0
    ? ((totalMessages / (sessionDuration / 60000)).toFixed(1))
    : "0";

  return (
    <Card className={`w-72 bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl ${className}`}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Metrics</span>
          {currentRun && (
            <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
              {currentRun.name}
            </Badge>
          )}
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Current Session Metrics */}
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            icon={Zap}
            label="Tokens"
            value={sessionTokens.toLocaleString()}
            subValue={`Total: ${stats.totalTokens.toLocaleString()}`}
            color="bg-purple-500"
          />
          <MetricCard
            icon={Coins}
            label="Cost"
            value={formatCost(sessionCost)}
            subValue={`Total: ${formatCost(stats.totalCost)}`}
            color="bg-yellow-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            icon={Timer}
            label="Duration"
            value={formatDuration(sessionDuration)}
            color="bg-blue-500"
          />
          <MetricCard
            icon={TrendingUp}
            label="Rate"
            value={`${messagesPerMinute}/min`}
            subValue="Messages"
            color="bg-green-500"
          />
        </div>

        {/* Activity Heatmap */}
        <ActivityHeatmap agents={agents} />

        {/* Agent Metrics */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Agent Activity</span>
          </div>
          <AgentMetricsList agents={agents} />
        </div>

        {/* Recent Runs */}
        {runHistory.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Recent Runs</span>
            </div>
            <ScrollArea className="h-32">
              <div className="space-y-2 pr-2">
                {runHistory.map((run) => (
                  <RunHistoryItem key={run.id} run={run} />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Summary Stats */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/30">
          <span>{stats.totalProjects} projects</span>
          <span>{stats.totalRuns} runs</span>
          <span>{stats.totalTokens.toLocaleString()} total tokens</span>
        </div>
      </div>
    </Card>
  );
}
