import { insertTrade, upsertPosition, getSetting, setSetting } from "@/lib/db/queries";
import type { AgentDecision } from "@/types/market";
import type { Trade } from "@/types/trade";

export async function executePaperTrade(decision: AgentDecision, currentPrice: number): Promise<Trade> {
  const cashBalance = await getSetting<number>("paper_cash_balance") ?? 10000;

  if (decision.size > cashBalance) {
    throw new Error(`Insufficient paper balance: $${cashBalance} < $${decision.size}`);
  }

  const outcome = decision.action.includes("yes") ? "Yes" : "No";
  const price = currentPrice;
  const shares = decision.size / price;

  const trade: Trade = {
    id: `trade-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    marketId: decision.marketId,
    decisionId: decision.id,
    mode: "paper",
    action: decision.action as Trade["action"],
    outcome,
    price,
    size: decision.size,
    shares,
    status: "filled",
    createdAt: new Date().toISOString(),
  };

  await insertTrade(trade);

  // Update cash balance
  await setSetting("paper_cash_balance", cashBalance - decision.size);

  // Update position
  const positionId = `${decision.marketId}-${outcome}`;
  await upsertPosition({
    id: positionId,
    marketId: decision.marketId,
    outcome,
    avgEntryPrice: price,
    shares,
    costBasis: decision.size,
    currentPrice: price,
    currentValue: decision.size,
    unrealizedPnl: 0,
    unrealizedPnlPct: 0,
  });

  return trade;
}
