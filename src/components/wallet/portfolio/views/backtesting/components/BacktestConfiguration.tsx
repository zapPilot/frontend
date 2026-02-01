"use client";

import { AlertCircle, Play, RefreshCw } from "lucide-react";

import { BaseCard } from "@/components/ui/BaseCard";
import type { BacktestStrategyCatalogResponseV3 } from "@/types/backtesting";

import { useBacktestEditor } from "../hooks/useBacktestEditor";
import { BacktestConfigurationHeader } from "./BacktestConfigurationHeader";
import { JsonModeEditor } from "./JsonModeEditor";
import { SimpleModeForm } from "./SimpleModeForm";

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
  const {
    mode,
    setMode,
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
  } = useBacktestEditor({
    editorValue,
    onEditorValueChange,
    setEditorError,
    catalog,
  });

  return (
    <BaseCard
      variant="glass"
      className="overflow-hidden flex flex-col w-full shadow-xl shadow-black/20 min-w-0"
    >
      <BacktestConfigurationHeader
        mode={mode}
        setMode={setMode}
        isSimpleModeAvailable={isSimpleModeAvailable}
      />

      <div className="p-5 bg-gray-900/10 min-w-0">
        {mode === "simple" && isSimpleModeAvailable ? (
          <SimpleModeForm
            days={days}
            totalCapital={totalCapital}
            enableBorrowing={enableBorrowing}
            borrowLtv={borrowLtv}
            borrowApr={borrowApr}
            handleSimpleChange={handleSimpleChange}
          />
        ) : (
          <JsonModeEditor
            editorValue={editorValue}
            onEditorValueChange={onEditorValueChange}
            setEditorError={setEditorError}
            handleFormat={handleFormat}
            onReset={onReset}
          />
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
