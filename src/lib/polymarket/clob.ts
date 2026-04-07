import type { ClobOrderbook, ClobMidpoint, ClobPriceHistoryPoint } from "./types";

const CLOB_BASE_URL = "https://clob.polymarket.com";

export async function getOrderbook(tokenId: string): Promise<ClobOrderbook> {
  const res = await fetch(`${CLOB_BASE_URL}/book?token_id=${tokenId}`);
  if (!res.ok) throw new Error(`CLOB orderbook fetch failed (${res.status})`);
  return res.json();
}

export async function getMidpoint(tokenId: string): Promise<number> {
  const res = await fetch(`${CLOB_BASE_URL}/midpoint?token_id=${tokenId}`);
  if (!res.ok) throw new Error(`CLOB midpoint fetch failed (${res.status})`);
  const data: ClobMidpoint = await res.json();
  return parseFloat(data.mid);
}

export async function getSpread(tokenId: string): Promise<number> {
  const res = await fetch(`${CLOB_BASE_URL}/spread?token_id=${tokenId}`);
  if (!res.ok) throw new Error(`CLOB spread fetch failed (${res.status})`);
  const data = await res.json();
  return parseFloat(data.spread);
}

export async function getPriceHistory(tokenId: string, interval = "1d", fidelity = 60): Promise<ClobPriceHistoryPoint[]> {
  const res = await fetch(
    `${CLOB_BASE_URL}/prices-history?market=${tokenId}&interval=${interval}&fidelity=${fidelity}`
  );
  if (!res.ok) throw new Error(`CLOB price history fetch failed (${res.status})`);
  const data = await res.json();
  return data.history ?? [];
}

export async function getMarketInfo(conditionId: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${CLOB_BASE_URL}/markets/${conditionId}`);
  if (!res.ok) throw new Error(`CLOB market info fetch failed (${res.status})`);
  return res.json();
}

// Tick size determines price precision for orders
export function roundToTickSize(price: number, tickSize: number): number {
  return Math.round(price / tickSize) * tickSize;
}
