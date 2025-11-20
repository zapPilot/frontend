import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WalletPortfolioPresenter } from "@/components/wallet/WalletPortfolioPresenter";
import type { WalletPortfolioViewModel } from "@/hooks/useWalletPortfolioState";

const walletHeaderSpy = vi.fn();
const walletMetricsSpy = vi.fn();
const walletActionsSpy = vi.fn();
const portfolioOverviewSpy = vi.fn();
const walletManagerSpy = vi.fn();
const balanceProviderSpy = vi.fn();
const errorBoundarySpy = vi.fn();

vi.mock("next/dynamic", () => ({
  default: () => (props: any) => {
    walletManagerSpy(props);
    return <div data-testid="wallet-manager" data-open={props.isOpen} />;
  },
}));

vi.mock("@/components/wallet/WalletHeader", () => ({
  WalletHeader: (props: any) => {
    walletHeaderSpy(props);
    return <div data-testid="wallet-header" />;
  },
}));

vi.mock("@/components/wallet/WalletMetrics", () => ({
  WalletMetrics: (props: any) => {
    walletMetricsSpy(props);
    return <div data-testid="wallet-metrics" />;
  },
}));

vi.mock("@/components/wallet/WalletActions", () => ({
  WalletActions: (props: any) => {
    walletActionsSpy(props);
    return <div data-testid="wallet-actions" />;
  },
}));

vi.mock("@/components/PortfolioOverview", () => ({
  PortfolioOverview: (props: any) => {
    portfolioOverviewSpy(props);
    return <div data-testid="portfolio-overview" />;
  },
}));

vi.mock("@/components/errors/ErrorBoundary", () => ({
  ErrorBoundary: ({ children, resetKeys }: any) => {
    errorBoundarySpy(resetKeys);
    return <div data-testid="error-boundary">{children}</div>;
  },
}));

vi.mock("@/components/ui", () => ({
  BaseCard: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="base-card">{children}</div>
  ),
  GradientButton: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="gradient-button">{children}</button>
  ),
}));

vi.mock("@/contexts/BalanceVisibilityContext", () => ({
  BalanceVisibilityProvider: ({ value, children }: any) => {
    balanceProviderSpy(value);
    return <div data-testid="balance-context">{children}</div>;
  },
}));

vi.mock("@/components/WalletManager/WalletManagerSkeleton", () => ({
  WalletManagerSkeleton: () => <div data-testid="wallet-manager-skeleton" />,
}));

function createViewModel(
  overrides: Partial<WalletPortfolioViewModel> = {}
): WalletPortfolioViewModel {
  return {
    resolvedUserId: "user-123",
    isVisitorMode: false,
    landingPageData: { total_net_usd: 15000 } as any,
    yieldSummaryData: null,
    pieChartData: [{ label: "ETH", value: 5000 }],
    categorySummaries: [
      { id: "eth", name: "ETH", value: 5000, percentage: 50 },
    ],
    debtCategorySummaries: [],
    portfolioMetrics: { totalChangePercentage: 4.2 } as any,
    portfolioState: {
      type: "has_data",
      isConnected: true,
      isLoading: false,
      hasError: false,
      hasZeroData: false,
      totalValue: 15000,
      errorMessage: null,
      isRetrying: false,
    },
    isLandingLoading: false,
    isYieldLoading: false,
    balanceHidden: false,
    toggleBalanceVisibility: vi.fn(),
    expandedCategory: null,
    toggleCategoryExpansion: vi.fn(),
    onOptimizeClick: vi.fn(),
    onZapInClick: vi.fn(),
    onZapOutClick: vi.fn(),
    onCategoryClick: vi.fn(),
    isOwnBundle: true,
    bundleUserName: "Alice",
    bundleUrl: "https://zap.pilot/bundles/alice",
    isWalletManagerOpen: false,
    openWalletManager: vi.fn(),
    closeWalletManager: vi.fn(),
    onRetry: vi.fn(),
    ...overrides,
  };
}

describe("WalletPortfolioPresenter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders header, metrics, actions, and overview", () => {
    const vm = createViewModel();
    render(<WalletPortfolioPresenter vm={vm} />);

    expect(walletHeaderSpy).toHaveBeenCalledWith(
      expect.objectContaining({ bundleUserName: "Alice" })
    );
    expect(walletMetricsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ landingPageData: vm.landingPageData })
    );
    expect(walletActionsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ disabled: false })
    );
    expect(portfolioOverviewSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        categorySummaries: vm.categorySummaries,
        pieChartData: vm.pieChartData,
      })
    );
    expect(balanceProviderSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        balanceHidden: vm.balanceHidden,
        toggleBalanceVisibility: vm.toggleBalanceVisibility,
      })
    );
  });

  it("disables wallet actions for visitor mode", () => {
    const vm = createViewModel({ isVisitorMode: true });
    render(<WalletPortfolioPresenter vm={vm} />);

    expect(walletActionsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ disabled: true })
    );
  });

  it("passes progressive loading state to WalletMetrics", () => {
    const landing = { total_net_usd: 5000 } as any;
    const yieldSummary = { windows: {} } as any;
    const vm = createViewModel({
      landingPageData: landing,
      yieldSummaryData: yieldSummary,
      isLandingLoading: true,
      isYieldLoading: true,
      portfolioMetrics: { totalChangePercentage: -1.5 } as any,
    });

    render(<WalletPortfolioPresenter vm={vm} />);

    expect(walletMetricsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        landingPageData: landing,
        yieldSummaryData: yieldSummary,
        isLandingLoading: true,
        isYieldLoading: true,
        portfolioChangePercentage: -1.5,
      })
    );
  });

  it("forwards category interactions to PortfolioOverview", () => {
    const toggleCategoryExpansion = vi.fn();
    const vm = createViewModel({ toggleCategoryExpansion });

    render(<WalletPortfolioPresenter vm={vm} />);

    expect(portfolioOverviewSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        onCategoryClick: toggleCategoryExpansion,
        debtCategorySummaries: vm.debtCategorySummaries,
        onRetry: vm.onRetry,
      })
    );
  });

  it("opens wallet manager with resolved user id", () => {
    const vm = createViewModel({ isWalletManagerOpen: true });
    render(<WalletPortfolioPresenter vm={vm} />);

    expect(walletManagerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        isOpen: true,
        urlUserId: "user-123",
        onClose: vm.closeWalletManager,
      })
    );
  });

  it("resets error boundaries on identity change", () => {
    const vm = createViewModel();
    render(<WalletPortfolioPresenter vm={vm} />);

    expect(errorBoundarySpy).toHaveBeenCalledWith(
      expect.arrayContaining(["user-123", "connected"])
    );
  });
});
