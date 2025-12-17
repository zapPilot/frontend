"use client";

import type { AllocationBreakdown } from "@/types/domain/transaction";

interface StrategySliderProps {
  value: number;
  onChange: (value: number) => void;
  currentAllocation: AllocationBreakdown;
  targetAllocation: AllocationBreakdown;
  previewAllocation: AllocationBreakdown;
}

const PRESETS = [0, 25, 50, 75, 100] as const;

export function StrategySlider({
  value,
  onChange,
  currentAllocation,
  targetAllocation,
  previewAllocation,
}: StrategySliderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Strategy Intensity
        </div>
        <span className="text-sm font-semibold text-white">{value}%</span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        aria-label="Strategy intensity slider"
        data-testid="strategy-slider"
        onChange={event => onChange(Number(event.target.value))}
        className="w-full accent-purple-500"
      />

      <div className="flex flex-wrap gap-2">
        {PRESETS.map(preset => (
          <button
            key={preset}
            type="button"
            data-testid={`preset-${preset}`}
            onClick={() => onChange(preset)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
              value === preset
                ? "border-purple-500/60 bg-purple-500/10 text-white"
                : "border-gray-800 bg-gray-900/60 text-gray-300 hover:border-purple-500/40 hover:text-white"
            }`}
          >
            {preset}%
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs text-gray-400">
        <AllocationCard
          title="Current"
          stable={currentAllocation.stable}
          crypto={currentAllocation.crypto}
          tone="muted"
        />
        <AllocationCard
          title="Preview"
          stable={previewAllocation.stable}
          crypto={previewAllocation.crypto}
          tone="primary"
        />
        <AllocationCard
          title="Target"
          stable={targetAllocation.stable}
          crypto={targetAllocation.crypto}
          tone="success"
        />
      </div>
    </div>
  );
}

interface AllocationCardProps {
  title: string;
  stable: number;
  crypto: number;
  tone: "muted" | "primary" | "success";
}

function AllocationCard({ title, stable, crypto, tone }: AllocationCardProps) {
  const toneClass =
    tone === "primary"
      ? "border-purple-500/40 bg-purple-500/5 text-purple-100"
      : tone === "success"
        ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-100"
        : "border-gray-800 bg-gray-900/60 text-gray-300";

  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <div className="text-[11px] font-semibold uppercase tracking-widest">
        {title}
      </div>
      <div className="mt-1 flex items-center justify-between text-white">
        <span className="text-[13px] font-semibold text-emerald-300">
          Stable {stable.toFixed(1)}%
        </span>
        <span className="text-[13px] font-semibold text-purple-200">
          Crypto {crypto.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
