import { agentBus } from "@/lib/agent/events";
import type { AgentEvent } from "@/types/agent";

export const runtime = "nodejs";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const listener = (event: AgentEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          // Stream closed
          agentBus.removeListener("agent-event", listener);
        }
      };

      agentBus.on("agent-event", listener);

      // Send initial state
      const initData = `data: ${JSON.stringify({ type: "init", state: agentBus.getState() })}\n\n`;
      controller.enqueue(encoder.encode(initData));

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          agentBus.removeListener("agent-event", listener);
        }
      }, 30000);

      // Cleanup on close
      const cleanup = () => {
        clearInterval(heartbeat);
        agentBus.removeListener("agent-event", listener);
      };

      // AbortSignal is not available on ReadableStream start, so we rely on enqueue error catching
      return cleanup;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
