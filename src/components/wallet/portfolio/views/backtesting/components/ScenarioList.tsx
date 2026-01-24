"use client";

import { Plus, Trash2 } from "lucide-react";

import { BaseCard } from "@/components/ui/BaseCard";
import type { BacktestRequest } from "@/types/backtesting";
import type { Scenario } from "../hooks/useBacktestScenarios";

export interface ScenarioListProps {
  scenarios: Scenario[];
  currentRequest: BacktestRequest;
  runStatus: "idle" | "running" | "done";
  onAdd: (request: BacktestRequest) => void;
  onRemove: (id: string) => void;
  onRunAll: () => void;
}

export function ScenarioList({
  scenarios,
  currentRequest,
  runStatus,
  onAdd,
  onRemove,
  onRunAll,
}: ScenarioListProps) {
  return (
    <BaseCard variant="glass" className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            Scenarios
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onAdd(currentRequest)}
              className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add scenario
            </button>
            <button
              type="button"
              onClick={onRunAll}
              disabled={scenarios.length === 0 || runStatus === "running"}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
            >
              {runStatus === "running" ? "Running…" : "Run all"}
            </button>
          </div>
        </div>
        <p className="text-[10px] text-gray-500">
          Add scenarios with different param sets, then Run all to compare
          multiple backtests.
        </p>
        {scenarios.length > 0 ? (
          <ul className="space-y-2">
            {scenarios.map(s => (
              <li
                key={s.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-900/50 border border-gray-800"
              >
                <span className="text-sm text-gray-300 truncate">
                  {s.label}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(s.id)}
                  className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  aria-label={`Remove ${s.label}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-500 py-2">
            No scenarios yet. Add one from current params above.
          </p>
        )}
      </div>
    </BaseCard>
  );
}
