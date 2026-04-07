import { NextResponse } from "next/server";
import { agentBus } from "@/lib/agent/events";

export async function GET() {
  return NextResponse.json(agentBus.getState());
}
