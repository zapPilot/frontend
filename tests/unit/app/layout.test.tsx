import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import RootLayout from "@/app/layout";

// Mock fonts
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

// Mock providers and components
vi.mock("@/components/debug/LogViewer", () => ({
  LogViewer: () => <div data-testid="log-viewer">LogViewer</div>,
}));

vi.mock("@/components/errors/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

vi.mock("@/components/errors/GlobalErrorHandler", () => ({
  GlobalErrorHandler: () => (
    <div data-testid="global-error-handler">GlobalErrorHandler</div>
  ),
}));

vi.mock("@/contexts/UserContext", () => ({
  UserProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="user-provider">{children}</div>
  ),
}));

vi.mock("@/providers/QueryProvider", () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="query-provider">{children}</div>
  ),
}));

vi.mock("@/providers/SimpleWeb3Provider", () => ({
  SimpleWeb3Provider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="simple-web3-provider">{children}</div>
  ),
}));

vi.mock("@/providers/ToastProvider", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="toast-provider">{children}</div>
  ),
}));

vi.mock("@/providers/WalletProvider", () => ({
  WalletProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="wallet-provider">{children}</div>
  ),
}));

describe("RootLayout", () => {
  it("renders children wrapped in providers", () => {
    // Note: RootLayout is a server component, but we can test the JSX output structure in unit tests
    // assuming no implementation details strictly depend on server-only features during render.
    // However, vitest runs in jsdom which is broadly compatible.

    render(
      <RootLayout>
        <div data-testid="child-content">Child Content</div>
      </RootLayout>
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByTestId("user-provider")).toBeInTheDocument();
    expect(screen.getByTestId("query-provider")).toBeInTheDocument();
    expect(screen.getByTestId("wallet-provider")).toBeInTheDocument();
  });
});
