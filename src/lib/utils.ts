import { PORTFOLIO_CONFIG } from "../constants/app";

/**
 * Format currency values
 */
export function formatCurrency(amount: number, isHidden = false): string {
  if (isHidden) return PORTFOLIO_CONFIG.HIDDEN_BALANCE_PLACEHOLDER;
  return new Intl.NumberFormat(PORTFOLIO_CONFIG.CURRENCY_LOCALE, {
    style: "currency",
    currency: PORTFOLIO_CONFIG.CURRENCY_CODE,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format numbers with optional hiding
 */
export function formatNumber(amount: number, isHidden = false): string {
  if (isHidden) return PORTFOLIO_CONFIG.HIDDEN_NUMBER_PLACEHOLDER;
  return amount.toLocaleString(PORTFOLIO_CONFIG.CURRENCY_LOCALE, {
    maximumFractionDigits: 4,
  });
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Get risk level styling classes
 */
export function getRiskLevelClasses(risk: string): string {
  switch (risk) {
    case "Low":
      return "bg-green-900/30 text-green-400";
    case "Medium":
      return "bg-yellow-900/30 text-yellow-400";
    case "High":
      return "bg-red-900/30 text-red-400";
    default:
      return "bg-gray-900/30 text-gray-400";
  }
}

/**
 * Get change color classes based on positive/negative value
 */
export function getChangeColorClasses(value: number): string {
  return value >= 0 ? "text-green-400" : "text-red-400";
}

/**
 * Calculate portfolio metrics from asset categories
 */
export function calculatePortfolioMetrics(
  categories: Array<{ totalValue: number; change24h: number }>
) {
  const totalValue = categories.reduce((sum, cat) => sum + cat.totalValue, 0);
  const totalChange24h = categories.reduce(
    (sum, cat) => sum + (cat.totalValue * cat.change24h) / 100,
    0
  );
  const totalChangePercentage =
    totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0;

  return {
    totalValue,
    totalChange24h,
    totalChangePercentage,
  };
}
