import { z } from "zod";

import type {
  BacktestRequest,
  BacktestStrategyCatalogResponseV3,
} from "@/types/backtesting";

// ── Zod Schemas ──────────────────────────────────────────────────────

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

export const backtestRequestSchema = z.object({
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

export type ParsedBacktestRequest = z.infer<typeof backtestRequestSchema>;

// ── Validation & Normalization ───────────────────────────────────────

/**
 * When the catalog has strategy entries, require each config's `strategy_id`
 * to appear in that list (backend source of truth). Skip when the catalog is
 * missing or empty so presets/backends can still run without a populated list.
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

export function formatValidationError(error: z.ZodError): string {
  return error.issues
    .map(issue => `${issue.path.join(".") || "payload"}: ${issue.message}`)
    .join("\n");
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

export function normalizeParams(
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
