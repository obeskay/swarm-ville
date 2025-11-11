import { useEffect, useRef, useState } from "react";
import { WebSocketClient, ServerMessage, UserState } from "../lib/ws/WebSocketClient";

export function useWebSocket(url?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<UserState[]>([]);
  const clientRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    const client = new WebSocketClient(url);
    clientRef.current = client;

    client
      .connect()
      .then(() => setIsConnected(true))
      .catch((e) => console.error("WebSocket connection failed:", e));

    client.onMessage((msg: ServerMessage) => {
      switch (msg.type) {
        case "space_state":
          setUsers(msg.users);
          if (msg.version !== undefined) {
            window.dispatchEvent(
              new CustomEvent("space-version-update", {
                detail: { spaceId: msg.space_id, version: msg.version },
              })
            );
          }
          break;

        case "user_joined":
          setUsers((prev) => [...prev, msg.user]);
          break;

        case "user_left":
          setUsers((prev) => prev.filter((u) => u.id !== msg.user_id));
          break;

        case "position_update":
          setUsers((prev) =>
            prev.map((u) =>
              u.id === msg.user_id
                ? { ...u, x: msg.x, y: msg.y, direction: msg.direction }
                : u,
            ),
          );
          break;

        case "chat_broadcast":
          console.log(`[${msg.name}]: ${msg.message}`);
          break;

        case "agent_broadcast":
          console.log(`Agent ${msg.agent_id} performed: ${msg.action}`);
          break;

        case "space_updated":
          window.dispatchEvent(
            new CustomEvent("space-version-update", {
              detail: {
                spaceId: msg.space_id,
                version: msg.version,
                updatedAt: msg.updated_at
              },
            })
          );
          break;

        case "error":
          console.error("Server error:", msg.message);
          break;
      }
    });

    return () => {
      client.disconnect();
      setIsConnected(false);
    };
  }, [url]);

  const joinSpace = (spaceId: string, userId: string, name: string, isAgent = false) => {
    clientRef.current?.joinSpace(spaceId, userId, name, isAgent);
  };

  const leaveSpace = (spaceId: string) => {
    clientRef.current?.leaveSpace(spaceId);
  };

  const updatePosition = (x: number, y: number, direction: string) => {
    clientRef.current?.updatePosition(x, y, direction);
  };

  const sendChat = (message: string) => {
    clientRef.current?.sendChat(message);
  };

  const sendAgentAction = (action: string, target?: string, data?: any) => {
    clientRef.current?.sendAgentAction(action, target, data);
  };

  return {
    isConnected,
    users,
    joinSpace,
    leaveSpace,
    updatePosition,
    sendChat,
    sendAgentAction,
  };
}
