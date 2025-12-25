import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BundlePageClient } from "@/app/bundle/BundlePageClient";

import { render } from "../../../test-utils";

// Mock lightweight child components to avoid heavy hooks
vi.mock("@/components/Navigation", () => ({
  Navigation: () => null,
}));

vi.mock("@/components/wallet/portfolio/WalletPortfolio", () => ({
  WalletPortfolio: () => <div data-testid="wallet-portfolio" />,
}));

vi.mock("@/components/DashboardShell", () => ({
  DashboardShell: ({
    headerBanners,
    footerOverlays,
  }: {
    headerBanners?: unknown;
    footerOverlays?: unknown;
  }) => (
    <div data-testid="dashboard-shell">
      <div data-testid="dashboard-header-banners">{headerBanners}</div>
      <div data-testid="dashboard-footer-overlays">{footerOverlays}</div>
    </div>
  ),
}));

vi.mock("@/components/WalletManager", () => ({
  WalletManager: () => null,
}));

// Router mock
const replaceMock = vi.fn();
vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<any>("next/navigation");
  return {
    ...actual,
    useRouter: () => ({ replace: replaceMock }),
  };
});

// User context mock (we'll override return values per test)
let mockIsConnected = false;
let mockUserId: string | null = null;
let mockConnectedWallet: string | null = null;
vi.mock("@/contexts/UserContext", () => ({
  useUser: () => ({
    userInfo: mockUserId ? { userId: mockUserId } : null,
    isConnected: mockIsConnected,
    loading: false,
    error: null,
    connectedWallet: mockConnectedWallet,
    refetch: () => {
      /* Mock refetch */
    },
  }),
}));

describe("BundlePageClient switch prompt", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    mockIsConnected = false;
    mockUserId = null;
    mockConnectedWallet = null;
    // Default URL
    window.history.pushState({}, "", "/bundle?userId=OWNER123&foo=bar");
  });

  it("allows staying on the current bundle (banner persists)", async () => {
    mockIsConnected = true;
    mockUserId = "ME456"; // different user
    mockConnectedWallet = "0xME456";

    await act(async () => {
      render(<BundlePageClient userId="OWNER123" />);
    });

    const switchBtn = await screen.findByTestId("switch-to-my-bundle");
    expect(switchBtn).toBeInTheDocument();

    // Click Stay (should be no-op, banner persists)
    await act(async () => {
      await userEvent.click(screen.getByText(/stay/i));
    });

    // Banner should still be visible (no permanent dismissal)
    expect(screen.queryByTestId("switch-to-my-bundle")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("does not show prompt when viewing own bundle", async () => {
    mockIsConnected = true;
    mockUserId = "OWNER123"; // same as URL
    mockConnectedWallet = "0xOWNER123";

    await act(async () => {
      render(<BundlePageClient userId="OWNER123" />);
    });

    expect(screen.queryByTestId("switch-to-my-bundle")).not.toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
