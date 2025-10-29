import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WalletPortfolioPresenter } from "../../src/components/wallet/WalletPortfolioPresenter";
import { useBalanceVisibility } from "../../src/contexts/BalanceVisibilityContext";
import type { WalletPortfolioViewModel } from "../../src/hooks/useWalletPortfolioState";

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => () => null,
}));

vi.mock("../../src/components/wallet/WalletHeader", () => ({
  WalletHeader: vi.fn(({ onWalletManagerClick, onToggleBalance }) => {
    const { balanceHidden } = useBalanceVisibility();
    return (
      <div data-testid="wallet-header">
        <span data-testid="header-balance">
          {balanceHidden ? "hidden" : "visible"}
        </span>
        <button
          data-testid="open-wallet-manager"
          onClick={onWalletManagerClick}
        >
          Open Wallet Manager
        </button>
        <button data-testid="toggle-balance" onClick={onToggleBalance}>
          Toggle Balance
        </button>
      </div>
    );
  }),
}));

vi.mock("../../src/components/wallet/WalletMetrics", () => ({
  WalletMetrics: vi.fn(({ portfolioState }) => {
    const { balanceHidden } = useBalanceVisibility();
    return (
      <div data-testid="wallet-metrics">
        <span data-testid="metrics-total">
          {portfolioState?.totalValue ?? "no-value"}
        </span>
        <span data-testid="metrics-hidden">
          {balanceHidden ? "hidden" : "visible"}
        </span>
      </div>
    );
  }),
}));

vi.mock("../../src/components/wallet/WalletActions", () => ({
  WalletActions: vi.fn(
    ({ onZapInClick, onZapOutClick, onOptimizeClick, disabled }) => (
      <div data-testid="wallet-actions">
        <button data-testid="zap-in" onClick={onZapInClick} disabled={disabled}>
          Zap In
        </button>
        <button
          data-testid="zap-out"
          onClick={onZapOutClick}
          disabled={disabled}
        >
          Zap Out
        </button>
        <button
          data-testid="optimize"
          onClick={onOptimizeClick}
          disabled={disabled}
        >
          Optimize
        </button>
      </div>
    )
  ),
}));

vi.mock("../../src/components/PortfolioOverview", () => ({
  PortfolioOverview: vi.fn(
    ({ pieChartData, onRetry, onCategoryClick, testId, isRetrying }) => {
      const { balanceHidden } = useBalanceVisibility();
      return (
        <div data-testid={testId ?? "portfolio-overview"}>
          <span data-testid="overview-hidden">
            {balanceHidden ? "hidden" : "visible"}
          </span>
          <span data-testid="overview-pie-count">{pieChartData.length}</span>
          <button
            data-testid="overview-retry"
            onClick={onRetry}
            disabled={isRetrying}
          >
            Retry
          </button>
          {onCategoryClick && (
            <button
              data-testid="overview-category"
              onClick={() => onCategoryClick("btc")}
            >
              Category
            </button>
          )}
        </div>
      );
    }
  ),
}));

vi.mock("../../src/components/WalletManager", () => ({
  WalletManager: vi.fn(({ isOpen, onClose }) =>
    isOpen ? (
      <div data-testid="wallet-manager">
        <button data-testid="close-wallet-manager" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null
  ),
}));

const createViewModel = (
  overrides: Partial<WalletPortfolioViewModel> = {}
): WalletPortfolioViewModel => ({
  resolvedUserId: "user-123",
  isVisitorMode: false,
  landingPageData: undefined,
  pieChartData: [
    { label: "BTC", value: 7500, percentage: 50, color: "#F7931A" },
    { label: "ETH", value: 4500, percentage: 30, color: "#627EEA" },
  ],
  categorySummaries: [],
  debtCategorySummaries: [],
  portfolioMetrics: {
    totalValue: 15000,
    totalChange24h: 0,
    totalChangePercentage: 0,
  },
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
});

describe("WalletPortfolioPresenter", () => {
  let viewModel: WalletPortfolioViewModel;

  beforeEach(() => {
    vi.clearAllMocks();
    viewModel = createViewModel();
  });

  it("renders core wallet sections with provided view model data", () => {
    render(<WalletPortfolioPresenter vm={viewModel} />);

    expect(screen.getByTestId("wallet-header")).toBeInTheDocument();
    expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
    expect(screen.getByTestId("wallet-actions")).toBeInTheDocument();
    expect(screen.getByTestId("wallet-portfolio-overview")).toBeInTheDocument();
  });

  it("invokes action callbacks when user interactions occur", () => {
    render(<WalletPortfolioPresenter vm={viewModel} />);

    fireEvent.click(screen.getByTestId("open-wallet-manager"));
    fireEvent.click(screen.getByTestId("zap-in"));
    fireEvent.click(screen.getByTestId("zap-out"));
    fireEvent.click(screen.getByTestId("optimize"));
    fireEvent.click(screen.getByTestId("overview-retry"));
    fireEvent.click(screen.getByTestId("overview-category"));

    expect(viewModel.openWalletManager).toHaveBeenCalledTimes(1);
    expect(viewModel.onZapInClick).toHaveBeenCalledTimes(1);
    expect(viewModel.onZapOutClick).toHaveBeenCalledTimes(1);
    expect(viewModel.onOptimizeClick).toHaveBeenCalledTimes(1);
    expect(viewModel.onRetry).toHaveBeenCalledTimes(1);
    expect(viewModel.toggleCategoryExpansion).toHaveBeenCalledWith("btc");
  });

  it("wires balance visibility toggles through the provider context", () => {
    render(<WalletPortfolioPresenter vm={viewModel} />);

    expect(screen.getByTestId("header-balance")).toHaveTextContent("visible");
    fireEvent.click(screen.getByTestId("toggle-balance"));
    expect(viewModel.toggleBalanceVisibility).toHaveBeenCalledTimes(1);
  });

  it("passes visitor-mode flag to action buttons", () => {
    viewModel = createViewModel({
      isVisitorMode: true,
    });

    render(<WalletPortfolioPresenter vm={viewModel} />);

    expect(screen.getByTestId("zap-in")).toBeDisabled();
    expect(screen.getByTestId("zap-out")).toBeDisabled();
    expect(screen.getByTestId("optimize")).toBeDisabled();
  });
});
