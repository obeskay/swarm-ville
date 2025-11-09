import { useEffect, useState } from "react";
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";

interface PixiAppState {
  app: PIXI.Application | null;
  stage: PIXI.Container | null;
  viewport: Viewport | null;
}

export function usePixiApp(
  canvasRef: React.RefObject<HTMLCanvasElement>
): PixiAppState {
  const [state, setState] = useState<PixiAppState>({
    app: null,
    stage: null,
    viewport: null,
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    const initializePixi = async () => {
      try {
        const app = new PIXI.Application({
          canvas: canvasRef.current!,
          resizeTo: window,
          backgroundColor: 0xfafafa,
          antialias: true,
        });

        // Create stage
        const stage = new PIXI.Container();
        app.stage.addChild(stage);

        // Create viewport with pan/zoom
        const viewport = new Viewport({
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
          worldWidth: 3200,
          worldHeight: 3200,
          interaction: app.renderer.events.domElement,
        });

        stage.addChild(viewport);

        // Enable drag and wheel
        viewport
          .drag({ direction: "all", wheel: false })
          .pinch()
          .wheel({ smooth: 5 });

        setState({
          app,
          stage,
          viewport,
        });

        // Handle window resize
        const handleResize = () => {
          if (viewport) {
            viewport.resize(window.innerWidth, window.innerHeight);
          }
        };

        window.addEventListener("resize", handleResize);

        return () => {
          window.removeEventListener("resize", handleResize);
          app.destroy(true, { children: true });
        };
      } catch (error) {
        console.error("Failed to initialize Pixi.js:", error);
      }
    };

    const cleanup = initializePixi();
    return () => cleanup?.then((c) => c?.());
  }, [canvasRef]);

  return state;
}
