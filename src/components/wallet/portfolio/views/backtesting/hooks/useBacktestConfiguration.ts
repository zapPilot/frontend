import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { useBacktestMutation } from "@/hooks/mutations/useBacktestMutation";
import { getBacktestingStrategiesV3, getStrategyConfigs } from "@/services";
import type {
  BacktestRequest,
  BacktestStrategyCatalogResponseV3,
} from "@/types/backtesting";
import type { StrategyConfigsResponse } from "@/types/strategy";

import { DEFAULT_DAYS, DMA_GATED_FGI_STRATEGY_ID } from "../constants";
import {
  parseConfigStrategyId,
  parseJsonField,
} from "../utils/jsonConfigurationHelpers";
import {
  buildDefaultPayloadFromCatalog,
  buildDefaultPayloadFromPresets,
  FALLBACK_DEFAULTS,
} from "./backtestConfigurationBuilders";

const signalParamsSchema = z
  .object({
    cross_cooldown_days: z.coerce.number().int().nonnegative().optional(),
    cross_on_touch: z.boolean().optional(),
  })
  .extend({
    rotation_neutral_band: z.coerce.number().nonnegative().optional(),
    rotation_max_deviation: z.coerce.number().positive().optional(),
  })
  .strict();

const pacingParamsSchema = z
  .object({
    k: z.coerce.number().optional(),
    r_max: z.coerce.number().optional(),
  })
  .strict();

const buyGateParamsSchema = z
  .object({
    window_days: z.coerce.number().int().positive().optional(),
    sideways_max_range: z.coerce.number().nonnegative().optional(),
    leg_caps: z.array(z.coerce.number()).optional(),
  })
  .strict();

const nullablePositiveInt = z
  .union([z.coerce.number().int().positive(), z.null()])
  .optional();

const tradeQuotaParamsSchema = z
  .object({
    min_trade_interval_days: nullablePositiveInt,
    max_trades_7d: nullablePositiveInt,
    max_trades_30d: nullablePositiveInt,
  })
  .strict();

const rotationParamsSchema = z
  .object({
    drift_threshold: z.coerce.number().nonnegative().optional(),
    cooldown_days: z.coerce.number().int().nonnegative().optional(),
  })
  .strict();

const backtestParamsSchema = z
  .object({
    signal: signalParamsSchema.optional(),
    pacing: pacingParamsSchema.optional(),
    buy_gate: buyGateParamsSchema.optional(),
    trade_quota: tradeQuotaParamsSchema.optional(),
    rotation: rotationParamsSchema.optional(),
  })
  .strict();

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
        strategy_id: z.string().min(1),
        params: backtestParamsSchema.optional(),
      })
    )
    .min(1),
});

type ParsedBacktestRequest = z.infer<typeof backtestRequestSchema>;

/**
 * When the catalog has strategy entries, require each config's `strategy_id`
 * to appear in that list (backend source of truth). Skip when the catalog is
 * missing or empty so presets/backends can still run without a populated list.
 *
 * Exported for unit tests.
 */
export function validateConfigsStrategyIdsAgainstCatalog(
  configs: { strategy_id: string }[],
  catalog: BacktestStrategyCatalogResponseV3 | null
): string | null {
  if (!catalog?.strategies?.length) {
    return null;
  }
  const allowed = new Set(catalog.strategies.map(entry => entry.strategy_id));
  for (let index = 0; index < configs.length; index += 1) {
    const config = configs[index];
    if (!config) {
      continue;
    }
    const strategyId = config.strategy_id;
    if (!allowed.has(strategyId)) {
      const options = [...allowed]
        .sort((left, right) => left.localeCompare(right))
        .join('", "');
      return `configs.${index}.strategy_id: Unknown strategy "${strategyId}". Expected one of "${options}"`;
    }
  }
  return null;
}

function formatValidationError(error: z.ZodError): string {
  return error.issues
    .map(issue => `${issue.path.join(".") || "payload"}: ${issue.message}`)
    .join("\n");
}

function normalizeParams(
  params: ParsedBacktestRequest["configs"][number]["params"]
): BacktestRequest["configs"][number]["params"] {
  if (!params) {
    return undefined;
  }
  const normalized = pruneUndefinedDeep(params);
  return normalized !== undefined
    ? (normalized as BacktestRequest["configs"][number]["params"])
    : undefined;
}

