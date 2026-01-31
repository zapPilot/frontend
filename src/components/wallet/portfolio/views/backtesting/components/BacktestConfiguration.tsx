"use client";

import {
  AlertCircle,
  Calendar,
  Code,
  Coins,
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
    if (!parsedJson || typeof parsedJson !== "object") return false;
    return true;
  }, [parsedJson]);

  // Derived state for inputs
  const tokenSymbol = parsedJson?.token_symbol || "BTC";
  const days = parsedJson?.days || 90;
  const totalCapital = parsedJson?.total_capital || 10000;

  const handleSimpleChange = (field: string, value: string | number) => {
    if (!parsedJson) return;

    const updated = { ...parsedJson, [field]: value };
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
      className="overflow-hidden flex flex-col h-full shadow-xl shadow-black/20 min-w-0"
    >
      {/* Header with Mode Toggle */}
      <div className="p-4 border-b border-gray-800/50 bg-gray-900/30 flex flex-wrap items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Settings2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <h3 className="text-sm font-semibold text-gray-200 truncate">
            Configuration
          </h3>
        </div>

        <div className="flex bg-gray-950/50 rounded-lg p-1 border border-gray-800/50 flex-shrink-0">
          <button
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

      <div className="p-5 space-y-6 flex-1 bg-gray-900/10 min-w-0 overflow-y-auto">
        {mode === "simple" && isSimpleModeAvailable ? (
          <div className="space-y-5 animate-in fade-in duration-300 min-w-0">
            {/* Token Symbol */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
                <Coins className="w-3.5 h-3.5" />
                Token Symbol
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={tokenSymbol}
                  onChange={e =>
                    handleSimpleChange(
                      "token_symbol",
                      e.target.value.toUpperCase()
                    )
                  }
                  className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/40 transition-all placeholder:text-gray-700"
                  placeholder="e.g. BTC"
                />
              </div>
            </div>

            {/* Time Period */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Time Period (Days)
              </label>
              <div className="grid grid-cols-2 xs:grid-cols-4 gap-2">
                {[30, 90, 180, 365].map(d => (
                  <button
                    key={d}
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
                  value={days}
                  onChange={e =>
                    handleSimpleChange("days", parseInt(e.target.value) || 0)
                  }
                  className="w-full bg-gray-950/60 border border-gray-800 rounded-lg pl-4 pr-24 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/40 transition-all placeholder:text-gray-700"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none truncate max-w-[80px]">
                  Custom Days
                </span>
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
                  value={totalCapital}
                  onChange={e =>
                    handleSimpleChange(
                      "total_capital",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full bg-gray-950/60 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/40 transition-all placeholder:text-gray-700"
                />
              </div>
            </div>

            {/* Strategy Info */}
            <div className="pt-2">
              <div className="text-xs text-gray-500 bg-gray-900/30 rounded-lg p-3 border border-gray-800/50">
                <span className="font-medium text-gray-400">
                  Included Strategies:
                </span>{" "}
                <div className="mt-1 flex flex-wrap gap-1">
                  {parsedJson?.configs?.map((c: any) => (
                    <span
                      key={c.strategy_id}
                      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-800 text-gray-300"
                    >
                      {c.strategy_id}
                    </span>
                  )) || "None"}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full animate-in fade-in duration-300 min-w-0">
            <div className="flex justify-end gap-2 mb-3 flex-wrap">
              <button
                onClick={handleFormat}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md text-xs font-medium transition-colors border border-gray-700"
              >
                Format
              </button>
              <button
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
            {editorError && (
              <div className="mt-3 flex items-start gap-2 text-xs text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="whitespace-pre-wrap">{editorError}</span>
              </div>
            )}

            {catalog && (
              <div className="mt-3 text-[10px] text-gray-500">
                Catalog v{catalog.catalog_version} loaded.
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
