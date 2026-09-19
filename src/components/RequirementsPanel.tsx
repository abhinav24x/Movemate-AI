"use client";

import type { BookingRequirements } from "@/lib/schemas/requirements";
import { formatLocation, hasLocation } from "@/lib/schemas/requirements";

interface RequirementsPanelProps {
  requirements: BookingRequirements;
  status: "collecting" | "ready_for_confirmation" | "confirmed";
}

export function RequirementsPanel({ requirements, status }: RequirementsPanelProps) {
  const fields: { label: string; value: string; filled: boolean }[] = [
    {
      label: "Pickup",
      value: formatLocation(requirements.pickup),
      filled: hasLocation(requirements.pickup),
    },
    {
      label: "Drop",
      value: formatLocation(requirements.drop),
      filled: hasLocation(requirements.drop),
    },
    {
      label: "Items",
      value: requirements.items.length > 0
        ? requirements.items.map((i) => `${i.quantity > 1 ? i.quantity + "× " : ""}${i.name}`).join(", ")
        : "—",
      filled: requirements.items.length > 0,
    },
    {
      label: "Date",
      value: requirements.date || "—",
      filled: !!requirements.date,
    },
    {
      label: "Time",
      value: requirements.time || "—",
      filled: !!requirements.time,
    },
    {
      label: "Vehicle",
      value: formatVehicleType(requirements.vehicle_type),
      filled: !!requirements.vehicle_type,
    },
  ];

  const filledCount = fields.filter((f) => f.filled).length;
  const progress = Math.round((filledCount / fields.length) * 100);

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Requirements
        </h2>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 tabular-nums">{filledCount}/{fields.length}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        {fields.map(({ label, value, filled }) => (
          <div
            key={label}
            className={`flex items-start justify-between gap-3 text-sm rounded-lg px-2.5 py-1.5 transition-colors ${
              filled
                ? "bg-slate-700/30"
                : "opacity-50"
            }`}
          >
            <span className="text-slate-400 font-medium flex-shrink-0 w-14">{label}</span>
            <span className={`text-right flex-1 break-words ${
              filled ? "text-slate-200" : "text-slate-600"
            }`}>
              {value}
            </span>
            <span className={`flex-shrink-0 mt-0.5 ${filled ? "text-emerald-400" : "text-slate-700"}`}>
              {filled ? (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" opacity="0.3"/>
                </svg>
              )}
            </span>
          </div>
        ))}
      </div>

      {requirements.special_requirements && (
        <div className="mt-2 pt-2 border-t border-slate-700/50">
          <span className="text-xs text-slate-500">Special: </span>
          <span className="text-xs text-slate-300">{requirements.special_requirements}</span>
        </div>
      )}

      {status === "confirmed" && (
        <div className="mt-3 rounded-lg bg-emerald-900/30 border border-emerald-700/50 px-3 py-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
          <span className="text-sm text-emerald-400 font-medium">Booking requirements confirmed</span>
        </div>
      )}
    </div>
  );
}

function formatVehicleType(vt: string | null): string {
  if (!vt) return "—";
  const map: Record<string, string> = {
    mini_truck: "Mini Truck",
    tempo: "Tempo",
    large_truck: "Large Truck",
    bike: "Bike",
    suitable: "Suitable vehicle",
  };
  return map[vt] ?? vt;
}
