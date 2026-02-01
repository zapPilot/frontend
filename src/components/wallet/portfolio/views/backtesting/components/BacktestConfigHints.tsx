import type { BacktestStrategyCatalogResponseV3 } from "@/types/backtesting";

export interface BacktestConfigHintsProps {
  catalog: BacktestStrategyCatalogResponseV3 | null;
  pacingPolicies: string[];
}

export function BacktestConfigHints({
  catalog,
  pacingPolicies,
}: BacktestConfigHintsProps) {
  if (!catalog) return null;

  return (
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
  );
}
