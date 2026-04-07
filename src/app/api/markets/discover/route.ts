import { NextResponse } from "next/server";
import { discoverMarkets, filterMarkets } from "@/lib/agent/discover";
import { DEFAULT_AGENT_CONFIG } from "@/types/agent";

export async function POST() {
  try {
    const markets = await discoverMarkets(DEFAULT_AGENT_CONFIG);
    const filtered = await filterMarkets(markets, DEFAULT_AGENT_CONFIG);
    return NextResponse.json({
      total: markets.length,
      filtered: filtered.length,
      markets: filtered,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Discovery failed" },
      { status: 500 },
    );
  }
}
