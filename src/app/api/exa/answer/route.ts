import { NextResponse } from "next/server";
import { getExaClient } from "@/lib/exa/client";
import type { ExaAnswerRequest } from "@/types/exa";

export async function POST(request: Request) {
  try {
    const body: ExaAnswerRequest = await request.json();
    const client = getExaClient();

    if (body.stream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of client.streamAnswer(body)) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }

    const result = await client.answer(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Answer failed" },
      { status: 500 },
    );
  }
}
