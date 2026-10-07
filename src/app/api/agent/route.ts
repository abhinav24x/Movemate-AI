import { NextRequest, NextResponse } from "next/server";
import { AgentRequestSchema } from "@/lib/schemas/agent-response";
import { runConversationTurn } from "@/lib/conversation/agent";
import { checkRateLimit, getRateLimitKey, rateLimitedResponse } from "@/lib/rate-limit";

// 30 requests per 60 seconds per IP
const LIMIT = 30;
const WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  // Rate limiting
  const key = getRateLimitKey(req, "agent");
  if (!checkRateLimit(key, LIMIT, WINDOW_MS)) {
    return rateLimitedResponse();
  }

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

    // Validate request body — reject malformed or unexpected state
    const parsed = AgentRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 },
      );
    }

    const { userMessage, conversationState } = parsed.data;

    // Run the conversation turn
    const result = await runConversationTurn(userMessage, conversationState);

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[/api/agent]", err);

    // Never expose raw provider/internal errors to the client
    return NextResponse.json(
      { error: "Something went wrong while processing your request. Please try again." },
      { status: 500 },
    );
  }
}
