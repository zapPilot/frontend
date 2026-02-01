import { Calendar, DollarSign } from "lucide-react";

interface SimpleModeFormProps {
  days: number | undefined;
  totalCapital: number | undefined;
  handleSimpleChange: (field: string, value: string | number) => void;
}

export function SimpleModeForm({
  days,
  totalCapital,
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
    </div>
  );
}
