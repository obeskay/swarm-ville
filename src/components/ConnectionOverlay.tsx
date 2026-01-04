import { useEffect, useState } from "react";
import { WifiOff, RefreshCw, Play, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Command } from "@tauri-apps/plugin-shell";

interface ConnectionOverlayProps {
  isConnected: boolean;
  onRetry?: () => void;
}

export function ConnectionOverlay({ isConnected, onRetry }: ConnectionOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [serverStarted, setServerStarted] = useState(false);

  // Delay showing overlay to prevent flash on initial load
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (!isConnected) {
      timeout = setTimeout(() => setVisible(true), 1500);
    } else {
      setVisible(false);
      setRetrying(false);
      setStarting(false);
    }

    return () => clearTimeout(timeout);
  }, [isConnected]);

  const handleRetry = () => {
    setRetrying(true);
    onRetry?.();
    setTimeout(() => setRetrying(false), 3000);
  };

  const handleStartServer = async () => {
    setStarting(true);
    try {
      // Start the WebSocket server using Tauri shell
      const command = Command.create("node", ["server/ws-server.js"]);

      command.on("error", (error) => {
        console.error("[Server] Error:", error);
        setStarting(false);
      });

      command.stdout.on("data", (line) => {
        console.log("[Server]", line);
        if (line.includes("ws://localhost:8765")) {
          setServerStarted(true);
          // Auto-retry connection after server starts
          setTimeout(() => {
            onRetry?.();
          }, 1000);
        }
      });

      command.stderr.on("data", (line) => {
        console.error("[Server Error]", line);
      });

      await command.spawn();
      console.log("[ConnectionOverlay] Server process spawned");
    } catch (error) {
      console.error("[ConnectionOverlay] Failed to start server:", error);
      setStarting(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Darkened backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl p-8 shadow-2xl max-w-sm mx-4 text-center animate-in fade-in zoom-in-95 duration-300">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <WifiOff className="w-8 h-8 text-destructive animate-pulse" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-foreground mb-2">Backend Not Running</h2>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-6">
            The WebSocket server is not running. Start it to spawn agents and use all features.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleStartServer}
              disabled={starting || serverStarted}
              className="gap-2 w-full"
              size="lg"
            >
              {starting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting Server...
                </>
              ) : serverStarted ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Backend Server
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleRetry}
              disabled={retrying}
              className="gap-2 w-full"
            >
              <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
              {retrying ? "Connecting..." : "Retry Connection"}
            </Button>
          </div>

          {/* Status */}
          <p className="text-xs text-muted-foreground mt-4">
            {serverStarted
              ? "Server started, connecting..."
              : "Auto-reconnecting every 3 seconds..."}
          </p>
        </div>
      </div>

      {/* Top banner */}
      <div className="absolute top-0 left-0 right-0 bg-destructive/90 text-destructive-foreground py-2 px-4 flex items-center justify-center gap-2 text-sm pointer-events-auto">
        <WifiOff className="w-4 h-4" />
        <span>Backend offline</span>
        <span className="text-destructive-foreground/70">|</span>
        <button
          onClick={handleStartServer}
          className="underline hover:no-underline font-medium"
          disabled={starting}
        >
          {starting ? "Starting..." : "Start Server"}
        </button>
      </div>
    </div>
  );
}
