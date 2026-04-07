import { makeTradeDecision } from "@/lib/llm/exa-answer";
import { insertAnalysis, insertDecision, getOpenPositions, getSetting } from "@/lib/db/queries";
import type { Market, MarketAnalysis, AgentDecision, TradeAction } from "@/types/market";
import type { ResearchResult } from "@/types/research";
import type { Position } from "@/types/trade";
import type { AgentConfig } from "@/types/agent";
import { agentBus } from "./events";

export async function analyzeMarket(
  market: Market,
  research: ResearchResult[],
  config: AgentConfig,
): Promise<AgentDecision> {
  agentBus.emitEvent({
    type: "phase_change",
    phase: "analyzing",
    detail: `Analyzing: ${market.question}`,
  });

  // Gather portfolio context so the LLM can make informed sizing decisions
  const cashBalance = await getSetting<number>("paper_cash_balance") ?? config.startingBalance;
  const positions = await getOpenPositions();
  const existingPosition = positions.find((p) => p.marketId === market.id) ?? null;
  const openPositionCount = positions.filter((p) => p.shares > 0).length;

  // Map DB position to the type the brain expects
  let positionForBrain: Position | null = null;
  if (existingPosition && existingPosition.shares > 0) {
    positionForBrain = {
      id: existingPosition.id,
      marketId: existingPosition.marketId,
      outcome: existingPosition.outcome,
      avgEntryPrice: existingPosition.avgEntryPrice,
      shares: existingPosition.shares,
      costBasis: existingPosition.costBasis,
      currentPrice: existingPosition.currentPrice,
      currentValue: existingPosition.currentValue,
      unrealizedPnl: existingPosition.unrealizedPnl,
      unrealizedPnlPct: existingPosition.unrealizedPnlPct,
    };
  }

  // Let the LLM brain make the full decision
  const instruction = await makeTradeDecision({
    market,
    research,
    cashBalance,
    existingPosition: positionForBrain,
    openPositionCount,
  });

  const marketPrice = market.outcomePrices[0] ?? 0.5;
  const edge = instruction.probability - marketPrice;

  // Store analysis
  const analysisId = `analysis-${market.id}-${Date.now()}`;
  const analysis: MarketAnalysis = {
    id: analysisId,
    marketId: market.id,
    estimatedProbability: instruction.probability,
    confidence: instruction.confidence,
    edge,
    summary: instruction.summary,
    bullCase: edge > 0 ? instruction.summary : "",
    bearCase: edge < 0 ? instruction.summary : "",
    keyFactors: [instruction.exitStrategy],
    createdAt: new Date().toISOString(),
  };

  await insertAnalysis({
    ...analysis,
    keyFactors: analysis.keyFactors,
  });

  agentBus.emitEvent({ type: "analysis_complete", marketId: market.id, analysis });

  // Convert LLM instruction to decision — the LLM decides everything
  const action: TradeAction = instruction.action === "sell" ? "sell_yes" : instruction.action as TradeAction;

  const decisionId = `decision-${market.id}-${Date.now()}`;
  const decision: AgentDecision = {
    id: decisionId,
    marketId: market.id,
    action: action === "sell_yes" ? "hold" : action, // sell handled separately in monitor
    confidence: instruction.confidence,
    reasoning: instruction.reasoning,
    researchIds: research.map((r) => r.id),
    estimatedProbability: instruction.probability,
    marketPrice,
    edge,
    size: instruction.size,
    createdAt: new Date().toISOString(),
  };

  console.log(`[Agent] Decision for "${market.question}": ${decision.action} $${decision.size} (edge=${edge.toFixed(3)}, conf=${instruction.confidence.toFixed(2)})`);

  await insertDecision({
    ...decision,
    researchIds: decision.researchIds,
  });

  agentBus.emitEvent({ type: "decision_made", decision });

  return decision;
}
