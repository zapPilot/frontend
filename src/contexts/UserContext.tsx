"use client";

import { createContext, ReactNode, useContext } from "react";
import { useCurrentUser, type UserInfo } from "../hooks/queries/useUserQuery";

// Types are now imported from useUserQuery hook

interface UserContextType {
  userInfo: UserInfo | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  connectedWallet: string | null;
  refetch: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  // Use React Query hook for all user data management
  const {
    userInfo,
    isLoading: loading,
    error,
    isConnected,
    connectedWallet,
    refetch,
  } = useCurrentUser();

  const value: UserContextType = {
    userInfo,
    loading,
    error,
    isConnected,
    connectedWallet,
    refetch,
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
