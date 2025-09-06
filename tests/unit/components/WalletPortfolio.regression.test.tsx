import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WalletPortfolio } from "../../../src/components/WalletPortfolio";
import { useUser } from "../../../src/contexts/UserContext";
import { useLandingPageData } from "../../../src/hooks/queries/usePortfolioQuery";
import { usePortfolio } from "../../../src/hooks/usePortfolio";
import { usePortfolioState } from "../../../src/hooks/usePortfolioState";
import { useWalletModal } from "../../../src/hooks/useWalletModal";
import { createCategoriesFromApiData } from "../../../src/utils/portfolio.utils";
import { render } from "../../test-utils";

// Mock dependencies
vi.mock("../../../src/contexts/UserContext");
vi.mock("../../../src/hooks/usePortfolio");
vi.mock("../../../src/hooks/queries/usePortfolioQuery");
vi.mock("../../../src/hooks/usePortfolioState");
vi.mock("../../../src/hooks/useWalletModal");
vi.mock("../../../src/utils/portfolio.utils");

// Mock dynamic imports
vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: vi.fn(factory => {
    // Handle the promise returned by factory
    const importPromise = factory();
    if (importPromise && typeof importPromise.then === "function") {
      // Return a mock component that will be resolved
      return vi.fn(({ isOpen, onClose }) =>
        isOpen ? (
          <div data-testid="wallet-manager-modal">
            <h2>Bundle Wallets</h2>
            <div data-testid="wallet-manager-content">
              <div data-testid="wallet-list">
                <div data-testid="wallet-item">Main Wallet: 0x123...456</div>
                <div data-testid="wallet-item">
                  Secondary Wallet: 0x789...abc
                </div>
              </div>
              <button data-testid="add-wallet">Add Wallet</button>
              <button data-testid="remove-wallet">Remove Wallet</button>
              <button data-testid="close-wallet-manager" onClick={onClose}>
                Close
              </button>
              <button data-testid="close-modal" onClick={onClose}>
                ×
              </button>
            </div>
          </div>
        ) : null
      );
    }
    // Fallback for non-promise factory
    return vi.fn(() => (
      <div data-testid="dynamic-component-mock">Dynamic Component Mock</div>
    ));
  }),
}));

// Mock child components with interaction capabilities
vi.mock("../../../src/components/PortfolioOverview", () => ({
  PortfolioOverview: vi.fn(
    ({
      portfolioState,
      onRetry,
      onCategoryClick,
      pieChartData,
      categorySummaries,
    }) => {
      const isLoading = portfolioState?.isLoading || false;
      const hasError = portfolioState?.hasError || false;
      const isRetrying = portfolioState?.isRetrying || false;
      const errorMessage = portfolioState?.errorMessage;

      return (
        <div data-testid="portfolio-overview">
          <div data-testid="overview-loading">
            {isLoading ? "loading" : "loaded"}
          </div>
          <div data-testid="overview-error">{errorMessage || "no-error"}</div>
          <div data-testid="overview-retrying">
            {isRetrying ? "retrying" : "not-retrying"}
          </div>
          <div data-testid="overview-categories">
            {categorySummaries?.length || 0}
          </div>
          <div data-testid="overview-pie-data">{pieChartData?.length || 0}</div>
          {(hasError || onRetry) && (
            <button
              data-testid="overview-retry"
              onClick={onRetry}
              disabled={isLoading}
            >
              Retry
            </button>
          )}
          {onCategoryClick && (
            <>
              <button
                data-testid="category-btc"
                onClick={() => onCategoryClick("btc")}
              >
                BTC
              </button>
              <button
                data-testid="category-eth"
                onClick={() => onCategoryClick("eth")}
              >
                ETH
              </button>
            </>
          )}
        </div>
      );
    }
  ),
}));

