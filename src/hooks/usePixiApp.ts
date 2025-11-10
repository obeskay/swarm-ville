import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { CharacterTextureLoader } from "../lib/pixi/CharacterTextureLoader";

export type GameLoopCallback = (deltaTime: number) => void;

interface PixiAppState {
  app: PIXI.Application | null;
  stage: PIXI.Container | null;
  isLoading: boolean;
  error: string | null;
  setGameLoop: (callback: GameLoopCallback | null) => void;
}

/**
 * Pixi.js hook based on Gather Clone's App.ts initialization pattern
 * Simplified to avoid async state update issues
 */
export function usePixiApp(
  containerRef: React.RefObject<HTMLDivElement>,
): PixiAppState {
  const appRef = useRef<PIXI.Application | null>(null);
  const gameLoopCallbackRef = useRef<GameLoopCallback | null>(null);
  const [state, setState] = useState<PixiAppState>({
    app: null,
    stage: null,
    isLoading: true,
    error: null,
    setGameLoop: (callback: GameLoopCallback | null) => {
      gameLoopCallbackRef.current = callback;
    },
  });

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    // Prevent double initialization
    if (appRef.current) return;

    const initializeApp = async () => {
      try {
        // Preload character textures to prevent loading issues
        console.log("[usePixiApp] 📦 Starting character texture preload...");
        await CharacterTextureLoader.preloadAllCharacters();
        const stats = CharacterTextureLoader.getStats();
        console.log(
          `[usePixiApp] ✅ Character textures preloaded: ${stats.loadedCount}/${stats.totalCharacters}`,
        );

        // Create app following Gather Clone's pattern
        const app = new PIXI.Application();

        await app.init({
          resizeTo: container,
          backgroundColor: 0x1a1a2e, // Dark blue for visibility
          roundPixels: true,
          antialias: false,
        });

        console.log(
          "[usePixiApp] ✅ App initialized with renderer:",
          app.renderer.type === 1 ? "WebGL" : "Canvas",
        );

        container.appendChild(app.canvas);
        app.stage.eventMode = "static";
        app.stage.sortableChildren = true;

        // 🔍 CRITICAL: Verify canvas is visible
        console.log("[usePixiApp] 🔍 Canvas verification:");
        console.log(
          `  - Canvas in DOM: ${app.canvas.parentElement === container}`,
        );
        console.log(
          `  - Canvas display: ${window.getComputedStyle(app.canvas).display}`,
        );
        console.log(
          `  - Canvas visibility: ${window.getComputedStyle(app.canvas).visibility}`,
        );
        console.log(
          `  - Canvas opacity: ${window.getComputedStyle(app.canvas).opacity}`,
        );
        console.log(`  - Canvas width: ${app.canvas.width}`);
        console.log(`  - Canvas height: ${app.canvas.height}`);
        console.log(`  - Stage visible: ${app.stage.visible}`);
        console.log(`  - Stage alpha: ${app.stage.alpha}`);

        // Setup game loop
        app.ticker.add((ticker) => {
          const deltaTime = ticker.deltaTime;
          if (gameLoopCallbackRef.current) {
            gameLoopCallbackRef.current(deltaTime);
          }
        });

        // Ensure ticker is running
        if (!app.ticker.started) {
          app.ticker.start();
          console.log("[usePixiApp] ✅ Ticker started");
        }

        appRef.current = app;

        // Expose app globally for debugging
        (window as any).pixiApp = app;
        console.log("[usePixiApp] 🔍 pixiApp exposed to window for debugging");

        setState({
          app,
          stage: app.stage,
          isLoading: false,
          error: null,
          setGameLoop: (callback: GameLoopCallback | null) => {
            gameLoopCallbackRef.current = callback;
          },
        });
      } catch (error) {
        console.error("[usePixiApp] Init failed:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to initialize Pixi.js";
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        appRef.current = null;
      }
    };

    initializeApp();

    // Cleanup function
    return () => {
      if (appRef.current) {
        try {
          const app = appRef.current;

          // Store canvas reference before destroying
          const canvas = app.canvas;

          // Stop ticker first
          app.ticker.stop();

          // Remove canvas from DOM before destroying app
          if (container && canvas && canvas.parentNode === container) {
            container.removeChild(canvas);
          }

          // Destroy app
          app.destroy(true, {
            children: true,
            texture: false,
            textureSource: false,
          });
          appRef.current = null;
        } catch (e) {
          // Silently handle cleanup errors during HMR
          appRef.current = null;
        }
      }

      setState({
        app: null,
        stage: null,
        isLoading: true,
        error: null,
        setGameLoop: (callback: GameLoopCallback | null) => {
          gameLoopCallbackRef.current = callback;
        },
      });
    };
  }, []);

  return state;
}
