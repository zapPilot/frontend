/**
 * Simplified Wallet Provider for ThirdWeb Integration
 *
 * Direct integration with ThirdWeb SDK without abstraction layers.
 * Provides essential wallet functionality in a clean, maintainable way.
 */

"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";
import {
  useActiveAccount,
  useActiveWallet,
  useActiveWalletChain,
  useConnect,
  useConnectedWallets,
  useDisconnect,
  useSwitchActiveWalletChain,
  useWalletBalance,
} from "thirdweb/react";

import { walletLogger } from "@/utils/logger";
// Chain types are handled internally
import THIRDWEB_CLIENT from "@/utils/thirdweb";

// Essential types for simplified wallet
interface SimplifiedWalletAccount {
  address: string;
  isConnected: boolean;
  balance?: string;
}

interface SimplifiedChain {
  id: number;
  name: string;
  symbol: string;
}

interface WalletError {
  message: string;
  code?: string;
}

// Context interface
interface WalletContextValue {
  // Account
  account: SimplifiedWalletAccount | null;

  // Chain
  chain: SimplifiedChain | null;
  switchChain: (chainId: number) => Promise<void>;

  // Connection
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  isDisconnecting: boolean;

  // Status
  isConnected: boolean;
  error: WalletError | null;
  clearError: () => void;

  // Signing
  signMessage: (message: string) => Promise<string>;
}

// Context
const WalletContext = createContext<WalletContextValue | null>(null);

// Provider Props
interface WalletProviderProps {
  children: ReactNode;
}

// Main Provider Component
export function WalletProvider({ children }: WalletProviderProps) {
  // ThirdWeb hooks
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();
  const balance = useWalletBalance({
    chain,
    address: account?.address,
    client: THIRDWEB_CLIENT,
  });
  const connectedWallets = useConnectedWallets();

  // Simplified account state
  const walletAccount = useMemo((): SimplifiedWalletAccount | null => {
    if (!account?.address) return null;

    return {
      address: account.address,
      isConnected: true,
      balance: balance.data?.displayValue || "0",
    };
  }, [account?.address, balance.data?.displayValue]);

  // Simplified chain state
  const walletChain = useMemo((): SimplifiedChain | null => {
    if (!chain) return null;

    return {
      id: chain.id,
      name: chain.name || `Chain ${chain.id}`,
      symbol: chain.nativeCurrency?.symbol || "ETH",
    };
  }, [chain]);

  // Connection states
  const isConnected = Boolean(account?.address);
  const isConnecting = Boolean(!account?.address && wallet);
  const isDisconnecting = Boolean(account?.address && !wallet);

  // Error state (simplified - could be enhanced)
  const error: WalletError | null = null;
  const clearError = useCallback(() => {
    // In a more complex implementation, you'd manage error state here
  }, []);

  // Connect function
  const handleConnect = useCallback(async () => {
    if (!connect) return;

    try {
      // Get the first available wallet from connected wallets
      // In a real app, you might want wallet selection UI
      const availableWallet = connectedWallets[0];
      if (availableWallet) {
        await connect(availableWallet);
      } else {
        throw new Error("No wallet available");
      }
    } catch (err) {
      walletLogger.error("Failed to connect wallet:", err);
      throw err;
    }
  }, [connect, connectedWallets]);

  // Disconnect function
  const handleDisconnect = useCallback(async () => {
    if (!disconnect || !wallet) return;

    try {
      await Promise.resolve(disconnect(wallet));
    } catch (err) {
      walletLogger.error("Failed to disconnect wallet:", err);
      throw err;
    }
  }, [disconnect, wallet]);

  // Switch chain function
  const handleSwitchChain = useCallback(
    async (chainId: number) => {
      if (!switchChain) return;

      try {
        // Create basic chain object
        const chainToSwitch = {
          id: chainId,
          name: `Chain ${chainId}`,
          rpc: `https://rpc-${chainId}.example.com`, // This should be configured properly
          nativeCurrency: {
            name: "ETH",
            symbol: "ETH",
            decimals: 18,
          },
        };

        await switchChain(chainToSwitch);
      } catch (err) {
        walletLogger.error("Failed to switch chain:", err);
        throw err;
      }
    },
    [switchChain]
  );

  // Sign message function
  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!account) {
        throw new Error("No account connected");
      }

      try {
        const signature = await Promise.resolve(
          account.signMessage({ message })
        );
        return signature;
      } catch (err) {
        walletLogger.error("Failed to sign message:", err);
        throw err;
      }
    },
    [account]
  );

  // Context value
  const contextValue = useMemo<WalletContextValue>(
    () => ({
      // Account
      account: walletAccount,

      // Chain
      chain: walletChain,
      switchChain: handleSwitchChain,

      // Connection
      connect: handleConnect,
      disconnect: handleDisconnect,
      isConnecting,
      isDisconnecting,

      // Status
      isConnected,
      error,
      clearError,

      // Signing
      signMessage,
    }),
    [
      walletAccount,
      walletChain,
      handleSwitchChain,
      handleConnect,
      handleDisconnect,
      isConnecting,
      isDisconnecting,
      isConnected,
      error,
      clearError,
      signMessage,
    ]
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

// Hook to use the wallet context
export function useWalletProvider() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWalletProvider must be used within a WalletProvider");
  }
  return context;
}
