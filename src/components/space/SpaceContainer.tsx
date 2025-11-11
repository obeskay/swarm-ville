import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import gsap from "gsap";
import { useSpaceStore } from "../../stores/spaceStore";
import { usePixiApp } from "../../hooks/usePixiApp";
import { GridRenderer, ProximityCircle } from "../../lib/pixi/GridRenderer";
import { CharacterSprite } from "../../lib/pixi/CharacterSprite";
import { Pathfinder } from "../../lib/pathfinding";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useProximityDialogue } from "../../hooks/useProximityDialogue";
import SpaceUI from "./SpaceUI";
import { AgentPanel } from "./AgentPanel";
import { AgentMetricsPanel } from "./AgentMetricsPanel";
import { GameHUD } from "../game/GameHUD";
import { GameNotifications } from "../game/GameNotifications";
import { InteractiveTutorial } from "../game/InteractiveTutorial";
import { DialogueBubbles } from "../game/DialogueBubbles";
import { useGameStore } from "../../stores/gameStore";

interface SpaceContainerProps {
  spaceId: string;
  onSpaceChange?: (spaceId: string) => void;
}

const TILE_SIZE = 32;
const PROXIMITY_RADIUS = 5;

export default function SpaceContainer({ spaceId, onSpaceChange }: SpaceContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { app, stage, isLoading, error, setGameLoop } = usePixiApp(containerRef);

  const { spaces, userPosition, setUserPosition, agents: agentsMap } = useSpaceStore();

  const { updateMissionProgress } = useGameStore();

  const {
    isConnected,
    users: remoteUsers,
    joinSpace,
    updatePosition: updateRemotePosition,
  } = useWebSocket();

  const [initialized, setInitialized] = useState(false);
  const [scaleState, setScaleState] = useState(2.5);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0 });

  // Enable proximity dialogue system
  useProximityDialogue();

  const space = spaces.find((s) => s.id === spaceId);

  const gridRendererRef = useRef<GridRenderer | null>(null);
  const pathfinderRef = useRef<Pathfinder | null>(null);
  const userAvatarRef = useRef<CharacterSprite | null>(null);
  const proximityCircleRef = useRef<ProximityCircle | null>(null);
  const agentSpritesRef = useRef<Map<string, CharacterSprite>>(new Map());
  const scaleRef = useRef<number>(2.5); // Default zoom level (1.0-4.0 range)
  const cameraPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pathQueueRef = useRef<{ x: number; y: number }[]>([]);
  const isDialogOpenRef = useRef<boolean>(false);
  const pathPreviewRef = useRef<PIXI.Graphics | null>(null);
  const currentTileHighlightRef = useRef<PIXI.Graphics | null>(null);
  const particlesRef = useRef<PIXI.Graphics[]>([]);
  const particlePoolRef = useRef<PIXI.Graphics[]>([]);
  const processedRemoteUsersRef = useRef<Set<string>>(new Set());
  const hasJoinedSpaceRef = useRef<boolean>(false);
  const localUserIdRef = useRef<string>("");
  const lastPositionSyncRef = useRef<{ x: number; y: number; time: number }>({
    x: 0,
    y: 0,
    time: 0,
  });
  const isMouseDownRef = useRef<boolean>(false);
  const mouseDownTimeRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const lastMouseMoveRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPreviewTileRef = useRef<{ x: number; y: number } | null>(null);

  // CRITICAL: Track pressed keys to reduce lag from rapid key presses
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const lastMovementTimeRef = useRef<number>(0);
  const MOVEMENT_THROTTLE_MS = 100; // Max 10 moves per second = smoother than holding down
  const lastDragMoveRef = useRef<number>(0);
  const DRAG_THROTTLE_MS = 150; // Throttle drag movement

  /**
   * Initialize scene - runs when app is ready or spaceId changes
   */
  useEffect(() => {
    if (!space || !app || !stage) {
      return;
    }

    // Reset initialization when spaceId changes
    setInitialized(false);

    const initScene = async () => {
      try {
        stage.removeChildren();

        let gridRenderer = new GridRenderer(space.dimensions.width, space.dimensions.height);
        await gridRenderer.init();
        gridRendererRef.current = gridRenderer;

        // Add layers to stage
        let layers = gridRenderer.getLayers();
        stage.addChild(layers.floor);
        stage.addChild(layers.above_floor);
        stage.addChild(layers.object);

        // Initialize pathfinding
        let pathfinder = new Pathfinder(space.dimensions.width, space.dimensions.height);
        pathfinderRef.current = pathfinder;

        // Load map from space tilemap or external file
        let loadedTilemap: Record<string, any> = {};
        try {
          // Try to load from file - check for map_{spaceId}.json first, then defaultmap.json
          let mapData;
          try {
            const mapFile = `/maps/map_${space.id}.json`;
            const response = await fetch(mapFile);
            mapData = await response.json();
          } catch {
            // Fallback to defaultmap.json for all spaces
            try {
              const mapFile = "/maps/defaultmap.json";
              const response = await fetch(mapFile);
              mapData = await response.json();
            } catch {
              // If default map also missing, use empty tilemap (blank grid)
              mapData = null;
            }
          }

          if (mapData && mapData.rooms && mapData.rooms[0] && mapData.rooms[0].tilemap) {
            loadedTilemap = mapData.rooms[0].tilemap;

            // CRITICAL FIX: Detect actual map dimensions from tilemap and recreate renderer if needed
            const tileKeys = Object.keys(loadedTilemap);
            if (tileKeys.length > 0) {
              const coords = tileKeys.map((k) => k.split(",").map(Number));
              const actualMaxX = Math.max(...coords.map((c) => c[0])) + 1;
              const actualMaxY = Math.max(...coords.map((c) => c[1])) + 1;

              // If actual map dimensions differ from space dimensions, recreate renderer
              // NOTE: With fixed 48x48 spaces, this should rarely happen now
              if (actualMaxX !== space.dimensions.width || actualMaxY !== space.dimensions.height) {
                console.warn(
                  `[SpaceContainer] Map dimensions mismatch: Space expects ${space.dimensions.width}x${space.dimensions.height}, but map is ${actualMaxX}x${actualMaxY}. Recreating renderer...`
                );

                // Remove old layers from stage to avoid memory leaks
                if (layers.floor.parent) stage.removeChild(layers.floor);
                if (layers.above_floor.parent) stage.removeChild(layers.above_floor);
                if (layers.object.parent) stage.removeChild(layers.object);

                // Create new gridRenderer with correct dimensions
                const newGridRenderer = new GridRenderer(actualMaxX, actualMaxY);
                await newGridRenderer.init();
                gridRendererRef.current = newGridRenderer;

                // Create new pathfinder with correct dimensions
                const newPathfinder = new Pathfinder(actualMaxX, actualMaxY);
                pathfinderRef.current = newPathfinder;

                // Add new layers to stage
                const newLayers = newGridRenderer.getLayers();
                stage.addChild(newLayers.floor);
                stage.addChild(newLayers.above_floor);
                stage.addChild(newLayers.object);

                // Update references
                gridRenderer = newGridRenderer;
                pathfinder = newPathfinder;
              }
            }
          }

          // Load the tilemap (empty object is acceptable default)
          await gridRenderer.loadTilemap(loadedTilemap);
          const blockedTiles = gridRenderer.getBlockedTiles();
          pathfinder.setBlocked(blockedTiles);

          // CRITICAL DEBUG: Verify collision system is initialized correctly
          if (import.meta.env.DEV) {
            const pathfinderBlockedCount = pathfinder.getBlockedCount();
            console.log(
              `[SpaceContainer] Collision system initialized:`,
              `GridRenderer blocked tiles: ${blockedTiles.length}`,
              `Pathfinder blocked count: ${pathfinderBlockedCount}`,
              `Match: ${blockedTiles.length === pathfinderBlockedCount ? "✓" : "✗ MISMATCH"}`
            );
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error("Map loading failed:", error);
          }
        }

        // Find a walkable spawn position in the loaded tilemap
        let spawnPosition = userPosition;
        if (loadedTilemap && typeof loadedTilemap === "object") {
          for (const [tilePoint, tileData] of Object.entries(loadedTilemap)) {
            if (
              tileData &&
              typeof tileData === "object" &&
              !("object" in tileData && tileData.object) &&
              !("impassable" in tileData && tileData.impassable)
            ) {
              const [x, y] = tilePoint.split(",").map(Number);
              spawnPosition = { x, y };
              break;
            }
          }
          // Update user position if different from current
          if (spawnPosition.x !== userPosition.x || spawnPosition.y !== userPosition.y) {
            setUserPosition(spawnPosition);
          }
        }

        // Preload character sprites
        try {
          const characterPromises = [];
          for (let i = 1; i <= 50; i++) {
            const path = `/sprites/characters/Character_${String(i).padStart(3, "0")}.png`;
            characterPromises.push(PIXI.Assets.load(path).catch(() => null));
          }
          await Promise.all(characterPromises);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error("❌ Sprite preload failed");
          }
        }

        // Create user avatar with character sprite at spawn position
        const userAvatar = new CharacterSprite(
          spawnPosition,
          1, // Character ID 1
          "You",
          false
        );

        // Initialize spritesheet (async)
        userAvatar.init().catch((err) => {
          if (import.meta.env.DEV) {
            console.error("[SpaceContainer] Failed to init user avatar:", err);
          }
        });

        layers.object.addChild(userAvatar);
        userAvatarRef.current = userAvatar;

        // Create proximity circle at spawn position
        const proximityCircle = new ProximityCircle(spawnPosition, PROXIMITY_RADIUS);
        layers.object.addChild(proximityCircle);
        proximityCircleRef.current = proximityCircle;

        // ✨ Create current tile highlight (subtle glow under player)
        const tileHighlight = new PIXI.Graphics();
        tileHighlight.rect(0, 0, TILE_SIZE, TILE_SIZE);
        tileHighlight.fill({ color: 0x3b82f6, alpha: 0.15 });
        tileHighlight.position.set(spawnPosition.x * TILE_SIZE, spawnPosition.y * TILE_SIZE);
        layers.floor.addChild(tileHighlight);
        currentTileHighlightRef.current = tileHighlight;

        // Add initial agent sprites (exclude user if they're in the agents map)
        const initialAgents = Array.from(agentsMap.values()).filter(
          (agent) => agent.id !== localUserIdRef.current
        );
        initialAgents.forEach((agent) => {
          // Use avatar.spriteId if available, otherwise use a default
          const characterId = agent.avatar.spriteId ?? 1;
          const sprite = new CharacterSprite(
            agent.position,
            characterId,
            agent.name,
            true,
            agent.id
          );

          // Initialize spritesheet (async)
          sprite.init().catch((err) => {
            if (import.meta.env.DEV) {
              console.error(`[SpaceContainer] Failed to init agent ${agent.id}:`, err);
            }
          });

          // Spawn animation
          sprite.alpha = 0;
          sprite.scale.set(0.5);
          let spawnProgress = 0;
          const spawnAnim = () => {
            spawnProgress += 0.08;
            sprite.alpha = Math.min(1, spawnProgress);
            sprite.scale.set(Math.min(1, 0.5 + spawnProgress * 0.5));
            if (spawnProgress < 1) requestAnimationFrame(spawnAnim);
          };
          spawnAnim();

          layers.object.addChild(sprite);
          agentSpritesRef.current.set(agent.id, sprite);
        });

        // Sort and position camera
        gridRenderer.sortObjectsByY();
        updateScale(scaleRef.current);
        moveCameraToPlayer();

        setInitialized(true);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("❌ Init failed:", error);
        }
      }
    };

    initScene();
  }, [space, app, stage, spaceId]);

  /**
   * Setup game loop for smooth movement and camera
   */
  useEffect(() => {
    if (!initialized || !setGameLoop) return;

    setGameLoop((deltaTime: number) => {
      // OPTIMIZED: Process pressed keys with throttling to reduce lag
      const now = Date.now();
      if (
        now - lastMovementTimeRef.current >= MOVEMENT_THROTTLE_MS &&
        pressedKeysRef.current.size > 0
      ) {
        lastMovementTimeRef.current = now;

        let dx = 0;
        let dy = 0;

        // Process all pressed movement keys
        if (pressedKeysRef.current.has("arrowup") || pressedKeysRef.current.has("w")) dy -= 1;
        if (pressedKeysRef.current.has("arrowdown") || pressedKeysRef.current.has("s")) dy += 1;
        if (pressedKeysRef.current.has("arrowleft") || pressedKeysRef.current.has("a")) dx -= 1;
        if (pressedKeysRef.current.has("arrowright") || pressedKeysRef.current.has("d")) dx += 1;

        // Only move if there's a direction
        if ((dx !== 0 || dy !== 0) && userAvatarRef.current && gridRendererRef.current) {
          const currentUserPos = {
            x: userAvatarRef.current.gridPosition.x,
            y: userAvatarRef.current.gridPosition.y,
          };

          const targetPos = {
            x: currentUserPos.x + dx,
            y: currentUserPos.y + dy,
          };

          if (
            gridRendererRef.current.isValidPosition(targetPos) &&
            !gridRendererRef.current.isAreaBlocked(targetPos)
          ) {
            movePlayerToTarget(targetPos, false);
          } else {
            // Play bounce animation on collision
            createCollisionBounce(dx, dy);
          }
        }
      }

      // Update all agent sprites
      if (userAvatarRef.current) {
        // ✨ Spawn movement particles when moving (simple juice)
        if (userAvatarRef.current.isMoving() && Math.random() < 0.3) {
          spawnMovementParticle(userAvatarRef.current.x, userAvatarRef.current.y);
        }

        userAvatarRef.current.update(deltaTime);

        // Follow path automatically when close to next waypoint (smooth Gather-clone movement)
        if (pathQueueRef.current.length > 0) {
          // Use threshold larger than movement speed (8px/frame) to prevent bounce
          const distanceToTarget = userAvatarRef.current.getDistanceToTarget();
          const hasReachedWaypoint = distanceToTarget <= 10; // Larger than movementSpeed (8px) for smooth transitions

          if (hasReachedWaypoint) {
            const nextPos = pathQueueRef.current.shift();
            if (nextPos && gridRendererRef.current) {
              // CRITICAL: Validate next position is valid AND not blocked (using area collision for character size)
              if (
                gridRendererRef.current.isValidPosition(nextPos) &&
                !gridRendererRef.current.isAreaBlocked(nextPos)
              ) {
                userAvatarRef.current.setTargetGridPosition(nextPos);
                setUserPosition(nextPos);
                proximityCircleRef.current?.update(nextPos);
              } else {
                // Path blocked or invalid, clear queue and stop movement
                pathQueueRef.current = [];
                if (import.meta.env.DEV) {
                  console.warn("[SpaceContainer] Path blocked at", nextPos, "- stopping movement");
                }
              }
            }
          }
        }
      }

      // Update agents and check proximity
      const userPos = userPosition;
      agentSpritesRef.current.forEach((sprite) => {
        // Guard: Skip if sprite is null/undefined
        if (!sprite) return;

        sprite.update(deltaTime);

        // Highlight agents within proximity radius
        if (sprite.isInProximity(userPos, PROXIMITY_RADIUS)) {
          sprite.setProximityHighlight(true);
        } else {
          sprite.setProximityHighlight(false);
        }
      });

      // Update camera smoothly
      updateCamera();

      // ✨ Sync proximity circle with sprite's actual pixel position (not grid position)
      // This fixes lag where circle was out of sync during smooth movement animation
      if (proximityCircleRef.current && userAvatarRef.current) {
        proximityCircleRef.current.position.set(userAvatarRef.current.x, userAvatarRef.current.y);
      }

      // ✨ Update current tile highlight position
      if (currentTileHighlightRef.current) {
        currentTileHighlightRef.current.position.set(
          userPosition.x * TILE_SIZE,
          userPosition.y * TILE_SIZE
        );
      }

      // Update depth sorting if needed
      if (gridRendererRef.current) {
        gridRendererRef.current.sortObjectsByY();
      }
    });

    return () => {
      setGameLoop(null);
    };
  }, [initialized, setGameLoop]);

  const updateScale = (newScale: number, smooth: boolean = false) => {
    if (!stage) return;

    // Clamp zoom between 1.0x and 4.0x for better gameplay
    const clampedScale = Math.max(1.0, Math.min(4.0, newScale));

    if (smooth) {
      // Smooth zoom animation
      const startScale = scaleRef.current;
      const diff = clampedScale - startScale;
      const duration = 200; // ms
      const startTime = Date.now();

      const animateZoom = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

        const currentScale = startScale + diff * easeProgress;
        scaleRef.current = currentScale;
        setScaleState(currentScale);
        stage.scale.set(currentScale);

        // Update camera position during zoom to keep player centered
        updateCamera();

        if (progress < 1) {
          requestAnimationFrame(animateZoom);
        }
      };

      animateZoom();
    } else {
      scaleRef.current = clampedScale;
      setScaleState(clampedScale);
      stage.scale.set(clampedScale);
      // Update camera immediately after scale change
      updateCamera();
    }
  };

  /**
   * Smooth camera lerp following player
   * CRITICAL: Uses stage.pivot for camera (gather-clone pattern)
   */
  const updateCamera = () => {
    if (!userAvatarRef.current || !stage || !app) return;

    const playerX = userAvatarRef.current.x;
    const playerY = userAvatarRef.current.y;

    // Camera target using gather-clone pattern:
    // Pivot is the world coordinate that appears at screen origin
    // Subtract half viewport (adjusted for scale) to center player
    const targetPivotX = playerX - app.screen.width / 2 / scaleRef.current;
    const targetPivotY = playerY - app.screen.height / 2 / scaleRef.current;

    // Smooth lerp (0.18 = follow speed, higher = more responsive)
    const lerpFactor = 0.18;
    cameraPositionRef.current.x += (targetPivotX - cameraPositionRef.current.x) * lerpFactor;
    cameraPositionRef.current.y += (targetPivotY - cameraPositionRef.current.y) * lerpFactor;

    // Update state for dialogue bubbles
    setCameraPosition({ x: cameraPositionRef.current.x, y: cameraPositionRef.current.y });

    // Apply pivot - this determines which world point appears at screen origin
    // Note: stage.position stays at (0, 0) - we don't need to set it
    stage.pivot.set(cameraPositionRef.current.x, cameraPositionRef.current.y);
  };

  /**
   * Instant camera snap (used for initialization)
   * CRITICAL: Snaps camera to player immediately
   */
  const moveCameraToPlayer = () => {
    if (!userAvatarRef.current || !stage || !app) return;

    const playerX = userAvatarRef.current.x;
    const playerY = userAvatarRef.current.y;

    // Using gather-clone camera pattern:
    // Pivot is the world coordinate that appears at screen origin
    // Subtract half viewport (adjusted for scale) to center player
    const pivotX = playerX - app.screen.width / 2 / scaleRef.current;
    const pivotY = playerY - app.screen.height / 2 / scaleRef.current;

    // Set pivot directly - stage.position stays at (0, 0)
    stage.pivot.set(pivotX, pivotY);

    cameraPositionRef.current.x = pivotX;
    cameraPositionRef.current.y = pivotY;
    setCameraPosition({ x: pivotX, y: pivotY });
  };

  /**
   * Move player to target position (using smooth movement)
   */
  const movePlayerToTarget = (
    targetGridPos: { x: number; y: number },
    usePathfinding: boolean = true
  ) => {
    if (!userAvatarRef.current) return;

    const pathfinder = pathfinderRef.current;
    const gridRenderer = gridRendererRef.current;

    if (!pathfinder || !gridRenderer) return;

    // CRITICAL: Validate target is within bounds AND not blocked (using area collision for character size)
    if (!gridRenderer.isValidPosition(targetGridPos) || gridRenderer.isAreaBlocked(targetGridPos)) {
      return;
    }

    if (usePathfinding) {
      // Find full path
      const path = pathfinder.findPath(userPosition, targetGridPos);

      if (path.length === 0) {
        return;
      }

      // Clear any existing path
      pathQueueRef.current = [];

      // Queue entire path (skip first position as it's current position)
      if (path.length > 1) {
        pathQueueRef.current = path.slice(1);
        // Start first movement immediately
        const firstPos = pathQueueRef.current.shift();
        if (firstPos) {
          userAvatarRef.current.setTargetGridPosition(firstPos);
          setUserPosition(firstPos);
          proximityCircleRef.current?.update(firstPos);
        }
      }
    } else {
      // Direct movement for keyboard (single step)
      pathQueueRef.current = []; // Clear path when using keyboard
      userAvatarRef.current.setTargetGridPosition(targetGridPos);
      setUserPosition(targetGridPos);
      proximityCircleRef.current?.update(targetGridPos);

      // Track movement for missions
      updateMissionProgress("first_steps", 1);
    }

    // Throttled WebSocket sync (max 10 updates/sec)
    const now = Date.now();
    const lastSync = lastPositionSyncRef.current;
    const SYNC_THROTTLE_MS = 100;

    if (
      now - lastSync.time > SYNC_THROTTLE_MS ||
      Math.abs(targetGridPos.x - lastSync.x) > 2 ||
      Math.abs(targetGridPos.y - lastSync.y) > 2
    ) {
      const direction = userAvatarRef.current.getDirection();
      const dirStr = ["down", "left", "right", "up"][direction] || "down";
      updateRemotePosition(targetGridPos.x, targetGridPos.y, dirStr);
      lastPositionSyncRef.current = {
        x: targetGridPos.x,
        y: targetGridPos.y,
        time: now,
      };
    }
  };

  /**
   * ✨ Get particle from pool or create new
   */
  const acquireParticle = (): PIXI.Graphics => {
    const particle = particlePoolRef.current.pop();
    if (particle) {
      particle.clear();
      particle.alpha = 1;
      particle.visible = true;
      return particle;
    }
    return new PIXI.Graphics();
  };

  /**
   * ✨ Return particle to pool
   */
  const releaseParticle = (particle: PIXI.Graphics) => {
    particle.visible = false;
    if (particlePoolRef.current.length < 100) {
      particlePoolRef.current.push(particle);
    } else {
      particle.destroy();
    }
  };

  /**
   * ✨ Spawn movement particle (pooled & optimized)
   */
  const spawnMovementParticle = (x: number, y: number) => {
    const gridRenderer = gridRendererRef.current;
    if (!gridRenderer) return;

    const particle = acquireParticle();
    const size = 2 + Math.random() * 2;
    particle.circle(0, 0, size);
    particle.fill({ color: 0x888888, alpha: 0.4 });
    particle.position.set(x + (Math.random() - 0.5) * 8, y + (Math.random() - 0.5) * 8);

    const objectLayer = gridRenderer.getLayer("floor");
    objectLayer.addChild(particle);
    particlesRef.current.push(particle);

    let alpha = 0.4;
    let scale = 1;
    const animate = () => {
      alpha -= 0.04;
      scale += 0.1;

      particle.alpha = alpha;
      particle.scale.set(scale);

      if (alpha > 0) {
        requestAnimationFrame(animate);
      } else {
        objectLayer.removeChild(particle);
        const idx = particlesRef.current.indexOf(particle);
        if (idx > -1) particlesRef.current.splice(idx, 1);
        releaseParticle(particle);
      }
    };
    animate();

    if (particlesRef.current.length > 30) {
      const oldParticle = particlesRef.current.shift();
      if (oldParticle) {
        objectLayer.removeChild(oldParticle);
        releaseParticle(oldParticle);
      }
    }
  };

  /**
   * ✨ Collision bounce + camera shake (GSAP-powered)
   */
  const createCollisionBounce = (dx: number, dy: number) => {
    const userAvatar = userAvatarRef.current;
    if (!userAvatar || !stage) return;

    const bounceDistance = 4;
    const originalX = userAvatar.x;
    const originalY = userAvatar.y;
    const bounceX = originalX - dx * bounceDistance;
    const bounceY = originalY - dy * bounceDistance;

    // Camera shake properties
    const originalPivotX = cameraPositionRef.current.x;
    const originalPivotY = cameraPositionRef.current.y;
    const shakeAmount = 3;

    // Bounce sprite with elastic ease
    gsap.to(userAvatar, {
      x: originalX,
      y: originalY,
      duration: 0.3,
      ease: "elastic.out",
      overwrite: "auto",
    });

    // Camera shake using pivot (gather-clone pattern)
    gsap.to(
      { progress: 0 },
      {
        progress: 1,
        duration: 0.2,
        ease: "power2.out",
        onUpdate: function () {
          const progress = this.progress();
          const randomShakeX = (Math.random() - 0.5) * shakeAmount * (1 - progress);
          const randomShakeY = (Math.random() - 0.5) * shakeAmount * (1 - progress);

          if (stage) {
            stage.pivot.set(originalPivotX + randomShakeX, originalPivotY + randomShakeY);
          }
        },
        onComplete: () => {
          if (stage) {
            stage.pivot.set(originalPivotX, originalPivotY);
          }
        },
      }
    );
  };

  /**
   * Listen for dialog state changes from SpaceUI
   */
  useEffect(() => {
    const handleDialogStateChanged = (event: CustomEvent) => {
      isDialogOpenRef.current = event.detail.isOpen;
    };

    window.addEventListener("dialog-state-changed", handleDialogStateChanged as EventListener);

    return () => {
      window.removeEventListener("dialog-state-changed", handleDialogStateChanged as EventListener);
    };
  }, []);

  /**
   * Listen for minimap clicks from SpaceUI
   */
  useEffect(() => {
    if (!initialized) return;

    const handleMinimapClick = (event: CustomEvent) => {
      const { x, y } = event.detail;

      // Move player to clicked position on minimap
      movePlayerToTarget({ x, y }, true);
    };

    window.addEventListener("minimap-click", handleMinimapClick as EventListener);

    return () => {
      window.removeEventListener("minimap-click", handleMinimapClick as EventListener);
    };
  }, [initialized]);

  /**
   * ✨ Show path preview on hover (juicy microinteraction)
   */
  const showPathPreview = (targetGridPos: { x: number; y: number }) => {
    const pathfinder = pathfinderRef.current;
    const gridRenderer = gridRendererRef.current;

    if (!pathfinder || !gridRenderer) return;

    // Remove old preview
    if (pathPreviewRef.current) {
      const objectLayer = gridRenderer.getLayer("object");
      objectLayer.removeChild(pathPreviewRef.current);
      pathPreviewRef.current.destroy();
      pathPreviewRef.current = null;
    }

    // Check if target is valid (using area collision for character size)
    const isBlocked = gridRenderer.isAreaBlocked(targetGridPos);
    let actualTarget = targetGridPos;

    if (isBlocked) {
      const nearestWalkable = gridRenderer.getNearestWalkable(targetGridPos, 3);
      if (!nearestWalkable) return; // Can't reach
      actualTarget = nearestWalkable;
    }

    // Find path
    const path = pathfinder.findPath(userPosition, actualTarget);
    if (path.length === 0) return;

    // Draw path preview
    const preview = new PIXI.Graphics();
    preview.alpha = 0.4;

    // Draw dotted line along path
    const allPoints = [userPosition, ...path];
    for (let i = 0; i < allPoints.length - 1; i++) {
      const from = allPoints[i];
      const to = allPoints[i + 1];

      const fromX = from.x * TILE_SIZE + TILE_SIZE / 2;
      const fromY = from.y * TILE_SIZE + TILE_SIZE / 2;
      const toX = to.x * TILE_SIZE + TILE_SIZE / 2;
      const toY = to.y * TILE_SIZE + TILE_SIZE / 2;

      // Dotted line effect
      const dist = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
      const segments = Math.ceil(dist / 8);

      for (let s = 0; s < segments; s += 2) {
        const t1 = s / segments;
        const t2 = Math.min((s + 1) / segments, 1);

        const x1 = fromX + (toX - fromX) * t1;
        const y1 = fromY + (toY - fromY) * t1;
        const x2 = fromX + (toX - fromX) * t2;
        const y2 = fromY + (toY - fromY) * t2;

        preview.moveTo(x1, y1);
        preview.lineTo(x2, y2);
      }
    }

    preview.stroke({ color: 0x3b82f6, width: 2 });

    const objectLayer = gridRenderer.getLayer("object");
    objectLayer.addChild(preview);
    pathPreviewRef.current = preview;
  };

  /**
   * ✨ Clear path preview
   */
  const clearPathPreview = () => {
    if (!pathPreviewRef.current || !gridRendererRef.current) return;

    const objectLayer = gridRendererRef.current.getLayer("object");
    objectLayer.removeChild(pathPreviewRef.current);
    pathPreviewRef.current.destroy();
    pathPreviewRef.current = null;
  };

  /**
   * Handle canvas click to move player (left click only) + ripple effect
   */
  useEffect(() => {
    if (!initialized || !app || !stage) return;

    try {
      // Safety check for canvas (can be null during HMR)
      const canvas = app?.canvas;
      if (!canvas) return;

      const handleMouseDown = (event: MouseEvent) => {
        if (isDialogOpenRef.current) return;
        if (event.button !== 0) return; // Solo clic izquierdo

        isMouseDownRef.current = true;
        mouseDownTimeRef.current = Date.now();
        isDraggingRef.current = false;
      };

      const handleMouseUp = (event: MouseEvent) => {
        if (isDialogOpenRef.current) return;
        if (event.button !== 0) return;
        if (!containerRef.current || !userAvatarRef.current) return;

        const clickDuration = Date.now() - mouseDownTimeRef.current;
        const wasDragging = isDraggingRef.current;

        isMouseDownRef.current = false;
        isDraggingRef.current = false;

        // Si fue un clic simple (menos de 200ms y sin arrastre)
        if (clickDuration < 200 && !wasDragging) {
          event.preventDefault();
          window.getSelection()?.removeAllRanges();

          const rect = containerRef.current.getBoundingClientRect();
          const screenX = event.clientX - rect.left;
          const screenY = event.clientY - rect.top;

          const worldX = (screenX + cameraPositionRef.current.x) / scaleRef.current;
          const worldY = (screenY + cameraPositionRef.current.y) / scaleRef.current;

          const targetGridPos = {
            x: Math.floor(worldX / TILE_SIZE),
            y: Math.floor(worldY / TILE_SIZE),
          };

          clearPathPreview();

          const gridRenderer = gridRendererRef.current;
          const isBlocked = gridRenderer?.isAreaBlocked(targetGridPos) ?? false;

          if (isBlocked) {
            const nearestWalkable = gridRenderer?.getNearestWalkable(targetGridPos, 3);
            if (nearestWalkable) {
              createClickRipple(worldX, worldY);
              movePlayerToTarget(nearestWalkable);
            } else {
              createBlockedIndicator(worldX, worldY);
            }
          } else {
            createClickRipple(worldX, worldY);
            movePlayerToTarget(targetGridPos);
          }
        }
      };

      const handleCanvasClick = (event: MouseEvent) => {
        // Manejado por mousedown/mouseup para mejor control
        event.preventDefault();
      };

      // ✨ Show path preview on hover + handle click and drag movement
      const handleCanvasMove = (event: MouseEvent) => {
        if (isDialogOpenRef.current) return;
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const screenX = event.clientX - rect.left;
        const screenY = event.clientY - rect.top;

        // Convert screen coordinates to world coordinates
        const worldX = (screenX + cameraPositionRef.current.x) / scaleRef.current;
        const worldY = (screenY + cameraPositionRef.current.y) / scaleRef.current;

        const targetGridPos = {
          x: Math.floor(worldX / TILE_SIZE),
          y: Math.floor(worldY / TILE_SIZE),
        };

        // Si el mouse está presionado y se mueve, activar arrastre
        if (isMouseDownRef.current && !userAvatarRef.current) return;

        if (isMouseDownRef.current) {
          const dx = Math.abs(screenX - lastMouseMoveRef.current.x);
          const dy = Math.abs(screenY - lastMouseMoveRef.current.y);

          // Si se movió más de 5 pixels, es un arrastre
          if (dx > 5 || dy > 5) {
            isDraggingRef.current = true;

            // Throttle drag movement to prevent lag
            const now = Date.now();
            if (now - lastDragMoveRef.current >= DRAG_THROTTLE_MS) {
              lastDragMoveRef.current = now;

              // Mover hacia donde está el cursor continuamente
              const gridRenderer = gridRendererRef.current;
              const isBlocked = gridRenderer?.isAreaBlocked(targetGridPos) ?? false;

              if (!isBlocked) {
                // Solo mover si no está bloqueado
                movePlayerToTarget(targetGridPos);
              }
            }
          }
        }

        lastMouseMoveRef.current = { x: screenX, y: screenY };
        // Path preview disabled for cleaner aesthetic - user prefers minimal UI
        // Only show destination circle indicator
        clearPathPreview();
      };

      // Click ripple effect (success) - dual ring
      const createClickRipple = (x: number, y: number) => {
        const objectLayer = gridRendererRef.current?.getLayer("object");
        if (!objectLayer) return;

        // Outer ring
        const ripple1 = new PIXI.Graphics();
        ripple1.circle(0, 0, 10);
        ripple1.stroke({ color: 0x3b82f6, width: 2, alpha: 0.8 });
        ripple1.position.set(x, y);
        objectLayer.addChild(ripple1);

        // Inner ring (delayed)
        const ripple2 = new PIXI.Graphics();
        ripple2.circle(0, 0, 6);
        ripple2.stroke({ color: 0x60a5fa, width: 3, alpha: 0.6 });
        ripple2.position.set(x, y);
        objectLayer.addChild(ripple2);

        let scale1 = 1,
          alpha1 = 0.8;
        let scale2 = 0.5,
          alpha2 = 0.6;

        const animate = () => {
          scale1 += 0.2;
          alpha1 -= 0.1;
          scale2 += 0.15;
          alpha2 -= 0.08;

          ripple1.scale.set(scale1);
          ripple1.alpha = Math.max(0, alpha1);
          ripple2.scale.set(scale2);
          ripple2.alpha = Math.max(0, alpha2);

          if (alpha1 > 0 || alpha2 > 0) {
            requestAnimationFrame(animate);
          } else {
            objectLayer.removeChild(ripple1);
            objectLayer.removeChild(ripple2);
            ripple1.destroy();
            ripple2.destroy();
          }
        };
        animate();
      };

      // ✨ New: Blocked indicator (visual feedback for blocked tiles)
      const createBlockedIndicator = (x: number, y: number) => {
        const indicator = new PIXI.Graphics();

        // Draw "X" mark
        indicator.moveTo(-6, -6);
        indicator.lineTo(6, 6);
        indicator.moveTo(6, -6);
        indicator.lineTo(-6, 6);
        indicator.stroke({ color: 0xff4444, width: 3, alpha: 0.9 });

        indicator.position.set(x, y);

        const objectLayer = gridRendererRef.current?.getLayer("object");
        if (objectLayer) {
          objectLayer.addChild(indicator);

          // Animate: quick pulse and fade
          let alpha = 0.9;
          let scale = 1.2;
          const animate = () => {
            alpha -= 0.1;
            scale += 0.05;

            indicator.alpha = alpha;
            indicator.scale.set(scale);

            if (alpha > 0) {
              requestAnimationFrame(animate);
            } else {
              objectLayer.removeChild(indicator);
              indicator.destroy();
            }
          };
          animate();
        }
      };

      const handleContextMenu = (event: MouseEvent) => {
        // Just prevent the default context menu
        event.preventDefault();
      };

      const handleDoubleClick = (event: MouseEvent) => {
        event.preventDefault();
      };

      const handleTouchStart = (event: TouchEvent) => {
        if (isDialogOpenRef.current || event.touches.length !== 1) return;

        const touch = event.touches[0];
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const screenX = touch.clientX - rect.left;
        const screenY = touch.clientY - rect.top;
        // Convert screen coordinates to world coordinates
        const worldX = (screenX + cameraPositionRef.current.x) / scaleRef.current;
        const worldY = (screenY + cameraPositionRef.current.y) / scaleRef.current;

        const targetGridPos = {
          x: Math.floor(worldX / TILE_SIZE),
          y: Math.floor(worldY / TILE_SIZE),
        };

        clearPathPreview();

        const gridRenderer = gridRendererRef.current;
        const isBlocked = gridRenderer?.isAreaBlocked(targetGridPos) ?? false;

        if (isBlocked) {
          const nearestWalkable = gridRenderer?.getNearestWalkable(targetGridPos, 3);
          if (nearestWalkable) {
            createClickRipple(worldX, worldY);
            movePlayerToTarget(nearestWalkable);
          } else {
            createBlockedIndicator(worldX, worldY);
          }
        } else {
          createClickRipple(worldX, worldY);
          movePlayerToTarget(targetGridPos);
        }
      };

      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("mouseup", handleMouseUp);
      canvas.addEventListener("click", handleCanvasClick);
      canvas.addEventListener("mousemove", handleCanvasMove);
      canvas.addEventListener("contextmenu", handleContextMenu);
      canvas.addEventListener("dblclick", handleDoubleClick);
      canvas.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });

      return () => {
        canvas.removeEventListener("mousedown", handleMouseDown);
        canvas.removeEventListener("mouseup", handleMouseUp);
        canvas.removeEventListener("click", handleCanvasClick);
        canvas.removeEventListener("mousemove", handleCanvasMove);
        canvas.removeEventListener("contextmenu", handleContextMenu);
        canvas.removeEventListener("dblclick", handleDoubleClick);
        canvas.removeEventListener("touchstart", handleTouchStart);
        clearPathPreview();
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("❌ Canvas handlers:", error);
      }
      return () => {};
    }
  }, [initialized, app, stage, userPosition]);

  /**
   * Zoom intuitivo: scroll hacia cursor + pinch
   */
  useEffect(() => {
    if (!initialized || !containerRef.current) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (!stage || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Simple zoom - just update scale, camera lerp handles the rest
      const zoomFactor = event.deltaY > 0 ? 0.92 : 1.08; // Smoother zoom steps
      const newScale = Math.max(1.0, Math.min(4.0, scaleRef.current * zoomFactor));

      scaleRef.current = newScale;
      stage.scale.set(newScale);

      // Update camera to recenter on player with new scale
      updateCamera();
    };

    // Pinch to zoom (mobile)
    let lastPinchDistance = 0;
    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 2 && stage) {
        event.preventDefault();

        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        if (lastPinchDistance > 0) {
          const scale = distance / lastPinchDistance;
          const newScale = Math.max(1.0, Math.min(4.0, scaleRef.current * scale));
          scaleRef.current = newScale;
          stage.scale.set(newScale);
        }

        lastPinchDistance = distance;
      }
    };

    const handleTouchEnd = () => {
      lastPinchDistance = 0;
    };

    const container = containerRef.current;
    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [initialized, stage]);

  /**
   * Auto-focus container for keyboard input
   */
  useEffect(() => {
    if (!initialized || !containerRef.current) return;

    // Focus the container to receive keyboard events
    containerRef.current.focus();

    if (import.meta.env.DEV) {
      console.log("[SpaceContainer] Container focused for keyboard input");
    }
  }, [initialized]);

  /**
   * DEBUG: Expose gridRenderer and pathfinder in window for console testing
   */
  useEffect(() => {
    if (gridRendererRef.current && import.meta.env.DEV) {
      (window as any).__debugGridRenderer = gridRendererRef.current;
      (window as any).__debugPathfinder = pathfinderRef.current;
      (window as any).__debugUserAvatar = userAvatarRef.current;
      console.log(
        "[SpaceContainer DEBUG] Exposed __debugGridRenderer, __debugPathfinder, __debugUserAvatar"
      );
    }
  }, [initialized]);

  /**
   * OPTIMIZED: Handle keyboard input for movement with throttling
   * Prevents lag from rapid key press events by debouncing movement
   */
  useEffect(() => {
    if (!initialized) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isDialogOpenRef.current) return;

      const key = event.key.toLowerCase();
      const isMovementKey = [
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        "w",
        "a",
        "s",
        "d",
      ].includes(key);

      // Track pressed keys
      if (isMovementKey) {
        event.preventDefault();
        pressedKeysRef.current.add(key);
      }

      // Space to recenter camera
      if (key === " " || key === "space") {
        event.preventDefault();
        if (userAvatarRef.current && stage && app) {
          const targetX = userAvatarRef.current.x - app.screen.width / 2 / scaleRef.current;
          const targetY = userAvatarRef.current.y - app.screen.height / 2 / scaleRef.current;

          const startPivotX = cameraPositionRef.current.x;
          const startPivotY = cameraPositionRef.current.y;
          const duration = 300;
          const startTime = Date.now();

          const animateSnap = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);

            const currentPivotX = startPivotX + (targetX - startPivotX) * ease;
            const currentPivotY = startPivotY + (targetY - startPivotY) * ease;

            cameraPositionRef.current.x = currentPivotX;
            cameraPositionRef.current.y = currentPivotY;
            stage.pivot.set(currentPivotX, currentPivotY);

            if (progress < 1) {
              requestAnimationFrame(animateSnap);
            }
          };

          animateSnap();
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      pressedKeysRef.current.delete(key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [initialized, app, stage]);

  /**
   * Mouse wheel zoom control - like Gather Clone
   */
  useEffect(() => {
    if (!initialized || !containerRef.current || !stage) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      const zoomSpeed = 0.001;
      const minScale = 1.0;
      const maxScale = 4.0;

      // deltaY > 0 = scroll down = zoom out
      // deltaY < 0 = scroll up = zoom in
      const delta = -event.deltaY * zoomSpeed;
      const newScale = Math.max(minScale, Math.min(maxScale, scaleRef.current + delta));

      updateScale(newScale);
    };

    const container = containerRef.current;
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [initialized, stage]);

  /**
   * Update agent sprites
   */
  useEffect(() => {
    if (!initialized || !gridRendererRef.current) return;

    const layers = gridRendererRef.current.getLayers();
    const agents = Array.from(agentsMap.values()).filter(
      (agent) => agent.id !== localUserIdRef.current
    );
    const existingIds = new Set(agentSpritesRef.current.keys());
    const newIds = new Set(agents.map((a) => a.id));

    existingIds.forEach((id) => {
      if (!newIds.has(id)) {
        const sprite = agentSpritesRef.current.get(id);
        if (sprite) {
          layers.object.removeChild(sprite);
          agentSpritesRef.current.delete(id);
        }
      }
    });

    agents.forEach((agent) => {
      const existing = agentSpritesRef.current.get(agent.id);

      if (existing) {
        if (
          existing.gridPosition.x !== agent.position.x ||
          existing.gridPosition.y !== agent.position.y
        ) {
          existing.setTargetGridPosition(agent.position);
        }
      } else {
        // Use avatar.spriteId if available, otherwise use a default
        const characterId = agent.avatar.spriteId ?? 1;
        const sprite = new CharacterSprite(agent.position, characterId, agent.name, true, agent.id);

        // Initialize spritesheet (async)
        sprite.init().catch((err) => {
          if (import.meta.env.DEV) {
            console.error(`[SpaceContainer] Failed to init new agent ${agent.id}:`, err);
          }
        });

        // Spawn animation for new agents
        sprite.alpha = 0;
        sprite.scale.set(0.3);
        let progress = 0;
        const spawn = () => {
          progress += 0.12;
          sprite.alpha = Math.min(1, progress);
          sprite.scale.set(Math.min(1, 0.3 + progress * 0.7));
          if (progress < 1) requestAnimationFrame(spawn);
        };
        spawn();

        // Spawn particles
        for (let i = 0; i < 8; i++) {
          setTimeout(() => {
            const angle = (i / 8) * Math.PI * 2;
            const dist = 16;
            spawnMovementParticle(
              agent.position.x * TILE_SIZE + Math.cos(angle) * dist,
              agent.position.y * TILE_SIZE + Math.sin(angle) * dist
            );
          }, i * 30);
        }

        layers.object.addChild(sprite);
        agentSpritesRef.current.set(agent.id, sprite);
      }
    });

    gridRendererRef.current.sortObjectsByY();
  }, [agentsMap, initialized]);

  useEffect(() => {
    if (!initialized || !isConnected || !space || hasJoinedSpaceRef.current) return;

    const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
    const userName = "Player";

    localUserIdRef.current = userId;
    joinSpace(space.id, userId, userName, false);
    hasJoinedSpaceRef.current = true;
  }, [initialized, isConnected, space?.id]);

  useEffect(() => {
    if (!initialized || remoteUsers.length === 0 || !gridRendererRef.current) return;

    const layers = gridRendererRef.current.getLayers();
    const existingRemoteSprites = agentSpritesRef.current;

    remoteUsers.forEach((remoteUser) => {
      if (remoteUser.is_agent) return;
      if (remoteUser.id === localUserIdRef.current) return;

      const existing = existingRemoteSprites.get(remoteUser.id);

      if (existing) {
        const targetPos = {
          x: Math.floor(remoteUser.x),
          y: Math.floor(remoteUser.y),
        };
        if (existing.gridPosition.x !== targetPos.x || existing.gridPosition.y !== targetPos.y) {
          existing.setTargetGridPosition(targetPos);
        }
      } else {
        const sprite = new CharacterSprite(
          { x: Math.floor(remoteUser.x), y: Math.floor(remoteUser.y) },
          Math.floor(Math.random() * 50) + 1,
          remoteUser.name,
          false,
          remoteUser.id
        );

        sprite.init().catch((err) => {
          if (import.meta.env.DEV) {
            console.error(`Failed to init remote user ${remoteUser.id}:`, err);
          }
        });

        sprite.alpha = 0;
        sprite.scale.set(0.5);
        let progress = 0;
        const spawn = () => {
          progress += 0.08;
          sprite.alpha = Math.min(1, progress);
          sprite.scale.set(Math.min(1, 0.5 + progress * 0.5));
          if (progress < 1) requestAnimationFrame(spawn);
        };
        spawn();

        layers.object.addChild(sprite);
        existingRemoteSprites.set(remoteUser.id, sprite);
      }
    });

    const remoteUserIds = new Set(remoteUsers.filter((u) => !u.is_agent).map((u) => u.id));
    const spritesToRemove: string[] = [];

    existingRemoteSprites.forEach((sprite, id) => {
      if (!id.startsWith("agent_") && !remoteUserIds.has(id)) {
        spritesToRemove.push(id);
      }
    });

    spritesToRemove.forEach((id) => {
      const sprite = existingRemoteSprites.get(id);
      if (sprite) {
        layers.object.removeChild(sprite);
        existingRemoteSprites.delete(id);
      }
    });

    gridRendererRef.current.sortObjectsByY();
  }, [remoteUsers, initialized]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="w-full h-full relative overflow-hidden bg-background select-none touch-none cursor-default focus:outline-none"
      style={{ touchAction: "none" }}
      onContextMenu={(e) => e.preventDefault()}
      onDoubleClick={(e) => e.preventDefault()}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground text-sm">Loading workspace...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-50">
          <div className="flex flex-col items-center gap-4 max-w-md p-6">
            <div className="text-4xl">⚠️</div>
            <h3 className="text-xl font-semibold text-destructive">
              Failed to initialize workspace
            </h3>
            <p className="text-muted-foreground text-sm text-center">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      )}

      <SpaceUI
        spaceId={spaceId}
        wsConnected={isConnected}
        remoteUserCount={remoteUsers.length}
        onSpaceChange={onSpaceChange}
      />

      {/* Dialogue Bubbles */}
      <DialogueBubbles scale={scaleState} cameraPosition={cameraPosition} />

      {/* Game Systems */}
      <GameHUD />
      <GameNotifications />
      <InteractiveTutorial />

      {/* Panels */}
      <AgentPanel spaceId={spaceId} />
      <AgentMetricsPanel />
    </div>
  );
}
