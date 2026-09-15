import Groq from "groq-sdk";
import { AI_CONFIG } from "./config";
import { buildSystemPrompt, buildChatMessages, getCurrentDateTimeContext } from "./prompts";
import { AgentLLMResponseSchema, type AgentLLMResponse } from "@/lib/schemas/agent-response";
import type { BookingRequirements } from "@/lib/schemas/requirements";
import type { ConversationMessage } from "@/lib/schemas/agent-response";

// ---------------------------------------------------------------------------
// Singleton Groq client (server-side only)
// ---------------------------------------------------------------------------
let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY environment variable is not set");
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

// ---------------------------------------------------------------------------
// JSON extraction helper — safe parse with fallback
// ---------------------------------------------------------------------------
function extractJSON(raw: string): unknown {
  // Try direct parse first
  try {
    return JSON.parse(raw);
  } catch {
    // Try to extract JSON from markdown code blocks or surrounding text
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                      raw.match(/(\{[\s\S]*\})/);
    if (jsonMatch?.[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // Fall through
      }
    }
    throw new Error(`Failed to extract valid JSON from LLM response. Raw: ${raw.slice(0, 500)}`);
  }
}

// ---------------------------------------------------------------------------
// Main LLM call
// ---------------------------------------------------------------------------
export async function callGroqAgent(
  userMessage: string,
  currentRequirements: BookingRequirements,
  conversationHistory: ConversationMessage[],
): Promise<AgentLLMResponse> {
  const client = getGroqClient();
  const currentDateTime = getCurrentDateTimeContext();
  const systemPrompt = buildSystemPrompt(currentRequirements, currentDateTime);
  const messages = buildChatMessages(systemPrompt, conversationHistory, userMessage);

  let rawResponse: string;

  try {
    const completion = await client.chat.completions.create({
      model: AI_CONFIG.groq.model,
      messages,
      max_tokens: AI_CONFIG.groq.maxTokens,
      temperature: AI_CONFIG.groq.temperature,
      response_format: { type: "json_object" }, // Groq JSON mode
    });

    rawResponse = completion.choices[0]?.message?.content ?? "";
    if (!rawResponse) {
      throw new Error("Empty response from Groq");
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown Groq error";
    throw new Error(`Groq API call failed: ${message}`);
  }

  // Parse + validate
  let parsed: unknown;
  try {
    parsed = extractJSON(rawResponse);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Parse error";
    throw new Error(`Failed to parse Groq response as JSON: ${message}`);
  }

  const validated = AgentLLMResponseSchema.safeParse(parsed);
  if (!validated.success) {
    console.error("Groq response validation failed:", validated.error.flatten());
    throw new Error(
      `Groq response did not match expected schema: ${JSON.stringify(validated.error.flatten())}`,
    );
  }

  return validated.data;
}
