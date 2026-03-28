"use client";

import { type JSX, useMemo, useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useMarketDashboardQuery } from "@/hooks/queries/market/useMarketDashboardQuery";
import { REGIME_LABELS } from "@/lib/domain/regimeMapper";
import type { MarketDashboardPoint } from "@/services";

// Regime hex colors keyed by short RegimeId (ef/f/n/g/eg)
const REGIME_COLORS: Record<string, string> = {
  ef: "#ef4444", // Extreme Fear - Red
  f: "#f97316", // Fear - Orange
  n: "#eab308", // Neutral - Yellow
  g: "#84cc16", // Greed - Lime
  eg: "#22c55e", // Extreme Greed - Green
};

type RegimeKey = keyof typeof REGIME_COLORS;

function getRegimeColor(
  regime: string | null | undefined,
  fallback = "#eab308"
): string {
  if (!regime || !(regime in REGIME_COLORS)) return fallback;
  return REGIME_COLORS[regime] ?? fallback;
}

function getRegimeLabel(regime: string | null | undefined): string {
  return regime && regime in REGIME_LABELS
    ? REGIME_LABELS[regime as keyof typeof REGIME_LABELS]
    : "";
}

const TIMEFRAMES = [
  { id: "1M", days: 30 },
  { id: "3M", days: 90 },
  { id: "1Y", days: 365 },
  { id: "MAX", days: 1900 },
] as const;

type Timeframe = (typeof TIMEFRAMES)[number]["id"];

const AXIS_COLOR = "#9CA3AF";
const RATIO_AXIS_COLOR = "#6EE7B7";

interface RelativeStrengthPoint {
  snapshot_date: string;
  ratio: number | null;
  dma_200: number | null;
  is_above_dma: boolean | null;
}

interface CrossPoint {
  snapshot_date: string;
  ratio: number;
  direction: "above" | "below";
}

