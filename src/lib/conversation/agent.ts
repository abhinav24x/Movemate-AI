import type { ConversationState, ConversationMessage, AgentResponse } from "@/lib/schemas/agent-response";
import {
  BookingRequirementsSchema,
  CLEARABLE_REQUIREMENT_FIELDS,
  emptyRequirements,
} from "@/lib/schemas/requirements";
import { callGroqAgent } from "@/lib/ai/groq";
import type { BookingRequirements } from "@/lib/schemas/requirements";

// ---------------------------------------------------------------------------
// Initial state factory
// ---------------------------------------------------------------------------
export function createInitialState(): ConversationState {
  return {
    requirements: emptyRequirements(),
    messages: [],
    status: "collecting",
    lastUpdated: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Main conversation orchestrator
// ---------------------------------------------------------------------------
export async function runConversationTurn(
  userMessage: string,
  currentState: ConversationState,
): Promise<AgentResponse> {
  // 1. Call Groq with current state + user message
  const llmResponse = await callGroqAgent(
    userMessage,
    currentState.requirements,
    currentState.messages,
  );

  // 2. Merge requirements — respecting both updates and intentional clears
  const mergedRequirements = mergeRequirements(
    currentState.requirements,
    llmResponse.updated_requirements,
    llmResponse.cleared_fields ?? [],
  );

  // 3. Build updated message history
  const now = new Date().toISOString();
  const newUserMessage: ConversationMessage = {
    role: "user",
    content: userMessage,
    timestamp: now,
  };
  const newAssistantMessage: ConversationMessage = {
    role: "assistant",
    content: llmResponse.assistant_message,
    timestamp: now,
  };

  const updatedMessages = [
    ...currentState.messages,
    newUserMessage,
    newAssistantMessage,
  ];

  // 4. Build updated state
  const updatedState: ConversationState = {
    requirements: mergedRequirements,
    messages: updatedMessages,
    status: llmResponse.status,
    lastUpdated: now,
  };

  return {
    assistantMessage: llmResponse.assistant_message,
    updatedState,
    correctionDetected: llmResponse.correction_detected,
    correctedFields: llmResponse.corrected_fields,
  };
}

// ---------------------------------------------------------------------------
// The set is shared with the structured LLM response schema. Keep a runtime
// check here as mergeRequirements can also be called independently of Zod.
const CLEARABLE_FIELD_SET: ReadonlySet<string> = new Set(CLEARABLE_REQUIREMENT_FIELDS);

// ---------------------------------------------------------------------------
// Safe merge: never lose existing data unless LLM explicitly overwrites or
// the user explicitly asked to clear a specific field via `cleared_fields`.
//
// Rules:
//  1. If a field name appears in `clearedFields` → set it to null/[]
//  2. Else if the updated value is non-null/non-empty → use updated value
//  3. Else → keep current value
// ---------------------------------------------------------------------------
export function mergeRequirements(
  current: BookingRequirements,
  updated: BookingRequirements,
  clearedFields: string[] = [],
): BookingRequirements {
  // Parse through Zod to ensure validity
  const parsed = BookingRequirementsSchema.safeParse(updated);
  if (!parsed.success) {
    console.warn("LLM requirements failed validation, keeping current state");
    return current;
  }

  const upd = parsed.data;
  const cleared = new Set(clearedFields.filter((field) => CLEARABLE_FIELD_SET.has(field)));

  /**
   * Resolve a scalar nullable field.
   * Priority: cleared → new value → current value
   */
  function resolveField<T>(
    field: keyof BookingRequirements,
    newVal: T | null,
    currentVal: T | null,
  ): T | null {
    if (cleared.has(field)) return null;
    return newVal ?? currentVal;
  }

  return {
    pickup: resolveField("pickup", upd.pickup, current.pickup),
    drop: resolveField("drop", upd.drop, current.drop),
    vehicle_type: resolveField("vehicle_type", upd.vehicle_type, current.vehicle_type),
    date: resolveField("date", upd.date, current.date),
    time: resolveField("time", upd.time, current.time),
    special_requirements: resolveField("special_requirements", upd.special_requirements, current.special_requirements),
    additional_notes: resolveField("additional_notes", upd.additional_notes, current.additional_notes),
    // Items: cleared → [] | updated non-empty → use update | else keep current
    items: cleared.has("items")
      ? []
      : upd.items.length > 0
        ? upd.items
        : current.items,
  };
}
