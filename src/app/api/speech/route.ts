import { NextRequest, NextResponse } from "next/server";
import { textToSpeech } from "@/lib/voice/tts";
import { z } from "zod";

const RequestSchema = z.object({
  text: z.string().min(1).max(1000),
});

export async function POST(req: NextRequest) {
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

    // Convert Buffer to Uint8Array for NextResponse compatibility
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
    const message = err instanceof Error ? err.message : "Text-to-speech failed";
    console.error("[/api/speech]", err);

    // Don't expose API key errors
    const userMessage =
      message.includes("ELEVENLABS") || message.includes("environment variable")
        ? "Voice synthesis is not configured. Please check API keys."
        : message.includes("Text-to-speech")
          ? "Voice synthesis is temporarily unavailable."
          : message;

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
