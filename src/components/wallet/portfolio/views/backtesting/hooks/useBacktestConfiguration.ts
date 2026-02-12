import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { useBacktestMutation } from "@/hooks/mutations/useBacktestMutation";
import { getBacktestingStrategiesV3 } from "@/services/backtestingService";
import { getStrategyConfigs } from "@/services/strategyService";
import type {
  BacktestRequest,
  BacktestStrategyCatalogResponseV3,
} from "@/types/backtesting";
import type {
  BacktestDefaults,
  StrategyConfigsResponse,
  StrategyPreset,
} from "@/types/strategy";

import {
  DCA_CLASSIC_STRATEGY_ID,
  DEFAULT_DAYS,
  DEFAULT_TOTAL_CAPITAL,
  SIMPLE_REGIME_STRATEGY_ID,
} from "../constants";

const backtestRequestSchema = z.object({
  token_symbol: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  days: z.coerce.number().int().positive().optional(),
  total_capital: z.coerce.number().positive(),
  configs: z
    .array(
      z.object({
        config_id: z.string().min(1),
        strategy_id: z.enum([
          DCA_CLASSIC_STRATEGY_ID,
          SIMPLE_REGIME_STRATEGY_ID,
        ]),
        params: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .min(1),
});

/** Fallback defaults when API response is unavailable. */
const FALLBACK_DEFAULTS: BacktestDefaults = {
  days: DEFAULT_DAYS,
  total_capital: DEFAULT_TOTAL_CAPITAL,
};

/**
 * Build default backtest payload from curated strategy presets.
 * Uses benchmark (baseline) and default (recommended) presets,
 * plus backtest defaults from the API.
 */
function buildDefaultPayloadFromPresets(
  presets: StrategyPreset[],
  defaults: BacktestDefaults
): BacktestRequest {
  const benchmark = presets.find(p => p.is_benchmark);
  const recommended = presets.find(p => p.is_default);

  const configs: BacktestRequest["configs"] = [];

  if (benchmark) {
    configs.push({
      config_id: benchmark.config_id,
      strategy_id: benchmark.strategy_id,
      params: benchmark.params,
    });
  }

  if (recommended && recommended.config_id !== benchmark?.config_id) {
    configs.push({
      config_id: recommended.config_id,
      strategy_id: recommended.strategy_id,
      params: recommended.params,
    });
  }

  // Fallback if neither found
  if (configs.length === 0) {
    configs.push({
      config_id: DCA_CLASSIC_STRATEGY_ID,
      strategy_id: DCA_CLASSIC_STRATEGY_ID,
      params: {},
    });
  }

  return {
    days: defaults.days,
    total_capital: defaults.total_capital,
    configs,
  };
}

/**
 * Legacy fallback: build payload from catalog (used before presets load).
 */
function buildDefaultPayloadFromCatalog(
  catalog: BacktestStrategyCatalogResponseV3 | null,
  defaults: BacktestDefaults = FALLBACK_DEFAULTS
): BacktestRequest {
  const simpleRegime = catalog?.strategies.find(
    s => s.id === SIMPLE_REGIME_STRATEGY_ID
  );
  const recommendedParams = simpleRegime?.recommended_params ?? {};

  return {
    days: defaults.days,
    total_capital: defaults.total_capital,
    configs: [
      {
        config_id: DCA_CLASSIC_STRATEGY_ID,
        strategy_id: DCA_CLASSIC_STRATEGY_ID,
        params: {},
      },
      {
        config_id: SIMPLE_REGIME_STRATEGY_ID,
        strategy_id: SIMPLE_REGIME_STRATEGY_ID,
        params: recommendedParams,
      },
    ],
  };
}

export function useBacktestConfiguration() {
  const {
    mutate,
    data: backtestData,
    isPending,
    error,
  } = useBacktestMutation();

  const [catalog, setCatalog] =
    useState<BacktestStrategyCatalogResponseV3 | null>(null);
  const [strategyConfigs, setStrategyConfigs] =
    useState<StrategyConfigsResponse | null>(null);
  const [editorValue, setEditorValue] = useState<string>(() =>
    JSON.stringify(
      buildDefaultPayloadFromCatalog(null, FALLBACK_DEFAULTS),
      null,
      2
    )
  );
  const [editorError, setEditorError] = useState<string | null>(null);
  const userEdited = useRef(false);

  // Fetch presets (primary) and catalog (fallback) in parallel on mount
  useEffect(() => {
    let cancelled = false;

    const fetchDefaults = async () => {
      const [presetsResult, catalogResult] = await Promise.allSettled([
        getStrategyConfigs(),
        getBacktestingStrategiesV3(),
      ]);
      if (cancelled) return;

      // Always store catalog when available (used for schema validation)
      const catalogData =
        catalogResult.status === "fulfilled" ? catalogResult.value : null;
      if (catalogData) setCatalog(catalogData);

      // Presets take priority for editor defaults
      if (presetsResult.status === "fulfilled") {
        const presets = presetsResult.value;
        setStrategyConfigs(presets);
        if (!userEdited.current && presets.presets.length > 0) {
          const payload = buildDefaultPayloadFromPresets(
            presets.presets,
            presets.backtest_defaults
          );
          setEditorValue(JSON.stringify(payload, null, 2));
          return;
        }
      }

      // Catalog as fallback only when presets unavailable and user hasn't edited
      if (!userEdited.current && catalogData) {
        const payload = buildDefaultPayloadFromCatalog(
          catalogData,
          FALLBACK_DEFAULTS
        );
        setEditorValue(JSON.stringify(payload, null, 2));
      }
    };

    void fetchDefaults();

    return () => {
      cancelled = true;
    };
  }, []);

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

    // Conditional spreads keep only defined properties (exactOptionalPropertyTypes)
    const configs: BacktestRequest["configs"] = parsed.data.configs.map(
      cfg => ({
        config_id: cfg.config_id,
        strategy_id: cfg.strategy_id,
        ...(cfg.params !== undefined && { params: cfg.params }),
      })
    );

    mutate({
      total_capital: parsed.data.total_capital,
      configs,
      ...(parsed.data.token_symbol !== undefined && {
        token_symbol: parsed.data.token_symbol,
      }),
      ...(parsed.data.start_date !== undefined && {
        start_date: parsed.data.start_date,
      }),
      ...(parsed.data.end_date !== undefined && {
        end_date: parsed.data.end_date,
      }),
      ...(parsed.data.days !== undefined && { days: parsed.data.days }),
    });
  };

  const resetConfiguration = () => {
    // Prefer presets if available, otherwise fall back to catalog
    const defaults = strategyConfigs?.backtest_defaults ?? FALLBACK_DEFAULTS;
    const payload =
      strategyConfigs && strategyConfigs.presets.length > 0
        ? buildDefaultPayloadFromPresets(strategyConfigs.presets, defaults)
        : buildDefaultPayloadFromCatalog(catalog, defaults);
    userEdited.current = false;
    setEditorValue(JSON.stringify(payload, null, 2));
    setEditorError(null);
  };

  const updateEditorValue = (val: string) => {
    userEdited.current = true;
    setEditorValue(val);
  };

  return {
    backtestData,
    catalog,
    editorError,
    editorValue,
    error,
    isPending,
    setEditorError,
    handleRunBacktest,
    resetConfiguration,
    updateEditorValue,
  };
}
