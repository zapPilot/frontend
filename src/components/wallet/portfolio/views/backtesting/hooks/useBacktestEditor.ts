import { useMemo, useState } from "react";

import type {
  BacktestRequest,
  BacktestStrategyCatalogResponseV3,
} from "@/types/backtesting";

import { patchBacktestConfig } from "../utils/jsonConfigurationHelpers";

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

  const parsedJson = useMemo(() => {
    try {
      return JSON.parse(editorValue) as Partial<BacktestRequest> &
        Record<string, unknown>;
    } catch {
      return null;
    }
  }, [editorValue]);

  const isSimpleModeAvailable = useMemo(() => {
    return !!(parsedJson && typeof parsedJson === "object");
  }, [parsedJson]);

  // Derived state for inputs
  const days = parsedJson?.days;
  const totalCapital = parsedJson?.total_capital;

  const { enableBorrowing, borrowLtv, borrowApr } = useMemo(
    () => extractBorrowingSettings(parsedJson),
    [parsedJson]
  );

  const pacingPolicies = useMemo(
    () => extractPacingPolicies(catalog),
    [catalog]
  );

  const handleSimpleChange = (
    field: string,
    value: string | number | boolean
  ) => {
    if (!parsedJson) return;

    const newJsonString = patchBacktestConfig(parsedJson, field, value);
    if (newJsonString) {
      onEditorValueChange(newJsonString);
      setEditorError(null);
    }
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
    enableBorrowing,
    borrowLtv,
    borrowApr,
    pacingPolicies,
    handleSimpleChange,
    handleFormat,
  };
}

// Helper functions to keep the hook clean
function extractBorrowingSettings(
  parsedJson: (Partial<BacktestRequest> & Record<string, unknown>) | null
) {
  if (!parsedJson?.configs)
    return { enableBorrowing: false, borrowLtv: 0.7, borrowApr: 5 };

  const simpleRegimeConfig = parsedJson.configs.find(
    c => c.strategy_id === "simple_regime"
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params = simpleRegimeConfig?.params as Record<string, any> | undefined;

  return {
    enableBorrowing: params?.["enable_borrowing"] ?? false,
    borrowLtv: params?.["borrow_ltv"] ?? 0.7,
    borrowApr: (params?.["borrow_apr"] ?? 0.05) * 100, // Convert to percentage
  };
}

function extractPacingPolicies(
  catalog: BacktestStrategyCatalogResponseV3 | null
) {
  if (!catalog) return [];

  const simpleRegime = catalog.strategies.find(s => s.id === "simple_regime");
  const schema = simpleRegime?.hyperparam_schema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = schema?.["properties"] as Record<string, any> | undefined;
  const pacingPolicy = props?.["pacing_policy"];

  return (pacingPolicy?.["enum"] as string[]) ?? [];
}
