/**
 * Session Replay - Privacy-First Implementation
 * Records DOM mutations, user interactions, and network activity
 * WITHOUT capturing PII, sensitive form data, or passwords
 */

import { filterPII, sanitizeHTML } from "@vantage-ai/sdk/security/sanitizer";
import { logger } from "@vantage-ai/sdk";

export interface RecordingConfig {
  /** Capture mouse movements */
  recordMouse?: boolean;
  /** Capture scroll events */
  recordScroll?: boolean;
  /** Capture network requests */
  recordNetwork?: boolean;
  /** Capture console logs */
  recordConsole?: boolean;
  /** Mask sensitive elements (passwords, credit cards) */
  maskSensitiveData?: boolean;
  /** Sample rate (0-1) */
  sampleRate?: number;
  /** Max session duration (ms) */
  maxDuration?: number;
  /** Privacy level: "strict" | "balanced" | "permissive" */
  privacyLevel?: "strict" | "balanced" | "permissive";
  /** Ignore CSS selectors */
  ignoredSelectors?: string[];
}

export interface RecordedEvent {
  type: "dom" | "mouse" | "scroll" | "network" | "console" | "viewport";
  timestamp: number;
  data: any;
}

export interface RecordedSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  events: RecordedEvent[];
  viewport: { width: number; height: number };
  userAgent: string;
  url: string;
}

export class SessionReplay {
  private config: Required<RecordingConfig>;
  private session: RecordedSession | null = null;
  private observers: MutationObserver[] = [];
  private isRecording = false;
  private eventBuffer: RecordedEvent[] = [];
  private maxBufferSize = 1000;
  
  // Cleanup refs
  private originalFetch: typeof fetch | null = null;
  private originalConsole: { log: any; error: any; warn: any } | null = null;
  private cleanupListeners: Array<() => void> = [];

  constructor(config: RecordingConfig = {}) {
    this.config = {
      recordMouse: config.recordMouse ?? true,
      recordScroll: config.recordScroll ?? true,
      recordNetwork: config.recordNetwork ?? true,
      recordConsole: config.recordConsole ?? false,
      maskSensitiveData: config.maskSensitiveData ?? true,
      sampleRate: config.sampleRate ?? 1.0,
      maxDuration: config.maxDuration ?? 30 * 60 * 1000, // 30 minutes
      privacyLevel: config.privacyLevel ?? "balanced",
      ignoredSelectors: config.ignoredSelectors ?? []
    };
  }

  /**
   * Start recording session
   */
  start(): void {
    if (this.isRecording) {
      logger.warn("Session replay already recording");
      return;
    }

    // Sample rate check
    if (Math.random() > this.config.sampleRate) {
      logger.info("Session not sampled for replay");
      return;
    }

    this.isRecording = true;
    this.session = {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      events: [],
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.setupRecorders();
    this.scheduleAutoStop();
  }

  /**
   * Stop recording
   */
  stop(): RecordedSession | null {
    if (!this.isRecording || !this.session) {
      return null;
    }

    this.isRecording = false;
    this.session.endTime = Date.now();
    this.session.events = this.eventBuffer;

    // Cleanup observers
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];

    // Cleanup Listeners
    this.cleanupListeners.forEach(cleanup => cleanup());
    this.cleanupListeners = [];

    // Restore Global Fetch
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }

    // Restore Console
    if (this.originalConsole) {
      console.log = this.originalConsole.log;
      console.error = this.originalConsole.error;
      console.warn = this.originalConsole.warn;
      this.originalConsole = null;
    }

    const recordedSession = this.session;
    this.session = null;
    this.eventBuffer = [];