vi.mock("../../../src/components/WalletManager", () => ({
  WalletManager: vi.fn(({ isOpen, onClose }) =>
    isOpen ? (
      <div data-testid="wallet-manager-modal">
        <h2>Wallet Manager</h2>
        <button data-testid="add-wallet">Add Wallet</button>
        <button data-testid="remove-wallet">Remove Wallet</button>
        <button data-testid="close-modal" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null
  ),
}));

vi.mock("../../../src/components/ui", () => ({
  GlassCard: vi.fn(({ children }) => (
    <div data-testid="glass-card">{children}</div>
  )),
}));

vi.mock("../../../src/components/wallet/WalletHeader", () => {
  return {
    WalletHeader: vi.fn(
      ({ onWalletManagerClick, onToggleBalance, balanceHidden }) => {
        const { balanceHidden: hookHidden, toggleBalanceVisibility } =
          usePortfolio();
        const hidden =
          typeof balanceHidden === "boolean" ? balanceHidden : hookHidden;
        const handleToggle = onToggleBalance ?? toggleBalanceVisibility;
        return (
          <div data-testid="wallet-header">
            <div data-testid="balance-visibility">
              {hidden ? "hidden" : "visible"}
            </div>
            <button
              data-testid="wallet-manager-btn"
              onClick={onWalletManagerClick}
            >
              Manage Wallets
            </button>
            <button data-testid="toggle-balance-btn" onClick={handleToggle}>
              {hidden ? "Show Balance" : "Hide Balance"}
            </button>
          </div>
        );
      }
    ),
  };
});

vi.mock("../../../src/components/wallet/WalletMetrics", () => {
  return {
    WalletMetrics: vi.fn(({ portfolioState, balanceHidden }) => {
      const { balanceHidden: hookHidden } = usePortfolio();
      const hidden =
        typeof balanceHidden === "boolean" ? balanceHidden : hookHidden;
      const totalValue = portfolioState?.totalValue;
      const isLoading = portfolioState?.isLoading || false;
      const error = portfolioState?.errorMessage;
      const isConnected = portfolioState?.isConnected || false;

      return (
        <div data-testid="wallet-metrics">
          <div data-testid="total-value-display">
            {hidden
              ? "****"
              : totalValue
                ? `$${totalValue.toLocaleString()}`
                : "No value"}
          </div>
          <div data-testid="metrics-loading-state">
            {isLoading ? "Loading..." : "Loaded"}
          </div>
          <div data-testid="metrics-error-state">{error || "No errors"}</div>
          <div data-testid="metrics-connection-state">
            {isConnected ? "Connected" : "Disconnected"}
          </div>
        </div>
      );
    }),
  };
});

vi.mock("../../../src/components/wallet/WalletActions", () => ({
  WalletActions: vi.fn(({ onZapInClick, onZapOutClick, onOptimizeClick }) => (
    <div data-testid="wallet-actions">
      <button
        data-testid="zap-in-action"
        onClick={onZapInClick}
        className="action-button"
      >
        Zap In
      </button>
      <button
        data-testid="zap-out-action"
        onClick={onZapOutClick}
        className="action-button"
      >
        Zap Out
      </button>
      <button
        data-testid="optimize-action"
        onClick={onOptimizeClick}
        className="action-button"
      >
        Optimize Portfolio
      </button>
    </div>
  )),
}));

vi.mock("../../../src/components/errors/ErrorBoundary", () => ({
  ErrorBoundary: vi.fn(({ children, onError, resetKeys }) => {
    // Simulate error boundary behavior
    try {
      return (
        <div
          data-testid="error-boundary"
          data-reset-keys={JSON.stringify(resetKeys)}
        >
          {children}
        </div>
      );
    } catch (error) {
      onError?.(error);
      return <div data-testid="error-fallback">Something went wrong</div>;
    }
  }),
}));

vi.mock("../../../src/utils/logger", () => ({
  logger: {
    createContextLogger: vi.fn(() => ({
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    })),
  },
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>),
    button: vi.fn(({ children, whileHover, whileTap, ...props }) => (
      <button {...props}>{children}</button>
    )),
  },
}));

