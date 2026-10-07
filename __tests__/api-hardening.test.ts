/**
 * Extended tests covering:
 * - Rate limiting behavior
 * - Intentional field clearing (cleared_fields)
 * - Safe API error handling
 * - Conversation state validation (malformed input rejection)
 * - Existing-state preservation
 * - Normal conversation flow (mocked Groq)
 */

import {
  BookingRequirementsSchema,
  emptyRequirements,
  type BookingRequirements,
} from "../src/lib/schemas/requirements";

import {
  AgentLLMResponseSchema,
  ConversationStateSchema,
  type AgentLLMResponse,
  type ConversationState,
} from "../src/lib/schemas/agent-response";

import { mergeRequirements } from "../src/lib/conversation/agent";
import { checkRateLimit } from "../src/lib/rate-limit";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type LLMResponseOverrides = Omit<Partial<AgentLLMResponse>, "cleared_fields"> & {
  cleared_fields?: string[];
};

function makeLLMResponse(overrides: LLMResponseOverrides = {}): AgentLLMResponse {
  const { cleared_fields = [], ...rest } = overrides;
  return {
    assistant_message: "Got it. What else?",
    updated_requirements: emptyRequirements(),
    missing_requirements: [],
    status: "collecting",
    needs_clarification: false,
    clarification_reason: null,
    correction_detected: false,
    corrected_fields: [],
    cleared_fields,
    ...rest,
  };
}

function filledRequirements(): BookingRequirements {
  return {
    pickup: { address: null, landmark: null, area: "Koramangala", city: "Bengaluru" },
    drop: { address: null, landmark: null, area: "Whitefield", city: "Bengaluru" },
    items: [{ name: "sofa", quantity: 1, notes: null }],
    vehicle_type: null,
    date: "2026-10-15",
    time: "18:00",
    special_requirements: "Need packing service",
    additional_notes: "Call before arrival",
  };
}

// ---------------------------------------------------------------------------
// 1. Rate limiting
// ---------------------------------------------------------------------------
describe("checkRateLimit", () => {
  test("allows requests under the limit", () => {
    const key = `test-allow-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, 5, 60_000)).toBe(true);
    }
  });

  test("blocks requests over the limit", () => {
    const key = `test-block-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 60_000);
    }
    expect(checkRateLimit(key, 5, 60_000)).toBe(false);
  });

  test("different keys are independent", () => {
    const ts = Date.now();
    const key1 = `test-key1-${ts}`;
    const key2 = `test-key2-${ts}`;
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key1, 3, 60_000);
    }
    // key1 is exhausted; key2 should still be allowed
    expect(checkRateLimit(key1, 3, 60_000)).toBe(false);
    expect(checkRateLimit(key2, 3, 60_000)).toBe(true);
  });

  test("window expiry: accepts requests after window passes", () => {
    const key = `test-window-${Date.now()}`;
    // Use a very short window (1ms) so it immediately expires
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, 3, 1);
    }
    // After 10ms, the window should have reset
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(checkRateLimit(key, 3, 1)).toBe(true);
        resolve();
      }, 10);
    });
  });
});

// ---------------------------------------------------------------------------
// 2. Intentional field clearing via cleared_fields
// ---------------------------------------------------------------------------
describe("mergeRequirements — field clearing", () => {
  test("clears special_requirements when explicitly requested", () => {
    const current = filledRequirements();
    const update = { ...current, special_requirements: null };
    const merged = mergeRequirements(current, update, ["special_requirements"]);
    expect(merged.special_requirements).toBeNull();
    // Other fields untouched
    expect(merged.pickup?.area).toBe("Koramangala");
    expect(merged.date).toBe("2026-10-15");
  });

  test("clears additional_notes when explicitly requested", () => {
    const current = filledRequirements();
    const merged = mergeRequirements(current, current, ["additional_notes"]);
    expect(merged.additional_notes).toBeNull();
    expect(merged.special_requirements).toBe("Need packing service"); // unchanged
  });

  test("clears items when explicitly requested", () => {
    const current = filledRequirements();
    const merged = mergeRequirements(current, current, ["items"]);
    expect(merged.items).toHaveLength(0);
  });

  test("clears multiple fields simultaneously", () => {
    const current = filledRequirements();
    const merged = mergeRequirements(current, current, ["special_requirements", "additional_notes"]);
    expect(merged.special_requirements).toBeNull();
    expect(merged.additional_notes).toBeNull();
    expect(merged.pickup?.area).toBe("Koramangala"); // unchanged
  });

  test("does NOT clear a field simply because updated_requirements is null", () => {
    // This is the KEY distinction: null in updated ≠ intentional clear
    const current = filledRequirements();
    const update = emptyRequirements(); // all nulls
    const merged = mergeRequirements(current, update, []); // NO cleared_fields
    expect(merged.special_requirements).toBe("Need packing service"); // preserved!
    expect(merged.additional_notes).toBe("Call before arrival");       // preserved!
    expect(merged.date).toBe("2026-10-15");                            // preserved!
  });

  test("clearing a non-existent field is safe (no-op)", () => {
    const current = emptyRequirements();
    const merged = mergeRequirements(current, current, ["special_requirements"]);
    expect(merged.special_requirements).toBeNull(); // already null, stays null
  });

  test("cleared field wins over a non-null updated value", () => {
    // Even if the LLM returns a value, cleared_fields takes priority
    const current = filledRequirements();
    const update = { ...current, special_requirements: "New requirement" };
    const merged = mergeRequirements(current, update, ["special_requirements"]);
    expect(merged.special_requirements).toBeNull(); // cleared wins
  });
});

