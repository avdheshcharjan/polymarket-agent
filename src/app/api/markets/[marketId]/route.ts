import { NextResponse } from "next/server";
import { getMarketById, getResearchForMarket, getLatestAnalysis, getTradesForMarket } from "@/lib/db/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ marketId: string }> },
) {
  const { marketId } = await params;
  const [market, research, analysis, trades] = await Promise.all([
    getMarketById(marketId),
    getResearchForMarket(marketId),
    getLatestAnalysis(marketId),
    getTradesForMarket(marketId),
  ]);

  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }

  return NextResponse.json({ market, research, analysis, trades });
}
