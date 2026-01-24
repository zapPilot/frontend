"use client";

import { BaseCard } from "@/components/ui/BaseCard";
import type { BacktestRequest } from "@/types/backtesting";

const inputClass =
  "w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const inputPlaceholderClass = `${inputClass} placeholder:text-gray-600`;
const labelClass = "text-xs font-medium text-gray-400";

export interface BacktestParamFormProps {
  params: BacktestRequest;
  onUpdate: <K extends keyof BacktestRequest>(
    key: K,
    value: BacktestRequest[K]
  ) => void;
  onReset: () => void;
}

export function BacktestParamForm({
  params,
  onUpdate,
  onReset,
}: BacktestParamFormProps) {
  return (
    <BaseCard variant="glass" className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white">
            Backtest Parameters
          </h3>
          <button
            onClick={onReset}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Reset to Defaults
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label htmlFor="token_symbol" className={labelClass}>
              Token Symbol
            </label>
            <select
              id="token_symbol"
              value={params.token_symbol}
              onChange={e => onUpdate("token_symbol", e.target.value)}
              className={inputClass}
            >
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
              <option value="USDC">USDC</option>
              <option value="USDT">USDT</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="total_capital" className={labelClass}>
              Total Capital ($)
            </label>
            <input
              id="total_capital"
              type="number"
              min={1}
              step={100}
              value={params.total_capital}
              onChange={e =>
                onUpdate("total_capital", parseFloat(e.target.value) || 0)
              }
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="days" className={labelClass}>
              Days (optional)
            </label>
            <input
              id="days"
              type="number"
              min={1}
              max={1000}
              value={params.days ?? ""}
              onChange={e =>
                onUpdate(
                  "days",
                  e.target.value ? parseInt(e.target.value, 10) : undefined
                )
              }
              placeholder="Leave empty for date range"
              className={inputPlaceholderClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="start_date" className={labelClass}>
              Start Date (optional)
            </label>
            <input
              id="start_date"
              type="date"
              value={params.start_date ?? ""}
              onChange={e =>
                onUpdate("start_date", e.target.value || undefined)
              }
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="end_date" className={labelClass}>
              End Date (optional)
            </label>
            <input
              id="end_date"
              type="date"
              value={params.end_date ?? ""}
              onChange={e => onUpdate("end_date", e.target.value || undefined)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="rebalance_step_count" className={labelClass}>
              Rebalance Step Count
            </label>
            <input
              id="rebalance_step_count"
              type="number"
              min={1}
              max={50}
              value={params.rebalance_step_count ?? ""}
              onChange={e =>
                onUpdate(
                  "rebalance_step_count",
                  e.target.value ? parseInt(e.target.value, 10) : undefined
                )
              }
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="rebalance_interval_days" className={labelClass}>
              Rebalance Interval (days)
            </label>
            <input
              id="rebalance_interval_days"
              type="number"
              min={0}
              max={30}
              value={params.rebalance_interval_days ?? ""}
              onChange={e => {
                const value = e.target.value;
                onUpdate(
                  "rebalance_interval_days",
                  value === "" ? undefined : parseInt(value, 10)
                );
              }}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="drift_threshold" className={labelClass}>
              Drift Threshold
            </label>
            <input
              id="drift_threshold"
              type="number"
              min={0.01}
              max={1}
              step={0.01}
              value={params.drift_threshold ?? ""}
              onChange={e => {
                const value = e.target.value;
                onUpdate(
                  "drift_threshold",
                  value === "" ? undefined : Number(value)
                );
              }}
              className={inputClass}
            />
            <p className="text-[10px] text-gray-500">
              Minimum portfolio drift required to trigger a rebalance. Example:
              0.05 = 5%.
            </p>
          </div>
        </div>
      </div>
    </BaseCard>
  );
}
