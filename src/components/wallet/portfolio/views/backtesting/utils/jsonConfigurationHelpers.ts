import type { BacktestRequest } from "@/types/backtesting";

import { SIMPLE_REGIME_STRATEGY_ID } from "../constants";

const BORROWING_FIELDS = new Set([
  "enable_borrowing",
  "borrow_ltv",
  "borrow_apr",
]);

type BacktestConfig = Partial<BacktestRequest> & Record<string, unknown>;
type ValueType = string | number | boolean;

function findRegimeConfig(
  configs: Record<string, unknown>[]
): Record<string, unknown> | undefined {
  return configs.find(c => c["strategy_id"] === SIMPLE_REGIME_STRATEGY_ID);
}

export function patchBacktestConfig(
  parsedJson: BacktestConfig,
  field: string,
  value: ValueType
): string | null {
  if (!parsedJson) return null;

  if (isBorrowingField(field)) {
    return updateBorrowingConfig(parsedJson, field, value);
  }

  return updateStandardConfig(parsedJson, field, value);
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
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const val = parsed[key];
    return typeof val === "number" ? val : fallback;
  } catch {
    return fallback;
  }
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
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    parsed[key] = value;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return json;
  }
}

/**
 * Read a param from the `simple_regime` config inside the JSON editor value.
 *
 * @param json - Raw JSON string from the editor
 * @param param - Parameter name within the regime config's `params` object
 * @param fallback - Default value when the config or param is missing
 * @returns The string param value or fallback
 *
 * @example
 * ```ts
 * parseRegimeParam(editorValue, "signal_provider", "")
 * ```
 */
export function parseRegimeParam(
  json: string,
  param: string,
  fallback: string
): string {
  try {
    const parsed = JSON.parse(json);
    const config = Array.isArray(parsed.configs)
      ? findRegimeConfig(parsed.configs)
      : undefined;
    const params = config?.["params"] as Record<string, unknown> | undefined;
    const val = params?.[param];
    return typeof val === "string" ? val : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Write a param into the `simple_regime` config inside the JSON editor value.
 * An empty string removes the key (lets the backend use its default).
 *
 * @param json - Raw JSON string from the editor
 * @param param - Parameter name within the regime config's `params` object
 * @param value - New value; empty string deletes the key
 * @returns Updated JSON string, or the original on parse failure
 *
 * @example
 * ```ts
 * updateRegimeParam(editorValue, "signal_provider", "fgi")
 * updateRegimeParam(editorValue, "signal_provider", "")  // removes key
 * ```
 */
export function updateRegimeParam(
  json: string,
  param: string,
  value: string
): string {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed.configs)) return json;
    const config = findRegimeConfig(parsed.configs);
    if (!config) return json;
    if (!config["params"]) config["params"] = {};
    const params = config["params"] as Record<string, unknown>;
    if (value) {
      params[param] = value;
    } else {
      config["params"] = Object.fromEntries(
        Object.entries(params).filter(([k]) => k !== param)
      );
    }
    return JSON.stringify(parsed, null, 2);
  } catch {
    return json;
  }
}

function isBorrowingField(field: string): boolean {
  return BORROWING_FIELDS.has(field);
}

function updateBorrowingConfig(
  parsedJson: BacktestConfig,
  field: string,
  value: ValueType
): string {
  const updated = { ...parsedJson };

  if (!Array.isArray(updated.configs)) {
    updated.configs = [];
  }

  // Find or create simple_regime config
  let regimeConfig = updated.configs.find(
    c => c.strategy_id === SIMPLE_REGIME_STRATEGY_ID
  );

  if (!regimeConfig) {
    regimeConfig = {
      config_id: SIMPLE_REGIME_STRATEGY_ID,
      strategy_id: SIMPLE_REGIME_STRATEGY_ID,
      params: {},
    };
    updated.configs.push(regimeConfig);
  }

  if (!regimeConfig.params) {
    regimeConfig.params = {};
  }

  // Convert borrow_apr from percentage to decimal
  const storeValue =
    field === "borrow_apr" && typeof value === "number" ? value / 100 : value;

  regimeConfig.params[field] = storeValue;

  return JSON.stringify(updated, null, 2);
}

function updateStandardConfig(
  parsedJson: BacktestConfig,
  field: string,
  value: ValueType
): string {
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
