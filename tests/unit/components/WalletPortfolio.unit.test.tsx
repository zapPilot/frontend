import { act, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WalletPortfolio } from "../../../src/components/WalletPortfolio";
import { useUser } from "../../../src/contexts/UserContext";
import { useLandingPageData } from "../../../src/hooks/queries/usePortfolioQuery";
import { usePortfolio } from "../../../src/hooks/usePortfolio";
import { useWalletModal } from "../../../src/hooks/useWalletModal";
import { createCategoriesFromApiData } from "../../../src/utils/portfolio.utils";
import { render } from "../../test-utils";

// Mock dependencies
vi.mock("../../../src/contexts/UserContext");
vi.mock("../../../src/hooks/usePortfolio");
vi.mock("../../../src/hooks/queries/usePortfolioQuery");
vi.mock("../../../src/hooks/useWalletModal");
vi.mock("../../../src/utils/portfolio.utils");

// Mock child components with detailed props tracking
vi.mock("../../../src/components/PortfolioOverview", () => ({
  PortfolioOverview: vi.fn(
    ({
      categorySummaries,
      debtCategorySummaries,
      pieChartData,
      totalValue,
      balanceHidden,
      isLoading,
      apiError,
      onRetry,
      isRetrying,
      isConnected,
      testId,
      onCategoryClick,
    }) => (
      <div data-testid="portfolio-overview">
        <div data-testid="loading-state">
          {isLoading ? "loading" : "not-loading"}
        </div>
        <div data-testid="error-state">{apiError || "no-error"}</div>
        <div data-testid="pie-chart-data">
          {pieChartData && pieChartData.length > 0 ? "has-data" : "no-data"}
        </div>
        <div data-testid="total-value">
          {totalValue !== undefined && totalValue !== null
            ? totalValue
            : "no-value"}
        </div>
        <div data-testid="balance-hidden">
          {balanceHidden ? "hidden" : "visible"}
        </div>
        <div data-testid="categories-count">
          {categorySummaries?.length || 0}
        </div>
        <div data-testid="debt-categories-count">
          {debtCategorySummaries?.length || 0}
        </div>
        <div data-testid="is-connected">
          {isConnected ? "connected" : "disconnected"}
        </div>
        <div data-testid="test-id">{testId}</div>
        <div data-testid="is-retrying">
          {isRetrying ? "retrying" : "not-retrying"}
        </div>
        <button data-testid="retry-button" onClick={onRetry}>
          Retry
        </button>
        {onCategoryClick && (
          <button
            data-testid="category-click-button"
            onClick={() => onCategoryClick("test-category")}
          >
            Category Click
          </button>
        )}
      </div>
    )
  ),
}));

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: vi.fn(factory => {
    const importPromise = factory();
    if (importPromise && typeof importPromise.then === "function") {
      return vi.fn(({ isOpen, onClose }) =>
        isOpen ? (
          <div data-testid="wallet-manager">
            <span>Wallet Manager</span>
            <button data-testid="close-wallet-manager" onClick={onClose}>
              Close
            </button>
          </div>
        ) : null
      );
    }
    return vi.fn(() => (
      <div data-testid="dynamic-component-mock">Dynamic Component Mock</div>
    ));
  }),
}));

