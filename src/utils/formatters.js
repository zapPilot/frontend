/**
 * Formats small numbers with appropriate precision
 * @param {number} num - The number to format
 * @returns {string} Formatted number string
 */
export const formatSmallNumber = num => {
  if (num === 0) return "0";
  if (num < 0.000001) return "< 0.000001";
  if (num < 0.01) return num.toFixed(6);
  if (num < 1) return num.toFixed(4);
  if (num < 100) return num.toFixed(2);
  return num.toFixed(0);
};

/**
 * Formats balance values with dollar sign
 * @param {number} balance - The balance to format
 * @returns {string} Formatted balance string
 */
export const formatBalance = balance => {
  if (balance === 0) return "$0.00";
  if (balance < 0.01) return "< $0.01";
  return `$${balance.toFixed(2)}`;
};

/**
 * Formats ETH amounts with variable precision
 * @param {number} value - The ETH value to format
 * @returns {string} Formatted ETH amount
 */
export const formatEthAmount = value => {
  if (value === 0) return "0 ETH";
  if (value < 0.0001) return "< 0.0001 ETH";
  if (value < 0.01) return `${value.toFixed(8)} ETH`;
  if (value < 1) return `${value.toFixed(4)} ETH`;
  return `${value.toFixed(4)} ETH`;
};

/**
 * Format currency with smart handling for very small amounts
 * @param {number} value - The numerical value to format
 * @param {number} threshold - Values below this show as "< $threshold" (default: 0.01)
 * @param {number} thresholdDecimals - Decimal places for threshold display (default: 4)
 * @param {number} normalDecimals - Decimal places for normal amounts (default: 2)
 * @returns {string} Formatted currency string
 */
export const formatSmallCurrency = (
  value,
  threshold = 0.01,
  thresholdDecimals = 4,
  normalDecimals = 2
) => {
  if (value === 0) return "0";

  const absValue = Math.abs(value);
  const isNegative = value < 0;

  if (absValue < threshold) {
    const formatted = `< $${threshold.toFixed(thresholdDecimals)}`;
    return isNegative ? `-${formatted}` : formatted;
  }

  const formatted = `$${absValue.toFixed(normalDecimals)}`;
  return isNegative ? `-${formatted}` : formatted;
};
