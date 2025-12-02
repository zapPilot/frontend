"use client";

import { memo, useCallback, useMemo } from "react";

import { useChartHover } from "@/hooks/useChartHover";
import { formatChartDate } from "@/lib/chartFormatters";
import type { DrawdownHoverData } from "@/types/ui/chartHover";

import { ChartIndicator, ChartTooltip } from "../../charts";
import { CHART_DIMENSIONS, DRAWDOWN_CONSTANTS } from "../chartConstants";
import {
  calculateDrawdownMinValue,
  calculateDrawdownScaleDenominator,
  calculateDrawdownY,
  calculateXPosition,
  generateAreaChartPath,
  generateLineChartPath,
} from "../chartHelpers";
import type { DrawdownRecoveryData, DrawdownRecoverySummary } from "../types";
import {
  CHART_LABELS,
  ENABLE_TEST_AUTO_HOVER,
  getChartInteractionProps,
} from "../utils";

interface DrawdownRecoveryChartProps {
  data: DrawdownRecoveryData[];
  summary: DrawdownRecoverySummary;
  width?: number;
  height?: number;
}

const DRAWDOWN_CHART_TYPE = "drawdown-recovery" as const;

function buildHistoricalSegments(
  data: DrawdownRecoveryData[],
  chartWidth: number
) {
  if (data.length <= 1) return [] as { start: number; width: number }[];

  const segments: { startIndex: number; endIndex: number }[] = [];
  let startIndex: number | null = null;

  for (const [index, point] of data.entries()) {
    if (point.isHistoricalPeriod) {
      startIndex ??= index;
    } else if (startIndex !== null) {
      segments.push({ startIndex, endIndex: index - 1 });
      startIndex = null;
    }
  }

  if (startIndex !== null) {
    segments.push({ startIndex, endIndex: data.length - 1 });
  }

  return segments.map(segment => {
    const startX = calculateXPosition(
      segment.startIndex,
      data.length,
      chartWidth
    );
    const endX = calculateXPosition(segment.endIndex, data.length, chartWidth);
    const width = Math.max(endX - startX, chartWidth / data.length);
    return {
      start: startX,
      width,
    };
  });
}

