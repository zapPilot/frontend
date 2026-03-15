"use client";

import { ArrowRight } from "lucide-react";

import { buildInvestAllocationComparison } from "@/components/wallet/regime/investAllocation";

// --- Helpers ---

const PORTFOLIO_STATE = {
  current: { spot: 0.45, stable: 0.55 },
  target: { spot: 0.7, stable: 0.3 },
} as const;

export function ImpactVisual() {
  const rows = buildInvestAllocationComparison(
    PORTFOLIO_STATE.current,
    PORTFOLIO_STATE.target
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Allocation Impact
        </h4>
        {/* Simple Legend */}
        <div className="flex gap-3 text-[10px] font-medium uppercase tracking-wide">
          {rows.map(row => (
            <div key={row.key} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${row.dotClass}`} />
              <span className="text-gray-600 dark:text-gray-400">
                {row.label}
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
            {rows.map(row => (
              <div
                key={row.key}
                style={{ height: `${row.current * 100}%` }}
                className={row.currentClass}
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
            {rows.map(row => (
              <div
                key={row.key}
                style={{ height: `${row.target * 100}%` }}
                className={row.targetClass}
              >
                <span className="text-[10px] font-bold text-white shadow-sm">
                  {(row.target * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
