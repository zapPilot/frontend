import type {
  BacktestCompareParamsV3,
  BacktestRequest,
} from "@/types/backtesting";

import { getDefaultConfigIdForStrategyId } from "../constants";

type BacktestConfig = Partial<BacktestRequest> & Record<string, unknown>;
type ValueType = string | number | boolean;

function parseJsonObject(json: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function patchBacktestConfig(
  parsedJson: BacktestConfig,
  field: string,
  value: ValueType
): string | null {
  if (!parsedJson) return null;

  // Preserve formatting for numbers while typing (e.g. "10.") by storing as string
  // until it is a clean number again.
  let valueToStore: string | number | boolean = value;

  if (typeof value === "string" && value !== "") {
    const num = Number(value);
    if (!isNaN(num) && String(num) === value) {
      valueToStore = num;
    }
  }

  const updated = { ...parsedJson, [field]: valueToStore };

  // Clean up date fields if switching to days mode
  if (field === "days") {
    delete updated.start_date;
    delete updated.end_date;
  }

  return JSON.stringify(updated, null, 2);
}

/**
 * Parse a numeric field from the JSON editor value string.
 * Returns `fallback` when the JSON is invalid or the key is missing.
 *
 * @param json - Raw JSON string from the editor
 * @param key - Top-level field name to read
 * @param fallback - Default value when parsing fails
 * @returns The numeric value or fallback
 *
 * @example
 * ```ts
 * parseJsonField('{"days": 500}', "days", 365) // => 500
 * parseJsonField('invalid', "days", 365)        // => 365
 * ```
 */
export function parseJsonField(
  json: string,
  key: string,
  fallback: number
): number {
  const parsed = parseJsonObject(json);
  if (!parsed) {
    return fallback;
  }

  const value = parsed[key];
  return typeof value === "number" ? value : fallback;
}

/**
 * Update a single numeric field inside the JSON editor value and return
 * the new JSON string. Preserves all other fields.
 *
 * @param json - Raw JSON string from the editor
 * @param key - Top-level field name to update
 * @param value - New numeric value
 * @returns Updated JSON string, or the original on parse failure
 *
 * @example
 * ```ts
 * updateJsonField('{"days": 500}', "days", 365)
 * // => '{\n  "days": 365\n}'
 * ```
 */
export function updateJsonField(
  json: string,
  key: string,
  value: number
): string {
  const parsed = parseJsonObject(json);
  if (!parsed) {
    return json;
  }

  parsed[key] = value;
  return JSON.stringify(parsed, null, 2);
}

/**
 * Read the `strategy_id` from the first config entry in the JSON editor value.
 * Returns `fallback` when the JSON is invalid or the path is missing.
 *
 * @param json - Raw JSON string from the editor
 * @param fallback - Default strategy id when parsing fails
 * @returns The strategy_id string or fallback
 *
 * @example
 * ```ts
 * parseConfigStrategyId('{"configs":[{"strategy_id":"dma_gated_fgi"}]}', "")
 * // => "dma_gated_fgi"
 * ```
 */
export function parseConfigStrategyId(json: string, fallback: string): string {
  const parsed = parseJsonObject(json);
  if (!parsed) {
    return fallback;
  }

  const configs = parsed["configs"];
  if (!Array.isArray(configs) || configs.length === 0) {
    return fallback;
  }

  const first = configs[0] as Record<string, unknown> | undefined;
  const strategyId = first?.["strategy_id"];
  return typeof strategyId === "string" ? strategyId : fallback;
}

/**
 * Update the `strategy_id`, matching default `config_id`, and optionally
 * `params` on the first config entry in the JSON editor value. Always
 * produces a single config entry.
 *
 * @param json - Raw JSON string from the editor
 * @param strategyId - New strategy_id to set
 * @param defaultParams - Optional default params for the new strategy
 * @returns Updated JSON string, or the original on parse failure
 *
 * @example
 * ```ts
 * updateConfigStrategy('{"configs":[{"config_id":"x","strategy_id":"old"},{"config_id":"y","strategy_id":"other"}]}', "new_strat", { k: 5 })
 * // updates configs[0] to new strategy and discards any additional configs
 * ```
 */
export function updateConfigStrategy(
  json: string,
  strategyId: string,
  defaultParams?: BacktestCompareParamsV3
): string {
  const parsed = parseJsonObject(json);
  if (!parsed) {
    return json;
  }

  const configs = parsed["configs"];
  if (!Array.isArray(configs) || configs.length === 0) {
    return json;
  }

  const first = { ...(configs[0] as Record<string, unknown>) };
  first["config_id"] = getDefaultConfigIdForStrategyId(strategyId);
  first["strategy_id"] = strategyId;
  if (defaultParams !== undefined) {
    first["params"] = defaultParams;
  }

  const updatedConfigs = [first];
  parsed["configs"] = updatedConfigs;
  return JSON.stringify(parsed, null, 2);
}
