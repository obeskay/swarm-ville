import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import * as PIXI from "pixi.js";
import { useSpaceStore } from "../../stores/spaceStore";
import { useAgentStore } from "../../stores/agentStore";
import { usePixiApp } from "../../hooks/usePixiApp";
import {
  GridRenderer,
  AgentSprite,
  ProximityCircle,
} from "../../lib/pixi/GridRenderer";
import { Pathfinder } from "../../lib/pathfinding";
import SpaceUI from "./SpaceUI";
import "./SpaceContainer.css";

interface SpaceContainerProps {
  spaceId: string;
}

const TILE_SIZE = 32;
const PROXIMITY_RADIUS = 5;

export default function SpaceContainer({ spaceId }: SpaceContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { spaces, userPosition, setUserPosition, agents } = useSpaceStore();
  const [isMoving, setIsMoving] = useState(false);

  const space = spaces.find((s) => s.id === spaceId);
  const { app, stage, viewport } = usePixiApp(canvasRef);
  const pathfinderRef = useRef<Pathfinder | null>(null);
  const userAvatarRef = useRef<AgentSprite | null>(null);
  const proximityCircleRef = useRef<ProximityCircle | null>(null);
  const agentSpritesRef = useRef<Map<string, AgentSprite>>(new Map());

  // Initialize grid and pathfinding
  useEffect(() => {
    if (!space || !app || !stage || !viewport) return;

    // Clear stage
    viewport.removeChildren();

    // Create grid
    const gridRenderer = new GridRenderer(
      space.dimensions.width,
      space.dimensions.height,
    );
    viewport.addChild(gridRenderer.getGraphics());

    // Initialize pathfinding
    pathfinderRef.current = new Pathfinder(
      space.dimensions.width,
      space.dimensions.height,
    );

    // Create user avatar
    const userAvatar = new AgentSprite(userPosition, 0x3b82f6, "You", false);
    viewport.addChild(userAvatar);
    userAvatarRef.current = userAvatar;

    // Create proximity circle
    const proximityCircle = new ProximityCircle(userPosition, PROXIMITY_RADIUS);
    viewport.addChild(proximityCircle);
    proximityCircleRef.current = proximityCircle;

    // Create agent sprites
    agents.forEach((agent) => {
      const sprite = new AgentSprite(
        agent.position,
        0xef4444,
        agent.name,
        true,
      );
      viewport.addChild(sprite);
      agentSpritesRef.current.set(agent.id, sprite);
    });

    // Handle canvas click to move
    const handleCanvasClick = (event: MouseEvent) => {
      if (!canvasRef.current || !userAvatarRef.current || isMoving) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Convert screen coords to world coords
      const point = new PIXI.Point(x, y);
      const worldPos = viewport?.toWorld(point);

      if (!worldPos) return;

      const targetGridPos = {
        x: Math.round(worldPos.x / TILE_SIZE),
        y: Math.round(worldPos.y / TILE_SIZE),
      };

      // Find path and move
      const pathfinder = pathfinderRef.current;
      if (pathfinder && userAvatarRef.current) {
        const path = pathfinder.findPath(userPosition, targetGridPos);

        // Only use first 3 steps or direct movement if close
        const moveTo =
          path.length > 0 ? path[Math.min(1, path.length - 1)] : targetGridPos;

        setIsMoving(true);
        userAvatarRef.current.animate(moveTo, 200).then(() => {
          setUserPosition(moveTo);
          proximityCircleRef.current?.update(moveTo);
          setIsMoving(false);
        });
      }
    };

    canvasRef.current?.addEventListener("click", handleCanvasClick);

    return () => {
      canvasRef.current?.removeEventListener("click", handleCanvasClick);
    };
  }, [space, app, stage, viewport, userPosition, agents, isMoving]);

  return (
    <div ref={containerRef} className="space-container">
      <canvas ref={canvasRef} className="space-canvas" />
      <SpaceUI spaceId={spaceId} />
    </div>
  );
}
