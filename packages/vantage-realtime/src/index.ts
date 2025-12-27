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
      const parsed = this.safeJSONParse<RealtimeMessage>(event.data);
      
      if (!parsed) {
        console.warn("RealtimeClient: Invalid JSON received");
        return;
      }

      if (!this.isValidMessageType(parsed.type)) {
        console.warn(`RealtimeClient: Invalid message type '${parsed.type}'`);
        return;
      }

      this.emit(parsed.type, parsed);
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

  private isValidMessageType(type: string): boolean {
    const validTypes = ["cursor", "selection", "update", "presence"];
    return validTypes.includes(type);
  }

  private safeJSONParse<T>(json: string): T | null {
    try {
      const parsed = JSON.parse(json);
      if (typeof parsed === "object" && parsed !== null) {
        return this.sanitizeObjectKeys(parsed) as T;
      }
      return null;
    } catch {
      return null;
    }
  }

  private sanitizeObjectKeys<T extends Record<string, any>>(obj: T): Partial<T> {
    const dangerous = ["__proto__", "constructor", "prototype"];
    const sanitized: any = {};
    for (const key in obj) {
      if (!dangerous.includes(key)) {
        sanitized[key] = obj[key];
      }
    }
    return sanitized;
  }
}

export { RealtimeConfig, RealtimeMessage, RealtimeClient };
