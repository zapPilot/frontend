"use client";

import React, { createContext, useContext } from "react";

interface BalanceVisibilityValue {
  balanceHidden: boolean;
  toggleBalanceVisibility: () => void;
}

const BalanceVisibilityContext = createContext<
  BalanceVisibilityValue | undefined
>(undefined);

export function BalanceVisibilityProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: BalanceVisibilityValue;
}) {
  return (
    <BalanceVisibilityContext.Provider value={value}>
      {children}
    </BalanceVisibilityContext.Provider>
  );
}

export function useBalanceVisibility() {
  const ctx = useContext(BalanceVisibilityContext);
  return (
    ctx || {
      balanceHidden: false,
      toggleBalanceVisibility: () => {
        // No-op default implementation
      },
    }
  );
}
