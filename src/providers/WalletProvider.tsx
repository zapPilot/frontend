/**
 * Simplified Wallet Provider for ThirdWeb Integration
 *
 * Direct integration with ThirdWeb SDK without abstraction layers.
 * Provides essential wallet functionality in a clean, maintainable way.
 */

"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  useActiveAccount,
  useActiveWallet,
  useActiveWalletChain,
  useConnect,
  useConnectedWallets,
  useDisconnect,
  useSetActiveWallet,
  useSwitchActiveWalletChain,
  useWalletBalance,
} from "thirdweb/react";

import type { WalletProviderInterface } from "@/types/domain/wallet";
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

type WalletContextValue = WalletProviderInterface;

// Context
const WalletContext = createContext<WalletContextValue | null>(null);

// Provider Props
interface WalletProviderProps {
  children: ReactNode;
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

function getWalletAddress(walletItem: {
  getAccount: () => { address?: string } | undefined | null;
}): string {
  return walletItem.getAccount()?.address ?? "";
}

function createWalletError(message: string, code: string): WalletError {
  return { message, code };
}

function handleWalletOperationError(
  setError: Dispatch<SetStateAction<WalletError | null>>,
  error: unknown,
  fallbackMessage: string,
  code: string,
  logPrefix: string
): never {
  const errorMessage = getErrorMessage(error, fallbackMessage);
  setError(createWalletError(errorMessage, code));
  walletLogger.error(logPrefix, error);
  throw error;
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
  const setActiveWallet = useSetActiveWallet();

  // Transform connectedWallets to simplified format with active state
  const walletList = useMemo(() => {
    return connectedWallets
      .map(wallet => {
        const address = getWalletAddress(wallet);
        return {
          address,
          isActive: address === account?.address,
        };
      })
      .filter(w => w.address);
  }, [connectedWallets, account?.address]);

  // Implement switchActiveWallet handler
  const handleSwitchActiveWallet = useCallback(
    async (address: string) => {
      const targetWallet = connectedWallets.find(
        walletItem => getWalletAddress(walletItem) === address
      );

      if (!targetWallet) {
        const errorMessage = `Wallet ${address} not found`;
        setError(createWalletError(errorMessage, "WALLET_NOT_FOUND"));
        throw new Error(errorMessage);
      }

      try {
        setError(null);
        await setActiveWallet(targetWallet);
        walletLogger.info("Switched active wallet to", address);
      } catch (err) {
        handleWalletOperationError(
          setError,
          err,
          "Failed to switch active wallet",
          "SWITCH_WALLET_ERROR",
          "Failed to switch active wallet:"
        );
      }
    },
    [connectedWallets, setActiveWallet]
  );

  // Simplified account state
  const walletAccount = useMemo((): SimplifiedWalletAccount | null => {
    if (!account?.address) return null;

    return {
      address: account.address,
      isConnected: true,
      balance: balance.data?.displayValue ?? "0",
    };
  }, [account?.address, balance.data?.displayValue]);

  // Simplified chain state
  const walletChain = useMemo((): SimplifiedChain | null => {
    if (!chain) return null;

    return {
      id: chain.id,
      name: chain.name ?? `Chain ${chain.id}`,
      symbol: chain.nativeCurrency?.symbol ?? "ETH",
    };
  }, [chain]);

  // Connection states
  const isConnected = Boolean(account?.address);
  const isConnecting = Boolean(!account?.address && wallet);
  const isDisconnecting = Boolean(account?.address && !wallet);

  // Error state management
  const [error, setError] = useState<WalletError | null>(null);
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Connect function
  const handleConnect = useCallback(async () => {
    if (!connect) return;

    try {
      setError(null);
      const availableWallet = connectedWallets[0];
      if (!availableWallet) {
        throw new Error("No wallet available");
      }

      await connect(availableWallet);
    } catch (err) {
      handleWalletOperationError(
        setError,
        err,
        "Failed to connect wallet",
        "CONNECT_ERROR",
        "Failed to connect wallet:"
      );
    }
  }, [connect, connectedWallets]);

  // Disconnect function
  const handleDisconnect = useCallback(async () => {
    if (!disconnect || !wallet) return;

    try {
      setError(null);
      await Promise.resolve(disconnect(wallet));
    } catch (err) {
      handleWalletOperationError(
        setError,
        err,
        "Failed to disconnect wallet",
        "DISCONNECT_ERROR",
        "Failed to disconnect wallet:"
      );
    }
  }, [disconnect, wallet]);

  // Switch chain function
  const handleSwitchChain = useCallback(
    async (chainId: number) => {
      if (!switchChain) return;

      try {
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

      // Multi-wallet support (V22 Phase 2A)
      connectedWallets: walletList,
      switchActiveWallet: handleSwitchActiveWallet,
      hasMultipleWallets: walletList.length > 1,
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
      walletList,
      handleSwitchActiveWallet,
    ]
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

// Hook to use the wallet context
export function useWalletProvider(): WalletProviderInterface {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWalletProvider must be used within a WalletProvider");
  }
  return context;
}
