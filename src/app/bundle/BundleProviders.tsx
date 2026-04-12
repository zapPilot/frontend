"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { GlobalErrorHandler } from "@/components/errors/GlobalErrorHandler";
import { UserProvider } from "@/contexts/UserContext";
import { QueryProvider } from "@/providers/QueryProvider";
import { SimpleWeb3Provider } from "@/providers/SimpleWeb3Provider";
import { ToastProvider } from "@/providers/ToastProvider";
import { WalletProvider } from "@/providers/WalletProvider";

const shouldLoadLogViewer =
  process.env.NODE_ENV === "development" &&
  process.env["NEXT_PUBLIC_ENABLE_LOG_VIEWER"] === "1";

const LogViewer = shouldLoadLogViewer
  ? dynamic(async () => {
      const mod = await import("@/components/debug/LogViewer");
      return mod.LogViewer;
    })
  : () => null;

interface BundleProvidersProps {
  children: ReactNode;
}

/**
 * Route-scoped providers for bundle pages.
 *
 * Keeping wallet/query providers out of the root layout reduces the amount of
 * app state that Next.js must include in the global layout graph during dev.
 */
export function BundleProviders({ children }: BundleProvidersProps) {
  return (
    <QueryProvider>
      <SimpleWeb3Provider>
        <WalletProvider>
          <UserProvider>
            <ErrorBoundary resetKeys={["user-context"]}>
              <GlobalErrorHandler />
              <ToastProvider>{children}</ToastProvider>
              <LogViewer />
            </ErrorBoundary>
          </UserProvider>
        </WalletProvider>
      </SimpleWeb3Provider>
    </QueryProvider>
  );
}
