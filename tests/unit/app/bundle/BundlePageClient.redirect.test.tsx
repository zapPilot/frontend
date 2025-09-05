import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "../../../test-utils";

// Capture props from WalletPortfolio
const walletPortfolioSpy = vi.fn();
vi.mock("../../../../src/components/WalletPortfolio", () => ({
  WalletPortfolio: (props: any) => {
    walletPortfolioSpy(props);
    return <div data-testid="wallet-portfolio" />;
  },
}));

// Mock Navigation to avoid heavy rendering
vi.mock("../../../../src/components/Navigation", () => ({
  Navigation: ({ activeTab }: any) => (
    <div data-testid="navigation" data-tab={activeTab} />
  ),
}));

// Mock useUser
let mockUser = {
  userInfo: { userId: "owner-1" },
  loading: false,
  error: null as string | null,
  isConnected: true,
  connectedWallet: "0xabc",
  refetch: vi.fn(),
};
vi.mock("../../../../src/contexts/UserContext", () => ({
  useUser: () => mockUser,
}));

// Spy on router.replace
const replaceSpy = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceSpy }),
}));

import { BundlePageClient } from "../../../../src/app/bundle/[userId]/BundlePageClient";

describe("BundlePageClient behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    walletPortfolioSpy.mockClear();
    mockUser = {
      userInfo: { userId: "owner-1" },
      loading: false,
      error: null,
      isConnected: true,
      connectedWallet: "0xabc",
      refetch: vi.fn(),
    };
  });

  it("passes urlUserId to WalletPortfolio", async () => {
    await act(async () => {
      render(<BundlePageClient userId="viewer-9" />);
      await Promise.resolve();
    });

    expect(walletPortfolioSpy).toHaveBeenCalled();
    const props = walletPortfolioSpy.mock.calls[0][0];
    expect(props.urlUserId).toBe("viewer-9");
  });

  it("does not redirect when viewing someone else's bundle while disconnected", async () => {
    mockUser.isConnected = false;
    mockUser.userInfo = { userId: "owner-1" } as any;
    window.history.pushState({}, "", "/bundle/other");

    await act(async () => {
      render(<BundlePageClient userId="other" />);
      await Promise.resolve();
    });

    expect(replaceSpy).not.toHaveBeenCalled();
  });
});
