import type { GammaMarket, GammaEvent } from "./types";
import type { Market } from "@/types/market";

const GAMMA_BASE_URL = "https://gamma-api.polymarket.com";

interface GetMarketsParams {
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
  order?: string;
  ascending?: boolean;
  tag?: string;
}

export async function getMarkets(params: GetMarketsParams = {}): Promise<GammaMarket[]> {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset) searchParams.set("offset", String(params.offset));
  if (params.active !== undefined) searchParams.set("active", String(params.active));
  if (params.closed !== undefined) searchParams.set("closed", String(params.closed));
  if (params.order) searchParams.set("order", params.order);
  if (params.ascending !== undefined) searchParams.set("ascending", String(params.ascending));
  if (params.tag) searchParams.set("tag", params.tag);

  const res = await fetch(`${GAMMA_BASE_URL}/markets?${searchParams}`);
  if (!res.ok) throw new Error(`Gamma API failed (${res.status}): ${await res.text()}`);
  return res.json();
}

export async function getMarket(conditionId: string): Promise<GammaMarket> {
  const res = await fetch(`${GAMMA_BASE_URL}/markets/${conditionId}`);
  if (!res.ok) throw new Error(`Gamma market fetch failed (${res.status})`);
  return res.json();
}

export async function getEvents(params: { active?: boolean; closed?: boolean; limit?: number } = {}): Promise<GammaEvent[]> {
  const searchParams = new URLSearchParams();
  if (params.active !== undefined) searchParams.set("active", String(params.active));
  if (params.closed !== undefined) searchParams.set("closed", String(params.closed));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const res = await fetch(`${GAMMA_BASE_URL}/events?${searchParams}`);
  if (!res.ok) throw new Error(`Gamma events fetch failed (${res.status})`);
  return res.json();
}

export async function getTrendingMarkets(limit = 50): Promise<GammaMarket[]> {
  return getMarkets({
    active: true,
    closed: false,
    limit,
    order: "volume24hr",
    ascending: false,
  });
}

export async function getClosingSoonMarkets(limit = 50): Promise<GammaMarket[]> {
  return getMarkets({
    active: true,
    closed: false,
    limit,
    order: "endDate",
    ascending: true,
  });
}

// IPL-specific keywords for filtering markets
// Only full team names + unambiguous terms — short abbreviations like "dc", "mi", "gt"
// cause false positives on unrelated markets
const IPL_KEYWORDS_EXACT = [
  "ipl",
  "indian premier league",
  "cricket",
  "chennai super kings",
  "mumbai indians",
  "royal challengers bengaluru",
  "royal challengers bangalore",
  "kolkata knight riders",
  "delhi capitals",
  "punjab kings",
  "rajasthan royals",
  "sunrisers hyderabad",
  "gujarat titans",
  "lucknow super giants",
  "cricbuzz",
  "espncricinfo",
];

export function isIPLMarket(market: GammaMarket): boolean {
  // Only check question and groupItemTitle — description can contain generic platform text
  const text = `${market.question} ${market.groupItemTitle ?? ""}`.toLowerCase();
  return IPL_KEYWORDS_EXACT.some((kw) => text.includes(kw));
}

/**
 * Fetch IPL markets using the Gamma series endpoint.
 *
 * The general /markets endpoint doesn't reliably return IPL markets.
 * Instead we use: /series?slug=indian-premier-league → get event IDs
 * → /events/{id} → get nested markets.
 */
export async function getIPLMarkets(): Promise<GammaMarket[]> {
  // Step 1: Get the IPL series with all event stubs
  const seriesRes = await fetch(
    `${GAMMA_BASE_URL}/series?slug=indian-premier-league`,
  );
  if (!seriesRes.ok) {
    console.log("[IPL Discovery] Series endpoint failed, falling back to market scan");
    return fallbackIPLMarketScan();
  }

  const seriesData = await seriesRes.json();
  if (!Array.isArray(seriesData) || seriesData.length === 0) {
    console.log("[IPL Discovery] No IPL series found");
    return [];
  }

  const events = seriesData[0].events ?? [];
  const now = Date.now();
  const cutoff14d = now + 14 * 24 * 60 * 60 * 1000;

  // Step 2: Filter to active events ending within 14 days
  const activeEventIds: string[] = [];
  for (const e of events) {
    if (e.closed || e.archived) continue;
    const endMs = new Date(e.endDate).getTime();
    if (endMs > now && endMs <= cutoff14d) {
      activeEventIds.push(e.id);
    }
  }

  console.log(
    `[IPL Discovery] Series has ${events.length} total events, ${activeEventIds.length} active within 14 days`,
  );

  // Step 3: Fetch markets for each active event
  const allMarkets: GammaMarket[] = [];
  for (const eventId of activeEventIds) {
    try {
      const eventRes = await fetch(`${GAMMA_BASE_URL}/events/${eventId}`);
      if (!eventRes.ok) continue;
      const eventData = await eventRes.json();
      const markets = eventData.markets ?? [];
      allMarkets.push(...markets);
    } catch {
      // Skip failed event fetches
    }
  }

  console.log(
    `[IPL Discovery] Found ${allMarkets.length} IPL markets`,
    allMarkets.slice(0, 3).map((m: GammaMarket) => m.question),
  );

  return allMarkets;
}

/** Fallback: scan general markets if series endpoint fails */
async function fallbackIPLMarketScan(): Promise<GammaMarket[]> {
  const [trending, closingSoon] = await Promise.all([
    getMarkets({ active: true, closed: false, limit: 100, order: "volume24hr", ascending: false }),
    getMarkets({ active: true, closed: false, limit: 100, order: "endDate", ascending: true }),
  ]);

  const seen = new Set<string>();
  return [...trending, ...closingSoon].filter((gm) => {
    const id = gm.conditionId || gm.id;
    if (seen.has(id)) return false;
    seen.add(id);
    return isIPLMarket(gm);
  });
}

export function toInternalMarket(gm: GammaMarket): Market {
  let outcomes: string[];
  let outcomePrices: number[];
  let clobTokenIds: string[];

  try {
    outcomes = JSON.parse(gm.outcomes || "[]");
  } catch {
    outcomes = gm.outcomes ? gm.outcomes.split(",").map((s) => s.trim()) : ["Yes", "No"];
  }

  try {
    outcomePrices = JSON.parse(gm.outcomePrices || "[]").map(Number);
  } catch {
    outcomePrices = gm.outcomePrices ? gm.outcomePrices.split(",").map(Number) : [0.5, 0.5];
  }

  try {
    clobTokenIds = JSON.parse(gm.clobTokenIds || "[]");
  } catch {
    clobTokenIds = gm.clobTokenIds ? gm.clobTokenIds.split(",").map((s) => s.trim()) : [];
  }

  return {
    id: gm.conditionId || gm.id,
    question: gm.question,
    slug: gm.slug,
    outcomes,
    outcomePrices,
    volume: parseFloat(gm.volume) || 0,
    volume24hr: gm.volume24hr || 0,
    liquidity: parseFloat(gm.liquidity) || 0,
    endDate: gm.endDate || "",
    image: gm.image || "",
    bestBid: gm.bestBid || 0,
    bestAsk: gm.bestAsk || 0,
    spread: gm.spread || 0,
    clobTokenIds,
    eventTitle: gm.groupItemTitle || "",
    eventSlug: gm.eventSlug || "",
    active: gm.active,
    closed: gm.closed,
    lastUpdated: new Date().toISOString(),
  };
}