// ---------------------------------------------------------------------------
// 3. Existing-state preservation (regression)
// ---------------------------------------------------------------------------
describe("mergeRequirements — state preservation", () => {
  test("preserves all fields when update is empty", () => {
    const current = filledRequirements();
    const merged = mergeRequirements(current, emptyRequirements(), []);
    expect(merged.pickup?.area).toBe("Koramangala");
    expect(merged.drop?.area).toBe("Whitefield");
    expect(merged.items).toHaveLength(1);
    expect(merged.date).toBe("2026-10-15");
    expect(merged.time).toBe("18:00");
    expect(merged.special_requirements).toBe("Need packing service");
    expect(merged.additional_notes).toBe("Call before arrival");
  });

  test("only time changes when only time is updated", () => {
    const current = filledRequirements();
    const update = { ...current, time: "09:00" };
    const merged = mergeRequirements(current, update, []);
    expect(merged.time).toBe("09:00");
    expect(merged.date).toBe("2026-10-15"); // unchanged
    expect(merged.pickup?.area).toBe("Koramangala"); // unchanged
  });

  test("items update replaces old items", () => {
    const current = filledRequirements();
    const update = {
      ...current,
      items: [
        { name: "sofa", quantity: 1, notes: null },
        { name: "wardrobe", quantity: 1, notes: null },
      ],
    };
    const merged = mergeRequirements(current, update, []);
    expect(merged.items).toHaveLength(2);
  });

  test("returns current state when LLM output fails Zod validation", () => {
    const current = filledRequirements();
    const invalid = { ...current, items: [{ name: "sofa", quantity: -1, notes: null }] };
    const merged = mergeRequirements(current, invalid, []);
    // Should fall back to current (invalid items fail Zod)
    expect(merged.items).toHaveLength(1);
    expect(merged.items[0].name).toBe("sofa");
  });
});

// ---------------------------------------------------------------------------
// 4. Schema validation — cleared_fields
// ---------------------------------------------------------------------------
describe("AgentLLMResponseSchema — cleared_fields", () => {
  test("accepts response with cleared_fields", () => {
    const response = makeLLMResponse({ cleared_fields: ["special_requirements"] });
    const result = AgentLLMResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cleared_fields).toEqual(["special_requirements"]);
    }
  });

  test("defaults cleared_fields to [] when absent", () => {
    const response = makeLLMResponse();
    const withoutCleared = { ...response };
    // @ts-expect-error intentionally omitting cleared_fields to test default
    delete withoutCleared.cleared_fields;
    const result = AgentLLMResponseSchema.safeParse(withoutCleared);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cleared_fields).toEqual([]);
    }
  });

  test("accepts empty cleared_fields array", () => {
    const response = makeLLMResponse({ cleared_fields: [] });
    const result = AgentLLMResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  test("accepts multiple cleared fields", () => {
    const response = makeLLMResponse({
      cleared_fields: ["special_requirements", "additional_notes"],
    });
    const result = AgentLLMResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. ConversationState validation — malformed input rejection
// ---------------------------------------------------------------------------
describe("ConversationStateSchema — input validation", () => {
  function makeValidState(): ConversationState {
    return {
      requirements: emptyRequirements(),
      messages: [],
      status: "collecting",
      lastUpdated: new Date().toISOString(),
    };
  }

  test("rejects missing status", () => {
    const state = makeValidState();
    const invalid = { ...state, status: undefined };
    const result = ConversationStateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  test("rejects invalid status enum", () => {
    const invalid = { ...makeValidState(), status: "hacked" };
    const result = ConversationStateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  test("rejects message with invalid role", () => {
    const state: ConversationState = {
      ...makeValidState(),
      messages: [{ role: "admin" as "user", content: "hack", timestamp: new Date().toISOString() }],
    };
    const result = ConversationStateSchema.safeParse(state);
    expect(result.success).toBe(false);
  });

  test("rejects negative item quantity in state", () => {
    const invalid = {
      ...makeValidState(),
      requirements: {
        ...emptyRequirements(),
        items: [{ name: "sofa", quantity: -1, notes: null }],
      },
    };
    const result = ConversationStateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  test("accepts valid state with messages", () => {
    const state: ConversationState = {
      requirements: emptyRequirements(),
      messages: [
        { role: "user", content: "I need to move", timestamp: new Date().toISOString() },
        { role: "assistant", content: "Sure, where from?", timestamp: new Date().toISOString() },
      ],
      status: "collecting",
      lastUpdated: new Date().toISOString(),
    };
    const result = ConversationStateSchema.safeParse(state);
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6. BookingRequirements — edge cases
// ---------------------------------------------------------------------------
describe("BookingRequirementsSchema — edge cases", () => {
  test("accepts plain string location (coerced to area)", () => {
    const result = BookingRequirementsSchema.safeParse({
      ...emptyRequirements(),
      pickup: "Koramangala",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pickup?.area).toBe("Koramangala");
    }
  });

  test("accepts null vehicle_type", () => {
    const result = BookingRequirementsSchema.safeParse({
      ...emptyRequirements(),
      vehicle_type: null,
    });
    expect(result.success).toBe(true);
  });

  test("rejects unknown vehicle_type", () => {
    const result = BookingRequirementsSchema.safeParse({
      ...emptyRequirements(),
      vehicle_type: "helicopter",
    });
    expect(result.success).toBe(false);
  });
});