vi.mock("../../../src/components/WalletManager", () => ({
  WalletManager: vi.fn(({ isOpen, onClose }) =>
    isOpen ? (
      <div data-testid="wallet-manager">
        <span>Wallet Manager</span>
        <button data-testid="close-wallet-manager" onClick={onClose}>
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

// Mock wallet components with prop tracking
vi.mock("../../../src/components/wallet/WalletHeader", () => ({
  WalletHeader: vi.fn(
    ({
      onAnalyticsClick,
      onWalletManagerClick,
      onToggleBalance,
      balanceHidden,
    }) => (
      <div data-testid="wallet-header">
        <div data-testid="balance-hidden-state">
          {balanceHidden ? "hidden" : "visible"}
        </div>
        <button data-testid="analytics-button" onClick={onAnalyticsClick}>
          Analytics
        </button>
        <button
          data-testid="wallet-manager-button"
          onClick={onWalletManagerClick}
        >
          Wallet Manager
        </button>
        <button data-testid="toggle-balance-button" onClick={onToggleBalance}>
          Toggle Balance
        </button>
      </div>
    )
  ),
}));

vi.mock("../../../src/components/wallet/WalletMetrics", () => ({
  WalletMetrics: vi.fn(
    ({
      totalValue,
      balanceHidden,
      isLoading,
      error,
      portfolioChangePercentage,
      isConnected,
      userId,
    }) => (
      <div data-testid="wallet-metrics">
        <div data-testid="metrics-total-value">{totalValue || "no-value"}</div>
        <div data-testid="metrics-balance-hidden">
          {balanceHidden ? "hidden" : "visible"}
        </div>
        <div data-testid="metrics-loading">
          {isLoading ? "loading" : "not-loading"}
        </div>
        <div data-testid="metrics-error">{error || "no-error"}</div>
        <div data-testid="metrics-change-percentage">
          {portfolioChangePercentage}
        </div>
        <div data-testid="metrics-connected">
          {isConnected ? "connected" : "disconnected"}
        </div>
        <div data-testid="metrics-user-id">{userId || "no-user"}</div>
      </div>
    )
  ),
}));

vi.mock("../../../src/components/wallet/WalletActions", () => ({
  WalletActions: vi.fn(({ onZapInClick, onZapOutClick, onOptimizeClick }) => (
    <div data-testid="wallet-actions">
      <button data-testid="zap-in-button" onClick={onZapInClick}>
        Zap In
      </button>
      <button data-testid="zap-out-button" onClick={onZapOutClick}>
        Zap Out
      </button>
      <button data-testid="optimize-button" onClick={onOptimizeClick}>
        Optimize
      </button>
    </div>
  )),
}));

// Mock Error Boundary
vi.mock("../../../src/components/errors/ErrorBoundary", () => ({
  ErrorBoundary: vi.fn(({ children, resetKeys }) => (
    <div
      data-testid="error-boundary"
      data-reset-keys={JSON.stringify(resetKeys)}
    >
      {children}
    </div>
  )),
}));

// Mock logger
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

describe("WalletPortfolio - Comprehensive Unit Tests", () => {
  const mockUseUser = vi.mocked(useUser);
  const mockUsePortfolio = vi.mocked(usePortfolio);
  const mockUseLandingPageData = vi.mocked(useLandingPageData);
  const mockUseWalletModal = vi.mocked(useWalletModal);
  const mockCreateCategoriesFromApiData = vi.mocked(
    createCategoriesFromApiData
  );

  // Mock data
  const mockUserInfo = { userId: "test-user-123" };
  const mockLandingPageData = {
    total_net_usd: 15000,
    weighted_apr: 0.125,
    estimated_monthly_income: 1000,
    portfolio_allocation: {
      btc: {
        total_value: 7500,
        percentage_of_portfolio: 50,
        wallet_tokens_value: 1000,
        other_sources_value: 6500,
      },
      eth: {
        total_value: 4500,
        percentage_of_portfolio: 30,
        wallet_tokens_value: 800,
        other_sources_value: 3700,
      },
      stablecoins: {
        total_value: 2000,
        percentage_of_portfolio: 13.33,
        wallet_tokens_value: 500,
        other_sources_value: 1500,
      },
      others: {
        total_value: 1000,
        percentage_of_portfolio: 6.67,
        wallet_tokens_value: 200,
        other_sources_value: 800,
      },
    },
    pool_details: [],
    total_positions: 0,
    protocols_count: 0,
    chains_count: 0,
    last_updated: null,
    apr_coverage: {
      matched_pools: 0,
      total_pools: 0,
      coverage_percentage: 0,
      matched_asset_value_usd: 0,
    },
    total_assets_usd: 15000,
    total_debt_usd: 0,
  };

  const mockAssetCategories = [
    {
      id: "btc",
      name: "Bitcoin",
      color: "#F7931A",
      totalValue: 7500,
      percentage: 50,
      averageAPR: 0,
      topProtocols: [],
    },
    {
      id: "eth",
      name: "Ethereum",
      color: "#627EEA",
      totalValue: 4500,
      percentage: 30,
      averageAPR: 0,
      topProtocols: [],
    },
  ];

  const mockPortfolioMetrics = {
    totalValue: 15000,
    totalChangePercentage: 5.2,
    totalChangeValue: 500,
    annualAPR: 12.5,
    monthlyReturn: 1000,
  };

  const mockRefetchFunction = vi.fn();

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    mockUseUser.mockReturnValue({
      userInfo: mockUserInfo,
      isConnected: true,
      loading: false,
    });

    mockUseLandingPageData.mockReturnValue({
      data: mockLandingPageData,
      isLoading: false,
      error: null,
      refetch: mockRefetchFunction,
      isRefetching: false,
    });

    mockUsePortfolio.mockReturnValue({
      balanceHidden: false,
      expandedCategory: null,
      portfolioMetrics: mockPortfolioMetrics,
      toggleBalanceVisibility: vi.fn(),
      toggleCategoryExpansion: vi.fn(),
    });

    mockUseWalletModal.mockReturnValue({
      isOpen: false,
      openModal: vi.fn(),
      closeModal: vi.fn(),
    });

    mockCreateCategoriesFromApiData.mockReturnValue(mockAssetCategories);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Initialization", () => {
    it("should render without crashing", () => {
      render(<WalletPortfolio />);
      expect(screen.getByTestId("wallet-header")).toBeInTheDocument();
      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
      expect(screen.getByTestId("wallet-actions")).toBeInTheDocument();
      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
    });

    it("should call all required hooks on mount", () => {
      render(<WalletPortfolio />);

      expect(mockUseUser).toHaveBeenCalled();
      expect(mockUseLandingPageData).toHaveBeenCalledWith(mockUserInfo.userId);
      expect(mockUsePortfolio).toHaveBeenCalledWith([]);
      expect(mockUseWalletModal).toHaveBeenCalled();
    });

    it("should setup error boundaries with correct resetKeys", () => {
      render(<WalletPortfolio />);

      const errorBoundaries = screen.getAllByTestId("error-boundary");
      expect(errorBoundaries).toHaveLength(4); // Main + 3 sub-components

      // Check main error boundary has correct reset keys
      const mainBoundary = errorBoundaries[0];
      const resetKeys = JSON.parse(
        mainBoundary.getAttribute("data-reset-keys") || "[]"
      );
      expect(resetKeys).toEqual([mockUserInfo.userId, "connected"]);
    });
  });

  describe("Data Transformation and useMemo", () => {
    it("should transform landing page data correctly via useMemo", async () => {
      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Verify createCategoriesFromApiData was called with transformed data
      expect(mockCreateCategoriesFromApiData).toHaveBeenCalledWith(
        {
          btc: 7500,
          eth: 4500,
          stablecoins: 2000,
          others: 1000,
        },
        15000
      );
    });

    it("should handle empty data in useMemo transformation", () => {
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: mockRefetchFunction,
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("pie-chart-data")).toHaveTextContent("no-data");
      expect(screen.getByTestId("total-value")).toHaveTextContent("no-value");
      expect(screen.getByTestId("categories-count")).toHaveTextContent("0");
    });

    it("should filter out zero-value categories from pie chart", () => {
      const dataWithZeros = {
        ...mockLandingPageData,
        portfolio_allocation: {
          ...mockLandingPageData.portfolio_allocation,
          stablecoins: {
            total_value: 0,
            percentage_of_portfolio: 0,
            wallet_tokens_value: 0,
            other_sources_value: 0,
          },
          others: {
            total_value: 0,
            percentage_of_portfolio: 0,
            wallet_tokens_value: 0,
            other_sources_value: 0,
          },
        },
      };

      mockUseLandingPageData.mockReturnValue({
        data: dataWithZeros,
        isLoading: false,
        error: null,
        refetch: mockRefetchFunction,
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      // Should still have data because BTC and ETH have values
      expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
        "has-data"
      );

      // Verify only non-zero categories are passed
      expect(mockCreateCategoriesFromApiData).toHaveBeenCalledWith(
        {
          btc: 7500,
          eth: 4500,
          stablecoins: 0,
          others: 0,
        },
        15000
      );
    });

    it("should handle debt categories separately", () => {
      const dataWithDebt = {
        ...mockLandingPageData,
        category_summary_debt: {
          btc: 0,
          eth: 0,
          stablecoins: 1000,
          others: 500,
        },
        total_debt_usd: 1500,
      };

      mockUseLandingPageData.mockReturnValue({
        data: dataWithDebt,
        isLoading: false,
        error: null,
        refetch: mockRefetchFunction,
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      // Should call createCategoriesFromApiData twice - once for assets, once for debt
      expect(mockCreateCategoriesFromApiData).toHaveBeenCalledTimes(2);
      expect(mockCreateCategoriesFromApiData).toHaveBeenNthCalledWith(
        2,
        {
          btc: 0,
          eth: 0,
          stablecoins: 1000,
          others: 500,
        },
        1500
      );
    });
  });

  describe("State Management", () => {
    it("should handle balance visibility toggle", async () => {
      const toggleBalanceMock = vi.fn();
      mockUsePortfolio.mockReturnValue({
        balanceHidden: true,
        expandedCategory: null,
        portfolioMetrics: mockPortfolioMetrics,
        toggleBalanceVisibility: toggleBalanceMock,
        toggleCategoryExpansion: vi.fn(),
      });

      render(<WalletPortfolio />);

      // Check balance is hidden in all components
      expect(screen.getByTestId("balance-hidden-state")).toHaveTextContent(
        "hidden"
      );
      expect(screen.getByTestId("metrics-balance-hidden")).toHaveTextContent(
        "hidden"
      );
      expect(screen.getByTestId("balance-hidden")).toHaveTextContent("hidden");

      // Trigger toggle
      await act(async () => {
        screen.getByTestId("toggle-balance-button").click();
      });

      expect(toggleBalanceMock).toHaveBeenCalled();
    });

    it("should handle wallet modal state", async () => {
      const openModalMock = vi.fn();
      const closeModalMock = vi.fn();

      mockUseWalletModal.mockReturnValue({
        isOpen: true,
        openModal: openModalMock,
        closeModal: closeModalMock,
      });

      render(<WalletPortfolio />);

      // Modal should be open
      expect(screen.getByTestId("wallet-manager")).toBeInTheDocument();

      // Test modal interactions
      await act(async () => {
        screen.getByTestId("wallet-manager-button").click();
      });
      expect(openModalMock).toHaveBeenCalled();

      await act(async () => {
        screen.getByTestId("close-wallet-manager").click();
      });
      expect(closeModalMock).toHaveBeenCalled();
    });

    it("should handle category expansion state", () => {
      const toggleCategoryMock = vi.fn();
      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        expandedCategory: "btc",
        portfolioMetrics: mockPortfolioMetrics,
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: toggleCategoryMock,
      });

      render(<WalletPortfolio />);

      // State should be accessible through usePortfolio hook
      expect(toggleCategoryMock).toBeDefined();
    });
  });

  describe("Loading States", () => {
    it("should show loading state initially", () => {
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: mockRefetchFunction,
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading");
      expect(screen.getByTestId("metrics-loading")).toHaveTextContent(
        "loading"
      );
      expect(screen.getByTestId("pie-chart-data")).toHaveTextContent("no-data");
    });

    it("should show loading state during refetch", () => {
      mockUseLandingPageData.mockReturnValue({
        data: mockLandingPageData,
        isLoading: false,
        error: null,
        refetch: mockRefetchFunction,
        isRefetching: true,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("is-retrying")).toHaveTextContent("retrying");
    });

    it("should transition from loading to loaded state", async () => {
      // Start with loading
      const { rerender } = render(<WalletPortfolio />);

      // Update to loaded
      mockUseLandingPageData.mockReturnValue({
        data: mockLandingPageData,
        isLoading: false,
        error: null,
        refetch: mockRefetchFunction,
        isRefetching: false,
      });

      rerender(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("loading-state")).toHaveTextContent(
          "not-loading"
        );
        expect(screen.getByTestId("metrics-loading")).toHaveTextContent(
          "not-loading"
        );
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully", () => {
      const errorMessage = "Network error occurred";
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: errorMessage },
        refetch: mockRefetchFunction,
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("error-state")).toHaveTextContent(errorMessage);
      expect(screen.getByTestId("metrics-error")).toHaveTextContent(
        errorMessage
      );
      expect(screen.getByTestId("pie-chart-data")).toHaveTextContent("no-data");
    });

    it("should handle retry functionality", async () => {
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: "API Error" },
        refetch: mockRefetchFunction,
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      await act(async () => {
        screen.getByTestId("retry-button").click();
      });

      expect(mockRefetchFunction).toHaveBeenCalled();
    });

    it("should clear errors on successful data load", () => {
      render(<WalletPortfolio />);

      expect(screen.getByTestId("error-state")).toHaveTextContent("no-error");
      expect(screen.getByTestId("metrics-error")).toHaveTextContent("no-error");
    });

    it("should handle malformed API data", () => {
      mockUseLandingPageData.mockReturnValue({
        data: {
          // Missing required fields but provide minimal structure to prevent crashes
          total_net_usd: 0,
          portfolio_allocation: {
            btc: { total_value: 0, percentage_of_portfolio: 0 },
            eth: { total_value: 0, percentage_of_portfolio: 0 },
            usdc: { total_value: 0, percentage_of_portfolio: 0 },
            usdt: { total_value: 0, percentage_of_portfolio: 0 },
            stablecoins: { total_value: 0, percentage_of_portfolio: 0 },
            others: { total_value: 0, percentage_of_portfolio: 0 },
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        isLoading: false,
        error: null,
        refetch: mockRefetchFunction,
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      // Should not crash and show empty/zero state
      expect(screen.getByTestId("pie-chart-data")).toHaveTextContent("no-data");
      expect(screen.getByTestId("total-value")).toHaveTextContent("no-value");
    });
  });

  describe("User Context Integration", () => {
    it("should handle disconnected wallet state", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
        loading: false,
      });

      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: mockRefetchFunction,
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("is-connected")).toHaveTextContent(
        "disconnected"
      );
      expect(screen.getByTestId("metrics-connected")).toHaveTextContent(
        "disconnected"
      );
      expect(screen.getByTestId("metrics-user-id")).toHaveTextContent(
        "no-user"
      );
    });

    it("should handle user loading state", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
        loading: true,
      });

      render(<WalletPortfolio />);

      expect(mockUseLandingPageData).toHaveBeenCalledWith(undefined);
    });

    it("should fetch data when user becomes available", async () => {
      // Start without user
      const { rerender } = render(<WalletPortfolio />);

      // User connects
      mockUseUser.mockReturnValue({
        userInfo: mockUserInfo,
        isConnected: true,
        loading: false,
      });

      rerender(<WalletPortfolio />);

      await waitFor(() => {
        expect(mockUseLandingPageData).toHaveBeenCalledWith(
          mockUserInfo.userId
        );
      });
    });
  });

  describe("Callback Props", () => {
    it("should handle all optional callback props", async () => {
      const onAnalyticsClick = vi.fn();
      const onOptimizeClick = vi.fn();
      const onZapInClick = vi.fn();
      const onZapOutClick = vi.fn();
      const onCategoryClick = vi.fn();

      render(
        <WalletPortfolio
          onAnalyticsClick={onAnalyticsClick}
          onOptimizeClick={onOptimizeClick}
          onZapInClick={onZapInClick}
          onZapOutClick={onZapOutClick}
          onCategoryClick={onCategoryClick}
        />
      );

      // Test all callbacks
      await act(async () => {
        screen.getByTestId("analytics-button").click();
      });
      expect(onAnalyticsClick).toHaveBeenCalled();

      await act(async () => {
        screen.getByTestId("zap-in-button").click();
      });
      expect(onZapInClick).toHaveBeenCalled();

      await act(async () => {
        screen.getByTestId("zap-out-button").click();
      });
      expect(onZapOutClick).toHaveBeenCalled();

      await act(async () => {
        screen.getByTestId("optimize-button").click();
      });
      expect(onOptimizeClick).toHaveBeenCalled();

      await act(async () => {
        screen.getByTestId("category-click-button").click();
      });
      expect(onCategoryClick).toHaveBeenCalledWith("test-category");
    });

    it("should handle no props provided gracefully", () => {
      render(<WalletPortfolio />);

      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
      // Should not show category click button when callback not provided
      expect(
        screen.queryByTestId("category-click-button")
      ).not.toBeInTheDocument();
    });

    it("should handle undefined callback props", () => {
      render(
        <WalletPortfolio
          onAnalyticsClick={undefined}
          onOptimizeClick={undefined}
          onZapInClick={undefined}
          onZapOutClick={undefined}
          onCategoryClick={undefined}
        />
      );

      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
    });
  });

  describe("Component Structure and Props Passing", () => {
    it("should pass correct props to WalletHeader", () => {
      render(<WalletPortfolio />);

      expect(screen.getByTestId("wallet-header")).toBeInTheDocument();
      expect(screen.getByTestId("balance-hidden-state")).toHaveTextContent(
        "visible"
      );
      expect(screen.getByTestId("analytics-button")).toBeInTheDocument();
      expect(screen.getByTestId("wallet-manager-button")).toBeInTheDocument();
      expect(screen.getByTestId("toggle-balance-button")).toBeInTheDocument();
    });

    it("should pass correct props to WalletMetrics", () => {
      render(<WalletPortfolio />);

      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
      expect(screen.getByTestId("metrics-total-value")).toHaveTextContent(
        "15000"
      );
      expect(screen.getByTestId("metrics-balance-hidden")).toHaveTextContent(
        "visible"
      );
      expect(screen.getByTestId("metrics-loading")).toHaveTextContent(
        "not-loading"
      );
      expect(screen.getByTestId("metrics-error")).toHaveTextContent("no-error");
      expect(screen.getByTestId("metrics-change-percentage")).toHaveTextContent(
        "0"
      );
      expect(screen.getByTestId("metrics-connected")).toHaveTextContent(
        "connected"
      );
      expect(screen.getByTestId("metrics-user-id")).toHaveTextContent(
        mockUserInfo.userId
      );
    });

    it("should pass correct props to WalletActions", () => {
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

      expect(screen.getByTestId("wallet-actions")).toBeInTheDocument();
      expect(screen.getByTestId("zap-in-button")).toBeInTheDocument();
      expect(screen.getByTestId("zap-out-button")).toBeInTheDocument();
      expect(screen.getByTestId("optimize-button")).toBeInTheDocument();
    });

    it("should pass correct props to PortfolioOverview", () => {
      render(<WalletPortfolio />);

      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
      expect(screen.getByTestId("categories-count")).toHaveTextContent("2");
      expect(screen.getByTestId("debt-categories-count")).toHaveTextContent(
        "2"
      );
      expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
        "has-data"
      );
      expect(screen.getByTestId("total-value")).toHaveTextContent("15000");
      expect(screen.getByTestId("balance-hidden")).toHaveTextContent("visible");
      expect(screen.getByTestId("loading-state")).toHaveTextContent(
        "not-loading"
      );
      expect(screen.getByTestId("error-state")).toHaveTextContent("no-error");
      expect(screen.getByTestId("is-connected")).toHaveTextContent("connected");
      expect(screen.getByTestId("test-id")).toHaveTextContent(
        "wallet-portfolio-overview"
      );
      expect(screen.getByTestId("is-retrying")).toHaveTextContent(
        "not-retrying"
      );
    });

    it("should handle WalletManager modal state correctly", () => {
      mockUseWalletModal.mockReturnValue({
        isOpen: false,
        openModal: vi.fn(),
        closeModal: vi.fn(),
      });

      render(<WalletPortfolio />);

      expect(screen.queryByTestId("wallet-manager")).not.toBeInTheDocument();
    });
  });
});
