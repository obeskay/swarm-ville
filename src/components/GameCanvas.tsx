import { useEffect, useRef } from "react";
import { SpriteGameApp } from "../game/SpriteGameApp";

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<SpriteGameApp | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isInitializedRef.current) return;

    const initGame = async () => {
      try {
        const game = new SpriteGameApp();
        await game.init(canvas);
        gameRef.current = game;
        isInitializedRef.current = true;
        console.log("[GameCanvas] ✅ Game ready with sprites");

        // Expose game to window for AgentSpawner
        (window as any).game = game;
      } catch (err) {
        console.error("[GameCanvas] ❌ Init error:", err);
      }
    };

    initGame();

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy();
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: "block" }}
      />
    </div>
  );
}
