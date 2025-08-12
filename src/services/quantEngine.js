/**
 * API service for quant-engine integration
 */

const QUANT_ENGINE_URL =
  process.env.NEXT_PUBLIC_QUANT_ENGINE_URL || "http://localhost:8003";

/**
 * Get user information by main wallet address
 * @param {string} walletAddress - Main wallet address
 * @returns {Promise<Object>} User information
 */
export const getUserByWallet = async walletAddress => {
  const response = await fetch(
    `${QUANT_ENGINE_URL}/api/v1/users/by-wallet/${walletAddress}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("User not found");
    }
    throw new Error(`Failed to fetch user data: ${response.status}`);
  }

  return response.json();
};

/**
 * Get bundle wallet addresses by primary wallet
 * @param {string} walletAddress - Primary wallet address
 * @returns {Promise<Array>} Array of bundle wallet addresses
 */
export const getBundleWalletsByPrimary = async userId => {
  const response = await fetch(
    `${QUANT_ENGINE_URL}/api/v1/users/${userId}/bundle-wallets`
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Bundle wallets not found");
    }
    throw new Error(`Failed to fetch bundle wallets: ${response.status}`);
  }

  return response.json();
};

/**
 * Get portfolio snapshots for a user
 * @param {string} userId - User ID (UUID)
 * @param {number} limit - Maximum number of records
 * @param {number} offset - Number of records to skip
 * @returns {Promise<Array>} Array of portfolio snapshots
 */
export const getPortfolioSnapshots = async (
  userId,
  limit = 100,
  offset = 0
) => {
  const response = await fetch(
    `${QUANT_ENGINE_URL}/api/v1/portfolio-snapshots/by-user/${userId}?limit=${limit}&offset=${offset}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch portfolio snapshots: ${response.status}`);
  }

  return response.json();
};

/**
 * Get portfolio trends for a user
 * @param {string} userId - User ID (UUID)
 * @param {number} days - Number of days to include in trend
 * @param {number} limit - Maximum number of data points
 * @returns {Promise<Array>} Array of portfolio trend data
 */
export const getPortfolioTrends = async (userId, days = 30, limit = 100) => {
  const response = await fetch(
    `${QUANT_ENGINE_URL}/api/v1/portfolio-trends/by-user/${userId}?days=${days}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch portfolio trends: ${response.status}`);
  }

  return response.json();
};

/**
 * Get portfolio summary for a user
 * @param {string} userId - User ID (UUID)
 * @param {boolean} includeCategories - Whether to include asset categories
 * @returns {Promise<Object>} Portfolio summary payload
 */
export const getPortfolioSummary = async (
  userId,
  includeCategories = false
) => {
  let url = `${QUANT_ENGINE_URL}/api/v1/portfolio-summary/by-user/${userId}`;
  if (includeCategories) {
    url += "?include_categories=true";
  }
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch portfolio summary: ${response.status}`);
  }

  return response.json();
};

/**
 * Transform quant-engine portfolio trends data into PortfolioDataPoint format
 * @param {Array} trendsData - Raw trends data from API
 * @returns {Array} Transformed data for charts
 */
export const transformPortfolioTrends = trendsData => {
  // Group by date and sum net_value_usd
  const groupedByDate = trendsData.reduce((acc, item) => {
    const date = item.date;
    if (!acc[date]) {
      acc[date] = {
        date,
        totalValue: 0,
        protocols: [],
        chains: new Set(),
      };
    }
    acc[date].totalValue += item.net_value_usd;
    acc[date].protocols.push({
      protocol: item.protocol,
      chain: item.chain,
      value: item.net_value_usd,
      pnl: item.pnl_usd,
    });
    acc[date].chains.add(item.chain);
    return acc;
  }, {});

  // Convert to array and sort by date
  const sortedData = Object.values(groupedByDate).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  // Calculate daily changes and format for chart
  return sortedData.map((item, index) => {
    const prevValue =
      index > 0 ? sortedData[index - 1].totalValue : item.totalValue;
    const change =
      prevValue > 0 ? ((item.totalValue - prevValue) / prevValue) * 100 : 0;

    return {
      date: item.date,
      value: item.totalValue,
      change,
      benchmark: item.totalValue * 0.95, // Mock benchmark - 5% below actual
      protocols: item.protocols,
      chainsCount: item.chains.size,
    };
  });
};

/**
 * Transform bundle addresses API response to WalletAddress format
 * @param {Object} bundleData - Raw bundle data from API
 * @returns {Array} Transformed wallet addresses for UI
 */
export const transformBundleWallets = bundleData => {
  if (!bundleData || !bundleData.bundle_wallets) {
    return [];
  }

  const wallets = [];

  // Add primary wallet first
  wallets.push({
    id: "primary",
    address: bundleData.primary_wallet,
    label: "Main Wallet",
    isActive: true,
    isMain: true,
    isVisible: true,
    createdAt: null,
  });

  // Add additional wallets
  bundleData.additional_wallets?.forEach((wallet, index) => {
    wallets.push({
      id: wallet.wallet_address,
      address: wallet.wallet_address,
      label: wallet.label || `Wallet ${index + 2}`, // Auto-generate labels
      isActive: false,
      isMain: wallet.is_main || false,
      isVisible: wallet.is_visible !== false, // Default to visible
      createdAt: wallet.created_at,
    });
  });

  return wallets;
};
