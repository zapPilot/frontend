/**
 * Type-safe factories for creating chart hover test data
 * Provides builders for all chart types with proper TypeScript inference
 */

import type {
  ChartHoverState,
  PerformanceHoverData,
  AllocationHoverData,
  DrawdownHoverData,
  SharpeHoverData,
  VolatilityHoverData,
} from "@/types/chartHover";
import type {
  PortfolioDataPoint,
  AssetAllocationPoint,
} from "@/types/portfolio";
import type { UseChartHoverOptions } from "@/hooks/useChartHover";

/**
 * Base factory interface for creating typed test data
 */
interface BaseChartDataFactory<T> {
  /** Create a single data point with optional overrides */
  createPoint(overrides?: Partial<T>): T;
  /** Create multiple data points */
  createPoints(count: number, generator?: (index: number) => Partial<T>): T[];
}

/**
 * Factory for PortfolioDataPoint test data
 */
export const PortfolioDataFactory: BaseChartDataFactory<PortfolioDataPoint> = {
  createPoint(overrides = {}) {
    return {
      date: "2025-01-01",
      value: 10000,
      change: 0,
      benchmark: 9800,
      protocols: [],
      chainsCount: 1,
      ...overrides,
    };
  },

  createPoints(count, generator) {
    return Array.from({ length: count }, (_, i) => {
      const baseDate = new Date("2025-01-01");
      baseDate.setDate(baseDate.getDate() + i);

      return this.createPoint({
        date: baseDate.toISOString().split("T")[0],
        value: 10000 + i * 100,
        change: i * 0.01,
        benchmark: 9800 + i * 95,
        ...(generator ? generator(i) : {}),
      });
    });
  },
};

/**
 * Factory for AssetAllocationPoint test data
 */
export const AllocationDataFactory: BaseChartDataFactory<AssetAllocationPoint> =
  {
    createPoint(overrides = {}) {
      return {
        date: "2025-01-01",
        btc: 40,
        eth: 30,
        stablecoin: 15,
        defi: 10,
        altcoin: 5,
        ...overrides,
      };
    },

    createPoints(count, generator) {
      return Array.from({ length: count }, (_, i) => {
        const baseDate = new Date("2025-01-01");
        baseDate.setDate(baseDate.getDate() + i);

        return this.createPoint({
          date: baseDate.toISOString().split("T")[0],
          ...(generator ? generator(i) : {}),
        });
      });
    },
  };

/**
 * Drawdown data point interface matching production
 */
export interface DrawdownDataPoint {
  date: string;
  drawdown_pct: number;
  portfolio_value: number;
  peak_date?: string;
  days_from_peak?: number;
  recovery_duration_days?: number;
  recovery_depth_pct?: number;
  is_recovery_point?: boolean;
}

export const DrawdownDataFactory: BaseChartDataFactory<DrawdownDataPoint> = {
  createPoint(overrides = {}) {
    return {
      date: "2025-01-01",
      drawdown_pct: -5,
      portfolio_value: 10000,
      ...overrides,
    };
  },

  createPoints(count, generator) {
    return Array.from({ length: count }, (_, i) => {
      const baseDate = new Date("2025-01-01");
      baseDate.setDate(baseDate.getDate() + i);

      return this.createPoint({
        date: baseDate.toISOString().split("T")[0],
        drawdown_pct: -5 - i * 0.5,
        portfolio_value: 10000 - i * 50,
        ...(generator ? generator(i) : {}),
      });
    });
  },
};

/**
 * Sharpe ratio data point
 */
export interface SharpeDataPoint {
  date: string;
  rolling_sharpe_ratio: number;
}

export const SharpeDataFactory: BaseChartDataFactory<SharpeDataPoint> = {
  createPoint(overrides = {}) {
    return {
      date: "2025-01-01",
      rolling_sharpe_ratio: 1.5,
      ...overrides,
    };
  },

  createPoints(count, generator) {
    return Array.from({ length: count }, (_, i) => {
      const baseDate = new Date("2025-01-01");
      baseDate.setDate(baseDate.getDate() + i);

      return this.createPoint({
        date: baseDate.toISOString().split("T")[0],
        rolling_sharpe_ratio: 1.5 + (Math.random() - 0.5) * 0.5,
        ...(generator ? generator(i) : {}),
      });
    });
  },
};

