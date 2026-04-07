import { calculatePortfolioSnapshot } from "@/lib/trading/portfolio";
import { getOpenPositions, getMarketById } from "@/lib/db/queries";
import { getMidpoint } from "@/lib/polymarket/clob";
import { upsertPosition } from "@/lib/db/queries";
import type { PortfolioSnapshot } from "@/types/trade";
import { agentBus } from "./events";

export async function monitorPositions(): Promise<PortfolioSnapshot> {
  agentBus.emitEvent({
    type: "phase_change",
    phase: "monitoring",
    detail: "Updating portfolio and positions",
  });

  // Update live prices for all open positions
  const positions = await getOpenPositions();
  for (const pos of positions) {
    if (pos.shares <= 0) continue;

    try {
      const market = await getMarketById(pos.marketId);
      if (!market) continue;

      // Find the right token ID for this position's outcome
      const outcomeIndex = market.outcomes.indexOf(pos.outcome);
      const tokenId = outcomeIndex >= 0 ? market.clobTokenIds[outcomeIndex] : null;

      if (tokenId) {
        const livePrice = await getMidpoint(tokenId);
        const currentValue = pos.shares * livePrice;
        const unrealizedPnl = currentValue - pos.costBasis;
        const unrealizedPnlPct = pos.costBasis > 0 ? unrealizedPnl / pos.costBasis : 0;

        await upsertPosition({
          ...pos,
          currentPrice: livePrice,
          currentValue,
          unrealizedPnl,
          unrealizedPnlPct,
        });

        console.log(
          `[Monitor] ${pos.outcome} on "${market.question.slice(0, 40)}..." — ` +
          `entry: $${pos.avgEntryPrice.toFixed(3)} → now: $${livePrice.toFixed(3)} | ` +
          `P&L: $${unrealizedPnl.toFixed(2)} (${(unrealizedPnlPct * 100).toFixed(1)}%)`
        );

        // Auto-exit check: if market is about to close or position P&L is extreme
        const hoursLeft = (new Date(market.endDate).getTime() - Date.now()) / 3600000;
        if (hoursLeft <= 0) {
          console.log(`[Monitor] Market resolved — position will settle automatically`);
        } else if (unrealizedPnlPct > 0.5) {
          console.log(`[Monitor] Position up ${(unrealizedPnlPct * 100).toFixed(0)}% — consider taking profit`);
        } else if (unrealizedPnlPct < -0.3) {
          console.log(`[Monitor] Position down ${(unrealizedPnlPct * 100).toFixed(0)}% — consider cutting loss`);
        }
      }
    } catch (error) {
      console.log(`[Monitor] Failed to update position ${pos.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const snapshot = await calculatePortfolioSnapshot();
  agentBus.emitEvent({ type: "portfolio_update", snapshot });

  return snapshot;
}
