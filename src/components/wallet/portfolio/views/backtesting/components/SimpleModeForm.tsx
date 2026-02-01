import { Calendar, DollarSign, TrendingUp } from "lucide-react";

interface SimpleModeFormProps {
  days: number | undefined;
  totalCapital: number | undefined;
  enableBorrowing?: boolean;
  borrowLtv?: number;
  borrowApr?: number;
  handleSimpleChange: (field: string, value: string | number | boolean) => void;
}

export function SimpleModeForm({
  days,
  totalCapital,
  enableBorrowing = false,
  borrowLtv = 0.7,
  borrowApr = 5,
  handleSimpleChange,
}: SimpleModeFormProps) {
  const daysOptions = [30, 90, 180, 365];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300 min-w-0">
      {/* Time Period */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" />
          Time Period (Days)
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {daysOptions.map(d => (
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
            onChange={e => handleSimpleChange("total_capital", e.target.value)}
            className="w-full bg-gray-950/60 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600/40 transition-all placeholder:text-gray-700"
          />
        </div>
      </div>

      {/* Leverage Settings */}
      <div className="col-span-1 md:col-span-2 space-y-3 border-t border-gray-800/30 pt-4 mt-2">
        <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5" />
          Leverage Settings (Regime Strategy Only)
        </label>

        {/* Enable Borrowing Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Enable Borrowing</span>
          <button
            type="button"
            onClick={() =>
              handleSimpleChange("enable_borrowing", !enableBorrowing)
            }
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              enableBorrowing ? "bg-purple-600" : "bg-gray-700"
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                enableBorrowing ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {enableBorrowing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
            {/* Max LTV */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Max LTV</span>
                <span className="text-gray-300">
                  {Math.round(borrowLtv * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="85"
                step="5"
                value={borrowLtv * 100}
                onChange={e =>
                  handleSimpleChange("borrow_ltv", Number(e.target.value) / 100)
                }
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-gray-600">
                <span>10%</span>
                <span>85%</span>
              </div>
            </div>

            {/* Borrow APR */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Borrow APR (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={borrowApr}
                  onChange={e =>
                    handleSimpleChange("borrow_apr", Number(e.target.value))
                  }
                  className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600/40 transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                  %
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
