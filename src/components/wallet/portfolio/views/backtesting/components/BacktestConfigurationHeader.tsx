import { Code, Settings2 } from "lucide-react";

interface BacktestConfigurationHeaderProps {
  mode: "simple" | "json";
  setMode: (mode: "simple" | "json") => void;
  isSimpleModeAvailable: boolean;
}

export function BacktestConfigurationHeader({
  mode,
  setMode,
  isSimpleModeAvailable,
}: BacktestConfigurationHeaderProps) {
  return (
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
  );
}
