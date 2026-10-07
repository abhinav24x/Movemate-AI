import { NextRequest, NextResponse } from "next/server";
import { textToSpeech } from "@/lib/voice/tts";
import { z } from "zod";
import { checkRateLimit, getRateLimitKey, rateLimitedResponse } from "@/lib/rate-limit";

const RequestSchema = z.object({
  text: z.string().min(1).max(1000),
});

// 30 requests per 60 seconds per IP
const LIMIT = 30;
const WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  // Rate limiting
  const key = getRateLimitKey(req, "speech");
  if (!checkRateLimit(key, LIMIT, WINDOW_MS)) {
    return rateLimitedResponse();
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "text field is required and must be under 1000 characters" },
        { status: 400 },
      );
    }

    const { text } = parsed.data;
    const { audioBuffer, mimeType } = await textToSpeech(text);

    const uint8Array = new Uint8Array(audioBuffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": uint8Array.byteLength.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    console.error("[/api/speech]", err);
    return NextResponse.json(
      { error: "Voice synthesis failed. Please try again." },
      { status: 500 },
    );
  }
}
