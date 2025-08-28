import { getUserTokens } from "../services/accountService";

/**
 * Fetches dust tokens from the backend API
 * @param {string} chainName - The normalized chain name (e.g., 'eth', 'arb', 'bsc')
 * @param {string} accountAddress - User's wallet address
 * @returns {Promise<Array>} Array of filtered and sorted dust tokens
 */
export const getTokens = async (chainName, accountAddress) => {
  try {
    const data = await getUserTokens(accountAddress, chainName);
    const filteredAndSortedTokens = data
      ? data
          .filter(token => token.price > 0)
          .filter(
            token =>
              !token.optimized_symbol.toLowerCase().includes("-") &&
              !token.optimized_symbol.toLowerCase().includes("/") &&
              token.optimized_symbol.toLowerCase() !== "usdc" &&
              token.optimized_symbol.toLowerCase() !== "usdt" &&
              token.optimized_symbol.toLowerCase() !== "eth" &&
              token.optimized_symbol.toLowerCase() !== "alp"
          )
          .filter(token => !token.protocol_id.includes("aave"))
          .filter(token => token.amount * token.price > 0.005)
          .sort((a, b) => b.amount * b.price - a.amount * a.price)
      : [];
    return filteredAndSortedTokens;
  } catch (error) {
    // Enhanced error handling using the service's built-in error handling
    const enhancedError = new Error(`Failed to fetch tokens: ${error.message}`);
    enhancedError.cause = error;
    throw enhancedError;
  }
};
