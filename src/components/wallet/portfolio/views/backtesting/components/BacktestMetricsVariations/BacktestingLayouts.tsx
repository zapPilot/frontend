"use client";

import { Gauge, TrendingDown, TrendingUp } from "lucide-react";
import { type ReactNode, useState } from "react";

import { MetricCard } from "../../MetricCard";
import { BacktestChart } from "../BacktestChart";
import type { BacktestMetricsSummary } from "../BacktestMetrics";
import { AnnotationBubble } from "./AnnotationBubble";
import { HeroMetricPod } from "./HeroMetricPod";
import { KeyMetricsGroup } from "./KeyMetricsGroup";
import { MetricsTicker } from "./MetricsTicker";
import { buildMetrics } from "./metricsUtils";
import { SecondaryMetricRail } from "./SecondaryMetricRail";
import { SecondaryMetricsGrid } from "./SecondaryMetricsGrid";
import { SpotlightRing } from "./SpotlightRing";

export interface BacktestingLayoutProps {
  summary: BacktestMetricsSummary | null;
  sortedStrategyIds: string[];
  actualDays: number;
  daysDisplay: string;
  chartData: Record<string, unknown>[];
  yAxisDomain: [number, number];
}

// ─── Shared helpers ───────────────────────────────────────────────────

function getHeroMetricValue(
  summary: BacktestMetricsSummary | null,
  sortedStrategyIds: string[],
  dataKey: Parameters<typeof buildMetrics>[0],
  format: Parameters<typeof buildMetrics>[3]
): string {
  const metrics = buildMetrics(dataKey, sortedStrategyIds, summary?.strategies, format);
  return metrics.find((m) => m.value !== null)?.formatted ?? "N/A";
}