/**
 * Volatility data point
 */
export interface VolatilityDataPoint {
  date: string;
  annualized_volatility_pct: number;
}

export const VolatilityDataFactory: BaseChartDataFactory<VolatilityDataPoint> =
  {
    createPoint(overrides = {}) {
      return {
        date: "2025-01-01",
        annualized_volatility_pct: 25,
        ...overrides,
      };
    },

    createPoints(count, generator) {
      return Array.from({ length: count }, (_, i) => {
        const baseDate = new Date("2025-01-01");
        baseDate.setDate(baseDate.getDate() + i);

        return this.createPoint({
          date: baseDate.toISOString().split("T")[0],
          annualized_volatility_pct: 25 + (Math.random() - 0.5) * 10,
          ...(generator ? generator(i) : {}),
        });
      });
    },
  };

/**
 * Type-safe hover data builders for each chart type
 */
export const HoverDataBuilders = {
  /**
   * Build performance hover data
   */
  performance(
    point: PortfolioDataPoint,
    x: number,
    y: number
  ): PerformanceHoverData {
    return {
      chartType: "performance" as const,
      x,
      y,
      date: new Date(point.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      value: point.value,
      benchmark: point.benchmark || 0,
    };
  },

  /**
   * Build allocation hover data
   */
  allocation(
    point: AssetAllocationPoint,
    x: number,
    y: number
  ): AllocationHoverData {
    const total =
      point.btc + point.eth + point.stablecoin + point.defi + point.altcoin;
    return {
      chartType: "allocation" as const,
      x,
      y,
      date: new Date(point.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      btc: total > 0 ? (point.btc / total) * 100 : 0,
      eth: total > 0 ? (point.eth / total) * 100 : 0,
      stablecoin: total > 0 ? (point.stablecoin / total) * 100 : 0,
      defi: total > 0 ? (point.defi / total) * 100 : 0,
      altcoin: total > 0 ? (point.altcoin / total) * 100 : 0,
    };
  },

  /**
   * Build drawdown hover data with peak detection
   */
  drawdown(
    point: DrawdownDataPoint,
    x: number,
    y: number,
    index: number,
    allPoints: DrawdownDataPoint[]
  ): DrawdownHoverData {
    const priorData = allPoints.slice(0, index + 1);
    const peak = Math.max(...priorData.map(p => p.portfolio_value));
    const peakIndex = priorData.findIndex(p => p.portfolio_value === peak);
    const peakDate = priorData[peakIndex]?.date || point.date;

    return {
      chartType: "drawdown-recovery" as const,
      x,
      y,
      date: new Date(point.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      drawdown: point.drawdown_pct,
      peakDate: new Date(point.peak_date ?? peakDate).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        }
      ),
      distanceFromPeak: point.days_from_peak ?? index - peakIndex,
      isRecoveryPoint:
        point.is_recovery_point ?? Math.abs(point.drawdown_pct) < 0.05,
      recoveryDurationDays: point.recovery_duration_days,
      recoveryDepth: point.recovery_depth_pct,
    };
  },

  /**
   * Build sharpe hover data
   */
  sharpe(point: SharpeDataPoint, x: number, y: number): SharpeHoverData {
    const sharpe = point.rolling_sharpe_ratio || 0;
    let interpretation: string;

    if (sharpe >= 2.0) {
      interpretation = "Excellent";
    } else if (sharpe >= 1.5) {
      interpretation = "Very Good";
    } else if (sharpe >= 1.0) {
      interpretation = "Good";
    } else if (sharpe >= 0.5) {
      interpretation = "Acceptable";
    } else {
      interpretation = "Poor";
    }

    return {
      chartType: "sharpe" as const,
      x,
      y,
      date: new Date(point.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      sharpe,
      interpretation,
    };
  },

  /**
   * Build volatility hover data
   */
  volatility(
    point: VolatilityDataPoint,
    x: number,
    y: number
  ): VolatilityHoverData {
    const vol = point.annualized_volatility_pct || 0;
    let riskLevel: string;

    if (vol >= 35) {
      riskLevel = "Very High";
    } else if (vol >= 25) {
      riskLevel = "High";
    } else if (vol >= 15) {
      riskLevel = "Moderate";
    } else {
      riskLevel = "Low";
    }

    return {
      chartType: "volatility" as const,
      x,
      y,
      date: new Date(point.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      volatility: vol,
      riskLevel,
    };
  },
};

/**
 * Builder for type-safe useChartHover options
 */
export class ChartHoverOptionsBuilder<T> {
  private options: Partial<UseChartHoverOptions<T>>;

  constructor(private defaultChartType: string) {
    this.options = {
      chartType: defaultChartType,
      chartWidth: 800,
      chartHeight: 300,
      chartPadding: 10,
      enabled: true,
    };
  }

  withDimensions(width: number, height: number, padding = 10): this {
    this.options.chartWidth = width;
    this.options.chartHeight = height;
    this.options.chartPadding = padding;
    return this;
  }

  withValueRange(min: number, max: number): this {
    this.options.minValue = min;
    this.options.maxValue = max;
    return this;
  }

  withYValueExtractor(extractor: (point: T) => number): this {
    this.options.getYValue = extractor;
    return this;
  }

  withHoverDataBuilder(
    builder: (point: T, x: number, y: number, index: number) => ChartHoverState
  ): this {
    this.options.buildHoverData = builder;
    return this;
  }

  disabled(): this {
    this.options.enabled = false;
    return this;
  }

  build(): UseChartHoverOptions<T> {
    if (this.options.minValue === undefined) {
      throw new Error("minValue is required");
    }
    if (this.options.maxValue === undefined) {
      throw new Error("maxValue is required");
    }
    if (!this.options.getYValue) {
      throw new Error("getYValue is required");
    }
    if (!this.options.buildHoverData) {
      throw new Error("buildHoverData is required");
    }

    return this.options as UseChartHoverOptions<T>;
  }
}

/**
 * Convenience factory for common chart types
 */
export const ChartHoverOptionsFactory = {
  performance(data: PortfolioDataPoint[]) {
    const minValue = Math.min(...data.map(d => d.value));
    const maxValue = Math.max(...data.map(d => d.value));

    return new ChartHoverOptionsBuilder<PortfolioDataPoint>("performance")
      .withValueRange(minValue, maxValue)
      .withYValueExtractor(point => point.value)
      .withHoverDataBuilder((point, x, y) =>
        HoverDataBuilders.performance(point, x, y)
      )
      .build();
  },

  allocation() {
    return new ChartHoverOptionsBuilder<AssetAllocationPoint>("allocation")
      .withValueRange(0, 100)
      .withYValueExtractor(() => 50) // Mid-point for stacked chart
      .withHoverDataBuilder((point, x, y) =>
        HoverDataBuilders.allocation(point, x, y)
      )
      .build();
  },

  drawdown(data: DrawdownDataPoint[]) {
    return new ChartHoverOptionsBuilder<DrawdownDataPoint>(
      "drawdown-recovery"
    )
      .withValueRange(-20, 0)
      .withYValueExtractor(point => point.drawdown_pct)
      .withHoverDataBuilder((point, x, y, index) =>
        HoverDataBuilders.drawdown(point, x, y, index, data)
      )
      .build();
  },

  sharpe() {
    return new ChartHoverOptionsBuilder<SharpeDataPoint>("sharpe")
      .withValueRange(0, 2.5)
      .withYValueExtractor(point => point.rolling_sharpe_ratio)
      .withHoverDataBuilder((point, x, y) =>
        HoverDataBuilders.sharpe(point, x, y)
      )
      .build();
  },

  volatility() {
    return new ChartHoverOptionsBuilder<VolatilityDataPoint>("volatility")
      .withValueRange(10, 40)
      .withYValueExtractor(point => point.annualized_volatility_pct)
      .withHoverDataBuilder((point, x, y) =>
        HoverDataBuilders.volatility(point, x, y)
      )
      .build();
  },
};
