import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Activity, DollarSign, Zap, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { agentMetrics, AgentMetrics } from "../../lib/agents/AgentMetrics";

export function AgentMetricsPanel() {
  const [metrics, setMetrics] = useState<AgentMetrics[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(agentMetrics.getAllMetrics());
    };

    // Initial load
    updateMetrics();

    // Subscribe to updates
    const unsubscribe = agentMetrics.subscribe(updateMetrics);

    return unsubscribe;
  }, []);

  const totalCost = agentMetrics.getTotalCost();
  const totalTokens = agentMetrics.getTotalTokens();

  const handleExport = () => {
    const data = agentMetrics.exportMetrics();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agent-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isCollapsed) {
    return (
      <div className="fixed top-4 right-4 z-10">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsCollapsed(false)}
          className="bg-background/95 backdrop-blur-md shadow-lg"
        >
          <Activity className="w-4 h-4 mr-2" />
          <span className="text-xs">
            {totalTokens.toLocaleString()}t • ${totalCost.toFixed(4)}
          </span>
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed top-4 right-4 w-96 z-10 bg-background/95 backdrop-blur-md shadow-lg border">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-green-500" />
            </div>
            Agent Metrics
          </CardTitle>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleExport}
              className="h-7 w-7 p-0"
              title="Export metrics"
            >
              <Download className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsCollapsed(true)}
              className="h-7 w-7 p-0"
            >
              ×
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-3">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1 mb-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span className="text-xs text-muted-foreground">Tokens</span>
            </div>
            <div className="text-sm font-bold">{totalTokens.toLocaleString()}</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="w-3 h-3 text-green-500" />
              <span className="text-xs text-muted-foreground">Cost</span>
            </div>
            <div className="text-sm font-bold">${totalCost.toFixed(4)}</div>
          </div>
        </div>

        {/* Per-agent metrics */}
        {metrics.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">
            No agent activity yet
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {metrics.map((metric) => (
              <div
                key={metric.agentId}
                className="p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-sm truncate">{metric.agentName}</div>
                  <div className="text-xs text-muted-foreground">{metric.totalCalls} calls</div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">Tokens</div>
                    <div className="font-semibold">{metric.totalTokensUsed.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Cost</div>
                    <div className="font-semibold">${metric.estimatedCost.toFixed(4)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Avg RT</div>
                    <div className="font-semibold">{metric.avgResponseTime.toFixed(0)}ms</div>
                  </div>
                </div>

                {metric.failedCalls > 0 && (
                  <div className="mt-1 text-xs text-red-500">⚠ {metric.failedCalls} failed</div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
