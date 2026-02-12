import { useEffect, useRef, useState } from "react";
import { Game } from "./game/Game";
import { createWS } from "./hooks/ws";

// Minimalist App - <60 lines
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const game = new Game();
    game.init(canvasRef.current).then(() => {
      gameRef.current = game;
      (window as unknown as { game: Game }).game = game;
    });

    const ws = createWS("ws://localhost:8765", (e) => {
      if (e.type === "agent_spawn" && gameRef.current) {
        const d = e.data as { id: string; name: string; role: string };
        gameRef.current.spawnAgent(d.id, d.name, d.role);
      }
      if (e.type === "agent_remove" && gameRef.current) {
        const d = e.data as { id: string };
        gameRef.current.removeAgent(d.id);
      }
    });

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    return () => { game.destroy(); ws.close(); };
  }, []);

  return (
    <div className="w-screen h-screen bg-gray-900 overflow-hidden">
      <div className="absolute top-3 right-3 z-10">
        <span className={`px-2 py-1 rounded text-xs ${connected ? "bg-green-600" : "bg-red-600"}`}>
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
