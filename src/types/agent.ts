import type { Market, MarketAnalysis, AgentDecision } from "./market";
import type { Trade, PortfolioSnapshot } from "./trade";
import type { ResearchStrategy } from "./research";

export type AgentPhase =
  | "idle"
  | "discovering"
  | "filtering"
  | "researching"
  | "analyzing"
  | "executing"
  | "monitoring"
  | "error";

export interface AgentState {
  phase: AgentPhase;
  isRunning: boolean;
  currentMarketId: string | null;
  currentStrategy: ResearchStrategy | null;
  lastRunAt: string | null;
  nextRunAt: string | null;
  cycleCount: number;
  error: string | null;
}

export type AgentEvent =
  | { type: "phase_change"; phase: AgentPhase; detail?: string }
  | { type: "market_discovered"; market: Market }
  | { type: "research_started"; marketId: string; strategy: ResearchStrategy; query: string }
  | { type: "research_result"; marketId: string; strategy: ResearchStrategy; resultCount: number; latencyMs: number; costDollars: number }
  | { type: "analysis_complete"; marketId: string; analysis: MarketAnalysis }
  | { type: "decision_made"; decision: AgentDecision }
  | { type: "trade_executed"; trade: Trade }
  | { type: "portfolio_update"; snapshot: PortfolioSnapshot }
  | { type: "error"; message: string };

export interface AgentConfig {
  mode: "paper" | "real";
  maxPositionSize: number;
  maxOpenPositions: number;
  minEdge: number;
  minConfidence: number;
  minVolume24hr: number;
  maxTimeToExpiry: number;
  cycleIntervalMinutes: number;
  llmProvider: "exa" | "claude";
  startingBalance: number;
}

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  mode: "paper",
  maxPositionSize: 100,
  maxOpenPositions: 5,
  minEdge: 0.03,               // 3% edge threshold — sports markets are tight
  minConfidence: 0.4,           // Lower confidence bar for IPL
  minVolume24hr: 0,              // IPL markets are niche, accept any volume
  maxTimeToExpiry: 336,          // 14 days in hours
  cycleIntervalMinutes: 30,     // 30 min to conserve API calls
  llmProvider: "exa",
  startingBalance: 10000,
};
