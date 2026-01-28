import { useState } from "react";

import type { AllocationConfig, RegimeAllocation } from "@/types/backtesting";

interface CustomAllocationBuilderProps {
  onAdd: (config: AllocationConfig) => void;
  onCancel: () => void;
}

const REGIMES = [
  { key: "extreme_fear", label: "Extreme Fear" },
  { key: "fear", label: "Fear" },
  { key: "neutral", label: "Neutral" },
  { key: "greed", label: "Greed" },
  { key: "extreme_greed", label: "Extreme Greed" },
] as const;

type RegimeKey = (typeof REGIMES)[number]["key"];

const DEFAULT_ALLOCATION: RegimeAllocation = {
  spot: 33.33,
  lp: 33.33,
  stable: 33.34,
};

type AllocationsMap = Record<RegimeKey, RegimeAllocation>;

function AllocationInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1">
        {label}
      </label>
      <input
        type="number"
        min="0"
        max="100"
        step="0.1"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
      />
    </div>
  );
}

export function CustomAllocationBuilder({
  onAdd,
  onCancel,
}: CustomAllocationBuilderProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [allocations, setAllocations] = useState<AllocationsMap>({
    extreme_fear: { ...DEFAULT_ALLOCATION },
    fear: { ...DEFAULT_ALLOCATION },
    neutral: { ...DEFAULT_ALLOCATION },
    greed: { ...DEFAULT_ALLOCATION },
    extreme_greed: { ...DEFAULT_ALLOCATION },
  });

  const updateAllocation = (
    regime: RegimeKey,
    field: keyof RegimeAllocation,
    value: number
  ) => {
    setAllocations(prev => ({
      ...prev,
      [regime]: {
        ...prev[regime],
        [field]: value,
      },
    }));
  };

  const getTotal = (regime: RegimeKey): number => {
    const alloc = allocations[regime];
    return alloc.spot + alloc.lp + alloc.stable;
  };

  const isValid = (): boolean => {
    if (!name.trim()) return false;
    return REGIMES.every(regime => {
      const total = getTotal(regime.key);
      return Math.abs(total - 100) < 0.01;
    });
  };

  const handleAdd = () => {
    if (!isValid()) return;

    const config: AllocationConfig = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      description: description.trim() || `Custom allocation: ${name}`,
      extreme_fear: allocations.extreme_fear,
      fear: allocations.fear,
      neutral: allocations.neutral,
      greed: allocations.greed,
      extreme_greed: allocations.extreme_greed,
    };

    onAdd(config);
  };

  return (
    <div className="border border-border rounded-lg p-6 bg-card">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Strategy Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., My Custom Strategy"
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Description (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Brief description of your strategy"
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
          />
        </div>

        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Configure allocation percentages for each market regime. Each regime
            must total 100%.
          </p>

          {REGIMES.map(regime => {
            const total = getTotal(regime.key);
            const isRegimeValid = Math.abs(total - 100) < 0.01;
            const alloc = allocations[regime.key];

            return (
              <div key={regime.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">{regime.label}</h4>
                  <span
                    className={`text-sm font-medium ${
                      isRegimeValid ? "text-green-600" : "text-destructive"
                    }`}
                  >
                    Total: {total.toFixed(1)}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <AllocationInput
                    label="Spot %"
                    value={alloc.spot}
                    onChange={v => updateAllocation(regime.key, "spot", v)}
                  />
                  <AllocationInput
                    label="LP %"
                    value={alloc.lp}
                    onChange={v => updateAllocation(regime.key, "lp", v)}
                  />
                  <AllocationInput
                    label="Stable %"
                    value={alloc.stable}
                    onChange={v => updateAllocation(regime.key, "stable", v)}
                  />
                </div>

                <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                  <div
                    className="bg-blue-500"
                    style={{ width: `${(alloc.spot / 100) * 100}%` }}
                  />
                  <div
                    className="bg-purple-500"
                    style={{ width: `${(alloc.lp / 100) * 100}%` }}
                  />
                  <div
                    className="bg-green-500"
                    style={{ width: `${(alloc.stable / 100) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={handleAdd}
            disabled={!isValid()}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Custom Strategy
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-border rounded-md hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
