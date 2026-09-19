"use client";

import type { BookingRequirements } from "@/lib/schemas/requirements";
import { formatLocation } from "@/lib/schemas/requirements";

interface BookingSummaryProps {
  requirements: BookingRequirements;
  status: "collecting" | "ready_for_confirmation" | "confirmed";
}

export function BookingSummary({ requirements, status }: BookingSummaryProps) {
  if (status === "collecting") return null;

  const isConfirmed = status === "confirmed";

  return (
    <div className={`rounded-xl border backdrop-blur-sm p-4 transition-all duration-500 ${
      isConfirmed
        ? "border-emerald-600/50 bg-emerald-900/20"
        : "border-amber-600/40 bg-amber-900/10"
    }`}>
      <div className="flex items-center gap-2 mb-4">
        {isConfirmed ? (
          <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
        ) : (
          <svg className="w-4 h-4 text-amber-400 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 5h2v6h-2V7zm0 8h2v2h-2v-2z"/>
          </svg>
        )}
        <h2 className={`text-sm font-bold uppercase tracking-widest ${
          isConfirmed ? "text-emerald-400" : "text-amber-400"
        }`}>
          {isConfirmed ? "Booking Confirmed" : "Booking Summary"}
        </h2>
      </div>

      <div className="space-y-3">
        <SummaryRow label="Pickup" value={formatLocation(requirements.pickup)} />
        <SummaryRow label="Drop" value={formatLocation(requirements.drop)} />
        <SummaryRow
          label="Items"
          value={
            requirements.items.length > 0
              ? requirements.items
                  .map((i) => `${i.quantity > 1 ? i.quantity + "× " : ""}${i.name}`)
                  .join(", ")
              : "—"
          }
        />
        <SummaryRow label="Date" value={requirements.date || "—"} />
        <SummaryRow label="Time" value={requirements.time || "—"} />
        <SummaryRow label="Vehicle" value={formatVehicleType(requirements.vehicle_type)} />
        {requirements.special_requirements && (
          <SummaryRow label="Special" value={requirements.special_requirements} />
        )}
      </div>

      {!isConfirmed && (
        <p className="mt-4 text-xs text-amber-400/80 border-t border-amber-700/30 pt-3">
          Please confirm the details above or ask to change anything.
        </p>
      )}

      {isConfirmed && (
        <p className="mt-4 text-xs text-emerald-400/70 border-t border-emerald-700/30 pt-3">
          Note: This is a booking requirements summary. No vehicle has been dispatched.
        </p>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-16 flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-slate-200 flex-1">{value}</span>
    </div>
  );
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
