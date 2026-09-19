/**
 * Core conversation logic tests.
 * All provider (Groq, ElevenLabs) responses are mocked.
 * These tests validate:
 * 1. Schema validation
 * 2. State management
 * 3. Requirement extraction logic
 * 4. Correction handling
 * 5. Missing field detection
 * 6. Readiness determination
 */

import {
  BookingRequirementsSchema,
  emptyRequirements,
  getMissingFields,
  isReadyForConfirmation,
  hasLocation,
  formatLocation,
  type BookingRequirements,
} from "../src/lib/schemas/requirements";

import {
  AgentLLMResponseSchema,
  ConversationStateSchema,
  type AgentLLMResponse,
  type ConversationState,
} from "../src/lib/schemas/agent-response";

// ---------------------------------------------------------------------------
// Helper: make a minimal valid AgentLLMResponse
// ---------------------------------------------------------------------------
function makeLLMResponse(overrides: Partial<AgentLLMResponse> = {}): AgentLLMResponse {
  return {
    assistant_message: "Got it. What else?",
    updated_requirements: emptyRequirements(),
    missing_requirements: [],
    status: "collecting",
    needs_clarification: false,
    clarification_reason: null,
    correction_detected: false,
    corrected_fields: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. Zod schema validation
// ---------------------------------------------------------------------------
describe("BookingRequirementsSchema", () => {
  test("accepts a fully empty requirements object", () => {
    const result = BookingRequirementsSchema.safeParse(emptyRequirements());
    expect(result.success).toBe(true);
  });

  test("accepts partial location data", () => {
    const result = BookingRequirementsSchema.safeParse({
      ...emptyRequirements(),
      pickup: { address: null, landmark: null, area: "Koramangala", city: "Bengaluru" },
    });
    expect(result.success).toBe(true);
  });

  test("accepts items array", () => {
    const result = BookingRequirementsSchema.safeParse({
      ...emptyRequirements(),
      items: [{ name: "sofa", quantity: 1, notes: null }],
    });
    expect(result.success).toBe(true);
  });

  test("rejects negative item quantity", () => {
    const result = BookingRequirementsSchema.safeParse({
      ...emptyRequirements(),
      items: [{ name: "sofa", quantity: -1, notes: null }],
    });
    expect(result.success).toBe(false);
  });

  test("accepts all vehicle types", () => {
    const types = ["mini_truck", "tempo", "large_truck", "bike", "suitable", null];
    for (const vt of types) {
      const result = BookingRequirementsSchema.safeParse({
        ...emptyRequirements(),
        vehicle_type: vt,
      });
      expect(result.success).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Missing field detection
// ---------------------------------------------------------------------------
describe("getMissingFields", () => {
  test("returns all required fields when empty", () => {
    const missing = getMissingFields(emptyRequirements());
    expect(missing).toContain("pickup location");
    expect(missing).toContain("drop location");
    expect(missing).toContain("items to move");
    expect(missing).toContain("date");
    expect(missing).toContain("time");
    expect(missing).toHaveLength(5);
  });

  test("returns empty when all required fields filled", () => {
    const req: BookingRequirements = {
      pickup: { address: null, landmark: null, area: "Koramangala", city: "Bengaluru" },
      drop: { address: null, landmark: null, area: "Whitefield", city: "Bengaluru" },
      items: [{ name: "sofa", quantity: 1, notes: null }],
      vehicle_type: null,
      date: "2026-09-16",
      time: "18:00",
      special_requirements: null,
      additional_notes: null,
    };
    expect(getMissingFields(req)).toHaveLength(0);
  });

  test("detects missing drop when pickup filled", () => {
    const req: BookingRequirements = {
      ...emptyRequirements(),
      pickup: { address: null, landmark: null, area: "Koramangala", city: null },
    };
    const missing = getMissingFields(req);
    expect(missing).not.toContain("pickup location");
    expect(missing).toContain("drop location");
  });

  test("detects missing time when all else filled", () => {
    const req: BookingRequirements = {
      pickup: { address: null, landmark: null, area: "HSR Layout", city: "Bengaluru" },
      drop: { address: null, landmark: null, area: "Whitefield", city: "Bengaluru" },
      items: [{ name: "table", quantity: 1, notes: null }],
      vehicle_type: null,
      date: "2026-09-16",
      time: null,
      special_requirements: null,
      additional_notes: null,
    };
    const missing = getMissingFields(req);
    expect(missing).toEqual(["time"]);
  });
});

// ---------------------------------------------------------------------------
// 3. Readiness for confirmation
// ---------------------------------------------------------------------------
describe("isReadyForConfirmation", () => {
  test("returns false for empty requirements", () => {
    expect(isReadyForConfirmation(emptyRequirements())).toBe(false);
  });

  test("returns true when all required fields filled", () => {
    const req: BookingRequirements = {
      pickup: { address: null, landmark: null, area: "Indiranagar", city: "Bengaluru" },
      drop: { address: null, landmark: null, area: "Whitefield", city: "Bengaluru" },
      items: [{ name: "sofa", quantity: 1, notes: null }, { name: "chair", quantity: 2, notes: null }],
      vehicle_type: null,
      date: "tomorrow",
      time: "18:00",
      special_requirements: null,
      additional_notes: null,
    };
    expect(isReadyForConfirmation(req)).toBe(true);
  });

  test("returns false with only pickup and drop", () => {
    const req: BookingRequirements = {
      ...emptyRequirements(),
      pickup: { address: null, landmark: null, area: "Koramangala", city: null },
      drop: { address: null, landmark: null, area: "Whitefield", city: null },
    };
    expect(isReadyForConfirmation(req)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. Location helpers
// ---------------------------------------------------------------------------
describe("hasLocation / formatLocation", () => {
  test("hasLocation returns false for null", () => {
    expect(hasLocation(null)).toBe(false);
  });

  test("hasLocation returns false for all-null location", () => {
    expect(hasLocation({ address: null, landmark: null, area: null, city: null })).toBe(false);
  });

  test("hasLocation returns true when area is set", () => {
    expect(hasLocation({ address: null, landmark: null, area: "Koramangala", city: null })).toBe(true);
  });

  test("formatLocation returns dash for null", () => {
    expect(formatLocation(null)).toBe("—");
  });

  test("formatLocation combines area and city", () => {
    const loc = { address: null, landmark: null, area: "Koramangala", city: "Bengaluru" };
    expect(formatLocation(loc)).toBe("Koramangala, Bengaluru");
  });

  test("formatLocation uses address when present", () => {
    const loc = { address: "123 Main St", landmark: null, area: "Koramangala", city: "Bengaluru" };
    const result = formatLocation(loc);
    expect(result).toContain("123 Main St");
  });
});

// ---------------------------------------------------------------------------
// 5. AgentLLMResponse schema validation
// ---------------------------------------------------------------------------
describe("AgentLLMResponseSchema", () => {
  test("validates a correct response", () => {
    const response = makeLLMResponse();
    const result = AgentLLMResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  test("rejects empty assistant_message", () => {
    const response = makeLLMResponse({ assistant_message: "" });
    const result = AgentLLMResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  test("validates status enum values", () => {
    const statuses = ["collecting", "ready_for_confirmation", "confirmed"] as const;
    for (const status of statuses) {
      const result = AgentLLMResponseSchema.safeParse(makeLLMResponse({ status }));
      expect(result.success).toBe(true);
    }
  });

  test("rejects invalid status", () => {
    const result = AgentLLMResponseSchema.safeParse(makeLLMResponse({ status: "invalid" as never }));
    expect(result.success).toBe(false);
  });

  test("validates correction_detected and corrected_fields", () => {
    const response = makeLLMResponse({
      correction_detected: true,
      corrected_fields: ["pickup"],
    });
    const result = AgentLLMResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6. State update semantics (merge logic simulation)
// ---------------------------------------------------------------------------
describe("State update merge logic", () => {
  /**
   * Simulates the mergeRequirements logic from agent.ts
   * to validate the business rules without calling Groq.
   */
  function mergeRequirements(
    current: BookingRequirements,
    updated: BookingRequirements,
  ): BookingRequirements {
    return {
      pickup: updated.pickup ?? current.pickup,
      drop: updated.drop ?? current.drop,
      items: updated.items.length > 0 ? updated.items : current.items,
      vehicle_type: updated.vehicle_type ?? current.vehicle_type,
      date: updated.date ?? current.date,
      time: updated.time ?? current.time,
      special_requirements: updated.special_requirements ?? current.special_requirements,
      additional_notes: updated.additional_notes ?? current.additional_notes,
    };
  }

  test("TC1: Initial extraction from one message", () => {
    const initial = emptyRequirements();
    const update: BookingRequirements = {
      ...emptyRequirements(),
      pickup: { address: null, landmark: null, area: "Koramangala", city: null },
      drop: { address: null, landmark: null, area: "Whitefield", city: null },
    };
    const merged = mergeRequirements(initial, update);
    expect(merged.pickup?.area).toBe("Koramangala");
    expect(merged.drop?.area).toBe("Whitefield");
    expect(merged.items).toHaveLength(0);
  });

  test("TC2: Multiple fields extracted from one message", () => {
    const initial = emptyRequirements();
    const update: BookingRequirements = {
      ...emptyRequirements(),
      pickup: { address: null, landmark: null, area: "Koramangala", city: null },
      drop: { address: null, landmark: null, area: "Whitefield", city: null },
      items: [{ name: "sofa", quantity: 1, notes: null }, { name: "chair", quantity: 2, notes: null }],
      date: "tomorrow",
      time: "18:00",
    };
    const merged = mergeRequirements(initial, update);
    expect(merged.pickup?.area).toBe("Koramangala");
    expect(merged.drop?.area).toBe("Whitefield");
    expect(merged.items).toHaveLength(2);
    expect(merged.date).toBe("tomorrow");
    expect(merged.time).toBe("18:00");
  });

  test("TC3: Context preservation — only specified fields change", () => {
    const current: BookingRequirements = {
      pickup: { address: null, landmark: null, area: "Koramangala", city: null },
      drop: { address: null, landmark: null, area: "Whitefield", city: null },
      items: [{ name: "sofa", quantity: 1, notes: null }],
      vehicle_type: null,
      date: "tomorrow",
      time: "17:00",
      special_requirements: null,
      additional_notes: null,
    };

    // User says: "Make it 7 PM" — only time changes
    const update: BookingRequirements = {
      ...current,
      time: "19:00",
    };
    const merged = mergeRequirements(current, update);
    expect(merged.time).toBe("19:00");
    expect(merged.pickup?.area).toBe("Koramangala"); // unchanged
    expect(merged.drop?.area).toBe("Whitefield");   // unchanged
    expect(merged.items).toHaveLength(1);            // unchanged
    expect(merged.date).toBe("tomorrow");            // unchanged
  });

  test("TC4: Correction handling — pickup changes, everything else preserved", () => {
    const current: BookingRequirements = {
      pickup: { address: null, landmark: null, area: "Koramangala", city: null },
      drop: { address: null, landmark: null, area: "Whitefield", city: null },
      items: [{ name: "sofa", quantity: 1, notes: null }],
      vehicle_type: null,
      date: "tomorrow",
      time: "18:00",
      special_requirements: null,
      additional_notes: null,
    };

    // User says: "Actually pickup is HSR Layout"
    const update: BookingRequirements = {
      ...current,
      pickup: { address: null, landmark: null, area: "HSR Layout", city: null },
    };
    const merged = mergeRequirements(current, update);
    expect(merged.pickup?.area).toBe("HSR Layout");
    expect(merged.drop?.area).toBe("Whitefield"); // unchanged
    expect(merged.time).toBe("18:00");             // unchanged
  });

  test("TC5: Items update replaces old items", () => {
    const current: BookingRequirements = {
      ...emptyRequirements(),
      items: [{ name: "sofa", quantity: 1, notes: null }],
    };
    const update: BookingRequirements = {
      ...emptyRequirements(),
      items: [
        { name: "sofa", quantity: 1, notes: null },
        { name: "chair", quantity: 2, notes: null },
      ],
    };
    const merged = mergeRequirements(current, update);
    expect(merged.items).toHaveLength(2);
  });

  test("TC6: Null update preserves existing values", () => {
    const current: BookingRequirements = {
      ...emptyRequirements(),
      date: "tomorrow",
      time: "18:00",
    };
    const update = emptyRequirements(); // nulls everywhere
    const merged = mergeRequirements(current, update);
    expect(merged.date).toBe("tomorrow");
    expect(merged.time).toBe("18:00");
  });

  test("TC7: Destination correction only", () => {
    const current: BookingRequirements = {
      pickup: { address: null, landmark: null, area: "Indiranagar", city: null },
      drop: { address: null, landmark: null, area: "Whitefield", city: null },
      items: [{ name: "bed", quantity: 1, notes: null }],
      vehicle_type: null,
      date: "Saturday",
      time: "10:00",
      special_requirements: null,
      additional_notes: null,
    };

    const update: BookingRequirements = {
      ...current,
      drop: { address: null, landmark: null, area: "Marathahalli", city: null },
    };
    const merged = mergeRequirements(current, update);
    expect(merged.drop?.area).toBe("Marathahalli");
    expect(merged.pickup?.area).toBe("Indiranagar"); // unchanged
    expect(merged.items).toHaveLength(1);             // unchanged
  });
});

// ---------------------------------------------------------------------------
// 7. ConversationState schema
// ---------------------------------------------------------------------------
describe("ConversationStateSchema", () => {
  test("validates initial state", () => {
    const state: ConversationState = {
      requirements: emptyRequirements(),
      messages: [],
      status: "collecting",
      lastUpdated: new Date().toISOString(),
    };
    const result = ConversationStateSchema.safeParse(state);
    expect(result.success).toBe(true);
  });

  test("validates state with messages", () => {
    const state: ConversationState = {
      requirements: emptyRequirements(),
      messages: [
        { role: "user", content: "I need to move a sofa", timestamp: new Date().toISOString() },
        { role: "assistant", content: "Got it! Where should I pick it up from?", timestamp: new Date().toISOString() },
      ],
      status: "collecting",
      lastUpdated: new Date().toISOString(),
    };
    const result = ConversationStateSchema.safeParse(state);
    expect(result.success).toBe(true);
  });

  test("validates confirmed state", () => {
    const req: BookingRequirements = {
      pickup: { address: null, landmark: null, area: "Koramangala", city: "Bengaluru" },
      drop: { address: null, landmark: null, area: "Whitefield", city: "Bengaluru" },
      items: [{ name: "sofa", quantity: 1, notes: null }],
      vehicle_type: null,
      date: "2026-09-16",
      time: "18:00",
      special_requirements: null,
      additional_notes: null,
    };
    const state: ConversationState = {
      requirements: req,
      messages: [],
      status: "confirmed",
      lastUpdated: new Date().toISOString(),
    };
    const result = ConversationStateSchema.safeParse(state);
    expect(result.success).toBe(true);
  });
});
