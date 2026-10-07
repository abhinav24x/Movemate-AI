import { NextRequest } from "next/server";
import { POST as transcribePost } from "../src/app/api/transcribe/route";
import { POST as speechPost } from "../src/app/api/speech/route";
import { POST as agentPost } from "../src/app/api/agent/route";
import { emptyRequirements } from "../src/lib/schemas/requirements";

jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: () => true,
  getRateLimitKey: () => "api-error-test",
  rateLimitedResponse: () => new Response(null, { status: 429 }),
}));

jest.mock("@/lib/voice/stt", () => ({
  transcribeAudio: jest.fn(),
}));

jest.mock("@/lib/voice/tts", () => ({
  textToSpeech: jest.fn(),
}));

jest.mock("@/lib/conversation/agent", () => ({
  runConversationTurn: jest.fn(),
}));

import { transcribeAudio } from "@/lib/voice/stt";
import { textToSpeech } from "@/lib/voice/tts";
import { runConversationTurn } from "@/lib/conversation/agent";

const providerError = new Error("401 Unauthorized: invalid API key");

describe("API provider error responses", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("transcription hides raw ElevenLabs errors", async () => {
    (transcribeAudio as jest.Mock).mockRejectedValue(providerError);
    const request = new NextRequest("http://localhost/api/transcribe", {
      method: "POST",
      headers: { "content-type": "audio/webm" },
      body: new Uint8Array([1, 2, 3]),
    });

    const response = await transcribePost(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Voice transcription failed. Please try again.");
    expect(JSON.stringify(body)).not.toContain(providerError.message);
  });

  test("speech hides raw ElevenLabs errors", async () => {
    (textToSpeech as jest.Mock).mockRejectedValue(providerError);
    const request = new NextRequest("http://localhost/api/speech", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "Hello" }),
    });

    const response = await speechPost(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Voice generation failed. Please try again.");
    expect(JSON.stringify(body)).not.toContain(providerError.message);
  });

  test("agent continues to hide raw provider errors", async () => {
    (runConversationTurn as jest.Mock).mockRejectedValue(providerError);
    const request = new NextRequest("http://localhost/api/agent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userMessage: "I need to move",
        conversationState: {
          requirements: emptyRequirements(),
          messages: [],
          status: "collecting",
          lastUpdated: new Date().toISOString(),
        },
      }),
    });

    const response = await agentPost(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Something went wrong while processing your request. Please try again.");
    expect(JSON.stringify(body)).not.toContain(providerError.message);
  });
});
