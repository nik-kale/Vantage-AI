import { useEffect, useState, useCallback, useRef } from "react";
import { initVantage, Vantage } from "@vantage-ai/sdk";
import type { VantageConfig, Recommendation } from "@vantage-ai/sdk";

/**
 * Main Vantage hook for React applications
 * Manages Vantage instance lifecycle and provides control methods
 */
export function useVantage(config: VantageConfig) {
  const [isActive, setIsActive] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const vantageRef = useRef<Vantage | null>(null);

  const start = useCallback(() => {
    if (!vantageRef.current) {
      vantageRef.current = initVantage({
        ...config,
        onTrigger: (recommendation) => {
          setRecommendations((prev) => [...prev, recommendation]);
          config.onTrigger?.(recommendation);
        }
      });
    }
    vantageRef.current.start();
    setIsActive(true);
  }, [config]);

  const stop = useCallback(() => {
    if (vantageRef.current) {
      // Assuming we add a stop method to Vantage class
      setIsActive(false);
    }
  }, []);

  const clearRecommendations = useCallback(() => {
    setRecommendations([]);
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    start,
    stop,
    isActive,
    recommendations,
    clearRecommendations,
    instance: vantageRef.current
  };
}

/**
 * Hook for accessing the latest recommendation
 */
export function useRecommendation() {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [history, setHistory] = useState<Recommendation[]>([]);

  useEffect(() => {
    // This would integrate with a VantageContext provider
    // For now, return null
  }, []);

  const dismiss = useCallback(() => {
    setRecommendation(null);
  }, []);

  return {
    current: recommendation,
    history,
    dismiss
  };
}

/**
 * Hook for manual guidance triggering
 */
export function useGuidance() {
  const [activeGuidance, setActiveGuidance] = useState<string[]>([]);

  const showGuidance = useCallback((id: string, recommendation: Recommendation) => {
    setActiveGuidance((prev) => [...prev, id]);
    // Trigger the recommendation
  }, []);

  const hideGuidance = useCallback((id: string) => {
    setActiveGuidance((prev) => prev.filter((gid) => gid !== id));
  }, []);

  const isActive = useCallback((id: string) => {
    return activeGuidance.includes(id);
  }, [activeGuidance]);

  return {
    showGuidance,
    hideGuidance,
    isActive,
    activeGuidance
  };
}

/**
 * Hook for playbook management
 */
export function usePlaybook() {
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPlaybooks = useCallback(async (url: string) => {
    setLoading(true);
    try {
      const response = await fetch(url);
      const data = await response.json();
      setPlaybooks(data);
    } catch (error) {
      console.error("Failed to load playbooks", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addPlaybook = useCallback((playbook: any) => {
    setPlaybooks((prev) => [...prev, playbook]);
  }, []);

  const removePlaybook = useCallback((id: string) => {
    setPlaybooks((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return {
    playbooks,
    loading,
    loadPlaybooks,
    addPlaybook,
    removePlaybook
  };
}

/**
 * Hook for analytics integration
 */
export function useAnalytics(adapter?: any) {
  const track = useCallback((event: string, properties?: Record<string, any>) => {
    if (adapter) {
      adapter.track(event, properties);
    }
  }, [adapter]);

  const identify = useCallback((userId: string, traits?: Record<string, any>) => {
    if (adapter) {
      adapter.identify(userId, traits);
    }
  }, [adapter]);

  const page = useCallback((name?: string, properties?: Record<string, any>) => {
    if (adapter) {
      adapter.page(name, properties);
    }
  }, [adapter]);

  return {
    track,
    identify,
    page
  };
}
