import type { ServerMessage } from "../types";

export type Status = "connecting" | "online" | "offline";

export interface Relay {
  send: (message: unknown) => void;
  close: () => void;
}

/**
 * WebSocket client with capped exponential backoff. The URL is derived from the
 * page origin, so the socket follows whatever host the app is served from and
 * upgrades to wss:// automatically behind TLS.
 */
export const connect = (
  onMessage: (message: ServerMessage) => void,
  onStatus: (status: Status) => void
): Relay => {
  let socket: WebSocket | null = null;
  let retryTimer: number | undefined;
  let attempt = 0;
  let closed = false;

  const url = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;

  const open = () => {
    if (closed) return;
    onStatus("connecting");
    socket = new WebSocket(url);

    socket.onopen = () => {
      attempt = 0;
      onStatus("online");
    };

    socket.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data) as ServerMessage);
      } catch {
        // A malformed frame is not worth tearing the session down for.
      }
    };

    socket.onclose = () => {
      onStatus("offline");
      if (closed) return;
      attempt += 1;
      const delay = Math.min(500 * 2 ** (attempt - 1), 10_000);
      retryTimer = window.setTimeout(open, delay);
    };

    socket.onerror = () => socket?.close();
  };

  open();

  return {
    send: (message) => {
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
    },
    close: () => {
      closed = true;
      window.clearTimeout(retryTimer);
      socket?.close();
    }
  };
};
