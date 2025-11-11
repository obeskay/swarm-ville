export type ClientMessage =
  | { type: "join_space"; space_id: string; user_id: string; name: string; is_agent: boolean }
  | { type: "leave_space"; space_id: string }
  | { type: "update_position"; x: number; y: number; direction: string }
  | { type: "chat_message"; message: string }
  | { type: "agent_action"; action: string; target?: string; data?: any };

export type ServerMessage =
  | { type: "space_state"; space_id: string; users: UserState[]; version: number }
  | { type: "user_joined"; user: UserState }
  | { type: "user_left"; user_id: string }
  | { type: "position_update"; user_id: string; x: number; y: number; direction: string }
  | { type: "chat_broadcast"; user_id: string; name: string; message: string }
  | { type: "agent_broadcast"; agent_id: string; action: string; data?: any }
  | { type: "space_updated"; space_id: string; version: number; updated_at: number }
  | { type: "error"; message: string };

export interface UserState {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: string;
  is_agent: boolean;
}

type MessageHandler = (msg: ServerMessage) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: MessageHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(url: string = "ws://localhost:8765") {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);
          this.handlers.forEach((handler) => handler(msg));
        } catch (e) {
          console.error("Failed to parse message:", e);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
        this.attemptReconnect();
      };
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnect attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    setTimeout(() => {
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
      this.connect().catch((e) => console.error("Reconnect failed:", e));
    }, delay);
  }

  send(msg: ClientMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      console.error("WebSocket not connected");
    }
  }

  onMessage(handler: MessageHandler) {
    this.handlers.push(handler);
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }

  joinSpace(spaceId: string, userId: string, name: string, isAgent: boolean = false) {
    this.send({
      type: "join_space",
      space_id: spaceId,
      user_id: userId,
      name,
      is_agent: isAgent,
    });
  }

  leaveSpace(spaceId: string) {
    this.send({
      type: "leave_space",
      space_id: spaceId,
    });
  }

  updatePosition(x: number, y: number, direction: string) {
    this.send({
      type: "update_position",
      x,
      y,
      direction,
    });
  }

  sendChat(message: string) {
    this.send({
      type: "chat_message",
      message,
    });
  }

  sendAgentAction(action: string, target?: string, data?: any) {
    this.send({
      type: "agent_action",
      action,
      target,
      data,
    });
  }
}
