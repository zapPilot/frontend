"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode } from "react";
import { queryClient } from "../lib/queryClient";

interface QueryProviderProps {
  children: ReactNode;
}

const enableDevtools =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_ENABLE_RQ_DEVTOOLS === "1";

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Enable React Query Devtools only when explicitly opted-in */}
      {enableDevtools && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}
