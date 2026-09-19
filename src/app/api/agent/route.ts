import { NextRequest, NextResponse } from "next/server";
import { AgentRequestSchema } from "@/lib/schemas/agent-response";
import { runConversationTurn } from "@/lib/conversation/agent";

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    // Validate request body
    const parsed = AgentRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request format", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { userMessage, conversationState } = parsed.data;

    // Run the conversation turn (STT already done client-side)
    const result = await runConversationTurn(userMessage, conversationState);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Agent processing failed";
    console.error("[/api/agent]", err);

    // Don't expose internal details
    const userMessage =
      message.includes("GROQ_API_KEY") || message.includes("environment variable")
        ? "Server configuration error. Please check API keys."
        : message.includes("Groq")
          ? "AI processing is temporarily unavailable. Please try again."
          : message;

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
