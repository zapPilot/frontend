import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardApp from "../../../src/app/page";
import { render } from "../../test-utils";

// Mock WalletPortfolio to avoid heavy rendering
vi.mock("../../../src/components/wallet/portfolio/WalletPortfolio", () => ({
  WalletPortfolio: () => <div data-testid="wallet-portfolio" />,
}));

// Mock Navigation to avoid heavy rendering
vi.mock("../../../src/components/Navigation", () => ({
  Navigation: ({ activeTab }: any) => (
    <div data-testid="navigation" data-tab={activeTab} />
  ),
}));

vi.mock("@/components/DashboardShell", () => ({
  DashboardShell: () => <div data-testid="dashboard-shell" />,
}));

vi.mock("@/components/WalletManager", () => ({
  WalletManager: () => null,
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
const hoisted = vi.hoisted(() => ({
  replaceSpy: vi.fn(),
  pathname: "/",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: hoisted.replaceSpy }),
  useSearchParams: () => new URLSearchParams(""),
  usePathname: () => hoisted.pathname,
}));

describe("DashboardApp redirect to bundle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.pathname = "/";
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

    await act(async () => {
      render(<DashboardApp />);
      await Promise.resolve();
    });

    expect(hoisted.replaceSpy).not.toHaveBeenCalled();
  });

  it("does not redirect when not on root path", async () => {
    hoisted.pathname = "/some/other/path";

    await act(async () => {
      render(<DashboardApp />);
      await Promise.resolve();
    });

    expect(hoisted.replaceSpy).not.toHaveBeenCalled();
  });
});
