import { NextResponse } from "next/server";
import { getExaClient } from "@/lib/exa/client";
import type { ExaSearchRequest } from "@/types/exa";

export async function POST(request: Request) {
  try {
    const body: ExaSearchRequest = await request.json();
    const client = getExaClient();
    const result = await client.search(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 },
    );
  }
}
