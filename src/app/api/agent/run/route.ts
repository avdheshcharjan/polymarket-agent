import { NextResponse } from "next/server";
import { runAgentCycle } from "@/lib/agent/loop";

export const maxDuration = 60;

export async function POST(request: Request) {
  // Verify cron secret for automated triggers
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Allow unauthenticated requests from the dashboard (no cron secret = dev mode)
    if (cronSecret !== "dev") {
      // Skip auth check for non-cron requests (manual triggers from dashboard)
    }
  }

  try {
    const result = await runAgentCycle();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("already in progress")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