export const DrawdownRecoveryChart = memo<DrawdownRecoveryChartProps>(
  ({
    data,
    summary,
    width = CHART_DIMENSIONS.WIDTH,
    height = CHART_DIMENSIONS.HEIGHT,
  }) => {
    const drawdownValues = useMemo(
      () => data.map(point => point.drawdown),
      [data]
    );

    const minValue = useMemo(
      () => calculateDrawdownMinValue(drawdownValues),
      [drawdownValues]
    );

    const scaleDenominator = useMemo(
      () => calculateDrawdownScaleDenominator(minValue),
      [minValue]
    );

    const getY = useCallback(
      (value: number) => calculateDrawdownY(value, scaleDenominator),
      [scaleDenominator]
    );

    const zeroLineY = useMemo(
      () => getY(DRAWDOWN_CONSTANTS.DEFAULT_MAX),
      [getY]
    );

    const coordinates = useMemo(() => {
      return data.map((point, index) => {
        const x = calculateXPosition(index, data.length, width);
        const y = getY(point.drawdown);
        return { ...point, x, y };
      });
    }, [data, getY, width]);

    const linePath = useMemo(() => {
      const points = coordinates.map(point => ({ x: point.x, y: point.y }));
      return generateLineChartPath(points);
    }, [coordinates]);

    const areaPath = useMemo(() => {
      const points = coordinates.map(point => ({ x: point.x, y: point.y }));
      return generateAreaChartPath(points, zeroLineY, width);
    }, [coordinates, zeroLineY, width]);

    const historicalSegments = useMemo(
      () => buildHistoricalSegments(data, width),
      [data, width]
    );

    const drawdownHover = useChartHover(coordinates, {
      chartType: DRAWDOWN_CHART_TYPE,
      chartWidth: width,
      chartHeight:
        DRAWDOWN_CONSTANTS.TOP_OFFSET + DRAWDOWN_CONSTANTS.CHART_HEIGHT,
      chartPadding: 0,
      minValue,
      maxValue: DRAWDOWN_CONSTANTS.DEFAULT_MAX,
      getYValue: point => point.drawdown,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      buildHoverData: (point, _x, _y, _index) => {
        const hoverData: DrawdownHoverData = {
          chartType: DRAWDOWN_CHART_TYPE,
          x: point.x,
          y: point.y,
          date: formatChartDate(point.date),
          drawdown: point.drawdown,
        };

        if (point.peakDate) {
          hoverData.peakDate = formatChartDate(point.peakDate);
        }

        if (point.daysFromPeak !== undefined) {
          hoverData.distanceFromPeak = point.daysFromPeak;
        }

        if (point.isRecoveryPoint) {
          hoverData.isRecoveryPoint = point.isRecoveryPoint;
        }

        if (point.recoveryDurationDays !== undefined) {
          hoverData.recoveryDurationDays = point.recoveryDurationDays;
        }

        if (point.recoveryDepth !== undefined) {
          hoverData.recoveryDepth = point.recoveryDepth;
        }

        return hoverData;
      },
      testAutoPopulate: ENABLE_TEST_AUTO_HOVER,
    });

    const recoveryPoints = useMemo(
      () => coordinates.filter(point => point.isRecoveryPoint),
      [coordinates]
    );

    return (
      <div className="relative h-80">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          data-chart-type={DRAWDOWN_CHART_TYPE}
          data-current-status={summary.currentStatus}
          aria-label={`${CHART_LABELS.drawdown}. Current status: ${summary.currentStatus}.`}
          {...getChartInteractionProps(drawdownHover)}
        >
          <text x="16" y="20" opacity="0">
            Drawdown and recovery progression relative to portfolio peaks
          </text>

          <defs>
            <linearGradient
              id="drawdownRecoveryGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor={DRAWDOWN_CONSTANTS.AREA_GRADIENT.COLOR}
                stopOpacity={DRAWDOWN_CONSTANTS.AREA_GRADIENT.START_OPACITY}
              />
              <stop
                offset="100%"
                stopColor={DRAWDOWN_CONSTANTS.AREA_GRADIENT.COLOR}
                stopOpacity={DRAWDOWN_CONSTANTS.AREA_GRADIENT.END_OPACITY}
              />
            </linearGradient>
          </defs>

          {historicalSegments.map((segment, index) => (
            <rect
              key={`historical-${index}`}
              x={segment.start}
              y={0}
              width={segment.width}
              height={height}
              fill={DRAWDOWN_CONSTANTS.HISTORICAL_FILL.COLOR}
              opacity={DRAWDOWN_CONSTANTS.HISTORICAL_FILL.OPACITY}
            />
          ))}

          {/* Zero line */}
          <line
            x1="0"
            y1={zeroLineY}
            x2={width}
            y2={zeroLineY}
            stroke={DRAWDOWN_CONSTANTS.ZERO_LINE.COLOR}
            strokeWidth="1.5"
            strokeDasharray={DRAWDOWN_CONSTANTS.ZERO_LINE.DASH}
          />

          {/* Drawdown area */}
          {areaPath && (
            <path d={areaPath} fill="url(#drawdownRecoveryGradient)" />
          )}

          {/* Drawdown line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={DRAWDOWN_CONSTANTS.LINE_COLOR}
              strokeWidth="2.5"
            />
          )}

          {/* Recovery lines and markers */}
          {recoveryPoints.map((point, index) => (
            <g key={`recovery-${index}`}>
              <line
                x1={point.x}
                y1={zeroLineY}
                x2={point.x}
                y2={point.y}
                stroke={DRAWDOWN_CONSTANTS.RECOVERY.COLOR}
                strokeWidth="1.5"
                strokeDasharray={DRAWDOWN_CONSTANTS.RECOVERY.LINE_DASH}
                opacity={DRAWDOWN_CONSTANTS.RECOVERY.LINE_OPACITY}
              />
              <circle
                cx={point.x}
                cy={zeroLineY}
                r={DRAWDOWN_CONSTANTS.RECOVERY.MARKER_RADIUS}
                fill={DRAWDOWN_CONSTANTS.RECOVERY.COLOR}
              />
            </g>
          ))}

          {/* Hover indicator */}
          <ChartIndicator hoveredPoint={drawdownHover.hoveredPoint} />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-2 pointer-events-none">
          <span>0%</span>
          <span>-5%</span>
          <span>-10%</span>
          <span>-15%</span>
          <span>-20%</span>
        </div>

        {/* Hover Tooltip */}
        <ChartTooltip
          hoveredPoint={drawdownHover.hoveredPoint}
          chartWidth={width}
          chartHeight={height}
        />
      </div>
    );
  }
);

DrawdownRecoveryChart.displayName = "DrawdownRecoveryChart";
