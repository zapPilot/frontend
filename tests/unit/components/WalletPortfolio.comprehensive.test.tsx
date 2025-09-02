import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
          <div data-testid="wallet-manager">
            <button data-testid="close-wallet-manager" onClick={onClose}>
              Close
            </button>
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

// Enhanced mocks with more realistic implementations
vi.mock("../../../src/components/PortfolioOverview", () => ({
  PortfolioOverview: vi.fn(
    ({
      isLoading,
      apiError,
      pieChartData,
      categorySummaries,
      onCategoryClick,
      onRetry,
      isRetrying,
    }) => (
      <div data-testid="portfolio-overview">
        <div data-testid="loading-state">
          {isLoading ? "loading" : "not-loading"}
        </div>
        <div data-testid="error-state">{apiError || "no-error"}</div>
        <div data-testid="pie-chart-data">
          {pieChartData && pieChartData.length > 0 ? "has-data" : "no-data"}
        </div>
        <div data-testid="categories-count">
          {categorySummaries ? categorySummaries.length : 0}
        </div>
        {onCategoryClick && (
          <button
            data-testid="category-click-btn"
            onClick={() => onCategoryClick("test-category")}
          >
            Click Category
          </button>
        )}
        {onRetry && (
          <button
            data-testid="retry-btn"
            onClick={() => onRetry()}
            disabled={isRetrying}
          >
            {isRetrying ? "Retrying..." : "Retry"}
          </button>
        )}
      </div>
    )
  ),
}));

