import type { ConversationState, ConversationMessage, AgentResponse } from "@/lib/schemas/agent-response";
import { BookingRequirementsSchema, emptyRequirements } from "@/lib/schemas/requirements";
import { callGroqAgent } from "@/lib/ai/groq";

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

  // 2. Validate and merge the updated requirements
  //    (LLM output is already Zod-validated by callGroqAgent, but we do a
  //     final merge to ensure we never lose existing fields)
  const mergedRequirements = mergeRequirements(
    currentState.requirements,
    llmResponse.updated_requirements,
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
// Safe merge: never lose existing data unless LLM explicitly overwrites
// ---------------------------------------------------------------------------
function mergeRequirements(
  current: ConversationState["requirements"],
  updated: ConversationState["requirements"],
): ConversationState["requirements"] {
  // Parse through Zod to ensure validity
  const parsed = BookingRequirementsSchema.safeParse(updated);
  if (!parsed.success) {
    console.warn("LLM requirements failed validation, keeping current state");
    return current;
  }

  const upd = parsed.data;

  // For each field: prefer updated value if non-null/non-empty, else keep current
  return {
    pickup: upd.pickup ?? current.pickup,
    drop: upd.drop ?? current.drop,
    items: upd.items.length > 0 ? upd.items : current.items,
    vehicle_type: upd.vehicle_type ?? current.vehicle_type,
    date: upd.date ?? current.date,
    time: upd.time ?? current.time,
    special_requirements: upd.special_requirements ?? current.special_requirements,
    additional_notes: upd.additional_notes ?? current.additional_notes,
  };
}
