/**
 * Gets the optimized symbol for a token
 * @param {Object} token - The token object
 * @returns {string} The token symbol
 */
export const getTokenSymbol = token => {
  return token.optimized_symbol || token.symbol || "UNKNOWN";
};

/**
 * Filters and sorts tokens by their total value
 * @param {Array} tokens - Array of token objects
 * @returns {Array} Filtered and sorted tokens
 */
export const getFilteredAndSortedTokens = tokens => {
  if (!tokens || !Array.isArray(tokens)) return [];

  return tokens
    .filter(token => token.price > 0)
    .filter(token => token.amount > 0)
    .sort((a, b) => b.amount * b.price - a.amount * a.price);
};

/**
 * Calculates the total USD value of a token array
 * @param {Array} tokens - Array of token objects
 * @returns {number} Total value in USD
 */
export const calculateTotalTokenValue = tokens => {
  if (!tokens || !Array.isArray(tokens)) return 0;

  return tokens.reduce((total, token) => {
    return total + token.amount * token.price;
  }, 0);
};
