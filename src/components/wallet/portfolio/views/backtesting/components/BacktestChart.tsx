"use client";

import {
    Area,
    CartesianGrid,
    ComposedChart,
    Line,
    ResponsiveContainer,
    Scatter,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { BaseCard } from "@/components/ui/BaseCard";

import {
  BacktestTooltip,
  type BacktestTooltipProps,
} from "./BacktestTooltip";

export interface BacktestChartProps {
  chartData: Record<string, unknown>[];
  sortedStrategyIds: string[];
  yAxisDomain: [number, number];
  actualDays: number;
  getStrategyDisplayName: (id: string) => string;
  getStrategyColor: (id: string) => string;
  /** Unique prefix for gradient IDs when multiple charts exist (e.g. scenario id). */
  chartIdPrefix?: string;
}

export function BacktestChart({
  chartData,
  sortedStrategyIds,
  yAxisDomain,
  actualDays,
  getStrategyDisplayName,
  getStrategyColor,
  chartIdPrefix = "default",
}: BacktestChartProps) {
  const gradientId = (s: string) => `${chartIdPrefix}-color-${s}`;
  return (
    <BaseCard
      variant="glass"
      className="p-1 h-[500px] relative overflow-hidden flex flex-col"
    >
      <div className="p-4 border-b border-gray-800/50 bg-gray-900/30 flex justify-between items-center">
        <div className="text-sm font-medium text-white flex items-center gap-2">
          Portfolio Value Growth
          <span className="text-xs font-normal text-gray-500">
            ({actualDays} Days)
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {sortedStrategyIds.map(strategyId => {
            const displayName = getStrategyDisplayName(strategyId);
            const color = getStrategyColor(strategyId);
            return (
              <div
                key={strategyId}
                className="flex items-center gap-1.5 text-[10px] text-gray-400"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {displayName}
              </div>
            );
          })}
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            Sentiment
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Buy Spot
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            Sell Spot
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <div className="w-2 h-2 rounded-full bg-cyan-500" />
            Buy LP
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <div className="w-2 h-2 rounded-full bg-fuchsia-500" />
            Sell LP
          </div>
        </div>
      </div>

      <div className="flex-1 w-full pt-4 pr-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <defs>
              {sortedStrategyIds.map(strategyId => {
                const color = getStrategyColor(strategyId);
                return (
                  <linearGradient
                    key={`gradient-${strategyId}`}
                    id={gradientId(strategyId)}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
              tickFormatter={value =>
                new Date(value as string).toLocaleDateString(undefined, {
                  month: "short",
                  year: "2-digit",
                })
              }
            />
            <YAxis
              domain={yAxisDomain}
              tick={{ fontSize: 10, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={value => `$${(Number(value) / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 4]}
              tick={{ fontSize: 10, fill: "#a855f7" }}
              tickLine={false}
              axisLine={false}
              label={{
                value: "Sentiment",
                angle: 90,
                position: "insideRight",
                style: { fontSize: 10, fill: "#a855f7" },
              }}
              tickFormatter={(value: number) => {
                const labels = [
                  "Extreme Fear",
                  "Fear",
                  "Neutral",
                  "Greed",
                  "Extreme Greed",
                ];
                return labels[value] ?? String(value);
              }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                const props: BacktestTooltipProps = {
                  active,
                  sortedStrategyIds,
                };
                if (payload != null)
                  props.payload = [...payload] as NonNullable<
                    BacktestTooltipProps["payload"]
                  >;
                if (label != null) props.label = label;
                return <BacktestTooltip {...props} />;
              }}
            />

            {sortedStrategyIds.map(strategyId => {
              const color = getStrategyColor(strategyId);
              const displayName = getStrategyDisplayName(strategyId);
              const isMainStrategy = strategyId === "smart_dca";
              const isDcaClassic = strategyId === "dca_classic";

              return (
                <Area
                  key={strategyId}
                  type="monotone"
                  dataKey={`${strategyId}_value`}
                  name={displayName}
                  stroke={color}
                  fillOpacity={isMainStrategy ? 1 : 0}
                  fill={
                    isMainStrategy
                      ? `url(#${gradientId(strategyId)})`
                      : "transparent"
                  }
                  strokeWidth={2}
                  strokeDasharray={isDcaClassic ? "4 4" : undefined}
                />
              );
            })}

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="sentiment"
              name="Sentiment"
              stroke="#a855f7"
              strokeWidth={2}
              dot={false}
              connectNulls={true}
              strokeOpacity={0.8}
            />

            <Scatter
              name="Buy Spot"
              dataKey="buySpotSignal"
              fill="#22c55e"
              shape="circle"
              legendType="none"
            />
            <Scatter
              name="Sell Spot"
              dataKey="sellSpotSignal"
              fill="#ef4444"
              shape="circle"
              legendType="none"
            />
            <Scatter
              name="Buy LP"
              dataKey="buyLpSignal"
              fill="#3b82f6"
              shape="circle"
              legendType="none"
            />
            <Scatter
              name="Sell LP"
              dataKey="sellLpSignal"
              fill="#d946ef"
              shape="circle"
              legendType="none"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </BaseCard>
  );
}
