/**
 * Svelte Stores for Vantage AI
 * Reactive state management using Svelte's store pattern
 */

import { writable, derived, readable, get } from "svelte/store";
import type { Writable, Readable } from "svelte/store";
import { initVantage, type Vantage, type VantageConfig, type Recommendation } from "@vantage-ai/sdk";

/**
 * Vantage store
 */
export interface VantageStore {
  vantage: Readable<Vantage | null>;
  isActive: Readable<boolean>;
  recommendations: Readable<Recommendation[]>;
  start: () => void;
  stop: () => void;
  clearRecommendations: () => void;
}

/**
 * Create Vantage store
 */
export function createVantageStore(config: VantageConfig): VantageStore {
  const vantageInstance = initVantage({
    ...config,
    onTrigger: (rec) => {
      recommendationsStore.update((recs) => [...recs, rec]);
      config.onTrigger?.(rec);
    }
  });

  const vantageStore = readable<Vantage | null>(vantageInstance);
  const isActiveStore = writable(false);
  const recommendationsStore = writable<Recommendation[]>([]);

  return {
    vantage: vantageStore,
    isActive: { subscribe: isActiveStore.subscribe },
    recommendations: { subscribe: recommendationsStore.subscribe },

    start: () => {
      vantageInstance.start();
      isActiveStore.set(true);
    },

    stop: () => {
      vantageInstance.stop();
      isActiveStore.set(false);
    },

    clearRecommendations: () => {
      recommendationsStore.set([]);
    }
  };
}

/**
 * Recommendation store
 */
export interface RecommendationStore {
  current: Readable<Recommendation | null>;
  history: Readable<Recommendation[]>;
  dismiss: () => void;
}

export function createRecommendationStore(): RecommendationStore {
  const currentStore = writable<Recommendation | null>(null);
  const historyStore = writable<Recommendation[]>([]);

  return {
    current: { subscribe: currentStore.subscribe },
    history: { subscribe: historyStore.subscribe },

    dismiss: () => {
      const current = get(currentStore);
      if (current) {
        historyStore.update((history) => [...history, current]);
        currentStore.set(null);
      }
    }
  };
}

/**
 * Guidance store
 */
export interface GuidanceStore {
  activeGuidance: Readable<string[]>;
  showGuidance: (id: string, rec: Recommendation) => void;
  hideGuidance: (id: string) => void;
  isActive: (id: string) => boolean;
}

export function createGuidanceStore(): GuidanceStore {
  const activeStore = writable<Map<string, Recommendation>>(new Map());

  return {
    activeGuidance: derived(activeStore, ($active) => Array.from($active.keys())),

    showGuidance: (id: string, rec: Recommendation) => {
      activeStore.update((active) => {
        active.set(id, rec);
        return active;
      });
    },

    hideGuidance: (id: string) => {
      activeStore.update((active) => {
        active.delete(id);
        return active;
      });
    },

    isActive: (id: string) => {
      return get(activeStore).has(id);
    }
  };
}

/**
 * Playbook store
 */
export interface PlaybookStore {
  playbooks: Readable<any[]>;
  loading: Readable<boolean>;
  loadPlaybooks: (url: string) => Promise<void>;
  addPlaybook: (playbook: any) => void;
  removePlaybook: (id: string) => void;
}

export function createPlaybookStore(initialPlaybooks: any[] = []): PlaybookStore {
  const playbooksStore = writable(initialPlaybooks);
  const loadingStore = writable(false);

  return {
    playbooks: { subscribe: playbooksStore.subscribe },
    loading: { subscribe: loadingStore.subscribe },

    loadPlaybooks: async (url: string) => {
      loadingStore.set(true);
      try {
        const response = await fetch(url);
        const playbooks = await response.json();
        playbooksStore.set(playbooks);
      } catch (error) {
        console.error("Failed to load playbooks:", error);
      } finally {
        loadingStore.set(false);
      }
    },

    addPlaybook: (playbook: any) => {
      playbooksStore.update((playbooks) => [...playbooks, playbook]);
    },

    removePlaybook: (id: string) => {
      playbooksStore.update((playbooks) => playbooks.filter((p) => p.id !== id));
    }
  };
}

/**
 * Analytics store
 */
export interface AnalyticsStore {
  track: (event: string, properties?: Record<string, any>) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
  page: (name?: string, properties?: Record<string, any>) => void;
}

export function createAnalyticsStore(adapter?: any): AnalyticsStore {
  return {
    track: (event: string, properties?: Record<string, any>) => {
      adapter?.track(event, properties);
    },

    identify: (userId: string, traits?: Record<string, any>) => {
      adapter?.identify(userId, traits);
    },

    page: (name?: string, properties?: Record<string, any>) => {
      adapter?.page(name, properties);
    }
  };
}

// Re-export types
export type {
  Vantage,
  VantageConfig,
  Recommendation,
  SuspicionSignal,
  EventContext,
  Playbook
} from "@vantage-ai/sdk";
