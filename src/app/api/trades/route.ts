import { NextResponse } from "next/server";
import { getTradeHistory } from "@/lib/db/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const trades = await getTradeHistory(limit);
  return NextResponse.json(trades);
}
