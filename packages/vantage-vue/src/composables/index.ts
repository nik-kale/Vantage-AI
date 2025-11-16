import { ref, onMounted, onUnmounted, computed, type Ref } from "vue";
import { initVantage, type Vantage, type VantageConfig, type Recommendation } from "@vantage-ai/sdk";

/**
 * Main Vantage composable for Vue 3 applications
 */
export function useVantage(config: VantageConfig) {
  const isActive = ref(false);
  const recommendations: Ref<Recommendation[]> = ref([]);
  let vantageInstance: Vantage | null = null;

  const start = () => {
    if (!vantageInstance) {
      vantageInstance = initVantage({
        ...config,
        onTrigger: (recommendation) => {
          recommendations.value.push(recommendation);
          config.onTrigger?.(recommendation);
        }
      });
    }
    vantageInstance.start();
    isActive.value = true;
  };

  const stop = () => {
    if (vantageInstance) {
      isActive.value = false;
    }
  };

  const clearRecommendations = () => {
    recommendations.value = [];
  };

  onMounted(() => {
    if (config.autoStart !== false) {
      start();
    }
  });

  onUnmounted(() => {
    stop();
  });

  return {
    isActive,
    recommendations,
    start,
    stop,
    clearRecommendations,
    instance: computed(() => vantageInstance)
  };
}

/**
 * Composable for accessing recommendations
 */
export function useRecommendation() {
  const current: Ref<Recommendation | null> = ref(null);
  const history: Ref<Recommendation[]> = ref([]);

  const dismiss = () => {
    current.value = null;
  };

  return {
    current,
    history,
    dismiss
  };
}

/**
 * Composable for manual guidance control
 */
export function useGuidance() {
  const activeGuidance: Ref<string[]> = ref([]);

  const showGuidance = (id: string, recommendation: Recommendation) => {
    if (!activeGuidance.value.includes(id)) {
      activeGuidance.value.push(id);
    }
  };

  const hideGuidance = (id: string) => {
    activeGuidance.value = activeGuidance.value.filter((gid) => gid !== id);
  };

  const isActive = (id: string) => {
    return activeGuidance.value.includes(id);
  };

  return {
    showGuidance,
    hideGuidance,
    isActive,
    activeGuidance: computed(() => activeGuidance.value)
  };
}

/**
 * Composable for playbook management
 */
export function usePlaybook() {
  const playbooks = ref([]);
  const loading = ref(false);

  const loadPlaybooks = async (url: string) => {
    loading.value = true;
    try {
      const response = await fetch(url);
      const data = await response.json();
      playbooks.value = data;
    } catch (error) {
      console.error("Failed to load playbooks", error);
    } finally {
      loading.value = false;
    }
  };

  const addPlaybook = (playbook: any) => {
    playbooks.value.push(playbook);
  };

  const removePlaybook = (id: string) => {
    playbooks.value = playbooks.value.filter((p: any) => p.id !== id);
  };

  return {
    playbooks,
    loading,
    loadPlaybooks,
    addPlaybook,
    removePlaybook
  };
}
