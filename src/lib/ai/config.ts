/**
 * Centralized AI model and configuration constants.
 * Change model IDs here — never scattered across the codebase.
 */

export const AI_CONFIG = {
  groq: {
    /** Primary chat model — change here to switch globally */
    model: "llama-3.3-70b-versatile",
    /** Max tokens for the LLM response */
    maxTokens: 1024,
    /** Temperature: lower = more predictable structured output */
    temperature: 0.3,
  },

  elevenlabs: {
    /** STT model for batch transcription */
    sttModel: "scribe_v2",
    /** TTS model: eleven_flash_v2_5 = ~75ms ultra-low-latency */
    ttsModel: "eleven_flash_v2_5",
    /** Maximum characters we'll send to TTS in one request */
    ttsMaxChars: 1000,
    /** Output audio format */
    ttsOutputFormat: "mp3_44100_128",
    /** Maximum audio file size for STT (25 MB) */
    sttMaxBytes: 25 * 1024 * 1024,
  },

  conversation: {
    /** How many previous messages to include in LLM context */
    maxHistoryMessages: 20,
    /** App timezone for date/time resolution */
    timezone: "Asia/Kolkata",
  },
} as const;
