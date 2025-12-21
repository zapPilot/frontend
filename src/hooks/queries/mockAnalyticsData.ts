/**
 * Mock Analytics Data
 *
 * Fallback data for Analytics tab when API is unavailable
 * Used in development, demo, and test environments
 */

import type { AnalyticsData } from "@/types/analytics";

/**
 * Mock Analytics Data
 *
 * Provides realistic sample data for:
 * - Performance charts (12-month timeline)
 * - Key metrics (Sharpe, Volatility, etc.)
 * - Monthly PnL heatmap
 */
export const MOCK_ANALYTICS_DATA: AnalyticsData = {
  performanceChart: {
    points: [
      {
        x: 0,
        portfolio: 100,
        btc: 100,
        date: "2024-01-01",
        portfolioValue: 10000,
      },
      {
        x: 8.33,
        portfolio: 105,
        btc: 103,
        date: "2024-02-01",
        portfolioValue: 10500,
      },
      {
        x: 16.67,
        portfolio: 108,
        btc: 98,
        date: "2024-03-01",
        portfolioValue: 10800,
      },
      {
        x: 25,
        portfolio: 112,
        btc: 105,
        date: "2024-04-01",
        portfolioValue: 11200,
      },
      {
        x: 33.33,
        portfolio: 118,
        btc: 110,
        date: "2024-05-01",
        portfolioValue: 11800,
      },
      {
        x: 41.67,
        portfolio: 115,
        btc: 108,
        date: "2024-06-01",
        portfolioValue: 11500,
      },
      {
        x: 50,
        portfolio: 122,
        btc: 115,
        date: "2024-07-01",
        portfolioValue: 12200,
      },
      {
        x: 58.33,
        portfolio: 125,
        btc: 118,
        date: "2024-08-01",
        portfolioValue: 12500,
      },
      {
        x: 66.67,
        portfolio: 128,
        btc: 120,
        date: "2024-09-01",
        portfolioValue: 12800,
      },
      {
        x: 75,
        portfolio: 135,
        btc: 125,
        date: "2024-10-01",
        portfolioValue: 13500,
      },
      {
        x: 83.33,
        portfolio: 138,
        btc: 128,
        date: "2024-11-01",
        portfolioValue: 13800,
      },
      {
        x: 91.67,
        portfolio: 142,
        btc: 130,
        date: "2024-12-01",
        portfolioValue: 14200,
      },
    ],
    startDate: "2024-01-01",
    endDate: "2024-12-31",
  },
  drawdownChart: {
    points: [
      { x: 0, value: 0, date: "2024-01-01" },
      { x: 8.33, value: -2.5, date: "2024-02-01" },
      { x: 16.67, value: -1.8, date: "2024-03-01" },
      { x: 25, value: -0.5, date: "2024-04-01" },
      { x: 33.33, value: 0, date: "2024-05-01" },
      { x: 41.67, value: -3.2, date: "2024-06-01" },
      { x: 50, value: -1.5, date: "2024-07-01" },
      { x: 58.33, value: 0, date: "2024-08-01" },
      { x: 66.67, value: -0.8, date: "2024-09-01" },
      { x: 75, value: 0, date: "2024-10-01" },
      { x: 83.33, value: -1.2, date: "2024-11-01" },
      { x: 91.67, value: 0, date: "2024-12-01" },
    ],
    maxDrawdown: -3.2,
    maxDrawdownDate: "2024-06-01",
  },
  keyMetrics: {
    timeWeightedReturn: {
      value: "+42.0%",
      subValue: "vs +30.0% BTC",
      trend: "up",
    },
    maxDrawdown: {
      value: "-3.2%",
      subValue: "June 2024",
      trend: "neutral",
    },
    sharpe: {
      value: "2.45",
      subValue: "Excellent",
      trend: "up",
    },
    winRate: {
      value: "75.0%",
      subValue: "9/12 months",
      trend: "up",
    },
    volatility: {
      value: "12.5%",
      subValue: "Annualized",
      trend: "neutral",
    },
    sortino: {
      value: "3.15",
      subValue: "Strong downside protection",
      trend: "up",
    },
    beta: {
      value: "0.85",
      subValue: "vs BTC",
      trend: "neutral",
    },
    alpha: {
      value: "+8.5%",
      subValue: "Excess Return",
      trend: "up",
    },
  },
  monthlyPnL: [
    { month: "Jan", year: 2024, value: 0 },
    { month: "Feb", year: 2024, value: 5.0 },
    { month: "Mar", year: 2024, value: 2.8 },
    { month: "Apr", year: 2024, value: 3.7 },
    { month: "May", year: 2024, value: 5.4 },
    { month: "Jun", year: 2024, value: -2.5 },
    { month: "Jul", year: 2024, value: 6.1 },
    { month: "Aug", year: 2024, value: 2.5 },
    { month: "Sep", year: 2024, value: 2.4 },
    { month: "Oct", year: 2024, value: 5.5 },
    { month: "Nov", year: 2024, value: 2.2 },
    { month: "Dec", year: 2024, value: 2.9 },
  ],
};
