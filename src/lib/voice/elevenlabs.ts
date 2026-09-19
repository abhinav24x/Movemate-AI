import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { AI_CONFIG } from "@/lib/ai/config";

// ---------------------------------------------------------------------------
// Singleton ElevenLabs client (server-side only)
// ---------------------------------------------------------------------------
let elevenLabsClient: ElevenLabsClient | null = null;

export function getElevenLabsClient(): ElevenLabsClient {
  if (!elevenLabsClient) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error("ELEVENLABS_API_KEY environment variable is not set");
    }
    elevenLabsClient = new ElevenLabsClient({ apiKey });
  }
  return elevenLabsClient;
}

/** Validate audio size before sending to STT */
export function validateAudioSize(bytes: number): void {
  if (bytes > AI_CONFIG.elevenlabs.sttMaxBytes) {
    throw new Error(
      `Audio file too large: ${(bytes / 1024 / 1024).toFixed(1)} MB. Maximum is 25 MB.`,
    );
  }
  if (bytes === 0) {
    throw new Error("Audio file is empty — please try recording again.");
  }
}

/** Validate TTS input text */
export function validateTTSInput(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("TTS input text is empty");
  // Truncate if over limit (with a note so we don't lose critical info)
  if (trimmed.length > AI_CONFIG.elevenlabs.ttsMaxChars) {
    return trimmed.slice(0, AI_CONFIG.elevenlabs.ttsMaxChars);
  }
  return trimmed;
}
