"use client";

import type { ReactNode } from "react";

import { BaseCard } from "@/components/ui/BaseCard";
import type { BacktestRequest } from "@/types/backtesting";

const inputClass =
  "w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const inputPlaceholderClass = `${inputClass} placeholder:text-gray-600`;
const labelClass = "text-xs font-medium text-gray-400";

type StrategyId = "smart_dca" | "simple_regime";
type ParamUpdater = <K extends keyof BacktestRequest>(
  key: K,
  value: BacktestRequest[K]
) => void;

function StrategyCheckbox({
  id,
  label,
  defaultChecked,
  params,
  onUpdate,
}: {
  id: StrategyId;
  label: string;
  defaultChecked: boolean;
  params: BacktestRequest;
  onUpdate: ParamUpdater;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
      <input
        type="checkbox"
        checked={params.strategies?.includes(id) ?? defaultChecked}
        onChange={e => {
          const current = params.strategies ?? ["smart_dca"];
          const updated: StrategyId[] = e.target.checked
            ? ([...new Set([...current, id])] as StrategyId[])
            : (current.filter(s => s !== id) as StrategyId[]);
          onUpdate("strategies", updated);
        }}
        className="rounded bg-gray-800 border-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
      />
      {label}
    </label>
  );
}

function LabeledInput({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}

function DateParam({
  id,
  label,
  value,
  onUpdate,
}: {
  id: "start_date" | "end_date";
  label: string;
  value: string | undefined;
  onUpdate: ParamUpdater;
}) {
  return (
    <LabeledInput id={id} label={label}>
      <input
        id={id}
        type="date"
        value={value ?? ""}
        onChange={e => onUpdate(id, e.target.value || undefined)}
        className={inputClass}
      />
    </LabeledInput>
  );
}

function NumberParam({
  id,
  label,
  value,
  min,
  max,
  onUpdate,
}: {
  id: "rebalance_step_count" | "rebalance_interval_days";
  label: string;
  value: number | undefined;
  min: number;
  max: number;
  onUpdate: ParamUpdater;
}) {
  return (
    <LabeledInput id={id} label={label}>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value ?? ""}
        onChange={e =>
          onUpdate(
            id,
            e.target.value ? parseInt(e.target.value, 10) : undefined
          )
        }
        className={inputClass}
      />
    </LabeledInput>
  );
}

export interface BacktestParamFormProps {
  params: BacktestRequest;
  onUpdate: ParamUpdater;
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
          <div className="space-y-2">
            <label className={labelClass}>Strategies to Compare</label>
            <div className="space-y-2">
              <StrategyCheckbox
                id="smart_dca"
                label="Smart DCA (Regime-based with multi-step rebalancing)"
                defaultChecked={true}
                params={params}
                onUpdate={onUpdate}
              />
              <StrategyCheckbox
                id="simple_regime"
                label="Simple Regime (Pattern-based with single-day rebalancing)"
                defaultChecked={false}
                params={params}
                onUpdate={onUpdate}
              />
            </div>
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

          <DateParam
            id="start_date"
            label="Start Date (optional)"
            value={params.start_date}
            onUpdate={onUpdate}
          />

          <DateParam
            id="end_date"
            label="End Date (optional)"
            value={params.end_date}
            onUpdate={onUpdate}
          />

          <NumberParam
            id="rebalance_step_count"
            label="Rebalance Step Count"
            value={1}
            min={1}
            max={50}
            onUpdate={onUpdate}
          />

          <NumberParam
            id="rebalance_interval_days"
            label="Rebalance Interval (days)"
            value={1}
            min={0}
            max={30}
            onUpdate={onUpdate}
          />

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
