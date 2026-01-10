import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Don't import statically if we want to reset modules effectively for env changes
// import { ConnectWalletButton } from "@/components/WalletManager/components/ConnectWalletButton";

vi.mock("thirdweb/react", () => ({
  ConnectButton: () => (
    <button data-testid="thirdweb-connect">Thirdweb Connect</button>
  ),
}));

vi.mock("@/utils/QueryClientBoundary", () => ({
  QueryClientBoundary: ({ children }: any) => <div>{children}</div>,
}));

describe("ConnectWalletButton", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders simple button in test environment", async () => {
    // Ensure VITEST is set (default in vitest runner)
    vi.stubEnv("VITEST", "true");

    // Dynamic import
    const { ConnectWalletButton } = await import(
      "@/components/WalletManager/components/ConnectWalletButton"
    );

    render(<ConnectWalletButton />);
    expect(screen.getByText("Connect Wallet")).toBeInTheDocument();
    expect(screen.queryByTestId("thirdweb-connect")).not.toBeInTheDocument();
  });

  it("renders Thirdweb ConnectButton in production environment", async () => {
    // Unset VITEST
    vi.stubEnv("VITEST", "");

    // Re-import
    const { ConnectWalletButton } = await import(
      "@/components/WalletManager/components/ConnectWalletButton"
    );

    render(<ConnectWalletButton />);
    expect(screen.getByTestId("thirdweb-connect")).toBeInTheDocument();
  });
});
