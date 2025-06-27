import {
  PortfolioDataPoint,
  ChartPeriod,
  AssetAttribution,
  AnalyticsMetric,
  PerformancePeriod,
} from "../types/portfolio";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Shield,
  Clock,
  Activity,
  PieChart,
} from "lucide-react";

export const CHART_PERIODS: ChartPeriod[] = [
  { label: "1W", value: "1W", days: 7 },
  { label: "1M", value: "1M", days: 30 },
  { label: "3M", value: "3M", days: 90 },
  { label: "6M", value: "6M", days: 180 },
  { label: "1Y", value: "1Y", days: 365 },
  { label: "ALL", value: "ALL", days: 500 },
];

export const generatePortfolioHistory = (
  period: string
): PortfolioDataPoint[] => {
  const days = CHART_PERIODS.find(p => p.value === period)?.days || 90;
  const data: PortfolioDataPoint[] = [];
  const baseValue = 100000;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Simulate portfolio performance with some volatility
    const progress = (days - i) / days;
    const trend = Math.sin(progress * Math.PI * 3) * 0.1 + progress * 0.25;
    const noise = (Math.random() - 0.5) * 0.05;
    const value = baseValue * (1 + trend + noise);

    // Simulate benchmark (more stable growth)
    const benchmarkTrend = progress * 0.15;
    const benchmarkNoise = (Math.random() - 0.5) * 0.02;
    const benchmark = baseValue * (1 + benchmarkTrend + benchmarkNoise);

    const change =
      i === days
        ? 0
        : ((value - (data[data.length - 1]?.value || value)) / value) * 100;

    data.push({
      date: date.toISOString().split("T")[0]!,
      value,
      change,
      benchmark,
    });
  }

  return data;
};

export const generateAssetAttribution = (): AssetAttribution[] => [
  {
    asset: "BTC",
    contribution: 8.2,
    allocation: 35.2,
    performance: 23.4,
    color: "bg-orange-500",
  },
  {
    asset: "ETH",
    contribution: 5.3,
    allocation: 28.7,
    performance: 18.6,
    color: "bg-blue-500",
  },
  {
    asset: "DeFi Tokens",
    contribution: 4.1,
    allocation: 12.4,
    performance: 33.2,
    color: "bg-purple-500",
  },
  {
    asset: "Stablecoins",
    contribution: 0.8,
    allocation: 20.1,
    performance: 4.2,
    color: "bg-green-500",
  },
  {
    asset: "Altcoins",
    contribution: -1.8,
    allocation: 3.6,
    performance: -48.9,
    color: "bg-red-500",
  },
];

export const getAnalyticsMetrics = (): AnalyticsMetric[] => [
  {
    label: "Total Return",
    value: "+24.3%",
    change: 2.4,
    trend: "up",
    icon: TrendingUp,
    description: "All-time portfolio performance",
  },
  {
    label: "Annualized Return",
    value: "+18.7%",
    change: 1.2,
    trend: "up",
    icon: BarChart3,
    description: "Year-over-year performance",
  },
  {
    label: "Risk Score",
    value: "6.2/10",
    change: -0.3,
    trend: "down",
    icon: Shield,
    description: "Portfolio risk assessment",
  },
  {
    label: "Sharpe Ratio",
    value: "1.34",
    change: 0.15,
    trend: "up",
    icon: Target,
    description: "Risk-adjusted returns",
  },
  {
    label: "Max Drawdown",
    value: "-12.4%",
    change: 2.1,
    trend: "down",
    icon: TrendingDown,
    description: "Largest peak-to-trough decline",
  },
  {
    label: "Volatility",
    value: "22.8%",
    change: -1.8,
    trend: "up",
    icon: Activity,
    description: "Portfolio standard deviation",
  },
  {
    label: "Active Positions",
    value: "12",
    change: 2,
    trend: "up",
    icon: PieChart,
    description: "Currently held assets",
  },
  {
    label: "Days Invested",
    value: "147",
    change: 1,
    trend: "neutral",
    icon: Clock,
    description: "Portfolio age",
  },
];

export const getPerformanceData = (): PerformancePeriod[] => [
  {
    period: "1D",
    return: 2.34,
    volatility: 1.2,
    sharpe: 1.95,
    maxDrawdown: -0.8,
  },
  {
    period: "1W",
    return: 8.67,
    volatility: 4.3,
    sharpe: 2.01,
    maxDrawdown: -3.2,
  },
  {
    period: "1M",
    return: 12.45,
    volatility: 18.7,
    sharpe: 0.67,
    maxDrawdown: -8.9,
  },
  {
    period: "3M",
    return: 18.23,
    volatility: 21.4,
    sharpe: 0.85,
    maxDrawdown: -12.4,
  },
  {
    period: "6M",
    return: 24.89,
    volatility: 22.1,
    sharpe: 1.13,
    maxDrawdown: -15.6,
  },
  {
    period: "1Y",
    return: 18.67,
    volatility: 22.8,
    sharpe: 0.82,
    maxDrawdown: -18.3,
  },
];

export const getChangeColor = (trend: string): string => {
  if (trend === "neutral") return "text-gray-400";
  if (trend === "up") return "text-green-400";
  return "text-red-400";
};

export const getPerformanceColor = (value: number): string => {
  if (value > 0) return "text-green-400";
  if (value < 0) return "text-red-400";
  return "text-gray-400";
};

export const calculateDrawdownData = (
  portfolioHistory: PortfolioDataPoint[]
) => {
  let peak = 0;
  return portfolioHistory.map(point => {
    peak = Math.max(peak, point.value);
    const drawdown = peak > 0 ? ((point.value - peak) / peak) * 100 : 0;
    return {
      date: point.date,
      drawdown,
    };
  });
};
