import { NextResponse } from "next/server";
import { getActiveMarkets } from "@/lib/db/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const markets = await getActiveMarkets(limit);
  return NextResponse.json(markets);
}
