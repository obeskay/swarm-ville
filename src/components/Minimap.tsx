import { useEffect, useRef, useState } from "react";
import { Card } from "./ui/card";

interface Entity {
  id: string;
  x: number;
  y: number;
  isAgent: boolean;
  name?: string;
}

interface MinimapProps {
  gridWidth?: number;
  gridHeight?: number;
  tileSize?: number;
}

export function Minimap({ gridWidth = 37, gridHeight = 25, tileSize = 32 }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [playerPos, setPlayerPos] = useState({ x: 18, y: 12 });
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });

  const MINIMAP_WIDTH = 148;
  const MINIMAP_HEIGHT = 100;
  const SCALE_X = MINIMAP_WIDTH / (gridWidth * tileSize);
  const SCALE_Y = MINIMAP_HEIGHT / (gridHeight * tileSize);

  useEffect(() => {
    const updateFromGame = () => {
      const game = (
        window as unknown as {
          game?: {
            player?: { x: number; y: number };
            agents?: Map<string, { id: string; x: number; y: number; name: string }>;
            worldContainer?: { x: number; y: number };
          };
        }
      ).game;

      if (game) {
        // Update player position
        if (game.player) {
          setPlayerPos({
            x: game.player.x / tileSize,
            y: game.player.y / tileSize,
          });
        }

        // Update camera position
        if (game.worldContainer) {
          setCameraPos({
            x: -game.worldContainer.x,
            y: -game.worldContainer.y,
          });
        }

        // Update agents
        if (game.agents) {
          const agentList: Entity[] = [];
          game.agents.forEach((agent) => {
            agentList.push({
              id: agent.id,
              x: agent.x,
              y: agent.y,
              isAgent: true,
              name: agent.name,
            });
          });
          setEntities(agentList);
        }
      }
    };

    const interval = setInterval(updateFromGame, 100);
    return () => clearInterval(interval);
  }, [tileSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.fillStyle = "hsl(240 10% 8%)";
    ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    // Draw grid border
    ctx.strokeStyle = "hsl(240 5% 20%)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    // Draw walls (border)
    ctx.fillStyle = "hsl(240 5% 25%)";
    ctx.fillRect(0, 0, MINIMAP_WIDTH, 3); // Top
    ctx.fillRect(0, MINIMAP_HEIGHT - 3, MINIMAP_WIDTH, 3); // Bottom
    ctx.fillRect(0, 0, 4, MINIMAP_HEIGHT); // Left
    ctx.fillRect(MINIMAP_WIDTH - 4, 0, 4, MINIMAP_HEIGHT); // Right

    // Draw desks as small dots
    const deskPositions = [
      { x: 3, y: 3 },
      { x: 7, y: 3 },
      { x: 11, y: 3 },
      { x: 15, y: 3 },
      { x: 3, y: 8 },
      { x: 7, y: 8 },
      { x: 11, y: 8 },
      { x: 15, y: 8 },
      { x: 3, y: 13 },
      { x: 7, y: 13 },
      { x: 11, y: 13 },
      { x: 15, y: 13 },
    ];

    ctx.fillStyle = "hsl(240 5% 35%)";
    deskPositions.forEach((desk) => {
      const x = desk.x * tileSize * SCALE_X;
      const y = desk.y * tileSize * SCALE_Y;
      ctx.fillRect(x, y, 8, 4);
    });

    // Draw conference table
    ctx.fillStyle = "hsl(240 5% 30%)";
    const tableX = 24 * tileSize * SCALE_X;
    const tableY = 10 * tileSize * SCALE_Y;
    ctx.fillRect(tableX, tableY, 16, 12);

    // Draw viewport rectangle
    const viewportWidth = 1200 * SCALE_X;
    const viewportHeight = 800 * SCALE_Y;
    const viewportX = cameraPos.x * SCALE_X;
    const viewportY = cameraPos.y * SCALE_Y;

    ctx.strokeStyle = "hsl(var(--primary))";
    ctx.lineWidth = 1;
    ctx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);

    // Draw agents
    entities.forEach((entity) => {
      if (entity.isAgent) {
        const x = entity.x * tileSize * SCALE_X;
        const y = entity.y * tileSize * SCALE_Y;

        // Glow effect
        ctx.fillStyle = "hsla(280, 80%, 60%, 0.3)";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Agent dot
        ctx.fillStyle = "hsl(280, 80%, 60%)";
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw player
    const playerX = playerPos.x * tileSize * SCALE_X;
    const playerY = playerPos.y * tileSize * SCALE_Y;

    // Player glow
    ctx.fillStyle = "hsla(142, 76%, 46%, 0.3)";
    ctx.beginPath();
    ctx.arc(playerX, playerY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Player dot
    ctx.fillStyle = "hsl(142, 76%, 46%)";
    ctx.beginPath();
    ctx.arc(playerX, playerY, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [
    entities,
    playerPos,
    cameraPos,
    gridWidth,
    gridHeight,
    tileSize,
    SCALE_X,
    SCALE_Y,
    MINIMAP_WIDTH,
    MINIMAP_HEIGHT,
  ]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to world coordinates
    const worldX = x / SCALE_X;
    const worldY = y / SCALE_Y;

    // Center camera on clicked position
    const game = (
      window as unknown as {
        game?: { centerCameraOn?: (x: number, y: number) => void };
      }
    ).game;

    if (game?.centerCameraOn) {
      game.centerCameraOn(worldX, worldY);
    }
  };

  return (
    <Card className="absolute bottom-3 left-3 p-1.5 bg-card/90 backdrop-blur-xl border-border/50 shadow-xl z-50">
      <canvas
        ref={canvasRef}
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        onClick={handleClick}
        className="rounded cursor-crosshair"
        style={{ imageRendering: "pixelated" }}
      />
      <div className="flex items-center justify-between mt-1 px-1">
        <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>You</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Agents</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
