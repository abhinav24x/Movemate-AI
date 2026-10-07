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
      className={`rounded-2xl neon-card p-5 transition-all duration-500 animate-fade-in ${
        isConfirmed ? "bg-[#0a1a05]/70" : "bg-[#0D0D0D]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isConfirmed
              ? "bg-[#39FF14]/15 shadow-[0_0_16px_rgba(57,255,20,0.15)]"
              : "bg-[#39FF14]/8"
          }`}
        >
          {isConfirmed ? (
            <svg className="w-4.5 h-4.5 w-5 h-5 text-[#39FF14]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-[#39FF14]/70" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zm-.5 1.5L21.96 12H17V9.5h2.5zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm14 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
            </svg>
          )}
        </div>
        <div>
          <h2
            className={`text-sm font-bold tracking-wide ${
              isConfirmed ? "text-[#39FF14]" : "text-[#8be870]"
            }`}
          >
            {isConfirmed ? "Booking Confirmed" : "Booking Summary"}
          </h2>
          <p className="text-xs text-[#8A8A8A] mt-0.5">
            {isConfirmed
              ? "All details confirmed"
              : "Please review and confirm"}
          </p>
        </div>
      </div>

      {/* Route visualization — From → To */}
      <div className="flex gap-3 mb-5">
        <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1.5">
          <div className={`w-2.5 h-2.5 rounded-full ${isConfirmed ? "bg-[#39FF14]" : "bg-[#39FF14]/60"}`} />
          <div className="w-px h-8 bg-gradient-to-b from-[#39FF14]/40 to-[#39FF14]/15 rounded-full" />
          <div className={`w-2.5 h-2.5 rounded-full border-2 ${isConfirmed ? "border-[#39FF14]" : "border-[#39FF14]/50"}`} />
        </div>
        <div className="flex flex-col justify-between flex-1 gap-1.5">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-[#555] font-semibold">From</p>
            <p className="text-sm text-[#F5F5F5] font-medium mt-0.5">{formatLocation(requirements.pickup)}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-[#555] font-semibold">To</p>
            <p className="text-sm text-[#F5F5F5] font-medium mt-0.5">{formatLocation(requirements.drop)}</p>
          </div>
        </div>
      </div>

      {/* Detail rows card */}
      <div
        className={`rounded-xl border p-3.5 space-y-2.5 ${
          isConfirmed
            ? "border-[#39FF14]/15 bg-[#0a1a05]/40"
            : "border-[#39FF14]/8 bg-black/20"
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
        {requirements.additional_notes && (
          <SummaryRow label="Notes" value={requirements.additional_notes} />
        )}
      </div>

      {/* Footer */}
      <p
        className={`mt-3 text-xs border-t pt-3 leading-relaxed ${
          isConfirmed
            ? "text-[#39FF14]/50 border-[#39FF14]/10"
            : "text-[#555] border-white/[0.04]"
        }`}
      >
        {isConfirmed
          ? "Note: This is a requirements summary. No vehicle has been dispatched yet."
          : "Please confirm the details above or ask to change anything."}
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 items-baseline">
      <span className="text-[9px] font-bold text-[#555] uppercase tracking-widest w-14 flex-shrink-0">
        {label}
      </span>
      <span className="text-sm text-[#D0D0D0] flex-1 leading-snug">{value}</span>
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