function formatXAxisDate(val: string): string {
  const d = new Date(val);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatPriceLabel(val: number): string {
  return `$${(val / 1000).toFixed(0)}k`;
}

function formatRatioLabel(val: number): string {
  return Number(val).toFixed(4);
}

function formatRatioValue(val: number | null | undefined): string {
  return val == null ? "---" : Number(val).toFixed(4);
}

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
    return [formatRatioLabel(Number(value ?? 0)), labelName];
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

function SimpleStatCard({
  label,
  value,
  valueClass,
  detail,
}: {
  label: string;
  value: string;
  valueClass: string;
  detail?: string;
}): JSX.Element {
  return (
    <div className="p-5 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:bg-gray-800/60 transition-colors">
      <p className="text-sm font-medium text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
      {detail ? <p className="mt-2 text-xs text-gray-500">{detail}</p> : null}
    </div>
  );
}

function getRelativeStrengthSignal(isAboveDma: boolean | null | undefined): {
  label: string;
  valueClass: string;
  detail: string;
} {
  if (isAboveDma === true) {
    return {
      label: "ETH leading",
      valueClass: "text-emerald-300",
      detail: "ETH/BTC is trading above its 200-day trend.",
    };
  }

  if (isAboveDma === false) {
    return {
      label: "BTC leading",
      valueClass: "text-amber-300",
      detail: "ETH/BTC is below its 200-day trend.",
    };
  }

  return {
    label: "Insufficient data",
    valueClass: "text-gray-300",
    detail: "Need 200 overlapping ETH/BTC daily points for a crossover signal.",
  };
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
  const [ratioTimeframe, setRatioTimeframe] = useState<Timeframe>("MAX");
  const activeDays = TIMEFRAMES.find(tf => tf.id === timeframe)?.days ?? 365;
  const ratioDays =
    TIMEFRAMES.find(tf => tf.id === ratioTimeframe)?.days ?? 1900;
  const { data: dashboardData, isLoading } =
    useMarketDashboardQuery(activeDays);
  const { data: ratioData, isLoading: isRatioLoading } =
    useMarketDashboardQuery(ratioDays);
  const filteredData = useMemo<MarketDashboardPoint[]>(
    () => dashboardData?.snapshots ?? [],
    [dashboardData?.snapshots]
  );

  const ratioSnapshots = useMemo<MarketDashboardPoint[]>(
    () => ratioData?.snapshots ?? [],
    [ratioData?.snapshots]
  );

  const relativeStrengthData = useMemo<RelativeStrengthPoint[]>(
    () =>
      ratioSnapshots.map(snapshot => ({
        snapshot_date: snapshot.snapshot_date,
        ratio: snapshot.eth_btc_relative_strength?.ratio ?? null,
        dma_200: snapshot.eth_btc_relative_strength?.dma_200 ?? null,
        is_above_dma: snapshot.eth_btc_relative_strength?.is_above_dma ?? null,
      })),
    [ratioSnapshots]
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
  const latestRelativeStrengthPoint = useMemo(
    () =>
      [...relativeStrengthData].reverse().find(point => point.ratio != null) ??
      null,
    [relativeStrengthData]
  );
  const relativeStrengthSignal = getRelativeStrengthSignal(
    latestRelativeStrengthPoint?.is_above_dma
  );

  const crossPoints = useMemo<CrossPoint[]>(() => {
    const points: CrossPoint[] = [];
    for (let i = 1; i < relativeStrengthData.length; i++) {
      const prev = relativeStrengthData[i - 1] as
        | RelativeStrengthPoint
        | undefined;
      const curr = relativeStrengthData[i] as RelativeStrengthPoint | undefined;
      if (
        prev?.is_above_dma != null &&
        curr?.is_above_dma != null &&
        prev.is_above_dma !== curr.is_above_dma &&
        curr.ratio != null
      ) {
        points.push({
          snapshot_date: curr.snapshot_date,
          ratio: curr.ratio,
          direction: curr.is_above_dma ? "above" : "below",
        });
      }
    }
    return points;
  }, [relativeStrengthData]);

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
              {/* Dynamic horizontal gradient for FGI line coloring by regime */}
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

            {/* Left Y-axis for Price / DMA / Normalized FGI */}
            <YAxis
              yAxisId="left"
              stroke={AXIS_COLOR}
              tick={{ fill: AXIS_COLOR, fontSize: 11 }}
              domain={["auto", "auto"]}
              tickFormatter={formatPriceLabel}
            />

            {/* Right Y-axis for raw FGI reference */}
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

      <section className="relative overflow-hidden rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-gray-900/90 via-gray-900/70 to-emerald-950/20 p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.16),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_35%)]" />
        <div className="relative">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300/70">
                Relative Strength
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                ETH/BTC Ratio vs 200 DMA
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Track whether ETH is gaining leadership over BTC on a
                long-horizon trend basis.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 border border-emerald-500/20">
                {TIMEFRAMES.map(tf => (
                  <button
                    key={`ratio-${tf.id}`}
                    onClick={() => setRatioTimeframe(tf.id)}
                    data-testid={`ratio-tf-${tf.id}`}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      ratioTimeframe === tf.id
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                    }`}
                  >
                    {tf.id}
                  </button>
                ))}
              </div>
              <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                {relativeStrengthSignal.label}
              </div>
            </div>
          </div>

          <div className="mt-5 h-[260px] rounded-2xl border border-gray-800/80 bg-black/10 p-3 relative">
            {isRatioLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/30">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={relativeStrengthData}
                margin={{ top: 20, right: 20, left: 20, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  vertical={false}
                />
                <XAxis
                  dataKey="snapshot_date"
                  stroke={AXIS_COLOR}
                  tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                  minTickGap={40}
                  tickFormatter={formatXAxisDate}
                />
                <YAxis
                  yAxisId="ratio"
                  orientation="right"
                  stroke={RATIO_AXIS_COLOR}
                  tick={{ fill: RATIO_AXIS_COLOR, fontSize: 11 }}
                  domain={["auto", "auto"]}
                  tickFormatter={formatRatioLabel}
                />
                <Tooltip
                  cursor={{ stroke: "#4B5563", strokeWidth: 1 }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0]?.payload as
                      | RelativeStrengthPoint
                      | undefined;
                    const cross = crossPoints.find(
                      cp => cp.snapshot_date === label
                    );
                    return (
                      <div className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 shadow-xl">
                        <p className="mb-2 text-xs font-bold text-gray-400">
                          {label}
                        </p>
                        <p className="text-sm text-emerald-300">
                          ETH/BTC Ratio: {formatRatioValue(data?.ratio)}
                        </p>
                        <p className="text-sm text-amber-300">
                          Ratio 200 DMA: {formatRatioValue(data?.dma_200)}
                        </p>
                        {cross ? (
                          <p
                            className={`mt-2 text-xs font-semibold ${cross.direction === "above" ? "text-emerald-400" : "text-amber-400"}`}
                          >
                            {cross.direction === "above" ? "\u2B06" : "\u2B07"}{" "}
                            ETH crosses {cross.direction} DMA200
                          </p>
                        ) : null}
                      </div>
                    );
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={32}
                  iconType="circle"
                  wrapperStyle={{ paddingTop: "0", marginBottom: "10px" }}
                />
                <Line
                  yAxisId="ratio"
                  type="monotone"
                  name="ETH/BTC Ratio"
                  dataKey="ratio"
                  stroke="#34D399"
                  strokeWidth={2.5}
                  dot={false}
                  connectNulls
                />
                <Line
                  yAxisId="ratio"
                  type="monotone"
                  name="Ratio 200 DMA"
                  dataKey="dma_200"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                  connectNulls
                />
                {crossPoints.map(cp => (
                  <ReferenceDot
                    key={cp.snapshot_date}
                    yAxisId="ratio"
                    x={cp.snapshot_date}
                    y={cp.ratio}
                    r={6}
                    fill={cp.direction === "above" ? "#34D399" : "#F59E0B"}
                    stroke="#fff"
                    strokeWidth={2}
                    ifOverflow="extendDomain"
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <SimpleStatCard
              label="Current ETH/BTC Ratio"
              value={formatRatioValue(latestRelativeStrengthPoint?.ratio)}
              valueClass="text-emerald-300"
              detail="ETH price divided by BTC price on the latest overlapping day."
            />
            <SimpleStatCard
              label="Ratio 200 DMA"
              value={formatRatioValue(latestRelativeStrengthPoint?.dma_200)}
              valueClass="text-amber-300"
              detail="200-day moving average of the ETH/BTC ratio."
            />
            <SimpleStatCard
              label="Leader Signal"
              value={relativeStrengthSignal.label}
              valueClass={relativeStrengthSignal.valueClass}
              detail={relativeStrengthSignal.detail}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
