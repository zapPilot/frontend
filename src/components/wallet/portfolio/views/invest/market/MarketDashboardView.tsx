"use client";

import { useEffect, useMemo, useState } from "react";
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

import {
  getMarketDashboardData,
  type MarketDashboardPoint,
} from "@/services/analyticsService";

// Regime colors
const REGIME_COLORS = {
  ef: "#ef4444", // Extreme Fear - Red
  f: "#f97316", // Fear - Orange
  n: "#eab308", // Neutral - Yellow
  g: "#84cc16", // Greed - Lime
  eg: "#22c55e", // Extreme Greed - Green
};

const REGIME_LABELS = {
  ef: "Extreme Fear",
  f: "Fear",
  n: "Neutral",
  g: "Greed",
  eg: "Extreme Greed",
};

const TIMEFRAMES = [
  { id: "1W", days: 7, label: "1W" },
  { id: "1M", days: 30, label: "1M" },
  { id: "3M", days: 90, label: "3M" },
  { id: "1Y", days: 365, label: "1Y" },
  { id: "ALL", days: 365, label: "ALL" },
] as const;

type Timeframe = (typeof TIMEFRAMES)[number]["id"];

export function MarketDashboardView() {
  const [timeframe, setTimeframe] = useState<Timeframe>("1Y");
  const [data, setData] = useState<MarketDashboardPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await getMarketDashboardData(365);
        setData(res.snapshots);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch market dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchData();
  }, []);

  const filteredData = useMemo(() => {
    const days = TIMEFRAMES.find(tf => tf.id === timeframe)?.days || 30;
    return data.slice(-days);
  }, [data, timeframe]);

  const regimeBlocks = useMemo(() => {
    if (!filteredData.length) return [];

    const blocks: {
      start: string;
      end: string;
      regime: keyof typeof REGIME_COLORS;
    }[] = [];
    let currentBlock: {
      start: string;
      end: string;
      regime: keyof typeof REGIME_COLORS;
    } | null = null;

    for (const [i, d] of filteredData.entries()) {
      const regime = (d.regime || "n") as keyof typeof REGIME_COLORS;

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

  const latestPoint = data[data.length - 1];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-[600px] bg-gray-900/50 rounded-xl border border-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
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
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                timeframe === tf.id
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
              }`}
            >
              {tf.label}
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
              {/* Dynamic horizontal gradient for FGI line coloring by regime */}
              <linearGradient id="fgiLineGradient" x1="0" y1="0" x2="1" y2="0">
                {filteredData.map((d, i) => {
                  const offset =
                    filteredData.length > 1 ? i / (filteredData.length - 1) : 0;
                  const color = d.regime
                    ? REGIME_COLORS[d.regime as keyof typeof REGIME_COLORS]
                    : "#eab308";
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
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF", fontSize: 11 }}
              tickMargin={35}
              minTickGap={40}
              tickFormatter={val => {
                const d = new Date(val);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
            />

            {/* Left Y-axis for Price / DMA / Normalized FGI */}
            <YAxis
              yAxisId="left"
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF", fontSize: 11 }}
              domain={["auto", "auto"]}
              tickFormatter={val => `$${(val / 1000).toFixed(0)}k`}
            />

            {/* Right Y-axis for raw FGI reference */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF", fontSize: 11 }}
              domain={[0, 100]}
              tickFormatter={val => `${val}`}
              label={{
                value: "FGI",
                angle: 90,
                position: "insideRight",
                fill: "#9CA3AF",
                fontSize: 10,
              }}
            />

            {/* Ribbon Y-axis (hidden) */}
            <YAxis yAxisId="ribbon" hide={true} domain={[0, 100]} />

            {/* Regime Ribbon at the bottom */}
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
                color: "#9CA3AF",
                marginBottom: "8px",
                fontWeight: "bold",
              }}
              cursor={{ stroke: "#4B5563", strokeWidth: 1 }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any, props: any) => {
                const labelName = String(name || "");
                if (labelName === "BTC Price" || labelName === "200 DMA")
                  return [`$${Number(value).toLocaleString()}`, labelName];
                if (labelName === "Fear & Greed Index") {
                  const rawFgi = props.payload.sentiment_value;
                  const regime = props.payload
                    .regime as keyof typeof REGIME_LABELS;
                  const label = regime ? REGIME_LABELS[regime] : "";
                  return [`${rawFgi} (${label})`, labelName];
                }
                return [value, labelName];
              }}
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
              stroke="#9CA3AF"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 5,
                fill: "#9CA3AF",
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              activeDot={(props: any) => {
                const { cx, cy, payload } = props;
                const color = payload.regime
                  ? REGIME_COLORS[payload.regime as keyof typeof REGIME_COLORS]
                  : "#10B981";
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill={color}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
        <div className="p-5 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:bg-gray-800/60 transition-colors">
          <p className="text-sm font-medium text-gray-400 mb-1">
            Current BTC Price
          </p>
          <p className="text-2xl font-bold text-white">
            ${latestPoint?.price_usd.toLocaleString() ?? "---"}
          </p>
        </div>
        <div className="p-5 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:bg-gray-800/60 transition-colors">
          <p className="text-sm font-medium text-gray-400 mb-1">
            Current 200 DMA
          </p>
          <p className="text-2xl font-bold text-[#A855F7]">
            ${latestPoint?.dma_200?.toLocaleString() ?? "---"}
          </p>
        </div>
        <div className="p-5 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:bg-gray-800/60 transition-colors">
          <p className="text-sm font-medium text-gray-400 mb-1">
            Fear & Greed Index
          </p>
          <div className="flex flex-col">
            <p
              className="text-2xl font-bold"
              style={{
                color: latestPoint?.regime
                  ? REGIME_COLORS[
                      latestPoint.regime as keyof typeof REGIME_COLORS
                    ]
                  : "#10B981",
              }}
            >
              {latestPoint?.sentiment_value ?? "---"} / 100
              {latestPoint?.regime && (
                <span className="text-sm ml-2 font-medium opacity-80">
                  (
                  {
                    REGIME_LABELS[
                      latestPoint.regime as keyof typeof REGIME_LABELS
                    ]
                  }
                  )
                </span>
              )}
            </p>
            {/* Regime Mini-legend */}
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
    </div>
  );
}
