/**
 * @vantage-ai/react-native
 * React Native SDK for Vantage AI
 *
 * Mobile analytics and session replay for React Native apps
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  AppState,
  AppStateStatus,
  Dimensions,
  Platform,
  NativeModules,
  NativeEventEmitter
} from "react-native";
import type { VantageConfig, Recommendation } from "@vantage-ai/sdk";

// =============================================================================
// Types
// =============================================================================

export interface MobileVantageConfig extends Omit<VantageConfig, "mode"> {
  /** Sample rate for session replay (0-1) */
  sessionReplaySampleRate?: number;
  /** Privacy level for recordings */
  privacyLevel?: "strict" | "balanced" | "permissive";
  /** Enable touch heatmaps */
  enableTouchHeatmaps?: boolean;
  /** Enable crash reporting */
  enableCrashReporting?: boolean;
  /** Maximum session duration (ms) */
  maxSessionDuration?: number;
}

export interface MobileSession {
  id: string;
  startTime: number;
  endTime?: number;
  screenViews: ScreenView[];
  touches: TouchEvent[];
  crashes: CrashEvent[];
  deviceInfo: DeviceInfo;
}

export interface ScreenView {
  screenName: string;
  timestamp: number;
  duration?: number;
  params?: Record<string, any>;
}

export interface TouchEvent {
  x: number;
  y: number;
  timestamp: number;
  type: "press" | "long-press" | "swipe";
  screenName: string;
}

export interface CrashEvent {
  message: string;
  stack?: string;
  timestamp: number;
  screenName: string;
  fatal: boolean;
}

export interface DeviceInfo {
  platform: string;
  osVersion: string;
  appVersion: string;
  deviceModel: string;
  screenWidth: number;
  screenHeight: number;
  locale: string;
}

// =============================================================================
// Mobile Session Manager
// =============================================================================

class MobileSessionManager {
  private currentSession: MobileSession | null = null;
  private config: MobileVantageConfig;
  private sessionTimeout: NodeJS.Timeout | null = null;
  private isRecording = false;

  constructor(config: MobileVantageConfig) {
    this.config = config;
  }

  startSession(): MobileSession {
    const { width, height } = Dimensions.get("window");

    this.currentSession = {
      id: this.generateSessionId(),
      startTime: Date.now(),
      screenViews: [],
      touches: [],
      crashes: [],
      deviceInfo: {
        platform: Platform.OS,
        osVersion: Platform.Version.toString(),
        appVersion: "1.0.0", // Should come from app config
        deviceModel: this.getDeviceModel(),
        screenWidth: width,
        screenHeight: height,
        locale: this.getLocale()
      }
    };

    this.isRecording = true;
    this.setupSessionTimeout();

    return this.currentSession;
  }

  endSession(): MobileSession | null {
    if (!this.currentSession) return null;

    this.currentSession.endTime = Date.now();
    this.isRecording = false;

    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }

    const session = { ...this.currentSession };
    this.currentSession = null;

