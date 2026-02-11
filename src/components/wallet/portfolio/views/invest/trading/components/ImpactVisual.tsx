"use client";

import { ArrowRight } from "lucide-react";

// --- Helpers ---

const PORTFOLIO_STATE = {
  current: { spot: 0.45, lp: 0.15, stable: 0.4 },
  target: { spot: 0.55, lp: 0.35, stable: 0.1 },
} as const;

const SEGMENTS = [
  {
    key: "spot" as const,
    label: "BTC",
    dotClass: "bg-orange-500",
    currentClass:
      "bg-orange-500/80 w-full relative group/segment flex items-center justify-center transition-all hover:bg-orange-500",
    targetClass:
      "bg-orange-500 w-full relative group/segment flex items-center justify-center",
  },
  {
    key: "lp" as const,
    label: "LP",
    dotClass: "bg-purple-500",
    currentClass:
      "bg-purple-500/80 w-full relative group/segment flex items-center justify-center transition-all hover:bg-purple-500",
    targetClass:
      "bg-purple-500 w-full relative group/segment flex items-center justify-center",
  },
  {
    key: "stable" as const,
    label: "Stable",
    dotClass: "bg-emerald-500",
    currentClass:
      "bg-emerald-500/80 w-full relative group/segment flex items-center justify-center transition-all hover:bg-emerald-500",
    targetClass:
      "bg-emerald-500 w-full relative group/segment flex items-center justify-center",
  },
];

export function ImpactVisual() {
  const { current, target } = PORTFOLIO_STATE;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Allocation Impact
        </h4>
        {/* Simple Legend */}
        <div className="flex gap-3 text-[10px] font-medium uppercase tracking-wide">
          {SEGMENTS.map(seg => (
            <div key={seg.key} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${seg.dotClass}`} />
              <span className="text-gray-600 dark:text-gray-400">
                {seg.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-12 items-end h-40 px-8">
        {/* Current Bar */}
        <div className="w-20 h-full flex flex-col justify-end group">
          <div className="text-[10px] text-center text-gray-400 mb-2 font-medium uppercase">
            Current
          </div>
          <div className="w-full h-full rounded-xl overflow-hidden flex flex-col-reverse shadow-sm opacity-80 ring-1 ring-black/5 dark:ring-white/10">
            {SEGMENTS.map(seg => (
              <div
                key={seg.key}
                style={{ height: `${current[seg.key] * 100}%` }}
                className={seg.currentClass}
              />
            ))}
          </div>
        </div>

        {/* Connector */}
        <div className="flex flex-col items-center justify-center pb-8 opacity-30">
          <ArrowRight className="w-6 h-6 text-gray-400" />
        </div>

        {/* Target Bar */}
        <div className="w-20 h-full flex flex-col justify-end group">
          <div className="text-[10px] text-center text-indigo-500 mb-2 font-bold uppercase">
            Target
          </div>
          <div className="w-full h-full rounded-xl overflow-hidden flex flex-col-reverse shadow-lg ring-2 ring-indigo-500/20">
            {SEGMENTS.map(seg => (
              <div
                key={seg.key}
                style={{ height: `${target[seg.key] * 100}%` }}
                className={seg.targetClass}
              >
                <span className="text-[10px] font-bold text-white shadow-sm">
                  {(target[seg.key] * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
