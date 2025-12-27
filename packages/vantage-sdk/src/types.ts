import { LoggerConfig } from "./utils/logger";

export type VantageMode = "lite" | "ai";

export interface VantageConfig {
  mode: VantageMode;
  playbooks?: Playbook[];
  onTrigger?: (recommendation: Recommendation) => void;
  offline?: {
    enabled: boolean;
    maxEvents?: number;
    maxAge?: number;
    onFlush?: (events: EventContext[]) => void;
  };
  logger?: Partial<LoggerConfig>;
  plugins?: VantagePlugin[];
}

export interface VantagePlugin {
  name: string;
  version?: string;
  onInit?(vantage: any): void | Promise<void>;
  onStart?(vantage: any): void;
  onStop?(vantage: any): void;
  onEvent?(event: EventContext): EventContext | void | null;
  onSignal?(signal: SuspicionSignal): SuspicionSignal | void | null;
  onRecommendation?(rec: Recommendation): Recommendation | void | null;
}

export interface EventContext {
  route: string;
  timestamp: number;
  eventType: string;
  details: Record<string, unknown>;
}

export interface SuspicionSignal {
  id: string;
  score: number; // 0–1
  category: "friction" | "error" | "confusion";
  context: EventContext[];
}

export interface PlaybookMatchCondition {
  categories?: ("friction" | "error" | "confusion")[];
  minScore?: number;
  routePattern?: string;
  containsText?: string[];
}

export interface Recommendation {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  link?: string;
  widget?: "banner" | "tooltip" | "checklist";
}

export interface Playbook {
  id: string;
  description?: string;
  match: PlaybookMatchCondition;
  recommendation: Recommendation;
}