describe("WalletPortfolio - Regression Tests", () => {
  const mockUseUser = vi.mocked(useUser);
  const mockUsePortfolio = vi.mocked(usePortfolio);
  const mockUseLandingPageData = vi.mocked(useLandingPageData);
  const mockUsePortfolioState = vi.mocked(usePortfolioState);
  const mockUseWalletModal = vi.mocked(useWalletModal);
  const mockCreateCategoriesFromApiData = vi.mocked(
    createCategoriesFromApiData
  );

  const mockUserInfo = { userId: "test-user-123" };
  const mockRefetch = vi.fn();
  const mockToggleBalance = vi.fn();
  const mockOpenModal = vi.fn();
  const mockCloseModal = vi.fn();

  const validPortfolioData = {
    total_net_usd: 25000,
    weighted_apr: 0.15,
    estimated_monthly_income: 1250,
    portfolio_allocation: {
      btc: {
        total_value: 12500,
        percentage_of_portfolio: 50,
        wallet_tokens_value: 2000,
        other_sources_value: 10500,
      },
      eth: {
        total_value: 7500,
        percentage_of_portfolio: 30,
        wallet_tokens_value: 1500,
        other_sources_value: 6000,
      },
      stablecoins: {
        total_value: 3750,
        percentage_of_portfolio: 15,
        wallet_tokens_value: 750,
        other_sources_value: 3000,
      },
      others: {
        total_value: 1250,
        percentage_of_portfolio: 5,
        wallet_tokens_value: 250,
        other_sources_value: 1000,
      },
    },
    pool_details: [],
    total_positions: 15,
    protocols_count: 5,
    chains_count: 3,
    last_updated: new Date().toISOString(),
    apr_coverage: {
      matched_pools: 10,
      total_pools: 15,
      coverage_percentage: 66.67,
      matched_asset_value_usd: 20000,
    },
    total_assets_usd: 25000,
    total_debt_usd: 0,
    category_summary_debt: {
      btc: 0,
      eth: 0,
      stablecoins: 0,
      others: 0,
    },
  };

  const mockCategories = [
    {
      id: "btc",
      name: "Bitcoin",
      color: "#F7931A",
      totalValue: 12500,
      percentage: 50,
      averageAPR: 0,
      topProtocols: [],
    },
    {
      id: "eth",
      name: "Ethereum",
      color: "#627EEA",
      totalValue: 7500,
      percentage: 30,
      averageAPR: 4.5,
      topProtocols: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseUser.mockReturnValue({
      userInfo: mockUserInfo,
      isConnected: true,
      loading: false,
    });

    mockUseLandingPageData.mockReturnValue({
      data: validPortfolioData,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isRefetching: false,
    });

    mockUsePortfolio.mockReturnValue({
      balanceHidden: false,
      expandedCategory: null,
      portfolioMetrics: {
        totalValue: 25000,
        totalChangePercentage: 7.5,
        totalChangeValue: 1750,
      },
      toggleBalanceVisibility: mockToggleBalance,
      toggleCategoryExpansion: vi.fn(),
    });

    mockUseWalletModal.mockReturnValue({
      isOpen: false,
      openModal: mockOpenModal,
      closeModal: mockCloseModal,
    });

    mockUsePortfolioState.mockReturnValue({
      type: "has_data",
      isConnected: true,
      isLoading: false,
      hasError: false,
      hasZeroData: false,
      totalValue: 25000,
      errorMessage: null,
      isRetrying: false,
    });

    mockCreateCategoriesFromApiData.mockReturnValue(mockCategories);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Critical User Flow: Wallet Connection/Disconnection", () => {
    it("should handle complete wallet connection flow", async () => {
      // Start disconnected
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
        loading: false,
      });

      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        isRefetching: false,
      });

      mockUsePortfolioState.mockReturnValue({
        type: "wallet_disconnected",
        isConnected: false,
        isLoading: false,
        hasError: false,
        hasZeroData: false,
        totalValue: null,
        errorMessage: null,
        isRetrying: false,
      });

      const { rerender } = render(<WalletPortfolio />);

      // Should show disconnected state
      expect(screen.getByTestId("metrics-connection-state")).toHaveTextContent(
        "Disconnected"
      );
      expect(screen.getByTestId("total-value-display")).toHaveTextContent(
        "No value"
      );

      // Simulate wallet connection
      mockUseUser.mockReturnValue({
        userInfo: mockUserInfo,
        isConnected: true,
        loading: false,
      });

      mockUseLandingPageData.mockReturnValue({
        data: validPortfolioData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        isRefetching: false,
      });

      mockUsePortfolioState.mockReturnValue({
        type: "has_data",
        isConnected: true,
        isLoading: false,
        hasError: false,
        hasZeroData: false,
        totalValue: 25000,
        errorMessage: null,
        isRetrying: false,
      });

      rerender(<WalletPortfolio />);

      await waitFor(() => {
        expect(
          screen.getByTestId("metrics-connection-state")
        ).toHaveTextContent("Connected");
        expect(screen.getByTestId("total-value-display")).toHaveTextContent(
          "$25,000"
        );
      });

      // Verify data fetching was triggered
      expect(mockUseLandingPageData).toHaveBeenCalledWith(mockUserInfo.userId);
    });

    it("should handle wallet disconnection gracefully", async () => {
      // Start connected
      const { rerender } = render(<WalletPortfolio />);

      expect(screen.getByTestId("metrics-connection-state")).toHaveTextContent(
        "Connected"
      );

      // Simulate disconnection
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
        loading: false,
      });

      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        isRefetching: false,
      });

      mockUsePortfolioState.mockReturnValue({
        type: "wallet_disconnected",
        isConnected: false,
        isLoading: false,
        hasError: false,
        hasZeroData: false,
        totalValue: null,
        errorMessage: null,
        isRetrying: false,
      });

      rerender(<WalletPortfolio />);

      await waitFor(() => {
        expect(
          screen.getByTestId("metrics-connection-state")
        ).toHaveTextContent("Disconnected");
        expect(screen.getByTestId("total-value-display")).toHaveTextContent(
          "No value"
        );
      });
    });

    it("should maintain state during wallet switching", async () => {
      const firstUser = { userId: "user-1" };
      const secondUser = { userId: "user-2" };

      // Start with first user
      mockUseUser.mockReturnValue({
        userInfo: firstUser,
        isConnected: true,
        loading: false,
      });

      const { rerender } = render(<WalletPortfolio />);

      expect(mockUseLandingPageData).toHaveBeenCalledWith(firstUser.userId);

      // Switch to second user
      mockUseUser.mockReturnValue({
        userInfo: secondUser,
        isConnected: true,
        loading: false,
      });

      rerender(<WalletPortfolio />);

      await waitFor(() => {
        expect(mockUseLandingPageData).toHaveBeenCalledWith(secondUser.userId);
      });
    });
  });

  describe("Critical User Flow: Balance Visibility Toggle", () => {
    it("should complete full balance visibility toggle flow", async () => {
      const { rerender } = render(<WalletPortfolio />);

      // Initial state - balance visible
      expect(screen.getByTestId("balance-visibility")).toHaveTextContent(
        "visible"
      );
      expect(screen.getByTestId("total-value-display")).toHaveTextContent(
        "$25,000"
      );
      expect(screen.getByTestId("toggle-balance-btn")).toHaveTextContent(
        "Hide Balance"
      );

      // Toggle to hidden
      mockUsePortfolio.mockReturnValue({
        balanceHidden: true,
        expandedCategory: null,
        portfolioMetrics: {
          totalValue: 25000,
          totalChangePercentage: 7.5,
          totalChangeValue: 1750,
        },
        toggleBalanceVisibility: mockToggleBalance,
        toggleCategoryExpansion: vi.fn(),
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("toggle-balance-btn"));
      });

      expect(mockToggleBalance).toHaveBeenCalled();

      rerender(<WalletPortfolio />);

      // Should show hidden state
      expect(screen.getByTestId("balance-visibility")).toHaveTextContent(
        "hidden"
      );
      expect(screen.getByTestId("total-value-display")).toHaveTextContent(
        "****"
      );
      expect(screen.getByTestId("toggle-balance-btn")).toHaveTextContent(
        "Show Balance"
      );
    });

    it("should maintain balance visibility across data refreshes", async () => {
      mockUsePortfolio.mockReturnValue({
        balanceHidden: true,
        expandedCategory: null,
        portfolioMetrics: {
          totalValue: 25000,
          totalChangePercentage: 7.5,
          totalChangeValue: 1750,
        },
        toggleBalanceVisibility: mockToggleBalance,
        toggleCategoryExpansion: vi.fn(),
      });

      render(<WalletPortfolio />);

      // Balance should be hidden
      expect(screen.getByTestId("total-value-display")).toHaveTextContent(
        "****"
      );

      // Trigger data refresh
      await act(async () => {
        fireEvent.click(screen.getByTestId("overview-retry"));
      });

      expect(mockRefetch).toHaveBeenCalled();

      // Balance should still be hidden after refresh
      expect(screen.getByTestId("total-value-display")).toHaveTextContent(
        "****"
      );
    });
  });

  describe("Critical User Flow: Modal Management", () => {
    it("should complete wallet manager modal flow", async () => {
      const { rerender } = render(<WalletPortfolio />);

      // Modal initially closed
      expect(
        screen.queryByTestId("wallet-manager-modal")
      ).not.toBeInTheDocument();

      // Open modal
      await act(async () => {
        fireEvent.click(screen.getByTestId("wallet-manager-btn"));
      });

      expect(mockOpenModal).toHaveBeenCalled();

      // Simulate modal open
      mockUseWalletModal.mockReturnValue({
        isOpen: true,
        openModal: mockOpenModal,
        closeModal: mockCloseModal,
      });

      rerender(<WalletPortfolio />);

      // Modal should be visible
      expect(screen.getByTestId("wallet-manager-modal")).toBeInTheDocument();
      expect(screen.getByTestId("add-wallet")).toBeInTheDocument();
      expect(screen.getByTestId("remove-wallet")).toBeInTheDocument();

      // Close modal
      await act(async () => {
        fireEvent.click(screen.getByTestId("close-modal"));
      });

      expect(mockCloseModal).toHaveBeenCalled();
    });

    it("should handle modal interactions without affecting main component", async () => {
      mockUseWalletModal.mockReturnValue({
        isOpen: true,
        openModal: mockOpenModal,
        closeModal: mockCloseModal,
      });

      render(<WalletPortfolio />);

      // Modal interactions should not affect main component state
      const initialMetricsText = screen.getByTestId(
        "total-value-display"
      ).textContent;

      await act(async () => {
        fireEvent.click(screen.getByTestId("add-wallet"));
      });

      // Main component should remain unaffected
      expect(screen.getByTestId("total-value-display")).toHaveTextContent(
        initialMetricsText!
      );
    });
  });

  describe("Critical User Flow: Error Recovery", () => {
    it("should handle complete error recovery flow", async () => {
      // Start with error state
      const errorMessage = "Failed to load portfolio data";
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: errorMessage },
        refetch: mockRefetch,
        isRefetching: false,
      });

      mockUsePortfolioState.mockReturnValue({
        type: "error",
        isConnected: true,
        isLoading: false,
        hasError: true,
        hasZeroData: false,
        totalValue: null,
        errorMessage,
        isRetrying: false,
      });

      const { rerender } = render(<WalletPortfolio />);

      // Should show error state
      expect(screen.getByTestId("overview-error")).toHaveTextContent(
        errorMessage
      );
      expect(screen.getByTestId("metrics-error-state")).toHaveTextContent(
        errorMessage
      );

      // Attempt retry
      await act(async () => {
        fireEvent.click(screen.getByTestId("overview-retry"));
      });

      expect(mockRefetch).toHaveBeenCalled();

      // Simulate retry in progress
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: errorMessage },
        refetch: mockRefetch,
        isRefetching: true,
      });

      mockUsePortfolioState.mockReturnValue({
        type: "error",
        isConnected: true,
        isLoading: false,
        hasError: true,
        hasZeroData: false,
        totalValue: null,
        errorMessage,
        isRetrying: true,
      });

      rerender(<WalletPortfolio />);

      expect(screen.getByTestId("overview-retrying")).toHaveTextContent(
        "retrying"
      );

      // Simulate successful recovery
      mockUseLandingPageData.mockReturnValue({
        data: validPortfolioData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        isRefetching: false,
      });

      mockUsePortfolioState.mockReturnValue({
        type: "has_data",
        isConnected: true,
        isLoading: false,
        hasError: false,
        hasZeroData: false,
        totalValue: 25000,
        errorMessage: null,
        isRetrying: false,
      });

      rerender(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("overview-error")).toHaveTextContent(
          "no-error"
        );
        expect(screen.getByTestId("metrics-error-state")).toHaveTextContent(
          "No errors"
        );
        expect(screen.getByTestId("total-value-display")).toHaveTextContent(
          "$25,000"
        );
      });
    });

    it("should handle network failure and recovery", async () => {
      const { rerender } = render(<WalletPortfolio />);

      // Initial successful state
      expect(screen.getByTestId("total-value-display")).toHaveTextContent(
        "$25,000"
      );

      // Simulate network failure
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: "Network connection lost" },
        refetch: mockRefetch,
        isRefetching: false,
      });

      mockUsePortfolioState.mockReturnValue({
        type: "error",
        isConnected: true,
        isLoading: false,
        hasError: true,
        hasZeroData: false,
        totalValue: null,
        errorMessage: "Network connection lost",
        isRetrying: false,
      });

      rerender(<WalletPortfolio />);

      expect(screen.getByTestId("overview-error")).toHaveTextContent(
        "Network connection lost"
      );

      // Recovery attempt
      await act(async () => {
        fireEvent.click(screen.getByTestId("overview-retry"));
      });

      // Successful recovery
      mockUseLandingPageData.mockReturnValue({
        data: validPortfolioData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        isRefetching: false,
      });

      mockUsePortfolioState.mockReturnValue({
        type: "has_data",
        isConnected: true,
        isLoading: false,
        hasError: false,
        hasZeroData: false,
        totalValue: 25000,
        errorMessage: null,
        isRetrying: false,
      });

      rerender(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("overview-error")).toHaveTextContent(
          "no-error"
        );
        expect(screen.getByTestId("total-value-display")).toHaveTextContent(
          "$25,000"
        );
      });
    });
  });

  describe("Critical User Flow: Data Loading Sequences", () => {
    it("should handle complete loading sequence", async () => {
      // Start with loading state
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
        isRefetching: false,
      });

      mockUsePortfolioState.mockReturnValue({
        type: "loading",
        isConnected: true,
        isLoading: true,
        hasError: false,
        hasZeroData: false,
        totalValue: null,
        errorMessage: null,
        isRetrying: false,
      });

      const { rerender } = render(<WalletPortfolio />);

      // Should show loading state
      expect(screen.getByTestId("overview-loading")).toHaveTextContent(
        "loading"
      );
      expect(screen.getByTestId("metrics-loading-state")).toHaveTextContent(
        "Loading..."
      );

      // Simulate loading completion
      mockUseLandingPageData.mockReturnValue({
        data: validPortfolioData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        isRefetching: false,
      });

      mockUsePortfolioState.mockReturnValue({
        type: "has_data",
        isConnected: true,
        isLoading: false,
        hasError: false,
        hasZeroData: false,
        totalValue: 25000,
        errorMessage: null,
        isRetrying: false,
      });

      rerender(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("overview-loading")).toHaveTextContent(
          "loaded"
        );
        expect(screen.getByTestId("metrics-loading-state")).toHaveTextContent(
          "Loaded"
        );
        expect(screen.getByTestId("total-value-display")).toHaveTextContent(
          "$25,000"
        );
      });
    });
  });

  describe("Critical User Flow: Category Interactions", () => {
    it("should handle category click interactions", async () => {
      const onCategoryClick = vi.fn();

      render(<WalletPortfolio onCategoryClick={onCategoryClick} />);

      // Category buttons should be available
      expect(screen.getByTestId("category-btc")).toBeInTheDocument();
      expect(screen.getByTestId("category-eth")).toBeInTheDocument();

      // Click BTC category
      await act(async () => {
        fireEvent.click(screen.getByTestId("category-btc"));
      });

      expect(onCategoryClick).toHaveBeenCalledWith("btc");

      // Click ETH category
      await act(async () => {
        fireEvent.click(screen.getByTestId("category-eth"));
      });

      expect(onCategoryClick).toHaveBeenCalledWith("eth");
      expect(onCategoryClick).toHaveBeenCalledTimes(2);
    });

    it("should handle category interactions without affecting other state", async () => {
      const onCategoryClick = vi.fn();

      render(<WalletPortfolio onCategoryClick={onCategoryClick} />);

      const initialBalance = screen.getByTestId(
        "total-value-display"
      ).textContent;

      // Category interactions should not affect balance display
      await act(async () => {
        fireEvent.click(screen.getByTestId("category-btc"));
      });

      expect(screen.getByTestId("total-value-display")).toHaveTextContent(
        initialBalance!
      );
      expect(onCategoryClick).toHaveBeenCalledWith("btc");
    });
  });

  describe("Critical User Flow: Action Button Interactions", () => {
    it("should handle all action button clicks", async () => {
      const onZapInClick = vi.fn();
      const onZapOutClick = vi.fn();
      const onOptimizeClick = vi.fn();

      render(
        <WalletPortfolio
          onZapInClick={onZapInClick}
          onZapOutClick={onZapOutClick}
          onOptimizeClick={onOptimizeClick}
        />
      );

      // Test all action buttons
      await act(async () => {
        fireEvent.click(screen.getByTestId("zap-in-action"));
      });
      expect(onZapInClick).toHaveBeenCalled();

      await act(async () => {
        fireEvent.click(screen.getByTestId("zap-out-action"));
      });
      expect(onZapOutClick).toHaveBeenCalled();

      await act(async () => {
        fireEvent.click(screen.getByTestId("optimize-action"));
      });
      expect(onOptimizeClick).toHaveBeenCalled();

      // Analytics action removed in new UI; covered via category/analytics tab navigation
    });

    it("should handle action button clicks without side effects", async () => {
      const onZapInClick = vi.fn();

      render(<WalletPortfolio onZapInClick={onZapInClick} />);

      const initialState = {
        balance: screen.getByTestId("total-value-display").textContent,
        loading: screen.getByTestId("overview-loading").textContent,
        error: screen.getByTestId("overview-error").textContent,
      };

      // Action should not affect component state
      await act(async () => {
        fireEvent.click(screen.getByTestId("zap-in-action"));
      });

      expect(onZapInClick).toHaveBeenCalled();
      expect(screen.getByTestId("total-value-display")).toHaveTextContent(
        initialState.balance!
      );
      expect(screen.getByTestId("overview-loading")).toHaveTextContent(
        initialState.loading!
      );
      expect(screen.getByTestId("overview-error")).toHaveTextContent(
        initialState.error!
      );
    });
  });

  describe("Critical User Flow: Component Re-mounting", () => {
    it("should handle component unmount and remount gracefully", async () => {
      const { unmount } = render(<WalletPortfolio />);

      // Verify initial render
      expect(screen.getByTestId("total-value-display")).toHaveTextContent(
        "$25,000"
      );

      // Unmount
      unmount();

      // Remount should work without issues - use fresh render after unmount
      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("total-value-display")).toHaveTextContent(
          "$25,000"
        );
        expect(mockUseLandingPageData).toHaveBeenCalledWith(
          mockUserInfo.userId
        );
      });
    });

    it("should cleanup resources on unmount", async () => {
      const { unmount } = render(<WalletPortfolio />);

      // Should not throw errors on unmount
      expect(() => unmount()).not.toThrow();
    });
  });
});
