import type { BacktestRequest } from "@/types/backtesting";

const BORROWING_FIELDS = [
  "enable_borrowing",
  "borrow_ltv",
  "borrow_apr",
] as const;

type BacktestConfig = Partial<BacktestRequest> & Record<string, unknown>;
type ValueType = string | number | boolean;

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

function isBorrowingField(field: string): boolean {
  return (BORROWING_FIELDS as readonly string[]).includes(field);
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
    c => c.strategy_id === "simple_regime"
  );

  if (!regimeConfig) {
    regimeConfig = {
      config_id: "simple_regime",
      strategy_id: "simple_regime",
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
