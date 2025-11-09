import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import * as PIXI from "pixi.js";
import { useSpaceStore } from "../../stores/spaceStore";
import { useAgentStore } from "../../stores/agentStore";
import { usePixiApp } from "../../hooks/usePixiApp";
import SpaceUI from "./SpaceUI";
import "./SpaceContainer.css";

interface SpaceContainerProps {
  spaceId: string;
}

export default function SpaceContainer({ spaceId }: SpaceContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { spaces, userPosition, setUserPosition } = useSpaceStore();
  const { selectedAgentId } = useAgentStore();

  const space = spaces.find((s) => s.id === spaceId);
  const { app, stage, viewport } = usePixiApp(canvasRef);

  useEffect(() => {
    if (!space || !app || !stage || !viewport) return;

    // Create grid
    const gridSprite = createGrid(
      space.dimensions.width,
      space.dimensions.height
    );
    stage.addChild(gridSprite);

    // Create user avatar
    const userAvatar = createUserAvatar(userPosition);
    viewport.addChild(userAvatar);

    // Handle click to move
    const handleCanvasClick = (event: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Convert screen coords to world coords
      const worldPos = viewport.toWorld(new PIXI.Point(x, y));
      setUserPosition({
        x: Math.round(worldPos.x / 32),
        y: Math.round(worldPos.y / 32),
      });
    };

    canvasRef.current?.addEventListener("click", handleCanvasClick);

    return () => {
      canvasRef.current?.removeEventListener("click", handleCanvasClick);
    };
  }, [space, app, stage, viewport]);

  return (
    <div ref={containerRef} className="space-container">
      <canvas ref={canvasRef} className="space-canvas" />
      <SpaceUI spaceId={spaceId} />
    </div>
  );
}

function createGrid(width: number, height: number): PIXI.Container {
  const TILE_SIZE = 32;
  const grid = new PIXI.Container();

  const graphics = new PIXI.Graphics();
  graphics.stroke({ color: 0xcccccc, width: 1 });

  // Vertical lines
  for (let x = 0; x <= width; x++) {
    graphics.moveTo(x * TILE_SIZE, 0);
    graphics.lineTo(x * TILE_SIZE, height * TILE_SIZE);
  }

  // Horizontal lines
  for (let y = 0; y <= height; y++) {
    graphics.moveTo(0, y * TILE_SIZE);
    graphics.lineTo(width * TILE_SIZE, y * TILE_SIZE);
  }

  grid.addChild(graphics);
  return grid;
}

function createUserAvatar(position: { x: number; y: number }): PIXI.Container {
  const TILE_SIZE = 32;
  const avatar = new PIXI.Container();

  const circle = new PIXI.Graphics();
  circle.circle(0, 0, TILE_SIZE / 2 - 2);
  circle.fill({ color: 0x3b82f6 });
  circle.stroke({ color: 0x1e40af, width: 2 });

  avatar.addChild(circle);
  avatar.position.set(position.x * TILE_SIZE, position.y * TILE_SIZE);

  return avatar;
}