function pruneUndefinedDeep(value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || Array.isArray(value)) {
    return value;
  }
  if (typeof value !== "object") {
    return value;
  }

  const normalizedEntries = Object.entries(value).flatMap(
    ([key, entryValue]) => {
      const normalizedEntry = pruneUndefinedDeep(entryValue);
      return normalizedEntry === undefined ? [] : [[key, normalizedEntry]];
    }
  );

  return normalizedEntries.length > 0
    ? Object.fromEntries(normalizedEntries)
    : undefined;
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
  const [defaultsReady, setDefaultsReady] = useState(false);
  const [initialRunSettled, setInitialRunSettled] = useState(false);
  const userEdited = useRef(false);
  const initialRunStarted = useRef(false);

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
          setDefaultsReady(true);
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

      setDefaultsReady(true);
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

  const submitBacktest = useCallback(
    (
      parsedData: ParsedBacktestRequest,
      options?: Parameters<typeof mutate>[1]
    ) => {
      const configs: BacktestRequest["configs"] = parsedData.configs.map(
        cfg => {
          const params = normalizeParams(cfg.params);
          return {
            config_id: cfg.config_id,
            strategy_id: cfg.strategy_id,
            ...(params !== undefined && { params }),
          };
        }
      );

      const request: BacktestRequest = {
        total_capital: parsedData.total_capital,
        configs,
        ...(parsedData.token_symbol !== undefined && {
          token_symbol: parsedData.token_symbol,
        }),
        ...(parsedData.start_date !== undefined && {
          start_date: parsedData.start_date,
        }),
        ...(parsedData.end_date !== undefined && {
          end_date: parsedData.end_date,
        }),
        ...(parsedData.days !== undefined && { days: parsedData.days }),
      };

      if (options) {
        mutate(request, options);
      } else {
        mutate(request);
      }
    },
    [mutate]
  );

  const validatePayload = useCallback(() => {
    if (!parsedEditorPayload) {
      return { ok: false as const, error: "Invalid JSON: unable to parse." };
    }
    const parsed = backtestRequestSchema.safeParse(parsedEditorPayload);
    if (!parsed.success) {
      return {
        ok: false as const,
        error: formatValidationError(parsed.error),
      };
    }
    const catalogError = validateConfigsStrategyIdsAgainstCatalog(
      parsed.data.configs,
      catalog
    );
    if (catalogError) {
      return { ok: false as const, error: catalogError };
    }
    return { ok: true as const, data: parsed.data };
  }, [parsedEditorPayload, catalog]);

  const handleRunBacktest = () => {
    const result = validatePayload();
    if (!result.ok) {
      setEditorError(result.error);
      return;
    }
    setEditorError(null);
    submitBacktest(result.data);
  };

  useEffect(() => {
    if (!defaultsReady || initialRunStarted.current) {
      return;
    }

    const result = validatePayload();
    if (!result.ok) {
      setEditorError(result.error);
      setInitialRunSettled(true);
      return;
    }

    initialRunStarted.current = true;
    setEditorError(null);
    submitBacktest(result.data, {
      onSettled: () => {
        setInitialRunSettled(true);
      },
    });
  }, [defaultsReady, validatePayload, submitBacktest]);

  const isInitializing =
    !initialRunSettled && !backtestData && !error && !editorError;

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

  // Compute display values from the editor JSON
  const days = parseJsonField(editorValue, "days", DEFAULT_DAYS);
  const selectedStrategyId = parseConfigStrategyId(
    editorValue,
    DMA_GATED_FGI_STRATEGY_ID
  );

  const strategyOptions = useMemo(() => {
    if (!catalog?.strategies?.length) {
      return [{ value: selectedStrategyId, label: selectedStrategyId }];
    }
    return catalog.strategies.map(s => ({
      value: s.strategy_id,
      label: s.display_name,
    }));
  }, [catalog, selectedStrategyId]);

  return {
    backtestData,
    catalog,
    days,
    editorError,
    editorValue,
    error,
    isInitializing,
    isPending,
    selectedStrategyId,
    setEditorError,
    strategyOptions,
    handleRunBacktest,
    resetConfiguration,
    updateEditorValue,
  };
}
