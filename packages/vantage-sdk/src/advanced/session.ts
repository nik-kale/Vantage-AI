/**
 * Session Management and Journey Tracking
 */

import { secureRandomId } from "../security/sanitizer";

export interface SessionEvent {
  type: string;
  timestamp: number;
  route: string;
  data: Record<string, any>;
}

export interface Journey {
  sessionId: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  events: SessionEvent[];
  metadata: Record<string, any>;
}

export class SessionManager {
  private currentSession: Journey | null = null;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(private onSessionEnd?: (journey: Journey) => void) {
    this.startSession();
    this.setupActivityListeners();
  }

  startSession(userId?: string): void {
    this.currentSession = {
      sessionId: secureRandomId(),
      userId,
      startTime: Date.now(),
      events: [],
      metadata: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    this.resetTimeout();
  }

  recordEvent(event: Omit<SessionEvent, "timestamp">): void {
    if (!this.currentSession) {
      this.startSession();
    }

    this.currentSession!.events.push({
      ...event,
      timestamp: Date.now()
    });

    this.resetTimeout();
  }

  endSession(): void {
    if (!this.currentSession) return;

    this.currentSession.endTime = Date.now();

    if (this.onSessionEnd) {
      this.onSessionEnd(this.currentSession);
    }

    this.currentSession = null;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  getCurrentSession(): Journey | null {
    return this.currentSession;
  }

  getJourneyPath(): string[] {
    if (!this.currentSession) return [];

    return this.currentSession.events
      .map((event) => event.route)
      .filter((route, idx, arr) => idx === 0 || route !== arr[idx - 1]); // Remove duplicates
  }

  getDuration(): number {
    if (!this.currentSession) return 0;

    const end = this.currentSession.endTime || Date.now();
    return end - this.currentSession.startTime;
  }

  private resetTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.endSession();
    }, this.SESSION_TIMEOUT);
  }

  private setupActivityListeners(): void {
    const resetTimer = () => this.resetTimeout();

    window.addEventListener("click", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("scroll", resetTimer);
    window.addEventListener("mousemove", resetTimer);

    // End session on page unload
    window.addEventListener("beforeunload", () => {
      this.endSession();
    });
  }
}
