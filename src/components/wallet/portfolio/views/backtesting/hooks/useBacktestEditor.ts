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

  const handleSimpleChange = (field: string, value: string | number) => {
    if (!parsedJson) return;

    // Preserve formatting for numbers while typing (e.g. "10.") by storing as string
    // until it is a clean number again.
    let valueToStore = value;
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
    pacingPolicies,
    handleSimpleChange,
    handleFormat,
  };
}
