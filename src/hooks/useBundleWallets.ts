import { useCallback, useEffect, useState } from "react";
import { useUser } from "../contexts/UserContext";

interface BundleWallet {
  id: string;
  address: string;
  label: string;
  isActive: boolean;
  isMain: boolean;
  createdAt: string | null;
}

interface UseBundleWalletsConfig {
  enabled?: boolean;
}

interface UseBundleWalletsReturn {
  wallets: BundleWallet[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  totalWallets: number;
  visibleWallets: number;
  setActiveWallet: (walletId: string) => void;
}

/**
 * Hook to fetch and manage bundle wallets from analytics-engine
 */
export function useBundleWallets({
  enabled = true,
}: UseBundleWalletsConfig = {}): UseBundleWalletsReturn {
  const {
    userInfo,
    loading: userLoading,
    error: userError,
    connectedWallet,
  } = useUser();
  const [wallets, setWallets] = useState<BundleWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBundleWallets = useCallback(async () => {
    // Return early if hook is disabled
    if (!enabled) {
      return;
    }

    // Handle USER_NOT_FOUND scenarios
    if (userError === "USER_NOT_FOUND") {
      setError(userError);
      setWallets([]);
      setLoading(false);
      return;
    }

    // Return early if no user data available
    if (!userInfo?.userId) {
      // Clear data when no user info
      setWallets([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the existing bundle wallets data from UserContext if available
      if (userInfo.bundleWallets && userInfo.bundleWallets.length > 0) {
        // Transform existing user data to match the expected format
        const transformedWallets = userInfo.bundleWallets.map(
          (address, index) => ({
            id: `wallet-${index}`,
            address,
            label:
              address === userInfo.primaryWallet
                ? "Main Wallet"
                : `Wallet ${index + 1}`,
            isActive: index === 0, // First wallet is active by default
            isMain: address === userInfo.primaryWallet,

            createdAt: null,
          })
        );
        setWallets(transformedWallets);
      } else {
        // Fallback to single wallet if no bundle data
        setWallets([
          {
            id: "main-wallet",
            address: userInfo.primaryWallet,
            label: "Main Wallet",
            isActive: true,
            isMain: true,

            createdAt: null,
          },
        ]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to process bundle wallets";
      setError(errorMessage);
      console.error("Bundle wallets processing error:", err);

      // Fallback to single wallet on error
      if (connectedWallet) {
        setWallets([
          {
            id: "fallback-1",
            address: connectedWallet,
            label: "Main Wallet",
            isActive: true,
            isMain: true,

            createdAt: null,
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, userInfo, userError, connectedWallet]);

  const setActiveWallet = useCallback((walletId: string) => {
    setWallets(prev =>
      prev.map(wallet => ({
        ...wallet,
        isActive: wallet.id === walletId,
      }))
    );
  }, []);

  // Auto-fetch when user data is available or changes
  useEffect(() => {
    fetchBundleWallets();
  }, [fetchBundleWallets]);

  // Calculate metrics
  const totalWallets = wallets.length;
  const visibleWallets = wallets.length;

  return {
    wallets, // Only return visible wallets
    loading: loading || userLoading, // Include user loading state
    error: error || userError, // Include user errors
    refetch: fetchBundleWallets,
    totalWallets,
    visibleWallets,
    setActiveWallet,
  };
}
