import { getElevenLabsClient, validateTTSInput } from "./elevenlabs";
import { AI_CONFIG } from "@/lib/ai/config";

export interface TTSResult {
  audioBuffer: Buffer;
  mimeType: string;
}

/**
 * Convert text to speech using ElevenLabs Flash v2.5.
 * Returns raw audio buffer ready for streaming to the client.
 *
 * The SDK's textToSpeech.convert returns HttpResponsePromise<ReadableStream<Uint8Array>>.
 * When awaited, it resolves to a ReadableStream<Uint8Array>.
 */
export async function textToSpeech(text: string): Promise<TTSResult> {
  const validatedText = validateTTSInput(text);
  const client = getElevenLabsClient();

  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!voiceId) {
    throw new Error("ELEVENLABS_VOICE_ID environment variable is not set");
  }

  try {
    // Convert returns HttpResponsePromise<ReadableStream<Uint8Array>>
    const stream: ReadableStream<Uint8Array> = await client.textToSpeech.convert(voiceId, {
      text: validatedText,
      modelId: AI_CONFIG.elevenlabs.ttsModel,  // camelCase per SDK types
      outputFormat: AI_CONFIG.elevenlabs.ttsOutputFormat as "mp3_44100_128",
    });

    // Read the ReadableStream into a Buffer
    const chunks: Uint8Array[] = [];
    const reader = stream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }

    const audioBuffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    if (audioBuffer.length === 0) {
      throw new Error("TTS returned empty audio");
    }

    return {
      audioBuffer,
      mimeType: "audio/mpeg",
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message.includes("ELEVENLABS_VOICE_ID") || err.message.includes("TTS")) {
        throw err;
      }
      throw new Error(`Text-to-speech failed: ${err.message}`);
    }
    throw new Error("Text-to-speech failed with an unknown error");
  }
}