vi.mock("../../../src/components/WalletManager", () => ({
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

vi.mock("../../../src/components/wallet/WalletHeader", () => ({
  WalletHeader: vi.fn(
    ({
      onAnalyticsClick,
      onWalletManagerClick,
      onToggleBalance,
      balanceHidden,
    }) => (
      <div data-testid="wallet-header">
        {onAnalyticsClick && (
          <button data-testid="analytics-btn" onClick={onAnalyticsClick}>
            Analytics
          </button>
        )}
        <button data-testid="wallet-manager-btn" onClick={onWalletManagerClick}>
          Wallet Manager
        </button>
        <button data-testid="toggle-balance-btn" onClick={onToggleBalance}>
          {balanceHidden ? "Show Balance" : "Hide Balance"}
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
        <div data-testid="total-value">
          {balanceHidden ? "****" : totalValue || "0"}
        </div>
        <div data-testid="loading-state">
          {isLoading ? "loading" : "not-loading"}
        </div>
        <div data-testid="error-state">{error || "no-error"}</div>
        <div data-testid="change-percentage">{portfolioChangePercentage}</div>
        <div data-testid="connection-state">
          {isConnected ? "connected" : "disconnected"}
        </div>
        <div data-testid="user-id">{userId || "no-user"}</div>
      </div>
    )
  ),
}));

vi.mock("../../../src/components/wallet/WalletActions", () => ({
  WalletActions: vi.fn(({ onZapInClick, onZapOutClick, onOptimizeClick }) => (
    <div data-testid="wallet-actions">
      {onZapInClick && (
        <button data-testid="zap-in-btn" onClick={onZapInClick}>
          Zap In
        </button>
      )}
      {onZapOutClick && (
        <button data-testid="zap-out-btn" onClick={onZapOutClick}>
          Zap Out
        </button>
      )}
      {onOptimizeClick && (
        <button data-testid="optimize-btn" onClick={onOptimizeClick}>
          Optimize
        </button>
      )}
    </div>
  )),
}));

vi.mock("../../../src/components/ui", () => ({
  GlassCard: vi.fn(({ children }) => (
    <div data-testid="glass-card">{children}</div>
  )),
}));

vi.mock("../../../src/components/errors/ErrorBoundary", () => ({
  ErrorBoundary: vi.fn(({ children }) => {
    // Simulate error boundary behavior in tests
    return <div data-testid="error-boundary">{children}</div>;
  }),
}));

// Mock implementations
const mockUseUser = vi.mocked(useUser);
const mockUsePortfolio = vi.mocked(usePortfolio);
const mockUseLandingPageData = vi.mocked(useLandingPageData);
const mockUseWalletModal = vi.mocked(useWalletModal);
const mockCreateCategoriesFromApiData = vi.mocked(createCategoriesFromApiData);

describe("WalletPortfolio - Comprehensive Tests", () => {
  const defaultUserInfo = {
    userId: "test-user-123",
    address: "0x123",
    email: null,
  };

  const defaultLandingPageData = {
    user_id: "test-user-123",
    total_net_usd: 25000,
    total_assets_usd: 25000,
    total_debt_usd: 0,
    weighted_apr: 12.5,
    estimated_monthly_income: 260.42,
    portfolio_allocation: {
      btc: { total_value: 10000, percentage_of_portfolio: 40 },
      eth: { total_value: 8000, percentage_of_portfolio: 32 },
      stablecoins: { total_value: 5000, percentage_of_portfolio: 20 },
      others: { total_value: 2000, percentage_of_portfolio: 8 },
    },
    category_summary_debt: {
      btc: 0,
      eth: 0,
      stablecoins: 0,
      others: 0,
    },
  };

  const mockCategorySummaries = [
    { id: "btc", name: "Bitcoin", value: 10000, percentage: 40 },
    { id: "eth", name: "Ethereum", value: 8000, percentage: 32 },
    { id: "stablecoins", name: "Stablecoins", value: 5000, percentage: 20 },
    { id: "others", name: "Others", value: 2000, percentage: 8 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseUser.mockReturnValue({
      userInfo: defaultUserInfo,
      isConnected: true,
    });

    mockUsePortfolio.mockReturnValue({
      balanceHidden: false,
      toggleBalanceVisibility: vi.fn(),
      positions: [],
      isLoading: false,
      error: null,
    });

    mockUseLandingPageData.mockReturnValue({
      data: defaultLandingPageData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    });

    mockUseWalletModal.mockReturnValue({
      isOpen: false,
      openModal: vi.fn(),
      closeModal: vi.fn(),
    });

    mockCreateCategoriesFromApiData.mockReturnValue(mockCategorySummaries);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Data Transformations", () => {
    it("should transform pie chart data correctly with all categories", () => {
      render(<WalletPortfolio />);

      expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
        "has-data"
      );
    });

    it("should filter out zero-value categories from pie chart", () => {
      const dataWithZeros = {
        ...defaultLandingPageData,
        portfolio_allocation: {
          btc: { total_value: 10000, percentage_of_portfolio: 100 },
          eth: { total_value: 0, percentage_of_portfolio: 0 },
          stablecoins: { total_value: 0, percentage_of_portfolio: 0 },
          others: { total_value: 0, percentage_of_portfolio: 0 },
        },
      };

      mockUseLandingPageData.mockReturnValue({
        data: dataWithZeros,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
        "has-data"
      );
    });

    it("should handle null portfolio allocation gracefully", () => {
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("pie-chart-data")).toHaveTextContent("no-data");
    });

    it("should transform portfolio metrics correctly", () => {
      render(<WalletPortfolio />);

      const totalValue = screen.getByTestId("total-value");
      expect(totalValue).toHaveTextContent("25000");
    });

    it("should handle debt category summaries", () => {
      const dataWithDebt = {
        ...defaultLandingPageData,
        total_debt_usd: 5000,
        category_summary_debt: {
          btc: 2000,
          eth: 1500,
          stablecoins: 1000,
          others: 500,
        },
      };

      mockUseLandingPageData.mockReturnValue({
        data: dataWithDebt,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(mockCreateCategoriesFromApiData).toHaveBeenCalledTimes(2); // Assets and debt
    });
  });

  describe("User Interactions", () => {
    it("should handle analytics click when provided", async () => {
      const onAnalyticsClick = vi.fn();
      const user = userEvent.setup();

      render(<WalletPortfolio onAnalyticsClick={onAnalyticsClick} />);

      const analyticsBtn = screen.getByTestId("analytics-btn");
      await user.click(analyticsBtn);

      expect(onAnalyticsClick).toHaveBeenCalledTimes(1);
    });

    it("should handle all action button clicks", async () => {
      const onZapInClick = vi.fn();
      const onZapOutClick = vi.fn();
      const onOptimizeClick = vi.fn();
      const user = userEvent.setup();

      render(
        <WalletPortfolio
          onZapInClick={onZapInClick}
          onZapOutClick={onZapOutClick}
          onOptimizeClick={onOptimizeClick}
        />
      );

      await user.click(screen.getByTestId("zap-in-btn"));
      await user.click(screen.getByTestId("zap-out-btn"));
      await user.click(screen.getByTestId("optimize-btn"));

      expect(onZapInClick).toHaveBeenCalledTimes(1);
      expect(onZapOutClick).toHaveBeenCalledTimes(1);
      expect(onOptimizeClick).toHaveBeenCalledTimes(1);
    });

    it("should handle category click when provided", async () => {
      const onCategoryClick = vi.fn();
      const user = userEvent.setup();

      render(<WalletPortfolio onCategoryClick={onCategoryClick} />);

      const categoryBtn = screen.getByTestId("category-click-btn");
      await user.click(categoryBtn);

      expect(onCategoryClick).toHaveBeenCalledWith("test-category");
    });

    it("should toggle balance visibility", async () => {
      const toggleBalanceVisibility = vi.fn();
      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        toggleBalanceVisibility,
        positions: [],
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup();
      render(<WalletPortfolio />);

      await user.click(screen.getByTestId("toggle-balance-btn"));

      expect(toggleBalanceVisibility).toHaveBeenCalledTimes(1);
    });

    it("should open and close wallet manager", async () => {
      let isModalOpen = false;
      const openModal = vi.fn(() => {
        isModalOpen = true;
      });
      const closeModal = vi.fn(() => {
        isModalOpen = false;
      });

      mockUseWalletModal.mockImplementation(() => ({
        isOpen: isModalOpen,
        openModal,
        closeModal,
      }));

      const user = userEvent.setup();
      const { rerender } = render(<WalletPortfolio />);

      await user.click(screen.getByTestId("wallet-manager-btn"));
      expect(openModal).toHaveBeenCalledTimes(1);

      // Rerender to reflect the modal state change
      rerender(<WalletPortfolio />);

      await user.click(screen.getByTestId("close-wallet-manager"));
      expect(closeModal).toHaveBeenCalledTimes(1);
    });
  });

  describe("Loading States", () => {
    it("should show loading state when data is loading", () => {
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      // Check both loading states
      const loadingStates = screen.getAllByTestId("loading-state");
      expect(loadingStates).toHaveLength(2);
      expect(loadingStates[0]).toHaveTextContent("loading"); // WalletMetrics loading
      expect(loadingStates[1]).toHaveTextContent("loading"); // PortfolioOverview loading
    });

    it("should handle retry functionality", async () => {
      const refetch = vi.fn();
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: "Network error" },
        refetch,
        isRefetching: false,
      });

      const user = userEvent.setup();
      render(<WalletPortfolio />);

      await user.click(screen.getByTestId("retry-btn"));
      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it("should show retrying state", () => {
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: "Network error" },
        refetch: vi.fn(),
        isRefetching: true,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("retry-btn")).toHaveTextContent("Retrying...");
    });
  });

  describe("Error Handling", () => {
    it("should display error state when API fails", () => {
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: "Failed to fetch data" },
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      // Check both error states
      const errorStates = screen.getAllByTestId("error-state");
      expect(errorStates).toHaveLength(2);
      expect(errorStates[0]).toHaveTextContent("Failed to fetch data"); // WalletMetrics error
      expect(errorStates[1]).toHaveTextContent("Failed to fetch data"); // PortfolioOverview error
    });

    it("should handle missing error message", () => {
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: {},
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      // Check both error states
      const errorStates = screen.getAllByTestId("error-state");
      expect(errorStates).toHaveLength(2);
      expect(errorStates[0]).toHaveTextContent("no-error"); // WalletMetrics no error
      expect(errorStates[1]).toHaveTextContent("no-error"); // PortfolioOverview no error
    });
  });

  describe("Balance Visibility", () => {
    it("should hide balance when balanceHidden is true", () => {
      mockUsePortfolio.mockReturnValue({
        balanceHidden: true,
        toggleBalanceVisibility: vi.fn(),
        positions: [],
        isLoading: false,
        error: null,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("total-value")).toHaveTextContent("****");
    });

    it("should show balance when balanceHidden is false", () => {
      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        toggleBalanceVisibility: vi.fn(),
        positions: [],
        isLoading: false,
        error: null,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("total-value")).toHaveTextContent("25000");
    });
  });

  describe("Connection States", () => {
    it("should handle connected state", () => {
      mockUseUser.mockReturnValue({
        userInfo: defaultUserInfo,
        isConnected: true,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("connection-state")).toHaveTextContent(
        "connected"
      );
      expect(screen.getByTestId("user-id")).toHaveTextContent("test-user-123");
    });

    it("should handle disconnected state", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("connection-state")).toHaveTextContent(
        "disconnected"
      );
      expect(screen.getByTestId("user-id")).toHaveTextContent("no-user");
    });

    it("should handle partial user info", () => {
      mockUseUser.mockReturnValue({
        userInfo: { userId: null, address: "0x123", email: null },
        isConnected: true,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("user-id")).toHaveTextContent("no-user");
    });
  });

  describe("Performance and Memoization", () => {
    it("should memoize data transformations when data doesn't change", () => {
      const { rerender } = render(<WalletPortfolio />);

      // Clear previous calls
      mockCreateCategoriesFromApiData.mockClear();

      // Rerender with same data
      rerender(<WalletPortfolio />);

      // Should not call transformation again due to useMemo
      expect(mockCreateCategoriesFromApiData).not.toHaveBeenCalled();
    });

    it("should recalculate when landing page data changes", () => {
      const { rerender } = render(<WalletPortfolio />);

      // Change the data
      const newData = {
        ...defaultLandingPageData,
        total_net_usd: 30000,
      };

      mockUseLandingPageData.mockReturnValue({
        data: newData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockCreateCategoriesFromApiData.mockClear();
      rerender(<WalletPortfolio />);

      // Should call transformation again with new data
      expect(mockCreateCategoriesFromApiData).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large numbers", () => {
      const dataWithLargeNumbers = {
        ...defaultLandingPageData,
        total_net_usd: 999999999.99,
        portfolio_allocation: {
          btc: { total_value: 999999999.99, percentage_of_portfolio: 100 },
          eth: { total_value: 0, percentage_of_portfolio: 0 },
          stablecoins: { total_value: 0, percentage_of_portfolio: 0 },
          others: { total_value: 0, percentage_of_portfolio: 0 },
        },
      };

      mockUseLandingPageData.mockReturnValue({
        data: dataWithLargeNumbers,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("total-value")).toHaveTextContent(
        "999999999.99"
      );
    });

    it("should handle negative values gracefully", () => {
      const dataWithNegatives = {
        ...defaultLandingPageData,
        total_net_usd: -5000,
      };

      mockUseLandingPageData.mockReturnValue({
        data: dataWithNegatives,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("total-value")).toHaveTextContent("-5000");
    });

    it("should handle rapid state changes", async () => {
      const toggleFn = vi.fn();
      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        toggleBalanceVisibility: toggleFn,
        positions: [],
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup();
      render(<WalletPortfolio />);

      const toggleBtn = screen.getByTestId("toggle-balance-btn");

      // Rapid clicks
      await user.click(toggleBtn);
      await user.click(toggleBtn);
      await user.click(toggleBtn);

      expect(toggleFn).toHaveBeenCalledTimes(3);
    });
  });

  describe("Component Lifecycle", () => {
    it("should handle remounting gracefully", () => {
      const { unmount } = render(<WalletPortfolio />);

      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();

      unmount();

      // Create fresh render after unmount
      render(<WalletPortfolio />);

      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
    });

    it("should handle prop changes dynamically", () => {
      const onAnalyticsClick1 = vi.fn();
      const onAnalyticsClick2 = vi.fn();

      const { rerender } = render(
        <WalletPortfolio onAnalyticsClick={onAnalyticsClick1} />
      );

      expect(screen.getByTestId("analytics-btn")).toBeInTheDocument();

      rerender(<WalletPortfolio onAnalyticsClick={onAnalyticsClick2} />);

      expect(screen.getByTestId("analytics-btn")).toBeInTheDocument();
    });

    it("should handle prop removal", () => {
      const { rerender } = render(
        <WalletPortfolio onAnalyticsClick={vi.fn()} />
      );

      expect(screen.getByTestId("analytics-btn")).toBeInTheDocument();

      rerender(<WalletPortfolio />);

      expect(screen.queryByTestId("analytics-btn")).not.toBeInTheDocument();
    });
  });
});
