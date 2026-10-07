import { z } from "zod";
import { BookingRequirementsSchema } from "./requirements";

// ---------------------------------------------------------------------------
// Conversation status
// ---------------------------------------------------------------------------
export const ConversationStatusSchema = z.enum([
  "collecting",
  "ready_for_confirmation",
  "confirmed",
]);
export type ConversationStatus = z.infer<typeof ConversationStatusSchema>;

// ---------------------------------------------------------------------------
// Structured LLM response — this is what Groq must return
// ---------------------------------------------------------------------------
export const AgentLLMResponseSchema = z.object({
  assistant_message: z
    .string()
    .min(1)
    .describe("What the assistant says to the user — natural, conversational, spoken-language friendly"),

  updated_requirements: BookingRequirementsSchema
    .describe("The complete requirements object after applying any updates from this turn"),

  missing_requirements: z
    .array(z.string())
    .describe("List of field names that are still unknown and required"),

  status: ConversationStatusSchema
    .describe("Current state of the booking collection"),

  needs_clarification: z
    .boolean()
    .describe("True if the user said something ambiguous that needs a follow-up question"),

  clarification_reason: z
    .string()
    .nullable()
    .describe("Why clarification is needed, if needs_clarification is true"),

  correction_detected: z
    .boolean()
    .describe("True if the user corrected or changed a previously provided field"),

  corrected_fields: z
    .array(z.string())
    .describe("Names of the fields that were corrected in this turn"),

  cleared_fields: z
    .array(z.string())
    .default([])
    .describe(
      "Names of fields the user explicitly asked to remove or clear. " +
      "Only populate this when the user INTENTIONALLY removes a value " +
      "(e.g. 'remove the special requirement', 'forget the time'). " +
      "Do NOT list fields that are simply missing from this response — " +
      "only list fields the user explicitly asked to erase.",
    ),
});

export type AgentLLMResponse = z.infer<typeof AgentLLMResponseSchema>;

// ---------------------------------------------------------------------------
// Message in the conversation history
// ---------------------------------------------------------------------------
export const ConversationMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.string(),
});
export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;

// ---------------------------------------------------------------------------
// Full conversation state (client-owned, sent each request)
// ---------------------------------------------------------------------------
export const ConversationStateSchema = z.object({
  requirements: BookingRequirementsSchema,
  messages: z.array(ConversationMessageSchema),
  status: ConversationStatusSchema,
  lastUpdated: z.string(),
});
export type ConversationState = z.infer<typeof ConversationStateSchema>;

// ---------------------------------------------------------------------------
// API request/response shapes
// ---------------------------------------------------------------------------
export const AgentRequestSchema = z.object({
  userMessage: z.string().min(1).max(2000),
  conversationState: ConversationStateSchema,
});
export type AgentRequest = z.infer<typeof AgentRequestSchema>;

export const AgentResponseSchema = z.object({
  assistantMessage: z.string(),
  updatedState: ConversationStateSchema,
  correctionDetected: z.boolean(),
  correctedFields: z.array(z.string()),
});
export type AgentResponse = z.infer<typeof AgentResponseSchema>;
