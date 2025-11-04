import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { render } from "../../test-utils";

// Mock WalletPortfolio to avoid heavy rendering
vi.mock("../../../src/components/WalletPortfolio", () => ({
  WalletPortfolio: () => <div data-testid="wallet-portfolio" />,
}));

// Mock Navigation to avoid heavy rendering
vi.mock("../../../src/components/Navigation", () => ({
  Navigation: ({ activeTab }: any) => (
    <div data-testid="navigation" data-tab={activeTab} />
  ),
}));

// Mock useUser to control connection state
let mockUser = {
  userInfo: { userId: "user-abc" },
  loading: false,
  error: null as string | null,
  isConnected: true,
  connectedWallet: "0xabc",
  refetch: vi.fn(),
};

vi.mock("../../../src/contexts/UserContext", () => ({
  useUser: () => mockUser,
}));

// Spy on router.replace
const replaceSpy = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceSpy }),
}));

import DashboardApp from "../../../src/app/page";

describe("DashboardApp redirect to bundle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: connected with userId
    mockUser = {
      userInfo: { userId: "user-abc" },
      loading: false,
      error: null,
      isConnected: true,
      connectedWallet: "0xabc",
      refetch: vi.fn(),
    };
  });

  it("does not redirect when not connected", async () => {
    mockUser.isConnected = false;
    window.history.pushState({}, "", "/");

    await act(async () => {
      render(<DashboardApp />);
      await Promise.resolve();
    });

    expect(replaceSpy).not.toHaveBeenCalled();
  });

  it("does not redirect when not on root path", async () => {
    window.history.pushState({}, "", "/some/other/path");

    await act(async () => {
      render(<DashboardApp />);
      await Promise.resolve();
    });

    expect(replaceSpy).not.toHaveBeenCalled();
  });
});
