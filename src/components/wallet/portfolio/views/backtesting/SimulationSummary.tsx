import { MetricCard } from "./MetricCard";

interface SimulationSummaryProps {
  strategyType: "conservative" | "aggressive";
  useLeverage: boolean;
  dcaFrequency: string;
}

export function SimulationSummary({
  strategyType,
  useLeverage,
  dcaFrequency,
}: SimulationSummaryProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <MetricCard
        label="Total Return"
        value={
          strategyType === "aggressive"
            ? useLeverage
              ? "+412.5%"
              : "+342.5%"
            : "+125.4%"
        }
        subtext="vs +180% Buy & Hold"
        highlight
        showLevBadge={useLeverage}
      />
      <MetricCard
        label="Max Drawdown"
        value={
          strategyType === "aggressive"
            ? useLeverage
              ? "-22.4%"
              : "-18.2%"
            : "-8.5%"
        }
        subtext="vs -75% Buy & Hold"
      />
      <MetricCard
        label="Trades Executed"
        value={
          dcaFrequency === "Daily"
            ? "1,420"
            : dcaFrequency === "Weekly"
              ? "208"
              : "48"
        }
        subtext={`Avg ${dcaFrequency === "Daily" ? "30" : dcaFrequency === "Weekly" ? "4" : "1"} per month`}
      />
    </div>
  );
}
