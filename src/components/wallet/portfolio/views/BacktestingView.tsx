"use client";

import { Activity, Zap } from "lucide-react";
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
import { BacktestConfiguration } from "./backtesting/components/BacktestConfiguration";
import { BacktestMetrics } from "./backtesting/components/BacktestMetrics";
import { useBacktestResult } from "./backtesting/hooks/useBacktestResult";

const backtestRequestSchema = z.object({
  token_symbol: z.string().optional(),
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
      total_capital: parsed.data.total_capital,
      configs,
    };
    /* eslint-disable sonarjs/deprecation */
    if (parsed.data.token_symbol !== undefined)
      request.token_symbol = parsed.data.token_symbol;
    /* eslint-enable sonarjs/deprecation */
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

      <div className="flex flex-col gap-6">
        <div className="w-full">
          <BacktestConfiguration
            editorValue={editorValue}
            onEditorValueChange={val => {
              userEdited.current = true;
              setEditorValue(val);
            }}
            editorError={editorError}
            setEditorError={setEditorError}
            onRun={handleRunBacktest}
            isPending={isPending}
            catalog={catalog}
            onReset={() => {
              const payload = buildDefaultPayload(catalog);
              userEdited.current = false;
              setEditorValue(JSON.stringify(payload, null, 2));
              setEditorError(null);
            }}
          />
        </div>

        <div className="w-full space-y-6">
          {!backtestData ? (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-gray-900/20 border border-dashed border-gray-800 rounded-2xl p-8 text-center text-gray-500">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                <Zap className="relative w-16 h-16 text-gray-700 mb-6" />
              </div>
              <h3 className="text-xl font-medium text-gray-200 mb-2">
                Ready to Compare Strategies
              </h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Click &quot;Run Backtest&quot; to see how the Zap Pilot
                regime-based strategy compares to normal DCA.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <BacktestMetrics
                summary={summary}
                sortedStrategyIds={sortedStrategyIds}
                actualDays={actualDays}
                daysDisplay={daysDisplay}
              />
              <BacktestChart
                chartData={chartData}
                sortedStrategyIds={sortedStrategyIds}
                yAxisDomain={yAxisDomain}
                actualDays={actualDays}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
