import { db } from "./index";
import { markets, researchResults, analyses, decisions, trades, positions, portfolioSnapshots, settings } from "./schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export async function upsertMarket(market: typeof markets.$inferInsert) {
  return db.insert(markets).values(market).onConflictDoUpdate({
    target: markets.id,
    set: {
      outcomePrices: market.outcomePrices,
      volume: market.volume,
      volume24hr: market.volume24hr,
      liquidity: market.liquidity,
      bestBid: market.bestBid,
      bestAsk: market.bestAsk,
      spread: market.spread,
      active: market.active,
      closed: market.closed,
      lastUpdated: market.lastUpdated,
    },
  });
}

export async function getActiveMarkets(limit = 50) {
  return db.select().from(markets)
    .where(and(eq(markets.active, true), eq(markets.closed, false)))
    .orderBy(desc(markets.volume24hr))
    .limit(limit);
}

export async function getMarketById(id: string) {
  const result = await db.select().from(markets).where(eq(markets.id, id)).limit(1);
  return result[0] ?? null;
}

export async function insertResearch(research: typeof researchResults.$inferInsert) {
  return db.insert(researchResults).values(research);
}

export async function getResearchForMarket(marketId: string) {
  return db.select().from(researchResults)
    .where(eq(researchResults.marketId, marketId))
    .orderBy(desc(researchResults.createdAt));
}

export async function getAllResearch(limit = 50) {
  return db.select().from(researchResults)
    .orderBy(desc(researchResults.createdAt))
    .limit(limit);
}

export async function insertAnalysis(analysis: typeof analyses.$inferInsert) {
  return db.insert(analyses).values(analysis);
}

export async function getLatestAnalysis(marketId: string) {
  const result = await db.select().from(analyses)
    .where(eq(analyses.marketId, marketId))
    .orderBy(desc(analyses.createdAt))
    .limit(1);
  return result[0] ?? null;
}

export async function insertDecision(decision: typeof decisions.$inferInsert) {
  return db.insert(decisions).values(decision);
}

export async function insertTrade(trade: typeof trades.$inferInsert) {
  return db.insert(trades).values(trade);
}

export async function getTradeHistory(limit = 50) {
  return db.select().from(trades)
    .orderBy(desc(trades.createdAt))
    .limit(limit);
}

export async function getTradesForMarket(marketId: string) {
  return db.select().from(trades)
    .where(eq(trades.marketId, marketId))
    .orderBy(desc(trades.createdAt));
}

export async function upsertPosition(position: typeof positions.$inferInsert) {
  return db.insert(positions).values(position).onConflictDoUpdate({
    target: positions.id,
    set: {
      shares: position.shares,
      avgEntryPrice: position.avgEntryPrice,
      costBasis: position.costBasis,
      currentPrice: position.currentPrice,
      currentValue: position.currentValue,
      unrealizedPnl: position.unrealizedPnl,
      unrealizedPnlPct: position.unrealizedPnlPct,
    },
  });
}

export async function getOpenPositions() {
  return db.select().from(positions).where(sql`${positions.shares} > 0`);
}

export async function insertPortfolioSnapshot(snapshot: typeof portfolioSnapshots.$inferInsert) {
  return db.insert(portfolioSnapshots).values(snapshot);
}

export async function getPortfolioHistory(limit = 100) {
  return db.select().from(portfolioSnapshots)
    .orderBy(desc(portfolioSnapshots.timestamp))
    .limit(limit);
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return result[0] ? (result[0].value as T) : null;
}

export async function setSetting(key: string, value: unknown) {
  return db.insert(settings).values({ key, value }).onConflictDoUpdate({
    target: settings.key,
    set: { value },
  });
}
