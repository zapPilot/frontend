"use client";

import {
  createContext,
  type ReactElement,
  type ReactNode,
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

import {
  buildWalletAccount,
  buildWalletChain,
  buildWalletList,
  createChainSwitchTarget,
  getWalletAddress,
  handleWalletOperationError,
  type SimplifiedChain,
  type SimplifiedWalletAccount,
  type WalletError,
} from "@/providers/walletProviderUtils";
import type { WalletProviderInterface } from "@/types";
import { walletLogger } from "@/utils/logger";
import THIRDWEB_CLIENT from "@/utils/thirdweb";

type WalletContextValue = WalletProviderInterface;

const WalletContext = createContext<WalletContextValue | null>(null);

interface WalletProviderProps {
  children: ReactNode;
}
export function WalletProvider({
  children,
}: WalletProviderProps): ReactElement {
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
  const [error, setError] = useState<WalletError | null>(null);

  const walletList = useMemo(() => {
    return buildWalletList(connectedWallets, account?.address);
  }, [connectedWallets, account?.address]);

  const handleSwitchActiveWallet = useCallback(
    async (address: string): Promise<void> => {
      const targetWallet = connectedWallets.find(
        walletItem => getWalletAddress(walletItem) === address
      );

      if (!targetWallet) {
        const errorMessage = `Wallet ${address} not found`;
        setError({ message: errorMessage, code: "WALLET_NOT_FOUND" });
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

  const walletAccount = useMemo((): SimplifiedWalletAccount | null => {
    return buildWalletAccount(account?.address, balance.data?.displayValue);
  }, [account?.address, balance.data?.displayValue]);

  const walletChain = useMemo((): SimplifiedChain | null => {
    return buildWalletChain(chain);
  }, [chain]);

  const isConnected = Boolean(account?.address);
  const isConnecting = Boolean(!account?.address && wallet);
  const isDisconnecting = Boolean(account?.address && !wallet);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

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

  const handleSwitchChain = useCallback(
    async (chainId: number): Promise<void> => {
      if (!switchChain) return;

      try {
        await switchChain(createChainSwitchTarget(chainId));
      } catch (err) {
        walletLogger.error("Failed to switch chain:", err);
        throw err;
      }
    },
    [switchChain]
  );

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

  const contextValue = useMemo<WalletContextValue>(
    () => ({
      account: walletAccount,
      chain: walletChain,
      switchChain: handleSwitchChain,
      connect: handleConnect,
      disconnect: handleDisconnect,
      isConnecting,
      isDisconnecting,
      isConnected,
      error,
      clearError,
      signMessage,
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

export function useWalletProvider(): WalletProviderInterface {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWalletProvider must be used within a WalletProvider");
  }
  return context;
}
