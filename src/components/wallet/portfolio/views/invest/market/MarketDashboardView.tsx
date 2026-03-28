"use client";

import { type JSX, useMemo, useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { LoadingState } from "@/components/ui";
import { useMarketDashboardQuery } from "@/hooks/queries/market/useMarketDashboardQuery";
import { REGIME_LABELS } from "@/lib/domain/regimeMapper";
import type { MarketDashboardPoint } from "@/services";

import {
  AXIS_COLOR,
  formatPriceLabel,
  formatXAxisDate,
  getRegimeColor,
  getRegimeLabel,
  REGIME_COLORS,
  type Timeframe,
  TIMEFRAMES,
} from "./sections/marketDashboardConstants";
import { RelativeStrengthSection } from "./sections/RelativeStrengthSection";
import { SimpleStatCard } from "./sections/SimpleStatCard";

type RegimeKey = keyof typeof REGIME_COLORS;

function formatTooltipValue(
  value: string | number | (string | number)[] | undefined,
  name: string | number | undefined,
  props: {
    payload?: {
      sentiment_value?: number | null;
      regime?: string | null;
      ratio?: number | null;
      dma_200?: number | null;
    };
  }
): [string | number, string | number] {
  const labelName = String(name ?? "");
  if (labelName === "BTC Price" || labelName === "200 DMA") {
    return [`$${Number(value ?? 0).toLocaleString()}`, labelName];
  }
  if (labelName === "ETH/BTC Ratio" || labelName === "Ratio 200 DMA") {
    return [Number(value ?? 0).toFixed(4), labelName];
  }
  if (labelName === "Fear & Greed Index") {
    const rawFgi = props.payload?.sentiment_value;
    const regime = props.payload?.regime as
      | keyof typeof REGIME_LABELS
      | undefined;
    const label = regime ? REGIME_LABELS[regime] : "";
    return [`${String(rawFgi)} (${label})`, labelName];
  }
  return [value as string | number, labelName];
}

function renderFgiActiveDot(dotProps: {
  cx?: number | undefined;
  cy?: number | undefined;
  payload?: { regime?: string | null | undefined };
}): JSX.Element {
  const { cx = 0, cy = 0, payload } = dotProps;
  const color = getRegimeColor(payload?.regime, "#10B981");
  return (
    <circle cx={cx} cy={cy} r={6} fill={color} stroke="#fff" strokeWidth={2} />
  );
}

export function MarketDashboardView(): JSX.Element {
  const [timeframe, setTimeframe] = useState<Timeframe>("1Y");
  const activeDays = TIMEFRAMES.find(tf => tf.id === timeframe)?.days ?? 365;
  const { data: dashboardData, isLoading } =
    useMarketDashboardQuery(activeDays);
  const filteredData = useMemo<MarketDashboardPoint[]>(
    () => dashboardData?.snapshots ?? [],
    [dashboardData?.snapshots]
  );

  const regimeBlocks = useMemo(() => {
    if (!filteredData.length) return [];

    const blocks: {
      start: string;
      end: string;
      regime: RegimeKey;
    }[] = [];
    let currentBlock: {
      start: string;
      end: string;
      regime: RegimeKey;
    } | null = null;

    for (const [i, d] of filteredData.entries()) {
      const regime = (d.regime || "n") as RegimeKey;

      if (!currentBlock) {
        currentBlock = { start: d.snapshot_date, end: d.snapshot_date, regime };
      } else if (currentBlock.regime === regime) {
        currentBlock.end = d.snapshot_date;
      } else {
        blocks.push(currentBlock);
        currentBlock = { start: d.snapshot_date, end: d.snapshot_date, regime };
      }

      if (i === filteredData.length - 1) {
        blocks.push(currentBlock);
      }
    }

    return blocks;
  }, [filteredData]);

  const latestPoint = filteredData[filteredData.length - 1];

  if (isLoading) {
    return (
      <LoadingState
        size="lg"
        className="w-full h-[600px] bg-gray-900/50 rounded-xl border border-gray-800"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full h-full p-6 bg-gray-900/50 rounded-xl border border-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Market Overview</h2>
          <p className="text-sm text-gray-400">
            BTC Price, 200 DMA, and Fear & Greed Index
          </p>
        </div>
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              data-testid={`btc-tf-${tf.id}`}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                timeframe === tf.id
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
              }`}
            >
              {tf.id}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-[540px] mt-4 relative">
        {/* Market Sentiment Ribbon Label */}
        <div className="absolute bottom-[68px] left-[72px] z-10">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Market Sentiment Regime
          </span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={filteredData}
            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorFgi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fgiLineGradient" x1="0" y1="0" x2="1" y2="0">
                {filteredData.map((d, i) => {
                  const offset =
                    filteredData.length > 1 ? i / (filteredData.length - 1) : 0;
                  const color = getRegimeColor(d.regime);
                  return (
                    <stop
                      key={i}
                      offset={`${(offset * 100).toFixed(2)}%`}
                      stopColor={color}
                    />
                  );
                })}
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              vertical={false}
            />
            <XAxis
              dataKey="snapshot_date"
              stroke={AXIS_COLOR}
              tick={{ fill: AXIS_COLOR, fontSize: 11 }}
              tickMargin={35}
              minTickGap={40}
              tickFormatter={formatXAxisDate}
            />

            <YAxis
              yAxisId="left"
              stroke={AXIS_COLOR}
              tick={{ fill: AXIS_COLOR, fontSize: 11 }}
              domain={["auto", "auto"]}
              tickFormatter={formatPriceLabel}
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              stroke={AXIS_COLOR}
              tick={{ fill: AXIS_COLOR, fontSize: 11 }}
              domain={[0, 100]}
              tickFormatter={String}
              label={{
                value: "FGI",
                angle: 90,
                position: "insideRight",
                fill: AXIS_COLOR,
                fontSize: 10,
              }}
            />

            <YAxis yAxisId="ribbon" hide={true} domain={[0, 100]} />

            {regimeBlocks.map((block, idx) => (
              <ReferenceArea
                key={`ribbon-${idx}`}
                yAxisId="ribbon"
                x1={block.start}
                x2={block.end}
                y1={0}
                y2={8}
                fill={REGIME_COLORS[block.regime]}
                fillOpacity={0.9}
                stroke="none"
              />
            ))}

            <Tooltip
              contentStyle={{
                backgroundColor: "#111827",
                borderColor: "#374151",
                borderRadius: "12px",
                color: "#fff",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
              }}
              itemStyle={{ color: "#E5E7EB", fontSize: "13px" }}
              labelStyle={{
                color: AXIS_COLOR,
                marginBottom: "8px",
                fontWeight: "bold",
              }}
              cursor={{ stroke: "#4B5563", strokeWidth: 1 }}
              formatter={formatTooltipValue}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{ paddingTop: "0", marginBottom: "20px" }}
            />

            <Line
              yAxisId="left"
              type="monotone"
              name="BTC Price"
              dataKey="price_usd"
              stroke={AXIS_COLOR}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 5,
                fill: AXIS_COLOR,
                strokeWidth: 2,
                stroke: "#fff",
              }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              name="200 DMA"
              dataKey="dma_200"
              stroke="#A855F7"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
              connectNulls
            />
            <Line
              yAxisId="right"
              type="monotone"
              name="Fear & Greed Index"
              dataKey="sentiment_value"
              stroke="url(#fgiLineGradient)"
              strokeWidth={2.5}
              dot={false}
              connectNulls
              activeDot={renderFgiActiveDot}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
        <SimpleStatCard
          label="Current BTC Price"
          value={`$${latestPoint?.price_usd.toLocaleString() ?? "---"}`}
          valueClass="text-white"
        />
        <SimpleStatCard
          label="Current 200 DMA"
          value={`$${latestPoint?.dma_200?.toLocaleString() ?? "---"}`}
          valueClass="text-[#A855F7]"
        />
        <div className="p-5 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:bg-gray-800/60 transition-colors">
          <p className="text-sm font-medium text-gray-400 mb-1">
            Fear & Greed Index
          </p>
          <div className="flex flex-col">
            <p
              className="text-2xl font-bold"
              style={{
                color: getRegimeColor(latestPoint?.regime, "#10B981"),
              }}
            >
              {latestPoint?.sentiment_value ?? "---"} / 100
              {latestPoint?.regime && (
                <span className="text-sm ml-2 font-medium opacity-80">
                  ({getRegimeLabel(latestPoint.regime)})
                </span>
              )}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {Object.entries(REGIME_COLORS).map(([key, color]) => (
                <div
                  key={key}
                  className="flex items-center gap-1"
                  title={REGIME_LABELS[key as keyof typeof REGIME_LABELS]}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[10px] text-gray-500 font-medium uppercase">
                    {key}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <RelativeStrengthSection />
    </div>
  );
}
