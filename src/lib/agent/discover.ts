import { getIPLMarkets, toInternalMarket } from "@/lib/polymarket/gamma";
import { upsertMarket, getOpenPositions } from "@/lib/db/queries";
import type { Market } from "@/types/market";
import type { AgentConfig } from "@/types/agent";
import { agentBus } from "./events";

export async function discoverMarkets(config: AgentConfig): Promise<Market[]> {
  agentBus.emitEvent({ type: "phase_change", phase: "discovering", detail: "Scanning Polymarket for IPL cricket markets" });

  // Only fetch IPL/cricket markets to conserve Exa API calls
  const iplGammaMarkets = await getIPLMarkets();

  // Convert and persist
  const markets: Market[] = [];
  for (const gm of iplGammaMarkets) {
    const market = toInternalMarket(gm);
    await upsertMarket({
      ...market,
      outcomes: market.outcomes,
      outcomePrices: market.outcomePrices,
      clobTokenIds: market.clobTokenIds,
    });
    markets.push(market);
    agentBus.emitEvent({ type: "market_discovered", market });
  }

  return markets;
}

export async function filterMarkets(markets: Market[], config: AgentConfig): Promise<Market[]> {
  agentBus.emitEvent({ type: "phase_change", phase: "filtering", detail: "Selecting high-potential markets" });

  const now = Date.now();
  const openPositions = await getOpenPositions();
  const positionMarketIds = new Set(openPositions.map((p) => p.marketId));

  const candidates = markets.filter((m) => {
    if (!m.active || m.closed) return false;

    const hoursToExpiry = (new Date(m.endDate).getTime() - now) / (1000 * 60 * 60);
    if (hoursToExpiry <= 0 || hoursToExpiry > config.maxTimeToExpiry) return false;

    // Skip essentially-resolved markets (price > 0.95 or < 0.05)
    const yesPrice = m.outcomePrices[0] ?? 0.5;
    if (yesPrice > 0.95 || yesPrice < 0.05) return false;

    // Skip "Completed match?" markets (they're about rain/abandoned, not match winner)
    if (m.question.toLowerCase().includes("completed match")) return false;

    // Skip wide-spread illiquid markets
    if (m.spread > 0.50) return false;

    // Skip markets where we already have a position
    if (positionMarketIds.has(m.id)) return false;

    return true;
  });

  // Rank by volume * urgency (closing-soon markets get priority)
  candidates.sort((a, b) => {
    const hoursA = Math.max(1, (new Date(a.endDate).getTime() - now) / (1000 * 60 * 60));
    const hoursB = Math.max(1, (new Date(b.endDate).getTime() - now) / (1000 * 60 * 60));
    const scoreA = a.volume24hr * (1 / hoursA);
    const scoreB = b.volume24hr * (1 / hoursB);
    return scoreB - scoreA;
  });

  // Limit to 3 markets to conserve Exa API calls on free tier
  return candidates.slice(0, 3);
}
