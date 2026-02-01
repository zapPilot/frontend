import { useMemo, useState } from "react";

import type { BacktestStrategyCatalogResponseV3 } from "@/types/backtesting";

interface UseBacktestEditorProps {
  editorValue: string;
  onEditorValueChange: (value: string) => void;
  setEditorError: (error: string | null) => void;
  catalog: BacktestStrategyCatalogResponseV3 | null;
}

export function useBacktestEditor({
  editorValue,
  onEditorValueChange,
  setEditorError,
  catalog,
}: UseBacktestEditorProps) {
  const [mode, setMode] = useState<"simple" | "json">("simple");

  // Parse JSON to populate simple mode fields
  const parsedJson = useMemo(() => {
    try {
      return JSON.parse(editorValue);
    } catch {
      return null;
    }
  }, [editorValue]);

  // Check if we can safely use simple mode
  const isSimpleModeAvailable = useMemo(() => {
    return !!(parsedJson && typeof parsedJson === "object");
  }, [parsedJson]);

  // Derived state for inputs
  const days = parsedJson?.days;
  const totalCapital = parsedJson?.total_capital;

  // Borrowing-related state - extract from first simple_regime config
  const simpleRegimeConfig = parsedJson?.configs?.find(
    (c: { strategy_id?: string }) => c.strategy_id === "simple_regime"
  );
  const enableBorrowing = simpleRegimeConfig?.params?.enable_borrowing ?? false;
  const borrowLtv = simpleRegimeConfig?.params?.borrow_ltv ?? 0.7;
  const borrowApr = (simpleRegimeConfig?.params?.borrow_apr ?? 0.05) * 100; // Convert to percentage

  // Extraction of pacing policies for hints
  const pacingPolicies = useMemo(() => {
    const simpleRegime = catalog?.strategies.find(
      s => s.id === "simple_regime"
    );
    const schema = simpleRegime?.hyperparam_schema as
      | Record<string, unknown>
      | undefined;
    const props = schema?.["properties"] as Record<string, unknown> | undefined;
    const pacingPolicy = props?.["pacing_policy"] as
      | Record<string, unknown>
      | undefined;
    return (pacingPolicy?.["enum"] as string[] | undefined) ?? [];
  }, [catalog]);

  const handleSimpleChange = (
    field: string,
    value: string | number | boolean
  ) => {
    if (!parsedJson) return;

    // Borrowing fields go into the simple_regime config's params
    const borrowingFields = ["enable_borrowing", "borrow_ltv", "borrow_apr"];
    if (borrowingFields.includes(field)) {
      const updated = { ...parsedJson };

      // Ensure configs array exists
      if (!updated.configs || !Array.isArray(updated.configs)) {
        updated.configs = [];
      }

      const configs = updated.configs as {
        strategy_id: string;
        params?: Record<string, unknown>;
      }[];

      // Find or create simple_regime config
      let regimeConfig = configs.find(c => c.strategy_id === "simple_regime");
      if (!regimeConfig) {
        // Create the simple_regime config if it doesn't exist
        regimeConfig = {
          strategy_id: "simple_regime",
          params: {},
        };
        configs.push(regimeConfig);
      }

      // Ensure params object exists
      if (!regimeConfig.params) {
        regimeConfig.params = {};
      }

      // Convert borrow_apr from percentage to decimal
      const storeValue =
        field === "borrow_apr" && typeof value === "number"
          ? value / 100
          : value;
      regimeConfig.params[field] = storeValue;

      onEditorValueChange(JSON.stringify(updated, null, 2));
      setEditorError(null);
      return;
    }

    // Preserve formatting for numbers while typing (e.g. "10.") by storing as string
    // until it is a clean number again.
    let valueToStore: string | number | boolean = value;
    if (typeof value === "string" && value !== "") {
      const num = Number(value);
      if (!isNaN(num) && String(num) === value) {
        valueToStore = num;
      }
    }

    // Allow empty strings to be set in the state
    const updated = { ...parsedJson, [field]: valueToStore };
    if (field === "days") {
      delete updated.start_date;
      delete updated.end_date;
    }

    onEditorValueChange(JSON.stringify(updated, null, 2));
    setEditorError(null);
  };

  const handleFormat = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(editorValue), null, 2);
      onEditorValueChange(formatted);
      setEditorError(null);
    } catch {
      setEditorError("Invalid JSON: unable to format.");
    }
  };

  return {
    mode,
    setMode,
    parsedJson,
    isSimpleModeAvailable,
    days,
    totalCapital,
    // Borrowing settings
    enableBorrowing,
    borrowLtv,
    borrowApr,
    pacingPolicies,
    handleSimpleChange,
    handleFormat,
  };
}
