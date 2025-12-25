/**
 * Field Normalization Utilities
 * Generic utilities for safely extracting fields from dynamic API responses
 */

export function pickStringField(
  record: Record<string, unknown>,
  keys: readonly string[]
): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }
  return undefined;
}

export const COMMON_FIELD_KEYS = {
  symbol: ["symbol", "tokenSymbol", "token_symbol"] as const,
  name: ["name", "tokenName", "token_name"] as const,
  address: ["address", "tokenAddress", "token_address"] as const,
  usdValue: ["usdValue", "usd_value", "fiatValue"] as const,
} as const;
