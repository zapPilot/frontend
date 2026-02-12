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

import { DCA_CLASSIC_STRATEGY_ID } from "../constants";
import { CHART_SIGNALS, getPrimaryStrategyId } from "../utils/chartHelpers";
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
  const primarySeriesId = getPrimaryStrategyId(sortedStrategyIds);

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
            <ChartDefs strategyIds={sortedStrategyIds} prefix={chartIdPrefix} />

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
              tickFormatter={formatDate}
            />

            <YAxis
              domain={yAxisDomain}
              tick={{ fontSize: 10, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCurrencyAxis}
            />

            <YAxis
              yAxisId="priceRight"
              orientation="right"
              tick={{ fontSize: 10, fill: "#f59e0b" }}
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={formatCurrencyAxis}
            />

            <YAxis
              yAxisId="sentimentRight"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#a855f7" }}
              tickLine={false}
              axisLine={false}
              width={48}
              label={{
                value: "Sentiment",
                angle: 90,
                position: "insideRight",
                style: { fontSize: 10, fill: "#a855f7" },
              }}
              tickFormatter={formatSentiment}
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

            {sortedStrategyIds.map((strategyId, index) => (
              <StrategyArea
                key={strategyId}
                strategyId={strategyId}
                index={index}
                isPrimary={strategyId === primarySeriesId}
                prefix={chartIdPrefix}
              />
            ))}

            <Line
              yAxisId="sentimentRight"
              type="monotone"
              dataKey="sentiment"
              name="Sentiment"
              stroke="#a855f7"
              strokeWidth={1}
              dot={false}
              connectNulls={true}
              strokeOpacity={0.4}
              legendType="none"
            />

            <Line
              yAxisId="priceRight"
              type="monotone"
              dataKey="dma_200"
              name="DMA 200"
              stroke="#f59e0b"
              strokeWidth={1.25}
              strokeDasharray="5 3"
              dot={false}
              connectNulls={true}
              legendType="none"
            />

            {CHART_SIGNALS.map(signal => (
              <Scatter
                key={signal.key}
                name={signal.name}
                dataKey={signal.field}
                fill={signal.color}
                shape={signal.shape}
                legendType="none"
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </BaseCard>
  );
}

// --- Sub-components for cleaner render ---

function ChartDefs({
  strategyIds,
  prefix,
}: {
  strategyIds: string[];
  prefix: string;
}) {
  return (
    <defs>
      {strategyIds.map((strategyId, index) => {
        const color = getStrategyColor(strategyId, index);
        return (
          <linearGradient
            key={`gradient-${strategyId}`}
            id={`${prefix}-color-${strategyId}`}
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
  );
}

function StrategyArea({
  strategyId,
  index,
  isPrimary,
  prefix,
}: {
  strategyId: string;
  index: number;
  isPrimary: boolean;
  prefix: string;
}) {
  const color = getStrategyColor(strategyId, index);
  const displayName = getStrategyDisplayName(strategyId);
  const isDcaClassic = strategyId === DCA_CLASSIC_STRATEGY_ID;

  return (
    <Area
      type="monotone"
      dataKey={`${strategyId}_value`}
      name={displayName}
      stroke={color}
      fillOpacity={isPrimary ? 1 : 0}
      fill={isPrimary ? `url(#${prefix}-color-${strategyId})` : "transparent"}
      strokeWidth={2}
      strokeDasharray={isDcaClassic ? "4 4" : undefined}
    />
  );
}

// --- Formatters ---

function formatDate(value: string | number) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
  });
}

function formatCurrencyAxis(value: string | number) {
  return `$${(Number(value) / 1000).toFixed(0)}k`;
}

function formatSentiment(value: number) {
  if (value === 0) return "Fear";
  if (value === 50) return "Neutral";
  if (value === 100) return "Greed";
  return String(value);
}
