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
    <div
      className={`rounded-2xl border backdrop-blur-xl p-5 transition-all duration-500 animate-fade-in ${
        isConfirmed
          ? "border-[#00ff88]/25 bg-[#001a0d]/60"
          : "border-[#00ff88]/15 bg-[#001a0d]/30"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            isConfirmed ? "bg-[#00ff88]/20" : "bg-[#00ff88]/10"
          }`}
        >
          {isConfirmed ? (
            <svg className="w-4 h-4 text-[#00ff88]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4 text-[#00cc6a]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zm-.5 1.5L21.96 12H17V9.5h2.5zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm14 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
            </svg>
          )}
        </div>
        <div>
          <h2
            className={`text-sm font-bold tracking-wide ${
              isConfirmed ? "text-[#00ff88]" : "text-[#00cc6a]"
            }`}
          >
            {isConfirmed ? "Booking Confirmed" : "Booking Summary"}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            {isConfirmed
              ? "All details have been confirmed"
              : "Please review and confirm"}
          </p>
        </div>
      </div>

      {/* Route visualization */}
      <div className="flex gap-3 mb-5">
        <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
          <div className={`w-2.5 h-2.5 rounded-full ${isConfirmed ? "bg-[#00ff88]" : "bg-[#00cc6a]"}`} />
          <div className="w-0.5 h-8 bg-gradient-to-b from-[#00ff88]/40 to-[#00cc6a]/40 rounded-full" />
          <div className={`w-2.5 h-2.5 rounded-full border-2 ${isConfirmed ? "border-[#00ff88]" : "border-[#00cc6a]"}`} />
        </div>
        <div className="flex flex-col justify-between flex-1 gap-1">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">From</p>
            <p className="text-sm text-slate-200 font-medium mt-0.5">{formatLocation(requirements.pickup)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">To</p>
            <p className="text-sm text-slate-200 font-medium mt-0.5">{formatLocation(requirements.drop)}</p>
          </div>
        </div>
      </div>

      {/* Detail rows */}
      <div
        className={`rounded-xl border p-3 space-y-2.5 ${
          isConfirmed ? "border-[#00ff88]/15 bg-[#001a0d]/30" : "border-[#00ff88]/10 bg-[#001a0d]/15"
        }`}
      >
        <SummaryRow label="Items" value={
          requirements.items.length > 0
            ? requirements.items.map((i) => `${i.quantity > 1 ? i.quantity + "× " : ""}${i.name}`).join(", ")
            : "—"
        } />
        <SummaryRow label="Date" value={requirements.date || "—"} />
        <SummaryRow label="Time" value={requirements.time || "—"} />
        <SummaryRow label="Vehicle" value={formatVehicleType(requirements.vehicle_type)} />
        {requirements.special_requirements && (
          <SummaryRow label="Special" value={requirements.special_requirements} />
        )}
      </div>

      {/* Footer note */}
      <p
        className={`mt-3 text-xs border-t pt-3 ${
          isConfirmed
            ? "text-[#00ff88]/60 border-[#00ff88]/15"
            : "text-[#00cc6a]/60 border-[#00ff88]/10"
        }`}
      >
        {isConfirmed
          ? "Note: This is a requirements summary. No vehicle has been dispatched."
          : "Please confirm the details above or ask to change anything."}
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 items-baseline">
      <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-14 flex-shrink-0">
        {label}
      </span>
      <span className="text-sm text-slate-300 flex-1">{value}</span>
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