import { getOpenPositions, getTradeHistory, insertPortfolioSnapshot, getSetting } from "@/lib/db/queries";
import { getMidpoint } from "@/lib/polymarket/clob";
import type { PortfolioSnapshot, Position } from "@/types/trade";

export async function calculatePortfolioSnapshot(): Promise<PortfolioSnapshot> {
  const dbPositions = await getOpenPositions();
  const trades = await getTradeHistory(1000);
  const cashBalance = await getSetting<number>("paper_cash_balance") ?? 10000;

  const positions: Position[] = [];
  let positionsValue = 0;

  for (const pos of dbPositions) {
    if (pos.shares <= 0) continue;

    // Try to get live price, fall back to stored price
    let currentPrice = pos.currentPrice;
    try {
      // For positions, we'd need the clobTokenId — this is simplified
      currentPrice = pos.currentPrice;
    } catch {
      // Use stored price if live fetch fails
    }

    const currentValue = pos.shares * currentPrice;
    const unrealizedPnl = currentValue - pos.costBasis;
    const unrealizedPnlPct = pos.costBasis > 0 ? unrealizedPnl / pos.costBasis : 0;

    positions.push({
      id: pos.id,
      marketId: pos.marketId,
      outcome: pos.outcome,
      avgEntryPrice: pos.avgEntryPrice,
      shares: pos.shares,
      costBasis: pos.costBasis,
      currentPrice,
      currentValue,
      unrealizedPnl,
      unrealizedPnlPct,
    });

    positionsValue += currentValue;
  }

  const totalValue = cashBalance + positionsValue;
  const startingBalance = await getSetting<number>("starting_balance") ?? 10000;
  const totalPnl = totalValue - startingBalance;
  const totalPnlPct = startingBalance > 0 ? totalPnl / startingBalance : 0;

  const filledTrades = trades.filter((t) => t.status === "filled");
  const winningTrades = filledTrades.filter((t) => (t.pnl ?? 0) > 0);
  const winRate = filledTrades.length > 0 ? winningTrades.length / filledTrades.length : 0;

  const snapshot: PortfolioSnapshot = {
    timestamp: new Date().toISOString(),
    totalValue,
    cashBalance,
    positionsValue,
    totalPnl,
    totalPnlPct,
    winRate,
    totalTrades: filledTrades.length,
    positions,
  };

  await insertPortfolioSnapshot({
    timestamp: snapshot.timestamp,
    totalValue: snapshot.totalValue,
    cashBalance: snapshot.cashBalance,
    positionsValue: snapshot.positionsValue,
    totalPnl: snapshot.totalPnl,
    totalPnlPct: snapshot.totalPnlPct,
    winRate: snapshot.winRate,
    totalTrades: snapshot.totalTrades,
  });

  return snapshot;
}
