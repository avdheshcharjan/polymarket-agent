import { executePaperTrade } from "@/lib/trading/paper";
import { executeRealTrade } from "@/lib/trading/real";
import { getMidpoint } from "@/lib/polymarket/clob";
import { getMarketById } from "@/lib/db/queries";
import type { AgentDecision } from "@/types/market";
import type { Trade } from "@/types/trade";
import type { AgentConfig } from "@/types/agent";
import { agentBus } from "./events";

export async function executeDecision(
  decision: AgentDecision,
  config: AgentConfig,
): Promise<Trade | null> {
  // The LLM already decided — we just execute. Only skip if it said "hold"
  if (decision.action === "hold") {
    console.log(`[Execute] Skipping — LLM decided to hold on ${decision.marketId}`);
    return null;
  }
  if (decision.size <= 0) {
    console.log(`[Execute] Skipping — size is 0 for ${decision.marketId}`);
    return null;
  }

  agentBus.emitEvent({
    type: "phase_change",
    phase: "executing",
    detail: `Executing: ${decision.action} $${decision.size} on "${decision.marketId.slice(0, 20)}..."`,
  });

  // Get current price
  const market = await getMarketById(decision.marketId);
  if (!market) throw new Error(`Market ${decision.marketId} not found`);

  let currentPrice: number;
  try {
    const tokenIndex = decision.action.includes("yes") ? 0 : 1;
    const tokenId = market.clobTokenIds[tokenIndex];
    if (tokenId) {
      currentPrice = await getMidpoint(tokenId);
    } else {
      currentPrice = market.outcomePrices[decision.action.includes("yes") ? 0 : 1] ?? 0.5;
    }
  } catch {
    currentPrice = market.outcomePrices[decision.action.includes("yes") ? 0 : 1] ?? 0.5;
  }

  console.log(`[Execute] ${decision.action} $${decision.size} at price ${currentPrice} on "${market.question}"`);

  const trade = config.mode === "real"
    ? await executeRealTrade(decision, currentPrice)
    : await executePaperTrade(decision, currentPrice);

  agentBus.emitEvent({ type: "trade_executed", trade });

  return trade;
}

export async function executeDecisions(
  decisions: AgentDecision[],
  config: AgentConfig,
): Promise<Trade[]> {
  const trades: Trade[] = [];

  for (const decision of decisions) {
    try {
      const trade = await executeDecision(decision, config);
      if (trade) trades.push(trade);
    } catch (error) {
      agentBus.emitEvent({
        type: "error",
        message: `Trade execution failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  return trades;
}
