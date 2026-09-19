import { getElevenLabsClient, validateAudioSize } from "./elevenlabs";
import { AI_CONFIG } from "@/lib/ai/config";

export interface TranscribeResult {
  transcript: string;
  language?: string;
}

/**
 * Send audio buffer to ElevenLabs STT (Scribe v2).
 * Accepts raw audio as a Buffer.
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string = "audio/webm",
): Promise<TranscribeResult> {
  validateAudioSize(audioBuffer.byteLength);

  const client = getElevenLabsClient();

  // The ElevenLabs SDK expects a File/Blob-like object
  // We use Uint8Array to avoid ArrayBufferLike type mismatch
  const uint8 = new Uint8Array(audioBuffer);
  const blob = new Blob([uint8], { type: mimeType });
  const file = new File([blob], "recording.webm", { type: mimeType });

  try {
    const result = await client.speechToText.convert({
      file,
      modelId: AI_CONFIG.elevenlabs.sttModel, // camelCase per SDK types
    });

    const transcript = result.text?.trim() ?? "";
    if (!transcript) {
      throw new Error(
        "No speech detected in the recording. Please speak clearly and try again.",
      );
    }

    return {
      transcript,
      language: result.languageCode ?? undefined, // camelCase per SDK types
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (
        err.message.includes("No speech detected") ||
        err.message.includes("Audio file")
      ) {
        throw err;
      }
      throw new Error(`Speech-to-text failed: ${err.message}`);
    }
    throw new Error("Speech-to-text failed with an unknown error");
  }
}
