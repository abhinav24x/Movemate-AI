"use client";

import type { BookingRequirements } from "@/lib/schemas/requirements";
import { formatLocation, hasLocation } from "@/lib/schemas/requirements";

interface RequirementsPanelProps {
  requirements: BookingRequirements;
  status: "collecting" | "ready_for_confirmation" | "confirmed";
}

const fieldIcons: Record<string, React.ReactNode> = {
  Pickup: (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
    </svg>
  ),
  Drop: (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
    </svg>
  ),
  Items: (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 6h-2.18c.07-.44.18-.88.18-1.33C18 2.99 16.67 2 15 2c-.9 0-1.72.4-2.27 1.02L12 4l-.73-.98C10.72 2.4 9.9 2 9 2 7.33 2 6 2.99 6 4.67c0 .45.11.89.18 1.33H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
    </svg>
  ),
  Date: (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
    </svg>
  ),
  Time: (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
    </svg>
  ),
  Vehicle: (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zm-.5 1.5L21.96 12H17V9.5h2.5zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm14 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
    </svg>
  ),
};

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
      value:
        requirements.items.length > 0
          ? requirements.items
              .map((i) => `${i.quantity > 1 ? i.quantity + "× " : ""}${i.name}`)
              .join(", ")
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
    <div className="rounded-2xl neon-card bg-[#050505] backdrop-blur-xl p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#00ff88] to-[#00cc6a]" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#4a9a6a]">
            Trip Details
          </h2>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-28 h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full progress-bar-shimmer"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-[#4a9a6a] tabular-nums font-mono">
            {filledCount}/{fields.length}
          </span>
        </div>
      </div>

      {/* Fields grid */}
      <div className="space-y-1.5">
        {fields.map(({ label, value, filled }) => (
          <div
            key={label}
            className={`flex items-center gap-3 text-sm rounded-xl px-3 py-2.5 transition-all duration-300 ${
              filled
                ? "bg-[#00ff88]/[0.05] border border-[#00ff88]/[0.08]"
                : "opacity-40"
            }`}
          >
            {/* Icon */}
            <span
              className={`flex-shrink-0 transition-colors duration-300 ${
                filled ? "text-[#00ff88]" : "text-[#1a2a1a]"
              }`}
            >
              {fieldIcons[label]}
            </span>

            {/* Label */}
            <span className="text-[#4a9a6a] font-medium flex-shrink-0 w-12 text-xs uppercase tracking-wider">
              {label}
            </span>

            {/* Value */}
            <span
              className={`flex-1 text-right break-words text-sm ${
                filled ? "text-gray-200" : "text-[#1a2a1a]"
              }`}
            >
              {value}
            </span>

            {/* Check / circle */}
            <span
              className={`flex-shrink-0 transition-all duration-300 ${
                filled ? "text-[#00ff88]" : "text-[#111]"
              }`}
            >
              {filled ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4.5-4.5 1.41-1.41L10 13.67l7.09-7.09 1.41 1.41L10 16.5z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" opacity="0.25" />
                </svg>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Special requirements */}
      {requirements.special_requirements && (
        <div className="mt-3 pt-3 border-t border-white/[0.05] flex gap-2">
          <svg className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">Special notes</span>
            <p className="text-xs text-slate-400 mt-0.5">{requirements.special_requirements}</p>
          </div>
        </div>
      )}

      {/* Confirmed badge */}
      {status === "confirmed" && (
        <div className="mt-3 rounded-xl bg-[#001a0d] border border-[#00ff88]/25 px-3 py-2.5 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#00ff88] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4.5-4.5 1.41-1.41L10 13.67l7.09-7.09 1.41 1.41L10 16.5z"/>
          </svg>
          <span className="text-sm text-[#00ff88] font-medium">Requirements confirmed</span>
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