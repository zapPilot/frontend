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
  getStrategyColor,
  getStrategyDisplayName,
} from "../utils/strategyDisplay";
import { BacktestChartLegend } from "./BacktestChartLegend";
import { BacktestTooltip, type BacktestTooltipProps } from "./BacktestTooltip";

export interface BacktestChartProps {
  chartData: Record<string, unknown>[];
  sortedStrategyIds: string[];
  yAxisDomain: [number, number];
  actualDays: number;
  /** Unique prefix for gradient IDs when multiple charts exist (e.g. scenario id). */
  chartIdPrefix?: string;
}

export function BacktestChart({
  chartData,
  sortedStrategyIds,
  yAxisDomain,
  actualDays,
  chartIdPrefix = "default",
}: BacktestChartProps) {
  const gradientId = (s: string) => `${chartIdPrefix}-color-${s}`;
  const primarySeriesId =
    sortedStrategyIds.find(id => id !== "dca_classic") ??
    sortedStrategyIds[0] ??
    null;
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
        <BacktestChartLegend sortedStrategyIds={sortedStrategyIds} />
      </div>

      <div className="flex-1 w-full pt-4 pr-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <defs>
              {sortedStrategyIds.map((strategyId, index) => {
                const color = getStrategyColor(strategyId, index);
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
              domain={[0, 100]}
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
                if (value === 0) return "Fear";
                if (value === 50) return "Neutral";
                if (value === 100) return "Greed";
                return String(value);
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

            {sortedStrategyIds.map((strategyId, index) => {
              const color = getStrategyColor(strategyId, index);
              const displayName = getStrategyDisplayName(strategyId);
              const isDcaClassic = strategyId === "dca_classic";
              const isPrimary =
                primarySeriesId != null && strategyId === primarySeriesId;

              return (
                <Area
                  key={strategyId}
                  type="monotone"
                  dataKey={`${strategyId}_value`}
                  name={displayName}
                  stroke={color}
                  fillOpacity={isPrimary ? 1 : 0}
                  fill={
                    isPrimary
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
              strokeWidth={1}
              dot={false}
              connectNulls={true}
              strokeOpacity={0.4}
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
            {/* Borrowing events */}
            <Scatter
              name="Borrow"
              dataKey="borrowSignal"
              fill="#a855f7"
              shape="triangle"
              legendType="none"
            />
            <Scatter
              name="Repay"
              dataKey="repaySignal"
              fill="#06b6d4"
              shape="diamond"
              legendType="none"
            />
            <Scatter
              name="Liquidation"
              dataKey="liquidateSignal"
              fill="#dc2626"
              shape="cross"
              legendType="none"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </BaseCard>
  );
}
