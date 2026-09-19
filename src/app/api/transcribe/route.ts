import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/voice/stt";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data") && !contentType.includes("audio/")) {
      return NextResponse.json(
        { error: "Expected multipart/form-data or audio content" },
        { status: 400 },
      );
    }

    let audioBuffer: Buffer;
    let mimeType: string;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("audio");
      if (!file || !(file instanceof Blob)) {
        return NextResponse.json(
          { error: "No audio file provided in form data" },
          { status: 400 },
        );
      }
      if (file.size > MAX_AUDIO_BYTES) {
        return NextResponse.json(
          { error: "Audio file exceeds 25 MB limit" },
          { status: 413 },
        );
      }
      audioBuffer = Buffer.from(await file.arrayBuffer());
      mimeType = file.type || "audio/webm";
    } else {
      // Raw audio body
      const arrayBuffer = await req.arrayBuffer();
      if (arrayBuffer.byteLength > MAX_AUDIO_BYTES) {
        return NextResponse.json(
          { error: "Audio file exceeds 25 MB limit" },
          { status: 413 },
        );
      }
      audioBuffer = Buffer.from(arrayBuffer);
      mimeType = contentType.split(";")[0];
    }

    if (audioBuffer.length === 0) {
      return NextResponse.json(
        { error: "Empty audio received — please try recording again." },
        { status: 400 },
      );
    }

    const result = await transcribeAudio(audioBuffer, mimeType);

    return NextResponse.json({
      transcript: result.transcript,
      language: result.language,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Transcription failed";
    console.error("[/api/transcribe]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
