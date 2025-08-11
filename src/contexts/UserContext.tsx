"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useActiveAccount } from "thirdweb/react";
import {
  getBundleWalletsByPrimary,
  getUserByWallet,
} from "../services/quantEngine";

interface UserInfo {
  userId: string;
  email: string;
  primaryWallet: string;
  bundleWallets: string[];
  additionalWallets: Array<{
    wallet_address: string;
    label: string | null;
    is_main: boolean;
    is_visible: boolean;
    created_at: string;
  }>;
  visibleWallets: string[];
  totalWallets: number;
  totalVisibleWallets: number;
}

interface UserContextType {
  userInfo: UserInfo | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  connectedWallet: string | null;
  fetchUserInfo: () => Promise<void>;
  clearUserInfo: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeAccount = useActiveAccount();
  const connectedWallet = activeAccount?.address || null;
  const isConnected = !!connectedWallet;

  const fetchUserInfo = useCallback(async () => {
    if (!connectedWallet) {
      setUserInfo(null);
      setError("No wallet connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First get user by wallet to get userId
      const userResponse = await getUserByWallet(connectedWallet);
      // Then get bundle wallets using userId
      const bundleResponse = await getBundleWalletsByPrimary(userResponse.id);
      setUserInfo({
        userId: bundleResponse.user.id,
        email: bundleResponse.user.email,
        primaryWallet: bundleResponse.main_wallet,
        additionalWallets: bundleResponse.additional_wallets || [],
        visibleWallets: bundleResponse.visible_wallets || [],
        totalWallets: bundleResponse.total_wallets || 0,
        totalVisibleWallets: bundleResponse.total_visible_wallets || 0,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch user info";
      setError(errorMessage);
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  }, [connectedWallet]);

  const clearUserInfo = useCallback(() => {
    setUserInfo(null);
    setError(null);
  }, []);

  // Auto-fetch user info when wallet connects/changes
  useEffect(() => {
    if (connectedWallet) {
      fetchUserInfo();
    } else {
      clearUserInfo();
    }
  }, [connectedWallet, fetchUserInfo, clearUserInfo]);

  const value: UserContextType = {
    userInfo,
    loading,
    error,
    isConnected,
    connectedWallet,
    fetchUserInfo,
    clearUserInfo,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

export default UserContext;
