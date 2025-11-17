/**
 * @vantage-ai/realtime
 * Real-time collaboration for dashboards with WebSocket
 */

export interface RealtimeConfig {
  url: string;
  roomId: string;
  userId: string;
  userName?: string;
}

export interface RealtimeMessage {
  type: "cursor" | "selection" | "update" | "presence";
  userId: string;
  data: any;
  timestamp: number;
}

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private config: RealtimeConfig;
  private listeners: Map<string, Function[]> = new Map();

  constructor(config: RealtimeConfig) {
    this.config = config;
  }

  connect(): void {
    this.ws = new WebSocket(this.config.url);

    this.ws.onopen = () => {
      this.send({ type: "join", roomId: this.config.roomId, userId: this.config.userId });
      this.emit("connected", {});
    };

    this.ws.onmessage = (event) => {
      const message: RealtimeMessage = JSON.parse(event.data);
      this.emit(message.type, message);
    };

    this.ws.onclose = () => this.emit("disconnected", {});
    this.ws.onerror = (error) => this.emit("error", error);
  }

  disconnect(): void {
    this.ws?.close();
  }

  send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ ...data, userId: this.config.userId, timestamp: Date.now() }));
    }
  }

  sendCursor(x: number, y: number): void {
    this.send({ type: "cursor", data: { x, y } });
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }
}

export { RealtimeConfig, RealtimeMessage, RealtimeClient };
