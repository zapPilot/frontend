"use client";

import { memo, type ReactElement } from "react";
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
import {
  formatChartDate,
  formatCurrencyAxis,
  formatSentiment,
} from "./backtestChartFormatters";
import { BacktestChartLegend } from "./BacktestChartLegend";
import { BacktestTooltip, type BacktestTooltipProps } from "./BacktestTooltip";

const AXIS_DEFAULTS = {
  tickLine: false,
  axisLine: false,
} as const;

function axisTick(fill: string): { fontSize: number; fill: string } {
  return { fontSize: 10, fill };
}

interface ChartDefsProps {
  strategyIds: string[];
  prefix: string;
}

interface StrategyAreaProps {
  strategyId: string;
  index: number;
  isPrimary: boolean;
  prefix: string;
}

function buildBacktestTooltipProps(params: {
  active: boolean | undefined;
  payload:
    | readonly {
        name?: string;
        value?: number;
        color?: string;
        payload?: Record<string, unknown>;
      }[]
    | undefined;
  label: string | number | undefined;
  sortedStrategyIds: string[];
}): BacktestTooltipProps {
  const { active, payload, label, sortedStrategyIds } = params;
  const tooltipProps: BacktestTooltipProps = { sortedStrategyIds };

  if (active !== undefined) {
    tooltipProps.active = active;
  }

  if (payload != null) {
    tooltipProps.payload = Array.from(payload, item => ({ ...item }));
  }

  if (label != null) {
    tooltipProps.label = label;
  }

  return tooltipProps;
}

function getStrokeDasharrayProps(isDcaClassic: boolean): {
  strokeDasharray?: string;
} {
  if (!isDcaClassic) {
    return {};
  }

  return { strokeDasharray: "4 4" };
}

export interface BacktestChartProps {
  chartData: Record<string, unknown>[];
  sortedStrategyIds: string[];
  yAxisDomain: [number, number];
  actualDays: number;
  /** Unique prefix for gradient IDs when multiple charts exist (e.g. scenario id). */
  chartIdPrefix?: string;
}

export const BacktestChart = memo(function BacktestChart({
  chartData,
  sortedStrategyIds,
  yAxisDomain,
  actualDays,
  chartIdPrefix = "default",
}: BacktestChartProps): ReactElement {
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
              tick={axisTick("#6b7280")}
              {...AXIS_DEFAULTS}
              minTickGap={30}
              tickFormatter={formatChartDate}
            />

            <YAxis
              domain={yAxisDomain}
              tick={axisTick("#6b7280")}
              {...AXIS_DEFAULTS}
              tickFormatter={formatCurrencyAxis}
            />

            <YAxis
              yAxisId="priceRight"
              orientation="right"
              tick={axisTick("#f59e0b")}
              {...AXIS_DEFAULTS}
              width={64}
              tickFormatter={formatCurrencyAxis}
            />

            <YAxis
              yAxisId="sentimentRight"
              orientation="right"
              domain={[0, 100]}
              tick={axisTick("#a855f7")}
              {...AXIS_DEFAULTS}
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
                const tooltipProps = buildBacktestTooltipProps({
                  active,
                  payload,
                  label,
                  sortedStrategyIds,
                });

                return <BacktestTooltip {...tooltipProps} />;
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
});

// --- Sub-components for cleaner render ---

function ChartDefs({ strategyIds, prefix }: ChartDefsProps): ReactElement {
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
}: StrategyAreaProps): ReactElement {
  const color = getStrategyColor(strategyId, index);
  const displayName = getStrategyDisplayName(strategyId);
  const isDcaClassic = strategyId === DCA_CLASSIC_STRATEGY_ID;
  const strokeDasharrayProps = getStrokeDasharrayProps(isDcaClassic);

  return (
    <Area
      type="monotone"
      dataKey={`${strategyId}_value`}
      name={displayName}
      stroke={color}
      fillOpacity={isPrimary ? 1 : 0}
      fill={isPrimary ? `url(#${prefix}-color-${strategyId})` : "transparent"}
      strokeWidth={2}
      {...strokeDasharrayProps}
    />
  );
}