    return session;
  }

  trackScreenView(screenName: string, params?: Record<string, any>): void {
    if (!this.currentSession || !this.isRecording) return;

    // End duration of previous screen
    const views = this.currentSession.screenViews;
    if (views.length > 0) {
      const lastView = views[views.length - 1];
      lastView.duration = Date.now() - lastView.timestamp;
    }

    this.currentSession.screenViews.push({
      screenName,
      timestamp: Date.now(),
      params
    });
  }

  trackTouch(x: number, y: number, type: TouchEvent["type"]): void {
    if (!this.currentSession || !this.isRecording) return;

    const screenName = this.getCurrentScreenName();

    this.currentSession.touches.push({
      x,
      y,
      timestamp: Date.now(),
      type,
      screenName
    });

    // Limit touch events to prevent memory issues
    if (this.currentSession.touches.length > 10000) {
      this.currentSession.touches = this.currentSession.touches.slice(-5000);
    }
  }

  trackCrash(error: Error, fatal: boolean): void {
    if (!this.currentSession) return;

    this.currentSession.crashes.push({
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      screenName: this.getCurrentScreenName(),
      fatal
    });
  }

  getCurrentSession(): MobileSession | null {
    return this.currentSession;
  }

  exportSession(): string | null {
    if (!this.currentSession) return null;

    return JSON.stringify(this.currentSession, null, 2);
  }

  private setupSessionTimeout(): void {
    const maxDuration = this.config.maxSessionDuration || 30 * 60 * 1000; // 30 min default

    this.sessionTimeout = setTimeout(() => {
      this.endSession();
    }, maxDuration);
  }

  private getCurrentScreenName(): string {
    if (!this.currentSession || this.currentSession.screenViews.length === 0) {
      return "Unknown";
    }
    return this.currentSession.screenViews[this.currentSession.screenViews.length - 1].screenName;
  }

  private generateSessionId(): string {
    return `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceModel(): string {
    // In a real implementation, this would use react-native-device-info
    return Platform.OS === "ios" ? "iPhone" : "Android Device";
  }

  private getLocale(): string {
    // In a real implementation, this would use NativeModules.SettingsManager
    return "en-US";
  }
}

// =============================================================================
// Mobile Analytics Tracker
// =============================================================================

class MobileAnalyticsTracker {
  private events: Array<{ name: string; properties: any; timestamp: number }> = [];
  private config: MobileVantageConfig;

  constructor(config: MobileVantageConfig) {
    this.config = config;
  }

  track(eventName: string, properties?: Record<string, any>): void {
    this.events.push({
      name: eventName,
      properties: properties || {},
      timestamp: Date.now()
    });

    // Send to analytics if configured
    if (this.config.onTrigger) {
      console.log(`[Vantage Mobile] Event: ${eventName}`, properties);
    }
  }

  screenView(screenName: string, properties?: Record<string, any>): void {
    this.track("screen_view", {
      screen_name: screenName,
      ...properties
    });
  }

  getEvents(): Array<{ name: string; properties: any; timestamp: number }> {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

// =============================================================================
// React Native SDK Instance
// =============================================================================

export class VantageReactNative {
  private sessionManager: MobileSessionManager;
  private analyticsTracker: MobileAnalyticsTracker;
  private config: MobileVantageConfig;
  private appStateListener: any = null;

  constructor(config: MobileVantageConfig) {
    this.config = config;
    this.sessionManager = new MobileSessionManager(config);
    this.analyticsTracker = new MobileAnalyticsTracker(config);
  }

  /**
   * Start tracking
   */
  start(): void {
    // Start session
    this.sessionManager.startSession();

    // Track app state changes
    this.appStateListener = AppState.addEventListener("change", this.handleAppStateChange);

    // Setup error handling
    if (this.config.enableCrashReporting) {
      this.setupErrorHandlers();
    }

    this.analyticsTracker.track("vantage_mobile_started");
  }

  /**
   * Stop tracking
   */
  stop(): void {
    const session = this.sessionManager.endSession();

    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }

    this.analyticsTracker.track("vantage_mobile_stopped");

    return session;
  }

  /**
   * Track screen view
   */
  trackScreen(screenName: string, params?: Record<string, any>): void {
    this.sessionManager.trackScreenView(screenName, params);
    this.analyticsTracker.screenView(screenName, params);
  }

  /**
   * Track touch event
   */
  trackTouch(x: number, y: number, type: TouchEvent["type"] = "press"): void {
    if (!this.config.enableTouchHeatmaps) return;
    this.sessionManager.trackTouch(x, y, type);
  }

  /**
   * Track custom event
   */
  track(eventName: string, properties?: Record<string, any>): void {
    this.analyticsTracker.track(eventName, properties);
  }

  /**
   * Export current session
   */
  exportSession(): string | null {
    return this.sessionManager.exportSession();
  }

  /**
   * Get current session
   */
  getCurrentSession(): MobileSession | null {
    return this.sessionManager.getCurrentSession();
  }

  private handleAppStateChange = (nextAppState: AppStateStatus): void {
    if (nextAppState === "background") {
      this.analyticsTracker.track("app_backgrounded");
    } else if (nextAppState === "active") {
      this.analyticsTracker.track("app_foregrounded");
    }
  };

  private setupErrorHandlers(): void {
    // Global error handler
    const originalErrorHandler = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      this.sessionManager.trackCrash(error, isFatal || false);
      this.analyticsTracker.track("error", {
        message: error.message,
        stack: error.stack,
        fatal: isFatal
      });

      // Call original handler
      if (originalErrorHandler) {
        originalErrorHandler(error, isFatal);
      }
    });
  }
}

// =============================================================================
// React Hook
// =============================================================================

export interface UseVantageMobileReturn {
  isActive: boolean;
  session: MobileSession | null;
  trackScreen: (screenName: string, params?: Record<string, any>) => void;
  trackTouch: (x: number, y: number, type?: TouchEvent["type"]) => void;
  track: (eventName: string, properties?: Record<string, any>) => void;
  start: () => void;
  stop: () => void;
  exportSession: () => string | null;
}

/**
 * React Hook for Vantage Mobile
 *
 * @example
 * ```tsx
 * function App() {
 *   const { trackScreen, trackTouch, isActive } = useVantageMobile({
 *     sessionReplaySampleRate: 1.0,
 *     enableTouchHeatmaps: true
 *   });
 *
 *   useEffect(() => {
 *     trackScreen('HomeScreen');
 *   }, []);
 *
 *   return <View onTouchStart={(e) => trackTouch(e.nativeEvent.pageX, e.nativeEvent.pageY)}>...</View>;
 * }
 * ```
 */
export function useVantageMobile(config: MobileVantageConfig): UseVantageMobileReturn {
  const [isActive, setIsActive] = useState(false);
  const [session, setSession] = useState<MobileSession | null>(null);
  const vantageRef = useRef<VantageReactNative | null>(null);

  useEffect(() => {
    vantageRef.current = new VantageReactNative(config);
    return () => {
      if (vantageRef.current) {
        vantageRef.current.stop();
      }
    };
  }, []);

  const start = useCallback(() => {
    if (vantageRef.current) {
      vantageRef.current.start();
      setIsActive(true);
      setSession(vantageRef.current.getCurrentSession());
    }
  }, []);

  const stop = useCallback(() => {
    if (vantageRef.current) {
      vantageRef.current.stop();
      setIsActive(false);
      setSession(null);
    }
  }, []);

  const trackScreen = useCallback((screenName: string, params?: Record<string, any>) => {
    if (vantageRef.current) {
      vantageRef.current.trackScreen(screenName, params);
      setSession(vantageRef.current.getCurrentSession());
    }
  }, []);

  const trackTouch = useCallback((x: number, y: number, type: TouchEvent["type"] = "press") => {
    if (vantageRef.current) {
      vantageRef.current.trackTouch(x, y, type);
    }
  }, []);

  const track = useCallback((eventName: string, properties?: Record<string, any>) => {
    if (vantageRef.current) {
      vantageRef.current.track(eventName, properties);
    }
  }, []);

  const exportSession = useCallback(() => {
    return vantageRef.current?.exportSession() || null;
  }, []);

  return {
    isActive,
    session,
    trackScreen,
    trackTouch,
    track,
    start,
    stop,
    exportSession
  };
}

// =============================================================================
// Navigation Tracking HOC
// =============================================================================

/**
 * Higher-order component to automatically track screen views
 *
 * @example
 * ```tsx
 * const HomeScreen = withVantageTracking('HomeScreen')(HomeScreenComponent);
 * ```
 */
export function withVantageTracking(screenName: string) {
  return function <P extends object>(Component: React.ComponentType<P>) {
    return function VantageTrackedComponent(props: P) {
      const { trackScreen } = useVantageMobile({});

      useEffect(() => {
        trackScreen(screenName);
      }, [trackScreen]);

      return <Component {...props} />;
    };
  };
}

// =============================================================================
// Exports
// =============================================================================

export {
  MobileVantageConfig,
  MobileSession,
  ScreenView,
  TouchEvent,
  CrashEvent,
  DeviceInfo,
  VantageReactNative,
  useVantageMobile,
  withVantageTracking
};

export type { Recommendation } from "@vantage-ai/sdk";
