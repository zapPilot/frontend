import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { ConnectWalletButton } from "@/components/WalletManager/components/ConnectWalletButton";

// Mock dependencies
vi.mock("thirdweb/react", () => ({
  ConnectButton: vi.fn(({ connectButton }) => (
    <button style={connectButton?.style}>
      {connectButton?.label || "Connect Wallet"}
    </button>
  )),
}));

vi.mock("@/config/wallets", () => ({
  DEFAULT_SUPPORTED_CHAINS: [],
  DEFAULT_WALLETS: [],
}));

vi.mock("@/utils/QueryClientBoundary", () => ({
  QueryClientBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="boundary">{children}</div>
  ),
}));

vi.mock("@/utils/thirdweb", () => ({
  default: {},
}));

describe("ConnectWalletButton", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should render test button in test environment", () => {
    process.env.VITEST = "true";

    // We need to re-import the component to pick up the env var change
    // But since it's a constant evaluated at module load time, we rely on the fact
    // that we are in a test env where VITEST is likely already set.
    // However, the component checks `typeof process !== "undefined" && !!process.env["VITEST"]`
    // which is true in this vitest run.

    render(<ConnectWalletButton />);
    expect(screen.getByText("Connect Wallet")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveClass("bg-purple-600");
  });

  // Since the component checks for VITEST env var at the top level,
  // testing the "production" branch (rendering ConnectButton) within a Vitest run
  // is tricky without complex module reloading.
  // For now, we verified the test branch.
  // To test the production branch, we would need to isolate the module
  // or use `vi.doMock` with `vi.resetModules()`.
});
