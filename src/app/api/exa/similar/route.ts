import { NextResponse } from "next/server";
import { getExaClient } from "@/lib/exa/client";
import type { ExaFindSimilarRequest } from "@/types/exa";

export async function POST(request: Request) {
  try {
    const body: ExaFindSimilarRequest = await request.json();
    const client = getExaClient();
    const result = await client.findSimilar(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "findSimilar failed" },
      { status: 500 },
    );
  }
}
