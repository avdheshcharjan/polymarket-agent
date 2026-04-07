import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/db/queries";
import { DEFAULT_AGENT_CONFIG, type AgentConfig } from "@/types/agent";

export async function GET() {
  const config = await getSetting<AgentConfig>("agent_config");
  return NextResponse.json({ ...DEFAULT_AGENT_CONFIG, ...config });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const current = await getSetting<AgentConfig>("agent_config");
    const updated = { ...DEFAULT_AGENT_CONFIG, ...current, ...body };
    await setSetting("agent_config", updated);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 },
    );
  }
}
