import { NextResponse } from "next/server";
import { agentRequestSchema } from "@/lib/schemas";
import { GeminiRetryExhaustedError, runAgent } from "@/lib/agent/runAgent";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST /api/agent  body: { messages: [{ role: "user" | "model", text: string }] } */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = agentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.issues }, { status: 400 });
  }

  try {
    const result = await runAgent(parsed.data.messages);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof GeminiRetryExhaustedError) {
      const originalMessage =
        err.originalError instanceof Error ? err.originalError.message : "Unknown Gemini error";
      console.error("[agent] Gemini retries exhausted", {
        status: err.status,
        message: originalMessage,
      });

      return NextResponse.json(
        {
          error:
            err.status === 503
              ? "CartCare AI is temporarily unavailable. Please try again shortly."
              : "CartCare AI is busy right now. Please try again in a minute.",
        },
        { status: err.status }
      );
    }

    console.error("[agent] Request failed", {
      name: err instanceof Error ? err.name : "UnknownError",
      message: err instanceof Error ? err.message : "Agent failed",
    });
    return NextResponse.json(
      { error: "Sorry, CartCare AI could not process your request. Please try again." },
      { status: 500 }
    );
  }
}
