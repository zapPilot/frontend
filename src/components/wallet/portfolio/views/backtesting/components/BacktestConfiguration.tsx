"use client";

import {
  AlertCircle,
  Calendar,
  Code,
  DollarSign,
  Play,
  RefreshCw,
  Settings2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { BaseCard } from "@/components/ui/BaseCard";
import type { BacktestStrategyCatalogResponseV3 } from "@/types/backtesting";

interface BacktestConfigurationProps {
  editorValue: string;
  onEditorValueChange: (value: string) => void;
  editorError: string | null;
  setEditorError: (error: string | null) => void;
  onRun: () => void;
  isPending: boolean;
  catalog: BacktestStrategyCatalogResponseV3 | null;
  onReset: () => void;
}

export function BacktestConfiguration({
  editorValue,
  onEditorValueChange,
  editorError,
  setEditorError,
  onRun,
  isPending,
  catalog,
  onReset,
}: BacktestConfigurationProps) {
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

  return (
    <BaseCard
      variant="glass"
      className="overflow-hidden flex flex-col w-full shadow-xl shadow-black/20 min-w-0"
    >
      {/* Header with Mode Toggle - using wording from tests */}
      <div className="p-4 border-b border-gray-800/50 bg-gray-900/30 flex flex-wrap items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Settings2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <h3 className="text-sm font-semibold text-gray-200 truncate">
            Request Payload (v3)
          </h3>
        </div>

        <div className="flex bg-gray-950/50 rounded-lg p-1 border border-gray-800/50 flex-shrink-0">
          <button
            type="button"
            onClick={() => setMode("simple")}
            disabled={!isSimpleModeAvailable}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              mode === "simple"
                ? "bg-blue-600/20 text-blue-400 shadow-sm border border-blue-500/20"
                : "text-gray-500 hover:text-gray-300"
            } ${!isSimpleModeAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Settings2 className="w-3 h-3" />
            <span className="hidden xs:inline">Simple</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("json")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              mode === "json"
                ? "bg-purple-600/20 text-purple-400 shadow-sm border border-purple-500/20"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Code className="w-3 h-3" />
            <span className="hidden xs:inline">JSON</span>
          </button>
        </div>
      </div>

      <div className="p-5 bg-gray-900/10 min-w-0">
        {mode === "simple" && isSimpleModeAvailable ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300 min-w-0">
            {/* Time Period */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Time Period (Days)
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {[30, 90, 180, 365].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleSimpleChange("days", d)}
                    className={`px-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                      days === d
                        ? "bg-blue-600/20 border-blue-500/30 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                        : "bg-gray-950/60 border-gray-800 text-gray-400 hover:border-gray-700 hover:bg-gray-900"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
              <div className="relative mt-2">
                <input
                  type="number"
                  value={days ?? ""}
                  onChange={e => handleSimpleChange("days", e.target.value)}
                  className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/40 transition-all placeholder:text-gray-700"
                  placeholder="Custom days..."
                />
              </div>
            </div>

            {/* Capital */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5" />
                Initial Capital
              </label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors pointer-events-none">
                  <DollarSign className="w-3.5 h-3.5" />
                </span>
                <input
                  type="number"
                  value={totalCapital ?? ""}
                  onChange={e =>
                    handleSimpleChange("total_capital", e.target.value)
                  }
                  className="w-full bg-gray-950/60 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/40 transition-all placeholder:text-gray-700"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col min-h-[400px] animate-in fade-in duration-300 min-w-0">
            <div className="flex justify-end gap-2 mb-3 flex-wrap">
              <button
                type="button"
                onClick={handleFormat}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md text-xs font-medium transition-colors border border-gray-700"
              >
                Format
              </button>
              <button
                type="button"
                onClick={onReset}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md text-xs font-medium transition-colors border border-gray-700"
              >
                Reset Default
              </button>
            </div>
            <textarea
              value={editorValue}
              onChange={e => {
                onEditorValueChange(e.target.value);
                setEditorError(null);
              }}
              spellCheck={false}
              className="w-full flex-1 min-h-[300px] font-mono text-xs leading-relaxed bg-gray-950/60 border border-gray-800 rounded-xl p-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600/40 resize-none"
            />
          </div>
        )}

        {/* editorError is now a sibling of hints and mode containers for test compatibility */}
        {editorError && (
          <div className="mt-3 flex items-start gap-2 text-xs text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="whitespace-pre-wrap">{editorError}</span>
          </div>
        )}

        {/* Hints Section - restoring for test compatibility and user guidance */}
        {catalog && (
          <div className="mt-3 text-xs text-gray-500 space-y-1 border-t border-gray-800/30 pt-3">
            <div>
              <span className="text-gray-400 font-medium">
                Available strategy_id:
              </span>{" "}
              {catalog.strategies.map(s => s.id).join(", ")}
            </div>
            {pacingPolicies.length > 0 && (
              <div>
                <span className="text-gray-400 font-medium">
                  Available pacing_policy:
                </span>{" "}
                {pacingPolicies.join(", ")}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-800/50 bg-gray-900/30 flex-shrink-0">
        <button
          onClick={onRun}
          disabled={isPending}
          className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
        >
          {isPending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
              Run Backtest
            </>
          )}
        </button>
      </div>
    </BaseCard>
  );
}
