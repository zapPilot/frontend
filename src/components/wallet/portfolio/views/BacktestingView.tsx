"use client";

import { Activity, Play, RefreshCw, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { BaseCard } from "@/components/ui/BaseCard";
import { useBacktestMutation } from "@/hooks/mutations/useBacktestMutation";
import { getBacktestingStrategiesV3 } from "@/services/backtestingService";
import type {
  BacktestRequest,
  BacktestStrategyCatalogResponseV3,
} from "@/types/backtesting";

import { BacktestChart } from "./backtesting/components/BacktestChart";
import { BacktestMetrics } from "./backtesting/components/BacktestMetrics";
import { useBacktestResult } from "./backtesting/hooks/useBacktestResult";
import {
  getStrategyColor,
  getStrategyDisplayName,
} from "./backtesting/utils/strategyDisplay";

const backtestRequestSchema = z.object({
  token_symbol: z.string().min(1),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  days: z.number().int().positive().optional(),
  total_capital: z.number().positive(),
  configs: z
    .array(
      z.object({
        config_id: z.string().min(1),
        strategy_id: z.enum(["dca_classic", "simple_regime"]),
        params: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .min(1),
});

function buildDefaultPayload(
  catalog: BacktestStrategyCatalogResponseV3 | null
): BacktestRequest {
  const simpleRegime = catalog?.strategies.find(s => s.id === "simple_regime");
  const recommendedParams = simpleRegime?.recommended_params ?? {};

  return {
    token_symbol: "BTC",
    days: 90,
    total_capital: 10000,
    configs: [
      {
        config_id: "dca_classic",
        strategy_id: "dca_classic",
        params: {},
      },
      {
        config_id: "simple_regime",
        strategy_id: "simple_regime",
        params: recommendedParams,
      },
    ],
  };
}

export function BacktestingView() {
  const {
    mutate,
    data: backtestData,
    isPending,
    error,
  } = useBacktestMutation();
  const [catalog, setCatalog] =
    useState<BacktestStrategyCatalogResponseV3 | null>(null);
  const [editorValue, setEditorValue] = useState<string>(() =>
    JSON.stringify(buildDefaultPayload(null), null, 2)
  );
  const [editorError, setEditorError] = useState<string | null>(null);
  const [lastSubmittedDays, setLastSubmittedDays] = useState<
    number | undefined
  >(90);
  const userEdited = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const fetchCatalog = async () => {
      try {
        const result = await getBacktestingStrategiesV3();
        if (cancelled) return;
        setCatalog(result);
        if (!userEdited.current) {
          const payload = buildDefaultPayload(result);
          setEditorValue(JSON.stringify(payload, null, 2));
        }
      } catch {
        // Catalog is optional; the editor can still work without it.
      }
    };

    void fetchCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  const {
    chartData,
    yAxisDomain,
    summary,
    sortedStrategyIds,
    actualDays,
    daysDisplay,
  } = useBacktestResult(backtestData ?? null, lastSubmittedDays);

  const parsedEditorPayload = useMemo(() => {
    try {
      return JSON.parse(editorValue) as unknown;
    } catch {
      return null;
    }
  }, [editorValue]);

  const pacingPolicies = useMemo(() => {
    const simpleRegime = catalog?.strategies.find(
      s => s.id === "simple_regime"
    );
    const schema = simpleRegime?.hyperparam_schema as
      | Record<string, unknown>
      | undefined;
    const props = schema?.["properties"] as Record<string, unknown> | undefined;
    const pacingPolicy = props?.["pacing_policy"] as
      | Record<string, unknown>
      | undefined;
    return (pacingPolicy?.["enum"] as string[] | undefined) ?? [];
  }, [catalog]);

  const handleRunBacktest = () => {
    if (!parsedEditorPayload) {
      setEditorError("Invalid JSON: unable to parse.");
      return;
    }

    const parsed = backtestRequestSchema.safeParse(parsedEditorPayload);
    if (!parsed.success) {
      setEditorError(
        parsed.error.issues
          .map(
            issue => `${issue.path.join(".") || "payload"}: ${issue.message}`
          )
          .join("\n")
      );
      return;
    }

    setEditorError(null);
    setLastSubmittedDays(parsed.data.days);

    // Build request with only defined optional properties (exactOptionalPropertyTypes)
    const configs: BacktestRequest["configs"] = parsed.data.configs.map(cfg => {
      const config: BacktestRequest["configs"][number] = {
        config_id: cfg.config_id,
        strategy_id: cfg.strategy_id,
      };
      if (cfg.params !== undefined) config.params = cfg.params;
      return config;
    });

    const request: BacktestRequest = {
      token_symbol: parsed.data.token_symbol,
      total_capital: parsed.data.total_capital,
      configs,
    };
    if (parsed.data.start_date !== undefined)
      request.start_date = parsed.data.start_date;
    if (parsed.data.end_date !== undefined)
      request.end_date = parsed.data.end_date;
    if (parsed.data.days !== undefined) request.days = parsed.data.days;

    mutate(request);
  };

  useEffect(() => {
    handleRunBacktest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showSingleResults = backtestData != null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            DCA Strategy Comparison
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Compare Normal DCA vs Regime-Based Strategy performance
          </p>
        </div>
        <button
          onClick={handleRunBacktest}
          disabled={isPending}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group"
        >
          {isPending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
              Run Backtest
            </>
          )}
        </button>
      </div>

      {error && (
        <BaseCard
          variant="glass"
          className="p-4 bg-red-500/5 border-red-500/20"
        >
          <div className="text-sm text-red-400">
            {error instanceof Error ? error.message : "Failed to run backtest"}
          </div>
        </BaseCard>
      )}

      <BaseCard variant="glass" className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <div className="text-sm font-medium text-white">
              Request Payload (v3)
            </div>
            <div className="text-xs text-gray-500">
              Edit the full JSON payload (globals + configs[]).{" "}
              {catalog?.catalog_version ? (
                <>Catalog v{catalog.catalog_version}</>
              ) : (
                <>Catalog unavailable</>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                try {
                  const formatted = JSON.stringify(
                    JSON.parse(editorValue),
                    null,
                    2
                  );
                  setEditorValue(formatted);
                  setEditorError(null);
                } catch {
                  setEditorError("Invalid JSON: unable to format.");
                }
              }}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg text-xs font-medium transition-colors"
            >
              Format
            </button>
            <button
              type="button"
              onClick={() => {
                const payload = buildDefaultPayload(catalog);
                userEdited.current = false;
                setEditorValue(JSON.stringify(payload, null, 2));
                setEditorError(null);
              }}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg text-xs font-medium transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        <textarea
          value={editorValue}
          onChange={e => {
            userEdited.current = true;
            setEditorValue(e.target.value);
          }}
          spellCheck={false}
          className="w-full min-h-[220px] font-mono text-xs leading-relaxed bg-gray-950/40 border border-gray-800 rounded-xl p-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/40"
        />

        {editorError && (
          <div className="mt-3 text-xs text-red-400 whitespace-pre-wrap">
            {editorError}
          </div>
        )}

        {catalog && (
          <div className="mt-3 text-xs text-gray-500 space-y-1">
            <div>
              <span className="text-gray-400 font-medium">
                Available strategy_id:
              </span>{" "}
              {catalog.strategies.map(s => s.id).join(", ")}
            </div>
            {pacingPolicies.length > 0 && (
              <div>
                <span className="text-gray-400 font-medium">
                  Available pacing_policy:
                </span>{" "}
                {pacingPolicies.join(", ")}
              </div>
            )}
          </div>
        )}
      </BaseCard>

      {!backtestData && (
        <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-gray-900/20 border border-dashed border-gray-800 rounded-2xl p-8 text-center text-gray-500">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
            <Zap className="relative w-16 h-16 text-gray-700 mb-6" />
          </div>
          <h3 className="text-xl font-medium text-gray-200 mb-2">
            Ready to Compare Strategies
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Click &quot;Run Backtest&quot; to see how the Zap Pilot regime-based
            strategy compares to normal DCA over the last 90 days.
          </p>
        </div>
      )}

      {showSingleResults && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          <BacktestMetrics
            summary={summary}
            sortedStrategyIds={sortedStrategyIds}
            actualDays={actualDays}
            daysDisplay={daysDisplay}
            getStrategyDisplayName={getStrategyDisplayName}
            getStrategyColor={getStrategyColor}
          />
          <BacktestChart
            chartData={chartData}
            sortedStrategyIds={sortedStrategyIds}
            yAxisDomain={yAxisDomain}
            actualDays={actualDays}
            getStrategyDisplayName={getStrategyDisplayName}
            getStrategyColor={getStrategyColor}
          />
        </div>
      )}
    </div>
  );
}