function getHeroTriple(summary: BacktestMetricsSummary | null, strategyIds: string[]) {
  return {
    roi: getHeroMetricValue(summary, strategyIds, "roi_percent", (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`),
    calmar: getHeroMetricValue(summary, strategyIds, "calmar_ratio", (v) => v.toFixed(2)),
    mdd: getHeroMetricValue(summary, strategyIds, "max_drawdown_percent", (v) => `${v.toFixed(1)}%`),
  };
}

function KeyMetricsWithPeriod({
  summary,
  sortedStrategyIds,
  periodLabel,
  periodValue,
  periodSubtext,
  metricsClassName,
}: {
  summary: BacktestMetricsSummary | null;
  sortedStrategyIds: string[];
  periodLabel: string;
  periodValue: string;
  periodSubtext: string;
  metricsClassName: string;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <KeyMetricsGroup
        summary={summary}
        sortedStrategyIds={sortedStrategyIds}
        className={`col-span-1 lg:col-span-3 ${metricsClassName}`}
        cardClassName="h-full"
      />
      <div className="h-full">
        <MetricCard label={periodLabel} value={periodValue} subtext={periodSubtext} />
      </div>
    </div>
  );
}

function SpotlightSideMetrics({
  items,
  children,
}: {
  items: { label: string; value: string }[];
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 w-full max-w-[180px]">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between rounded-xl bg-gray-900/50 border border-gray-800 px-4 py-2.5"
        >
          <span className="text-xs text-gray-400">{item.label}</span>
          <span className="text-sm font-mono text-white">{item.value}</span>
        </div>
      ))}
      {children}
    </div>
  );
}

// ─── Shared linear layout (metrics + chart + secondary in configurable order)
function LinearLayout({
  chartFirst,
  chartIdPrefix,
  periodLabel,
  periodValue,
  secondaryClassName,
  ...rest
}: BacktestingLayoutProps & {
  chartFirst: boolean;
  chartIdPrefix: string;
  periodLabel: string;
  periodValue: string;
  secondaryClassName: string;
}) {
  const metricsBlock = (
    <KeyMetricsWithPeriod
      summary={rest.summary}
      sortedStrategyIds={rest.sortedStrategyIds}
      periodLabel={periodLabel}
      periodValue={periodValue}
      periodSubtext={rest.daysDisplay}
      metricsClassName="grid grid-cols-1 md:grid-cols-3 gap-4"
    />
  );

  const chartBlock = (
    <BacktestChart
      chartData={rest.chartData}
      sortedStrategyIds={rest.sortedStrategyIds}
      yAxisDomain={rest.yAxisDomain}
      actualDays={rest.actualDays}
      chartIdPrefix={chartIdPrefix}
    />
  );

  const secondaryBlock = (
    <SecondaryMetricsGrid
      summary={rest.summary}
      sortedStrategyIds={rest.sortedStrategyIds}
      className={secondaryClassName}
    />
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {chartFirst ? <>{chartBlock}{metricsBlock}</> : <>{metricsBlock}{chartBlock}</>}
      {secondaryBlock}
    </div>
  );
}

// ─── Variation 1: Cards (Clean & Modern) ──────────────────────────────
export function VariationCards(props: BacktestingLayoutProps) {
  return (
    <LinearLayout
      {...props}
      chartFirst={false}
      chartIdPrefix="cards"
      periodLabel="Simulation Period"
      periodValue={`${props.actualDays} days`}
      secondaryClassName="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
    />
  );
}

// ─── Variation 2: Dashboard / Pro (Chart Focused) ─────────────────────
export function VariationChartLead(props: BacktestingLayoutProps) {
  return (
    <LinearLayout
      {...props}
      chartFirst={true}
      chartIdPrefix="chart-lead"
      periodLabel="Period"
      periodValue={`${props.actualDays}d`}
      secondaryClassName="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3"
    />
  );
}

// ─── Variation 3: Minimalist / Focused ────────────────────────────────
export function VariationMinimal({
  summary,
  sortedStrategyIds,
  actualDays,
  daysDisplay,
  chartData,
  yAxisDomain,
}: BacktestingLayoutProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="xl:col-span-8 space-y-6">
        <BacktestChart
          chartData={chartData}
          sortedStrategyIds={sortedStrategyIds}
          yAxisDomain={yAxisDomain}
          actualDays={actualDays}
          chartIdPrefix="minimal"
        />
        <SecondaryMetricsGrid
          summary={summary}
          sortedStrategyIds={sortedStrategyIds}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
        />
      </div>

      <div className="xl:col-span-4 flex flex-col gap-4">
        <MetricCard
          label="Simulation Period"
          value={`${actualDays} days`}
          subtext={daysDisplay}
        />
        <KeyMetricsGroup
          summary={summary}
          sortedStrategyIds={sortedStrategyIds}
          className="flex flex-col gap-4"
        />
      </div>
    </div>
  );
}

// ─── Variation 4: HUD (Heads-Up Display) ──────────────────────────────
// Full-bleed chart backdrop with floating frosted-glass hero pods
export function VariationHUD({
  summary,
  sortedStrategyIds,
  actualDays,
  daysDisplay,
  chartData,
  yAxisDomain,
}: BacktestingLayoutProps) {
  const { roi, calmar, mdd } = getHeroTriple(summary, sortedStrategyIds);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-gray-950 animate-in slide-in-from-bottom-4 duration-500">
      {/* Floating hero metric pods */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-start justify-center gap-3">
        <HeroMetricPod
          icon={TrendingUp}
          label="ROI"
          value={roi}
          colorClass="text-emerald-400"
          iconShadowClass="drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]"
          delay={0.1}
        />
        <HeroMetricPod
          icon={Gauge}
          label="Calmar"
          value={calmar}
          colorClass="text-cyan-400"
          iconShadowClass="drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]"
          delay={0.25}
        />
        <HeroMetricPod
          icon={TrendingDown}
          label="Max DD"
          value={mdd}
          colorClass="text-rose-400"
          iconShadowClass="drop-shadow-[0_0_6px_rgba(251,113,133,0.5)]"
          delay={0.4}
        />
      </div>

      {/* Full-bleed chart backdrop */}
      <div className="opacity-90">
        <BacktestChart chartData={chartData} sortedStrategyIds={sortedStrategyIds} yAxisDomain={yAxisDomain} actualDays={actualDays} chartIdPrefix="hud" />
      </div>

      {/* Bottom secondary metrics rail */}
      <div className="absolute bottom-0 left-0 right-0 z-20 backdrop-blur bg-gray-900/70 border-t border-white/5 px-4 py-2.5">
        <SecondaryMetricRail summary={summary} sortedStrategyIds={sortedStrategyIds} actualDays={actualDays} daysDisplay={daysDisplay} />
      </div>
    </div>
  );
}

// ─── Variation 5: Spotlight ───────────────────────────────────────────
// Theater stage metaphor — one hero metric "spotlighted" center-stage
type SpotlightMetric = "roi" | "calmar" | "mdd";

const SPOTLIGHT_CONFIG: Record<
  SpotlightMetric,
  { label: string; dataKey: Parameters<typeof buildMetrics>[0]; format: (v: number) => string; colorClass: string }
> = {
  roi: { label: "ROI", dataKey: "roi_percent", format: (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`, colorClass: "text-emerald-400" },
  calmar: { label: "Calmar", dataKey: "calmar_ratio", format: (v) => v.toFixed(2), colorClass: "text-cyan-400" },
  mdd: { label: "Max DD", dataKey: "max_drawdown_percent", format: (v) => `${v.toFixed(1)}%`, colorClass: "text-rose-400" },
};

export function VariationSpotlight({
  summary,
  sortedStrategyIds,
  actualDays,
  daysDisplay,
  chartData,
  yAxisDomain,
}: BacktestingLayoutProps) {
  const [active, setActive] = useState<SpotlightMetric>("roi");
  const cfg = SPOTLIGHT_CONFIG[active];
  const spotlightValue = getHeroMetricValue(summary, sortedStrategyIds, cfg.dataKey, cfg.format);
  const resolve = (dk: Parameters<typeof buildMetrics>[0], fmt: Parameters<typeof buildMetrics>[3]) =>
    getHeroMetricValue(summary, sortedStrategyIds, dk, fmt);

  const leftItems = [
    { label: "Sharpe", value: resolve("sharpe_ratio", (v) => v.toFixed(2)) },
    { label: "Sortino", value: resolve("sortino_ratio", (v) => v.toFixed(2)) },
    { label: "Volatility", value: resolve("volatility", (v) => `${(v * 100).toFixed(1)}%`) },
  ];
  const rightItems = [
    { label: "Beta", value: resolve("beta", (v) => v.toFixed(2)) },
    { label: "Final", value: resolve("final_value", (v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`) },
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Spotlight area */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center justify-items-center py-6">
        <SpotlightSideMetrics items={leftItems} />

        <SpotlightRing
          metricKey={active}
          label={cfg.label}
          value={spotlightValue}
          colorClass={cfg.colorClass}
        />

        <SpotlightSideMetrics items={rightItems}>
          <div className="flex items-center justify-between rounded-xl bg-gray-900/50 border border-gray-800 px-4 py-2.5">
            <span className="text-xs text-gray-400">Period</span>
            <span className="text-sm font-mono text-white">{actualDays}d &middot; {daysDisplay}</span>
          </div>
        </SpotlightSideMetrics>
      </div>

      {/* Pill tab switcher */}
      <div className="flex items-center justify-center gap-2">
        {(Object.keys(SPOTLIGHT_CONFIG) as SpotlightMetric[]).map((key) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              active === key
                ? "bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30"
                : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
            }`}
          >
            {SPOTLIGHT_CONFIG[key].label}
          </button>
        ))}
      </div>

      <BacktestChart
        chartData={chartData}
        sortedStrategyIds={sortedStrategyIds}
        yAxisDomain={yAxisDomain}
        actualDays={actualDays}
        chartIdPrefix="spotlight"
      />
    </div>
  );
}

// ─── Variation 6: Ticker ──────────────────────────────────────────────
// Sports broadcast overlay — chart with floating annotation bubbles
export function VariationTicker({
  summary,
  sortedStrategyIds,
  actualDays,
  daysDisplay,
  chartData,
  yAxisDomain,
}: BacktestingLayoutProps) {
  const heroes = getHeroTriple(summary, sortedStrategyIds);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-gray-950 animate-in slide-in-from-bottom-4 duration-500">
      <AnnotationBubble label="ROI" value={heroes.roi} borderColor="#34d399" position="top-4 left-6" connectorDirection="down" delay={0.3} />
      <AnnotationBubble label="Calmar" value={heroes.calmar} borderColor="#22d3ee" position="top-4 right-6" connectorDirection="down" delay={0.6} />
      <AnnotationBubble label="Max DD" value={heroes.mdd} borderColor="#fb7185" position="bottom-20 right-12" connectorDirection="up" delay={0.9} />

      <BacktestChart
        sortedStrategyIds={sortedStrategyIds}
        chartData={chartData}
        actualDays={actualDays}
        yAxisDomain={yAxisDomain}
        chartIdPrefix="ticker"
      />

      <MetricsTicker sortedStrategyIds={sortedStrategyIds} summary={summary} daysDisplay={daysDisplay} actualDays={actualDays} />
    </div>
  );
}
