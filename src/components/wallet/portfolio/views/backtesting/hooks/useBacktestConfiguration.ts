import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { useBacktestMutation } from "@/hooks/mutations/useBacktestMutation";
import { getBacktestingStrategiesV3 } from "@/services/backtestingService";
import type {
  BacktestRequest,
  BacktestStrategyCatalogResponseV3,
} from "@/types/backtesting";

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

export function useBacktestConfiguration() {
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

  const resetConfiguration = () => {
    const payload = buildDefaultPayload(catalog);
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
    lastSubmittedDays,
    setEditorError,
    handleRunBacktest,
    resetConfiguration,
    updateEditorValue,
  };
}
