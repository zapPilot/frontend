"use client";

import { CheckCircle } from "lucide-react";

import { BaseCard } from "@/components/ui/BaseCard";
import type { AllocationConfig, RegimeAllocation } from "@/types/backtesting";

import { CustomAllocationBuilder } from "../CustomAllocationBuilder";
import { PRESET_ALLOCATIONS } from "../presetAllocations";

const REGIMES = [
  "extreme_fear",
  "fear",
  "greed",
  "extreme_greed",
] as const;

export interface AllocationConfigSelectorProps {
  allocationConfigs: AllocationConfig[] | undefined;
  onToggle: (config: AllocationConfig) => void;
  onAddCustom: (config: AllocationConfig) => void;
  showCustomBuilder: boolean;
  onShowCustomBuilder: (show: boolean) => void;
}

export function AllocationConfigSelector({
  allocationConfigs,
  onToggle,
  onAddCustom,
  showCustomBuilder,
  onShowCustomBuilder,
}: AllocationConfigSelectorProps) {
  return (
    <BaseCard variant="glass" className="p-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400">
          Allocation Strategies to Test
        </label>
        <p className="text-[10px] text-gray-500 mb-3">
          Select one or more allocation configurations to compare performance.
          Each configuration defines target spot/LP/stable percentages for
          different market regimes.
        </p>
        {allocationConfigs && allocationConfigs.length > 5 && (
          <div className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-400">
            <strong>Note:</strong> More than 5 configurations may reduce chart
            readability.
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESET_ALLOCATIONS.map(config => {
            const isSelected =
              allocationConfigs?.some(c => c.id === config.id) ?? false;
            return (
              <button
                key={config.id}
                type="button"
                onClick={() => onToggle(config)}
                className={`p-4 rounded-lg text-left transition-all ${
                  isSelected
                    ? "bg-blue-600/20 border-2 border-blue-500"
                    : "bg-gray-900/50 border border-gray-800 hover:bg-gray-800 hover:border-gray-700"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-white">
                    {config.name}
                  </h4>
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {config.description}
                </p>

                <div className="mt-3 space-y-1">
                  {REGIMES.map(regime => {
                    const allocation = config[regime] as RegimeAllocation;
                    return (
                      <div key={regime} className="text-[9px]">
                        <div className="text-gray-500 mb-0.5 capitalize">
                          {regime.replace(/_/g, " ")}
                        </div>
                        <div className="flex h-1.5 rounded overflow-hidden">
                          <div
                            className="bg-blue-400"
                            style={{ width: `${allocation.spot}%` }}
                          />
                          <div
                            className="bg-cyan-400"
                            style={{ width: `${allocation.lp}%` }}
                          />
                          <div
                            className="bg-gray-400"
                            style={{ width: `${allocation.stable}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-400" />
            Spot
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-cyan-400" />
            LP
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-400" />
            Stable
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-800">
          {!showCustomBuilder ? (
            <button
              type="button"
              onClick={() => onShowCustomBuilder(true)}
              className="w-full px-4 py-3 bg-blue-600/20 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors text-sm text-blue-400 font-medium"
            >
              + Create Custom Allocation Strategy
            </button>
          ) : (
            <CustomAllocationBuilder
              onAdd={config => {
                onAddCustom(config);
                onShowCustomBuilder(false);
              }}
              onCancel={() => onShowCustomBuilder(false)}
            />
          )}
        </div>
      </div>
    </BaseCard>
  );
}
