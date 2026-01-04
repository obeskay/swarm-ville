import { useEffect, useRef } from "react";
import { ColorGameApp } from "../game/ColorGameApp";

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<ColorGameApp | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isInitializedRef.current) return;

    const initGame = async () => {
      try {
        // Log the selected character path for debugging
        const charPath = (window as unknown as { selectedCharacterPath?: string })
          .selectedCharacterPath;
        console.log("[GameCanvas] Initializing with character:", charPath);

        const game = new ColorGameApp();
        await game.init(canvas);
        gameRef.current = game;
        isInitializedRef.current = true;
        console.log("[GameCanvas] Game ready");

        // Expose game to window for AgentSpawner
        (window as unknown as { game: ColorGameApp }).game = game;
      } catch (err) {
        console.error("[GameCanvas] Init error:", err);
      }
    };

    initGame();

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy();
        gameRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={
          {
            display: "block",
            zIndex: 0,
            imageRendering: "pixelated",
          } as React.CSSProperties
        }
      />
    </div>
  );
}