    return recordedSession;
  }

  /**
   * Get current session
   */
  getCurrentSession(): RecordedSession | null {
    return this.session;
  }

  /**
   * Export session as JSON
   */
  export(): string | null {
    const session = this.stop();
    if (!session) return null;

    return JSON.stringify(session, null, 2);
  }

  /**
   * Setup all recorders
   */
  private setupRecorders(): void {
    this.recordInitialDOM();

    if (this.config.recordMouse) {
      this.setupMouseRecording();
    }

    if (this.config.recordScroll) {
      this.setupScrollRecording();
    }

    if (this.config.recordNetwork) {
      this.setupNetworkRecording();
    }

    if (this.config.recordConsole) {
      this.setupConsoleRecording();
    }

    this.setupDOMRecording();
    this.setupViewportRecording();
  }

  /**
   * Record initial DOM snapshot
   */
  private recordInitialDOM(): void {
    const snapshot = this.serializeDOM(document.documentElement);

    this.recordEvent({
      type: "dom",
      timestamp: Date.now(),
      data: {
        action: "snapshot",
        snapshot
      }
    });
  }

  /**
   * Setup DOM mutation recording
   */
  private setupDOMRecording(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (!this.shouldIgnoreElement(mutation.target as Element)) {
          this.recordEvent({
            type: "dom",
            timestamp: Date.now(),
            data: {
              action: mutation.type,
              target: this.getElementPath(mutation.target as Element),
              addedNodes: Array.from(mutation.addedNodes).map((node) =>
                this.serializeNode(node)
              ),
              removedNodes: Array.from(mutation.removedNodes).map((node) =>
                this.serializeNode(node)
              ),
              attributeName: mutation.attributeName,
              oldValue: mutation.oldValue
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true,
      attributeOldValue: true,
      characterDataOldValue: true
    });

    this.observers.push(observer);
  }

  /**
   * Setup mouse movement recording
   */
  private setupMouseRecording(): void {
    const throttledMouseMove = this.throttle((e: MouseEvent) => {
      this.recordEvent({
        type: "mouse",
        timestamp: Date.now(),
        data: {
          action: "move",
          x: e.clientX,
          y: e.clientY
        }
      });
    }, 50);

    const mouseMoveHandler = throttledMouseMove;
    window.addEventListener("mousemove", mouseMoveHandler);
    this.cleanupListeners.push(() => window.removeEventListener("mousemove", mouseMoveHandler));

    const clickHandler = (e: MouseEvent) => {
      this.recordEvent({
        type: "mouse",
        timestamp: Date.now(),
        data: {
          action: "click",
          x: e.clientX,
          y: e.clientY,
          target: this.getElementPath(e.target as Element)
        }
      });
    };
    window.addEventListener("click", clickHandler);
    this.cleanupListeners.push(() => window.removeEventListener("click", clickHandler));
  }

  /**
   * Setup scroll recording
   */
  private setupScrollRecording(): void {
    const throttledScroll = this.throttle(() => {
      this.recordEvent({
        type: "scroll",
        timestamp: Date.now(),
        data: {
          x: window.scrollX,
          y: window.scrollY
        }
      });
    }, 100);

    const scrollHandler = throttledScroll;
    window.addEventListener("scroll", scrollHandler);
    this.cleanupListeners.push(() => window.removeEventListener("scroll", scrollHandler));
  }

  /**
   * Setup network recording (fetch/XHR)
   */
  private setupNetworkRecording(): void {
    // Intercept fetch
    if (!this.originalFetch) {
        this.originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = Date.now();
            const url = typeof args[0] === "string" ? args[0] : (args[0] as Request).url; // Safe access

            try {
                const response = await this.originalFetch!(...args);
                this.recordEvent({
                type: "network",
                timestamp: Date.now(),
                data: {
                    method: args[1]?.method || "GET",
                    url: filterPII(url),
                    status: response.status,
                    duration: Date.now() - startTime
                }
                });
                return response;
            } catch (error) {
                this.recordEvent({
                type: "network",
                timestamp: Date.now(),
                data: {
                    method: args[1]?.method || "GET",
                    url: filterPII(url),
                    error: (error as Error).message,
                    duration: Date.now() - startTime
                }
                });
                throw error;
            }
        };
    }
  }

  /**
   * Setup console recording
   */
  private setupConsoleRecording(): void {
    if (this.originalConsole) return;

    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn
    };

    const originalConsole = this.originalConsole; // Capture for closure

    ["log", "error", "warn"].forEach((level) => {
      (console as any)[level] = (...args: any[]) => {
        this.recordEvent({
          type: "console",
          timestamp: Date.now(),
          data: {
            level,
            message: args.map((arg) => filterPII(String(arg))).join(" ")
          }
        });

        (originalConsole as any)[level](...args);
      };
    });
  }

  /**
   * Setup viewport recording
   */
  private setupViewportRecording(): void {
    const resizeHandler = () => {
      this.recordEvent({
        type: "viewport",
        timestamp: Date.now(),
        data: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      });
    };
    
    window.addEventListener("resize", resizeHandler);
    this.cleanupListeners.push(() => window.removeEventListener("resize", resizeHandler));
  }

  /**
   * Record an event
   */
  private recordEvent(event: RecordedEvent): void {
    if (!this.isRecording) return;

    this.eventBuffer.push(event);

    // Limit buffer size
    if (this.eventBuffer.length > this.maxBufferSize) {
      this.eventBuffer.shift();
    }
  }

  /**
   * Serialize DOM element
   */
  private serializeDOM(element: Element): any {
    const serialized: any = {
      tag: element.tagName.toLowerCase(),
      attributes: {}
    };

    // Capture attributes (except sensitive ones)
    Array.from(element.attributes).forEach((attr) => {
      if (!this.isSensitiveAttribute(attr.name)) {
        serialized.attributes[attr.name] = this.maskValue(attr.value, element);
      }
    });

    // Capture text content
    if (element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
      serialized.text = this.maskValue(element.textContent || "", element);
    } else {
      serialized.children = Array.from(element.children).map((child) =>
        this.serializeDOM(child)
      );
    }

    return serialized;
  }

  /**
   * Serialize a node
   */
  private serializeNode(node: Node): any {
    if (node.nodeType === Node.ELEMENT_NODE) {
      return this.serializeDOM(node as Element);
    } else if (node.nodeType === Node.TEXT_NODE) {
      return {
        type: "text",
        content: this.maskValue(node.textContent || "", node.parentElement!)
      };
    }
    return null;
  }

  /**
   * Mask sensitive values based on privacy level
   */
  private maskValue(value: string, element: Element | null): string {
    if (!this.config.maskSensitiveData || !element) {
      return value;
    }

    const tagName = element.tagName?.toLowerCase();
    const type = element.getAttribute("type")?.toLowerCase();
    const inputMode = element.getAttribute("inputmode")?.toLowerCase();

    // Always mask passwords and credit cards
    if (
      type === "password" ||
      type === "creditcard" ||
      element.hasAttribute("data-sensitive")
    ) {
      return "***";
    }

    // Mask based on privacy level
    if (this.config.privacyLevel === "strict") {
      // Mask all input values
      if (tagName === "input" || tagName === "textarea") {
        return "***";
      }
      // Mask email and phone inputs
      if (type === "email" || type === "tel" || inputMode === "tel") {
        return "***";
      }
    }

    // Filter PII from text content
    if (this.config.privacyLevel !== "permissive") {
      return filterPII(value);
    }

    return value;
  }

  /**
   * Check if attribute is sensitive
   */
  private isSensitiveAttribute(name: string): boolean {
    const sensitive = ["data-token", "data-key", "data-secret", "authorization"];
    return sensitive.includes(name.toLowerCase());
  }

  /**
   * Check if element should be ignored
   */
  private shouldIgnoreElement(element: Element | null): boolean {
    if (!element) return true;

    return this.config.ignoredSelectors.some((selector) => {
      try {
        return element.matches(selector);
      } catch {
        return false;
      }
    });
  }

  /**
   * Get element CSS path
   */
  private getElementPath(element: Element | null): string {
    if (!element) return "";

    const path: string[] = [];
    let current: Element | null = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector += `#${current.id}`;
        path.unshift(selector);
        break;
      } else if (current.className && typeof current.className === "string") {
        const classes = current.className.trim().split(/\s+/).join(".");
        if (classes) {
          selector += `.${classes}`;
        }
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(" > ");
  }

  /**
   * Throttle function
   */
  private throttle<T extends (...args: any[]) => void>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= limit) {
        lastCall = now;
        func(...args);
      }
    };
  }

  /**
   * Schedule auto-stop
   */
  private scheduleAutoStop(): void {
    setTimeout(() => {
      if (this.isRecording) {
        logger.info("Session replay auto-stopped after max duration");
        this.stop();
      }
    }, this.config.maxDuration);
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Session Replay Player
 */
export class SessionReplayPlayer {
  private container: HTMLElement;
  private session: RecordedSession | null = null;
  private currentEventIndex = 0;
  private isPlaying = false;
  private playbackSpeed = 1;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Load session
   */
  load(session: RecordedSession): void {
    this.session = session;
    this.currentEventIndex = 0;
    this.renderInitialState();
  }

  /**
   * Play session
   */
  play(): void {
    if (!this.session || this.isPlaying) return;

    this.isPlaying = true;
    this.playEvents();
  }

  /**
   * Pause playback
   */
  pause(): void {
    this.isPlaying = false;
  }

  /**
   * Set playback speed
   */
  setSpeed(speed: number): void {
    this.playbackSpeed = speed;
  }

  /**
   * Seek to timestamp
   */
  seek(timestamp: number): void {
    if (!this.session) return;

    this.currentEventIndex = this.session.events.findIndex(
      (e) => e.timestamp >= timestamp
    );

    if (this.currentEventIndex === -1) {
      this.currentEventIndex = this.session.events.length - 1;
    }

    this.renderState();
  }

  /**
   * Render initial state
   */
  private renderInitialState(): void {
    if (!this.session) return;

    this.container.innerHTML = "";
    this.container.style.width = `${this.session.viewport.width}px`;
    this.container.style.height = `${this.session.viewport.height}px`;
    this.container.style.position = "relative";
    this.container.style.overflow = "hidden";
    this.container.style.border = "1px solid #ccc";

    // Find and apply initial DOM snapshot
    const snapshotEvent = this.session.events.find(
      (e) => e.type === "dom" && e.data.action === "snapshot"
    );

    if (snapshotEvent) {
      const dom = this.deserializeDOM(snapshotEvent.data.snapshot);
      this.container.appendChild(dom);
    }
  }

  /**
   * Play events
   */
  private playEvents(): void {
    if (!this.session || !this.isPlaying) return;

    if (this.currentEventIndex >= this.session.events.length) {
      this.pause();
      return;
    }

    const event = this.session.events[this.currentEventIndex];
    const nextEvent = this.session.events[this.currentEventIndex + 1];

    this.applyEvent(event);

    this.currentEventIndex++;

    if (nextEvent) {
      const delay = (nextEvent.timestamp - event.timestamp) / this.playbackSpeed;
      setTimeout(() => this.playEvents(), delay);
    } else {
      this.pause();
    }
  }

  /**
   * Apply event to DOM
   */
  private applyEvent(event: RecordedEvent): void {
    switch (event.type) {
      case "mouse":
        this.renderMouseEvent(event);
        break;
      case "scroll":
        this.container.scrollTo(event.data.x, event.data.y);
        break;
      case "viewport":
        this.container.style.width = `${event.data.width}px`;
        this.container.style.height = `${event.data.height}px`;
        break;
      case "dom":
        // DOM mutations would be applied here
        break;
    }
  }

  /**
   * Render mouse event
   */
  private renderMouseEvent(event: RecordedEvent): void {
    const cursor = document.getElementById("replay-cursor") || this.createCursor();

    cursor.style.left = `${event.data.x}px`;
    cursor.style.top = `${event.data.y}px`;

    if (event.data.action === "click") {
      cursor.classList.add("clicking");
      setTimeout(() => cursor.classList.remove("clicking"), 200);
    }
  }

  /**
   * Create cursor element
   */
  private createCursor(): HTMLElement {
    const cursor = document.createElement("div");
    cursor.id = "replay-cursor";
    cursor.style.position = "absolute";
    cursor.style.width = "20px";
    cursor.style.height = "20px";
    cursor.style.borderRadius = "50%";
    cursor.style.backgroundColor = "rgba(255, 0, 0, 0.5)";
    cursor.style.pointerEvents = "none";
    cursor.style.zIndex = "9999";
    cursor.style.transition = "transform 0.1s";

    this.container.appendChild(cursor);
    return cursor;
  }

  /**
   * Render current state
   */
  private renderState(): void {
    // Re-render from beginning to current index
    // This is simplified - real implementation would be more efficient
  }

  /**
   * Deserialize DOM
   */
  private deserializeDOM(serialized: any): HTMLElement {
    const element = document.createElement(serialized.tag);

    // Apply attributes
    Object.entries(serialized.attributes || {}).forEach(([name, value]) => {
      element.setAttribute(name, value as string);
    });

    // Apply text content
    if (serialized.text) {
      element.textContent = serialized.text;
    }

    // Apply children
    if (serialized.children) {
      serialized.children.forEach((child: any) => {
        element.appendChild(this.deserializeDOM(child));
      });
    }

    return element;
  }
}

export function createSessionReplay(config?: RecordingConfig): SessionReplay {
  return new SessionReplay(config);
}

export function createSessionReplayPlayer(container: HTMLElement): SessionReplayPlayer {
  return new SessionReplayPlayer(container);
}
