import { useState, useEffect } from "react";
import { useSpaceStore } from "../../stores/spaceStore";
import AgentDialog from "../agents/AgentDialog";
import AgentSpawner from "../agents/AgentSpawner";
import MicrophoneButton from "../speech/MicrophoneButton";
import SpriteGeneratorDialog from "../ai/SpriteGeneratorDialog";
import { LanguagePanel } from "../thronglet/LanguagePanel";
import { TeachingInterface } from "../thronglet/TeachingInterface";
import { ThemeToggle } from "../theme-toggle";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { UserPlus, Sparkles, Wifi, WifiOff, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface SpaceUIProps {
  spaceId: string;
  wsConnected?: boolean;
  remoteUserCount?: number;
  onSpaceChange?: (spaceId: string) => void;
}

export default function SpaceUI({
  spaceId,
  wsConnected = false,
  remoteUserCount = 0,
  onSpaceChange,
}: SpaceUIProps) {
  const { spaces, agents, userPosition, addSpace } = useSpaceStore();
  const [showAgentSpawner, setShowAgentSpawner] = useState(false);
  const [showSpriteGenerator, setShowSpriteGenerator] = useState(false);
  const [showTeachingInterface, setShowTeachingInterface] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedSpriteId, setSelectedSpriteId] = useState<number | null>(null);

  const space = spaces.find((s) => s.id === spaceId);

  const handleCreateNewSpace = () => {
    const newSpaceId = crypto.randomUUID();
    addSpace({
      id: newSpaceId,
      name: `Space ${new Date().toLocaleTimeString()}`,
      ownerId: "local-user",
      dimensions: {
        width: 80,
        height: 80,
      },
      tileset: {
        floor: "grass",
        theme: "modern",
      },
      tilemap: undefined,
      agents: [],
      settings: {
        proximityRadius: 5,
        maxAgents: 10,
        snapToGrid: true,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  // Track if any dialog is open
  const isDialogOpen =
    showAgentSpawner || showSpriteGenerator || showTeachingInterface || !!selectedAgentId;

  // Notify SpaceContainer when dialogs open/close
  useEffect(() => {
    const event = new CustomEvent("dialog-state-changed", {
      detail: { isOpen: isDialogOpen },
    });
    window.dispatchEvent(event);
  }, [isDialogOpen]);

  // Listen for agent interaction events from CharacterSprite clicks
  useEffect(() => {
    const handleAgentInteract = (event: CustomEvent) => {
      const { agentId } = event.detail;
      setSelectedAgentId(agentId);
    };

    window.addEventListener(
      "agent-interact",
      handleAgentInteract as EventListener,
    );

    return () => {
      window.removeEventListener(
        "agent-interact",
        handleAgentInteract as EventListener,
      );
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Top Bar - Enhanced with better contrast */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-background/95 backdrop-blur-md border-b border-border flex items-center justify-between px-6 pointer-events-auto z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold select-text">{space?.name}</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full text-xs font-medium">
            {wsConnected ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-foreground">
                  {remoteUserCount} online
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <span className="text-muted-foreground">offline</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Space Selector Dropdown */}
          {spaces.length > 1 && (
            <Select value={spaceId} onValueChange={onSpaceChange}>
              <SelectTrigger className="w-40 text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {spaces.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            onClick={handleCreateNewSpace}
            size="default"
            variant="outline"
            className="select-none touch-manipulation transition-all active:scale-95 h-9 shadow-sm"
            title="Create new space"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Space
          </Button>

          <div className="h-8 w-px bg-border" />

          <ThemeToggle />

          <Button
            onClick={() => setShowAgentSpawner(!showAgentSpawner)}
            size="default"
            className="select-none touch-manipulation transition-all active:scale-95 h-9 shadow-sm"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Agent
          </Button>

          <Button
            onClick={() => setShowSpriteGenerator(true)}
            size="default"
            variant="secondary"
            className="select-none touch-manipulation transition-all active:scale-95 h-9 shadow-sm"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Sprite
          </Button>
        </div>
      </div>

      {/* Keyboard hints - Enhanced visibility */}
      <Card className="absolute top-20 right-6 bg-background/95 backdrop-blur-md border shadow-lg pointer-events-none z-10">
        <CardContent className="p-3">
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono font-semibold">
                WASD
              </kbd>
              <span className="text-muted-foreground">Move</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono font-semibold">
                Space
              </kbd>
              <span className="text-muted-foreground">Recenter</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono font-semibold">
                Scroll
              </kbd>
              <span className="text-muted-foreground">Zoom</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Sprite Generator */}
      {showSpriteGenerator && (
        <SpriteGeneratorDialog
          onClose={() => setShowSpriteGenerator(false)}
          onSpriteGenerated={(sprite) => {
            setSelectedSpriteId(sprite.characterId);
            setShowSpriteGenerator(false);
            setShowAgentSpawner(true);
          }}
        />
      )}

      {/* Agent Spawner */}
      {showAgentSpawner && (
        <AgentSpawner
          spaceId={spaceId}
          spriteId={selectedSpriteId}
          onClose={() => {
            setShowAgentSpawner(false);
            setSelectedSpriteId(null);
          }}
        />
      )}

      {/* Agent Dialog */}
      {selectedAgentId && (
        <AgentDialog
          agentId={selectedAgentId}
          onClose={() => setSelectedAgentId(null)}
        />
      )}

      {/* Agents Sidebar */}
      <div className="absolute right-0 top-12 bottom-0 w-64 bg-background border-l border-border p-3 overflow-y-auto pointer-events-auto z-40 flex flex-col">
        <h3 className="text-xs font-semibold text-muted-foreground mb-2">
          {agents.size}
        </h3>
        <div className="flex flex-col gap-2 flex-1">
          {Array.from(agents.values()).map((agent) => (
            <div
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              className="flex items-center gap-2.5 p-3 rounded-md bg-accent/50 hover:bg-accent cursor-pointer transition-all duration-200 border-l-2 select-none touch-manipulation active:scale-95"
              style={{ borderLeftColor: agent.avatar.color }}
            >
              <div className="text-base flex-shrink-0">
                {agent.avatar.emoji}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-semibold text-sm truncate">
                  {agent.name}
                </div>
                <div className="text-xs text-muted-foreground capitalize truncate">
                  {agent.role}
                </div>
              </div>
              <div className="text-green-500 text-xs flex-shrink-0">●</div>
            </div>
          ))}
          {agents.size === 0 && (
            <div className="text-center text-muted-foreground text-xs py-4">
              Empty
            </div>
          )}
        </div>
      </div>

      {/* Microphone Button (already has position styling) */}
      <MicrophoneButton />

      {/* Minimap */}
      {space && (
        <Card className="absolute bottom-3 left-3 bg-black/80 border-primary/30 pointer-events-auto z-50">
          <CardContent className="p-1.5">
            <svg
              width="100"
              height="100"
              viewBox={`0 0 ${space.dimensions.width} ${space.dimensions.height}`}
              className="border border-primary/20 rounded bg-black/30 cursor-pointer"
              onClick={(e) => {
                const svg = e.currentTarget;
                const rect = svg.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Convert click position to grid coordinates
                const gridX = Math.floor(
                  (x / rect.width) * space.dimensions.width,
                );
                const gridY = Math.floor(
                  (y / rect.height) * space.dimensions.height,
                );

                // Dispatch custom event for SpaceContainer to handle
                const event = new CustomEvent("minimap-click", {
                  detail: { x: gridX, y: gridY },
                  bubbles: true,
                });
                window.dispatchEvent(event);
              }}
            >
              <rect
                width={space.dimensions.width}
                height={space.dimensions.height}
                fill="#1a1a2a"
                opacity="0.8"
              />
              <circle
                cx={userPosition.x}
                cy={userPosition.y}
                r="1.5"
                fill="#3b82f6"
              />
            </svg>
          </CardContent>
        </Card>
      )}

      {/* Thronglet Language System */}
      <LanguagePanel
        agentId={spaceId}
        onToggleAutoTeach={(enabled) => {
          console.log("Auto-teach enabled:", enabled);
          // Will integrate with actual language system
        }}
        onTeachWord={(word) => {
          setShowTeachingInterface(true);
        }}
      />

      {/* Teaching Interface Dialog */}
      <TeachingInterface
        isOpen={showTeachingInterface}
        onClose={() => setShowTeachingInterface(false)}
        agentId={spaceId}
        onTeachWord={(word, associations) => {
          console.log("Teaching word:", word, "with associations:", associations);
          // Will integrate with actual language system
        }}
      />
    </div>
  );
}
