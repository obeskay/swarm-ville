import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Plus, Users, Bot } from "lucide-react";
import { useSpaceStore } from "../../stores/spaceStore";
import { useState } from "react";
import AgentSpawner from "../agents/AgentSpawner";

interface AgentPanelProps {
  spaceId?: string;
}

export function AgentPanel({ spaceId = "default" }: AgentPanelProps) {
  const { agents } = useSpaceStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSpawner, setShowSpawner] = useState(false);

  const agentList = Array.from(agents.values());

  if (isCollapsed) {
    return (
      <div className="fixed bottom-6 right-6 z-10">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsCollapsed(false)}
        >
          <Users className="w-4 h-4 mr-2" />
          <span className="font-semibold">{agentList.length} Agents</span>
        </Button>
      </div>
    );
  }

  return (
    <Card variant="panel" className="fixed bottom-6 right-6 w-80 z-10">
      <CardHeader className="pb-3 border-b border-border/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Bot className="w-4 h-4 text-white" />
            </div>
            Agents
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsCollapsed(true)}
            className="h-8 w-8 p-0 hover:bg-white/5 text-lg leading-none"
          >
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-3">
        {agentList.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-2xl bg-card border border-border/20 flex items-center justify-center mx-auto mb-3">
              <Bot className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No agents yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {agentList.map((agent) => (
              <Card key={agent.id} variant="flat" className="cursor-pointer hover:shadow-md group">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                      {agent.avatar?.emoji || agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-card shadow-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                      {agent.name}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">{agent.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        <Button
          size="sm"
          className="w-full"
          variant="outline"
          onClick={() => setShowSpawner(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Agent
        </Button>
      </CardContent>

      {showSpawner && <AgentSpawner spaceId={spaceId} onClose={() => setShowSpawner(false)} />}
    </Card>
  );
}
