import { z } from "zod";

/** Accept both a plain string (coerced to area) and a proper object */
const LocationObjectSchema = z.object({
  address: z.string().nullable().default(null),
  landmark: z.string().nullable().default(null),
  area: z.string().nullable().default(null),
  city: z.string().nullable().default(null),
});

export const LocationSchema = z.union([
  // A proper location object
  LocationObjectSchema,
  // A plain string — treat it as the area name
  z.string().transform((s) => ({
    address: null,
    landmark: null,
    area: s || null,
    city: null,
  })),
]).pipe(LocationObjectSchema);

export type Location = z.infer<typeof LocationObjectSchema>;


// ---------------------------------------------------------------------------
// Item sub-schema
// ---------------------------------------------------------------------------
export const MovingItemSchema = z.object({
  name: z.string(),
  quantity: z.number().int().positive().default(1),
  notes: z.string().nullable().default(null),
});
export type MovingItem = z.infer<typeof MovingItemSchema>;

// ---------------------------------------------------------------------------
// Vehicle type enum
// ---------------------------------------------------------------------------
export const VehicleTypeSchema = z.enum([
  "mini_truck",
  "tempo",
  "large_truck",
  "bike",
  "suitable", // let system decide
]).nullable();
export type VehicleType = z.infer<typeof VehicleTypeSchema>;

// ---------------------------------------------------------------------------
// Core booking requirements schema
// ---------------------------------------------------------------------------
export const BookingRequirementsSchema = z.object({
  pickup: LocationSchema.nullable().default(null),
  drop: LocationSchema.nullable().default(null),
  items: z.array(MovingItemSchema).default([]),
  vehicle_type: VehicleTypeSchema.default(null),
  date: z.string().nullable().default(null),        // ISO date or natural (normalized)
  time: z.string().nullable().default(null),        // HH:MM 24h or natural description
  special_requirements: z.string().nullable().default(null),
  additional_notes: z.string().nullable().default(null),
});
export type BookingRequirements = z.infer<typeof BookingRequirementsSchema>;

export const emptyRequirements = (): BookingRequirements => ({
  pickup: null,
  drop: null,
  items: [],
  vehicle_type: null,
  date: null,
  time: null,
  special_requirements: null,
  additional_notes: null,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check if a location has at least one meaningful field */
export function hasLocation(loc: Location | null): boolean {
  if (!loc) return false;
  return !!(loc.address || loc.area || loc.city || loc.landmark);
}

/** Human-readable label for a location */
export function formatLocation(loc: Location | null): string {
  if (!loc) return "—";
  const parts = [loc.area, loc.city].filter(Boolean);
  if (loc.address) parts.unshift(loc.address);
  return parts.join(", ") || loc.landmark || "—";
}

/** Check which required fields are missing */
export function getMissingFields(req: BookingRequirements): string[] {
  const missing: string[] = [];
  if (!hasLocation(req.pickup)) missing.push("pickup location");
  if (!hasLocation(req.drop)) missing.push("drop location");
  if (req.items.length === 0) missing.push("items to move");
  if (!req.date) missing.push("date");
  if (!req.time) missing.push("time");
  return missing;
}

/** True when we have enough for a summary */
export function isReadyForConfirmation(req: BookingRequirements): boolean {
  return getMissingFields(req).length === 0;
}
