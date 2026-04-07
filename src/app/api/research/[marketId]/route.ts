import { NextResponse } from "next/server";
import { getMarketById, getResearchForMarket } from "@/lib/db/queries";
import { researchMarket } from "@/lib/agent/research";
import type { Market } from "@/types/market";

function dbToMarket(row: NonNullable<Awaited<ReturnType<typeof getMarketById>>>): Market {
  return {
    ...row,
    image: row.image ?? "",
    bestBid: row.bestBid ?? 0,
    bestAsk: row.bestAsk ?? 0,
    spread: row.spread ?? 0,
    eventTitle: row.eventTitle ?? "",
    eventSlug: row.eventSlug ?? "",
  };
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ marketId: string }> },
) {
  const { marketId } = await params;
  const row = await getMarketById(marketId);
  if (!row) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }

  try {
    const market = dbToMarket(row);
    const research = await researchMarket(market);
    return NextResponse.json(research);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Research failed" },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ marketId: string }> },
) {
  const { marketId } = await params;
  const research = await getResearchForMarket(marketId);
  return NextResponse.json(research);
}
