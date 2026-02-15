import { Clock, Quote, TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/ui/classNames";

import {
  MOCK_ALLOCATION,
  MOCK_ROUTE,
  MOCK_STRATEGY,
} from "./reviewModalMockData";

function BacktestMetric({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl">
      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div
        className={cn(
          "text-base font-bold font-mono",
          positive ? "text-emerald-400" : "text-red-400"
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function VariationStrategy() {
  const { regime, philosophy, patternReason, pacing, backtest } = MOCK_STRATEGY;
  const pacingPct = pacing.currentStep / pacing.totalSteps;

  return (
    <div className="space-y-5">
      {/* Regime Badge */}
      <div className="flex items-center gap-3">
        <div className="px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/25 flex items-center gap-2">
          <TrendingDown className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-bold text-red-400">{regime.label}</span>
        </div>
        <div className="text-xs text-gray-500 font-medium">
          FGI <span className="text-white font-bold">{regime.fgi}</span>
          <span className="text-gray-600">/100</span>
          <span className="ml-1.5 text-red-400/70">
            · {regime.direction} · {regime.duration_days}d
          </span>
        </div>
      </div>

      {/* Philosophy Quote */}
      <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/5 rounded-2xl">
        <div className="flex gap-3">
          <Quote className="w-5 h-5 text-indigo-400/60 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-indigo-100 italic leading-relaxed">
              &ldquo;{philosophy.quote}&rdquo;
            </p>
            <p className="text-[10px] text-indigo-400/60 mt-1.5 font-medium uppercase tracking-wider">
              — {philosophy.author}
            </p>
          </div>
        </div>
      </div>

      {/* Pattern Reason */}
      <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
          Why Now
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{patternReason}</p>
      </div>

      {/* Pacing Info */}
      <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Pacing
          </div>
          <div className="text-xs text-gray-400">
            Step{" "}
            <span className="text-white font-bold">{pacing.currentStep}</span>{" "}
            of {pacing.totalSteps}
            <span className="text-gray-600 ml-1.5">
              · every {pacing.intervalDays}d
            </span>
          </div>
        </div>
        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${pacingPct * 100}%` }}
          />
        </div>
        <div className="text-[10px] text-gray-500 mt-2">
          Executing{" "}
          <span className="text-indigo-400 font-bold">
            {(pacing.convergencePct * 100).toFixed(0)}%
          </span>{" "}
          of target delta this step
        </div>
      </div>

      {/* Backtesting Proof */}
      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">
          Backtesting · {backtest.period}
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <BacktestMetric label="ROI" value={`+${backtest.roi}%`} positive />
          <BacktestMetric
            label="Sharpe Ratio"
            value={backtest.sharpe.toFixed(2)}
            positive
          />
          <BacktestMetric
            label="Max Drawdown"
            value={`${backtest.maxDrawdown}%`}
            positive={false}
          />
          <BacktestMetric
            label="vs HODL"
            value={`+${backtest.vsHodl}% alpha`}
            positive
          />
        </div>
      </div>
    </div>
  );
}

export function VariationImpact() {
  return (
    <div className="space-y-6">
      {/* Allocation Table */}
      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">
          Allocation Breakdown
        </div>
        <div className="border border-gray-800 rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-2 px-4 py-2.5 bg-gray-900/70 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            <div>Bucket</div>
            <div className="text-right">Current</div>
            <div className="text-right">Target</div>
            <div className="text-right">Change</div>
          </div>
          {/* Table Rows */}
          {MOCK_ALLOCATION.map(row => {
            const change = row.target - row.current;
            return (
              <div
                key={row.bucket}
                className="grid grid-cols-4 gap-2 px-4 py-3 border-t border-gray-800/50 hover:bg-gray-900/30 transition-colors"
              >
                <div className="text-sm font-medium text-white">
                  {row.bucket}
                </div>
                <div className="text-sm text-gray-400 text-right font-mono">
                  {(row.current * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-white text-right font-mono font-medium">
                  {(row.target * 100).toFixed(0)}%
                </div>
                <div
                  className={cn(
                    "text-sm text-right font-mono font-bold",
                    change > 0 ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {change > 0 ? "+" : ""}
                  {(change * 100).toFixed(0)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Net Summary */}
      <div className="p-3.5 bg-gray-900/50 border border-gray-800 rounded-xl flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center shrink-0">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <div className="text-xs font-bold text-white">Pure rebalance</div>
          <div className="text-[10px] text-gray-500">
            No new capital needed · Internal position shifts only
          </div>
        </div>
      </div>
    </div>
  );
}

function getRouteStepDetail(step: (typeof MOCK_ROUTE)[number]): string {
  if ("asset" in step) return step.asset;
  if ("action" in step) return step.action;
  return "";
}

export function VariationRoute() {
  return (
    <div className="space-y-6">
      <div className="relative">
        {/* Connection Line */}
        <div className="absolute left-[23px] top-6 bottom-6 w-px border-l-2 border-dashed border-gray-800" />

        <div className="space-y-6">
          {MOCK_ROUTE.map((step, i) => (
            <div key={i} className="relative flex items-center gap-4">
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 z-10",
                  step.type === "finish"
                    ? "bg-green-500/20 border border-green-500/30 text-green-400 shadow-lg shadow-green-500/10"
                    : "bg-gray-900 border border-gray-800 text-gray-400"
                )}
              >
                <step.icon className="w-6 h-6" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    {step.type}
                  </span>
                  {"duration" in step && step.duration && (
                    <span className="flex items-center gap-1 text-[10px] text-gray-500">
                      <Clock className="w-3 h-3" /> {step.duration}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-sm font-bold text-white">
                    {"chain" in step ? step.chain : step.protocol}
                  </div>
                  <div className="text-sm font-mono text-indigo-400">
                    {getRouteStepDetail(step)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
