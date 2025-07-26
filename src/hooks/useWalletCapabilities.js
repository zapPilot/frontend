import { useCallback, useMemo, useRef } from "react";
import { useActiveAccount } from "thirdweb/react";

/**
 * Hook for detecting wallet capabilities and optimal batch sizes
 */
export const useWalletCapabilities = () => {
  const activeAccount = useActiveAccount();
  const capabilitiesCacheRef = useRef(new Map());

  // Wallet batch size configurations based on wallet type and capabilities
  const WALLET_BATCH_CONFIGS = useMemo(
    () => ({
      // EIP-5792 compliant wallets (support sendCalls natively)
      eip5792: {
        maxBatchSize: 50,
        description: "EIP-5792 compliant wallet",
        features: ["sendCalls", "atomicBatching", "largeTransactions"],
      },

      // MetaMask specific configurations
      metamask: {
        maxBatchSize: 20,
        description: "MetaMask wallet",
        features: ["multipleConfirmations", "gasEstimation"],
      },

      // WalletConnect wallets
      walletConnect: {
        maxBatchSize: 15,
        description: "WalletConnect wallet",
        features: ["remoteConfirmation", "crossDevice"],
      },

      // Coinbase Wallet
      coinbase: {
        maxBatchSize: 25,
        description: "Coinbase Wallet",
        features: ["gaslessTransactions", "smartContractWallet"],
      },

      // Trust Wallet
      trust: {
        maxBatchSize: 18,
        description: "Trust Wallet",
        features: ["mobileOptimized", "multiChain"],
      },

      // Rainbow Wallet
      rainbow: {
        maxBatchSize: 22,
        description: "Rainbow Wallet",
        features: ["gasOptimization", "socialFeatures"],
      },

      // Default fallback for unknown wallets
      default: {
        maxBatchSize: 10,
        description: "Unknown wallet",
        features: ["basic"],
      },
    }),
    []
  );

  /**
   * Detect wallet type based on account properties
   */
  const detectWalletType = useCallback(account => {
    if (!account) return "default";

    // Check for EIP-5792 support first (highest priority)
    if (account.sendCalls || account.sendCallsAsync) {
      return "eip5792";
    }

    // Check wallet ID if available
    const walletId = account.walletId?.toLowerCase() || "";

    if (walletId.includes("metamask")) return "metamask";
    if (walletId.includes("walletconnect")) return "walletConnect";
    if (walletId.includes("coinbase")) return "coinbase";
    if (walletId.includes("trust")) return "trust";
    if (walletId.includes("rainbow")) return "rainbow";

    // Check user agent for browser-based detection
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (userAgent.includes("metamask")) return "metamask";

      // Check for injected providers
      if (window.ethereum) {
        if (window.ethereum.isMetaMask) return "metamask";
        if (window.ethereum.isCoinbaseWallet) return "coinbase";
        if (window.ethereum.isTrust) return "trust";
      }
    }

    return "default";
  }, []);

  /**
   * Get wallet capabilities with caching
   */
  const getWalletCapabilities = useCallback(
    async account => {
      if (!account) return WALLET_BATCH_CONFIGS.default;

      const cacheKey = account.address;

      // Check cache first
      if (capabilitiesCacheRef.current.has(cacheKey)) {
        return capabilitiesCacheRef.current.get(cacheKey);
      }

      const walletType = detectWalletType(account);
      const baseConfig = WALLET_BATCH_CONFIGS[walletType];

      // Enhance with runtime capability detection
      const enhancedConfig = {
        ...baseConfig,
        walletType,
        address: account.address,

        // Runtime capability checks
        supportsSendCalls: !!(account.sendCalls || account.sendCallsAsync),
        supportsAtomicBatching: walletType === "eip5792",

        // Dynamic batch size adjustment based on network and wallet state
        dynamicBatchSize: await calculateDynamicBatchSize(walletType),

        // Performance characteristics
        estimatedConfirmationTime: getEstimatedConfirmationTime(walletType),
        gasEstimationAccuracy: getGasEstimationAccuracy(walletType),
      };

      // Cache the result
      capabilitiesCacheRef.current.set(cacheKey, enhancedConfig);

      return enhancedConfig;
    },
    [detectWalletType, WALLET_BATCH_CONFIGS]
  );

  /**
   * Calculate dynamic batch size based on wallet and network conditions
   */
  const calculateDynamicBatchSize = useCallback(
    async walletType => {
      const baseSize = WALLET_BATCH_CONFIGS[walletType]?.maxBatchSize || 10;

      try {
        // Adjust based on network congestion (simplified)
        const networkFactor = await getNetworkCongestionFactor();

        // Adjust based on wallet performance (could be enhanced with historical data)
        const walletFactor = getWalletPerformanceFactor(walletType);

        // Calculate adjusted batch size
        const adjustedSize = Math.floor(
          baseSize * networkFactor * walletFactor
        );

        // Ensure minimum batch size of 5 and maximum of base size
        return Math.max(5, Math.min(adjustedSize, baseSize));
      } catch (error) {
        console.warn("Error calculating dynamic batch size:", error);
        return baseSize;
      }
    },
    [WALLET_BATCH_CONFIGS]
  );

  /**
   * Get estimated confirmation time for wallet type
   */
  const getEstimatedConfirmationTime = useCallback(walletType => {
    const timingMap = {
      eip5792: 2000, // 2 seconds - native support
      metamask: 5000, // 5 seconds - multiple confirmations
      walletConnect: 8000, // 8 seconds - remote confirmation
      coinbase: 4000, // 4 seconds - smart wallet features
      trust: 6000, // 6 seconds - mobile optimization
      rainbow: 5000, // 5 seconds - standard wallet
      default: 10000, // 10 seconds - conservative estimate
    };

    return timingMap[walletType] || timingMap.default;
  }, []);

  /**
   * Get gas estimation accuracy for wallet type
   */
  const getGasEstimationAccuracy = useCallback(walletType => {
    const accuracyMap = {
      eip5792: 0.95, // 95% accuracy - native support
      metamask: 0.9, // 90% accuracy - good gas estimation
      coinbase: 0.88, // 88% accuracy - smart wallet
      rainbow: 0.85, // 85% accuracy - optimization features
      trust: 0.82, // 82% accuracy - mobile focused
      walletConnect: 0.8, // 80% accuracy - remote processing
      default: 0.75, // 75% accuracy - conservative
    };

    return accuracyMap[walletType] || accuracyMap.default;
  }, []);

  /**
   * Get network congestion factor (simplified implementation)
   */
  const getNetworkCongestionFactor = useCallback(async () => {
    // In a real implementation, this would check current gas prices,
    // mempool size, or other network indicators
    // For now, return a default factor
    return 0.9; // Slightly reduce batch size for network safety
  }, []);

  /**
   * Get wallet performance factor based on historical data
   */
  const getWalletPerformanceFactor = useCallback(walletType => {
    const performanceMap = {
      eip5792: 1.0, // Optimal performance
      metamask: 0.95, // Very good performance
      coinbase: 0.92, // Good performance with smart features
      rainbow: 0.9, // Good performance
      trust: 0.88, // Good mobile performance
      walletConnect: 0.85, // Decent remote performance
      default: 0.8, // Conservative for unknown wallets
    };

    return performanceMap[walletType] || performanceMap.default;
  }, []);

  /**
   * Chunk transactions into optimal batches for the current wallet
   */
  const chunkTransactionsForWallet = useCallback(
    async (transactions, account) => {
      if (!transactions || transactions.length === 0) return [];

      const capabilities = await getWalletCapabilities(account);
      const batchSize = capabilities.dynamicBatchSize;

      const chunks = [];
      for (let i = 0; i < transactions.length; i += batchSize) {
        chunks.push(transactions.slice(i, i + batchSize));
      }

      return chunks;
    },
    [getWalletCapabilities]
  );

  /**
   * Current wallet capabilities (memoized)
   */
  const currentCapabilities = useMemo(async () => {
    if (!activeAccount) return WALLET_BATCH_CONFIGS.default;
    return await getWalletCapabilities(activeAccount);
  }, [activeAccount, getWalletCapabilities]);

  return {
    // Core functions
    detectWalletType,
    getWalletCapabilities,
    chunkTransactionsForWallet,

    // Utility functions
    getEstimatedConfirmationTime,
    getGasEstimationAccuracy,

    // Current wallet data
    currentCapabilities,
    activeAccount,

    // Configuration
    WALLET_BATCH_CONFIGS,
  };
};
