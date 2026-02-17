import type { BacktestRequest } from "@/types/backtesting";

import { SIMPLE_REGIME_STRATEGY_ID } from "../constants";

const BORROWING_FIELDS = new Set([
  "enable_borrowing",
  "borrow_ltv",
  "borrow_apr",
]);

type BacktestConfig = Partial<BacktestRequest> & Record<string, unknown>;
type ValueType = string | number | boolean;

function parseJsonValue(json: string): unknown | null {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function parseJsonObject(json: string): Record<string, unknown> | null {
  const parsed = parseJsonValue(json);
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  return parsed as Record<string, unknown>;
}

function findRegimeConfig(
  configs: Record<string, unknown>[]
): Record<string, unknown> | undefined {
  return configs.find(c => c["strategy_id"] === SIMPLE_REGIME_STRATEGY_ID);
}

function parseConfigsArray(json: string): {
  parsed: Record<string, unknown>;
  configs: Record<string, unknown>[];
} | null {
  const parsed = parseJsonObject(json);
  if (!parsed || !Array.isArray(parsed["configs"])) {
    return null;
  }
  return { parsed, configs: parsed["configs"] as Record<string, unknown>[] };
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
  const result = parseConfigsArray(json);
  if (!result) return fallback;

  const config = findRegimeConfig(result.configs);
  const params = config?.["params"] as Record<string, unknown> | undefined;
  const value = params?.[param];
  return typeof value === "string" ? value : fallback;
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
  const result = parseConfigsArray(json);
  if (!result) return json;

  const config = findRegimeConfig(result.configs);
  if (!config) {
    return json;
  }

  if (!config["params"]) {
    config["params"] = {};
  }

  const params = config["params"] as Record<string, unknown>;
  if (value) {
    params[param] = value;
  } else {
    config["params"] = Object.fromEntries(
      Object.entries(params).filter(([key]) => key !== param)
    );
  }

  return JSON.stringify(result.parsed, null, 2);
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
