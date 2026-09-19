import type { BookingRequirements } from "@/lib/schemas/requirements";
import { formatLocation } from "@/lib/schemas/requirements";

/**
 * Format a booking summary as clean text for TTS and display.
 */
export function formatBookingSummary(req: BookingRequirements): string {
  const lines: string[] = ["BOOKING SUMMARY", ""];

  lines.push("Pickup");
  lines.push(formatLocation(req.pickup) || "—");
  lines.push("");

  lines.push("Drop");
  lines.push(formatLocation(req.drop) || "—");
  lines.push("");

  lines.push("Items");
  if (req.items.length === 0) {
    lines.push("—");
  } else {
    for (const item of req.items) {
      lines.push(`• ${item.quantity > 1 ? item.quantity + "x " : ""}${item.name}${item.notes ? ` (${item.notes})` : ""}`);
    }
  }
  lines.push("");

  lines.push("Date");
  lines.push(req.date || "—");
  lines.push("");

  lines.push("Time");
  lines.push(req.time || "—");
  lines.push("");

  lines.push("Vehicle");
  lines.push(formatVehicleType(req.vehicle_type));
  lines.push("");

  if (req.special_requirements) {
    lines.push("Special requirements");
    lines.push(req.special_requirements);
    lines.push("");
  }

  if (req.additional_notes) {
    lines.push("Notes");
    lines.push(req.additional_notes);
    lines.push("");
  }

  return lines.join("\n").trim();
}

function formatVehicleType(vt: string | null): string {
  if (!vt) return "Suitable vehicle";
  const map: Record<string, string> = {
    mini_truck: "Mini Truck",
    tempo: "Tempo",
    large_truck: "Large Truck",
    bike: "Bike",
    suitable: "Suitable vehicle",
  };
  return map[vt] ?? vt;
}
