import { useState, useEffect } from "react";
import { Wifi, WifiOff, MapPin, Gauge } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Separator } from "../ui/separator";
import { StatusIndicator } from "../ui/status-indicator";
import { Stat } from "../ui/stat";
import { useSpaceStore } from "../../stores/spaceStore";

export function BottomStatusBar() {
  const [isConnected, setIsConnected] = useState(true);
  const [fps, setFps] = useState(60);
  const { userPosition, agents } = useSpaceStore();

  // Mock WebSocket connection status
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(true);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  // FPS monitoring
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        setFps(Math.round(frameCount * 1000 / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    const rafId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const getFpsVariant = () => {
    if (fps >= 55) return "success" as const;
    if (fps >= 30) return "warning" as const;
    return "error" as const;
  };

  return (
    <TooltipProvider>
      <div className="h-7 px-4 flex items-center justify-between text-xs border-t border-border/50 bg-card/50 backdrop-blur-sm">
        {/* Left Section: Connection + Performance */}
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-default">
                <StatusIndicator
                  variant={isConnected ? "online" : "offline"}
                  size="sm"
                  label={isConnected ? "ONLINE" : "OFFLINE"}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{isConnected ? "Connected to server" : "Reconnecting..."}</p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-3" />

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-default">
                <Stat
                  variant={getFpsVariant()}
                  size="sm"
                  icon={<Gauge className="h-3 w-3" />}
                  value={fps}
                  label="FPS"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">Frames per second</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Center Section: Stats */}
        <Stat
          variant="default"
          size="sm"
          value={agents.size}
          label={agents.size === 1 ? "agent" : "agents"}
        />

        {/* Right Section: Position */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-default">
              <Stat
                variant="default"
                size="sm"
                icon={<MapPin className="h-3 w-3" />}
                value={`${Math.round(userPosition.x)}, ${Math.round(userPosition.y)}`}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">Current position</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
