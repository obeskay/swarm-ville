import { useEffect, useRef } from "react";
import { WebSocketClient } from "../lib/ws/WebSocketClient";

export function useAgentWebSocket(
  agentId: string,
  agentName: string,
  spaceId: string,
  enabled: boolean = true,
) {
  const clientRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const client = new WebSocketClient();
    clientRef.current = client;

    client
      .connect()
      .then(() => {
        client.joinSpace(spaceId, agentId, agentName, true);
      })
      .catch((e) => console.error(`Agent ${agentId} WebSocket connection failed:`, e));

    return () => {
      client.disconnect();
    };
  }, [agentId, agentName, spaceId, enabled]);

  const broadcastAction = (action: string, target?: string, data?: any) => {
    clientRef.current?.sendAgentAction(action, target, data);
  };

  const updatePosition = (x: number, y: number, direction: string) => {
    clientRef.current?.updatePosition(x, y, direction);
  };

  return {
    broadcastAction,
    updatePosition,
  };
}
