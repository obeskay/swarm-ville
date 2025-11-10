import { useState, useEffect } from "react";
import { Wifi, WifiOff, MapPin } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Badge } from "../ui/badge";
import { useSpaceStore } from "../../stores/spaceStore";
import { cn } from "@/lib/utils";

export function BottomStatusBar() {
  const [isConnected, setIsConnected] = useState(true);
  const { userPosition } = useSpaceStore();

  // Mock WebSocket connection status (will be replaced with real implementation)
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(true);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TooltipProvider>
      <div className="h-8 px-4 flex items-center justify-between text-xs border-t border-border bg-card">
        {/* Left Section: Connection Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-default">
              {isConnected ? (
                <>
                  <Wifi className={cn("h-3.5 w-3.5", "text-emerald-500 dark:text-emerald-400")} />
                  <span className="text-muted-foreground">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className={cn("h-3.5 w-3.5", "text-amber-500 dark:text-amber-400")} />
                  <span className="text-muted-foreground">Disconnected</span>
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isConnected ? "Connected to WebSocket server" : "Attempting to reconnect..."}</p>
          </TooltipContent>
        </Tooltip>

        {/* Right Section: Position */}
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          <Badge variant="secondary" className="h-5 text-xs tabular-nums">
            {userPosition.x}, {userPosition.y}
          </Badge>
        </div>
      </div>
    </TooltipProvider>
  );
}
