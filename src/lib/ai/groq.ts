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
// Single model attempt
// ---------------------------------------------------------------------------
async function attemptGroqCall(
  client: Groq,
  model: string,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  useJsonMode: boolean,
): Promise<string> {
  const completion = await client.chat.completions.create({
    model,
    messages,
    max_tokens: AI_CONFIG.groq.maxTokens,
    temperature: AI_CONFIG.groq.temperature,
    ...(useJsonMode ? { response_format: { type: "json_object" } } : {}),
  });
  return completion.choices[0]?.message?.content ?? "";
}

// ---------------------------------------------------------------------------
// Main LLM call — with model fallback
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

  const modelsToTry = [
    { model: AI_CONFIG.groq.model, jsonMode: true },
    { model: AI_CONFIG.groq.model, jsonMode: false },        // same model, no JSON mode
    { model: AI_CONFIG.groq.fallbackModel, jsonMode: true },  // fallback model
    { model: AI_CONFIG.groq.fallbackModel, jsonMode: false }, // fallback, no JSON mode
  ];

  let lastError: Error | null = null;

  for (const { model, jsonMode } of modelsToTry) {
    try {
      const rawResponse = await attemptGroqCall(client, model, messages, jsonMode);

      if (!rawResponse) {
        lastError = new Error(`Empty response from model ${model}`);
        continue;
      }

      // Parse + validate
      let parsed: unknown;
      try {
        parsed = extractJSON(rawResponse);
      } catch {
        lastError = new Error(`Model ${model} did not return valid JSON`);
        continue;
      }

      const validated = AgentLLMResponseSchema.safeParse(parsed);
      if (!validated.success) {
        console.warn(`Model ${model} response failed schema validation:`, validated.error.flatten());
        lastError = new Error(`Model ${model} response did not match expected schema`);
        continue;
      }

      // Success — log which model/mode worked
      console.log(`[Groq] Success with model=${model}, jsonMode=${jsonMode}`);
      return validated.data;

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.warn(`[Groq] Model ${model} (jsonMode=${jsonMode}) failed: ${message}`);
      lastError = new Error(`Groq API call failed: ${message}`);
    }
  }

  throw lastError ?? new Error("All Groq model attempts failed");
}
