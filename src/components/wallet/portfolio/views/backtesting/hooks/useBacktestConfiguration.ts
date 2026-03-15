import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { useBacktestMutation } from "@/hooks/mutations/useBacktestMutation";
import { getBacktestingStrategiesV3 } from "@/services/backtestingService";
import { getStrategyConfigs } from "@/services/strategyService";
import type {
  BacktestRequest,
  BacktestStrategyCatalogResponseV3,
} from "@/types/backtesting";
import type { StrategyConfigsResponse } from "@/types/strategy";

import {
  DCA_CLASSIC_STRATEGY_ID,
  DMA_GATED_FGI_STRATEGY_ID,
} from "../constants";
import {
  buildDefaultPayloadFromCatalog,
  buildDefaultPayloadFromPresets,
  FALLBACK_DEFAULTS,
} from "./backtestConfigurationBuilders";

const backtestParamsSchema = z
  .object({
    cross_cooldown_days: z.coerce.number().int().nonnegative().optional(),
    cross_on_touch: z.boolean().optional(),
    pacing_k: z.coerce.number().optional(),
    pacing_r_max: z.coerce.number().optional(),
    buy_sideways_window_days: z.coerce.number().int().positive().optional(),
    buy_sideways_max_range: z.coerce.number().nonnegative().optional(),
    buy_leg_caps: z.array(z.coerce.number()).optional(),
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
        strategy_id: z.enum([
          DCA_CLASSIC_STRATEGY_ID,
          DMA_GATED_FGI_STRATEGY_ID,
        ]),
        params: backtestParamsSchema.optional(),
      })
    )
    .min(1),
});

type ParsedBacktestRequest = z.infer<typeof backtestRequestSchema>;

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
  const normalized = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined)
  );
  return Object.keys(normalized).length > 0
    ? (normalized as BacktestRequest["configs"][number]["params"])
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
    return { ok: true as const, data: parsed.data };
  }, [parsedEditorPayload]);

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

  return {
    backtestData,
    catalog,
    editorError,
    editorValue,
    error,
    isInitializing,
    isPending,
    setEditorError,
    handleRunBacktest,
    resetConfiguration,
    updateEditorValue,
  };
}
