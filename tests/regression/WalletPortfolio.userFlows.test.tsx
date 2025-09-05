import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WalletPortfolio } from "../../src/components/WalletPortfolio";
import { useUser } from "../../src/contexts/UserContext";
import { useLandingPageData } from "../../src/hooks/queries/usePortfolioQuery";
import { usePortfolio } from "../../src/hooks/usePortfolio";
import {
  usePortfolioState,
  usePortfolioStateHelpers,
} from "../../src/hooks/usePortfolioState";
import { useWalletModal } from "../../src/hooks/useWalletModal";
import { render } from "../test-utils";

// Mock all dependencies
vi.mock("../../src/contexts/UserContext");
vi.mock("../../src/hooks/usePortfolio");
vi.mock("../../src/hooks/queries/usePortfolioQuery");
vi.mock("../../src/hooks/useWalletModal");
vi.mock("../../src/hooks/usePortfolioState");
vi.mock("../../src/utils/portfolio.utils");

// Create realistic component mocks
vi.mock("../../src/components/PortfolioOverview", () => ({
  PortfolioOverview: vi.fn(
    ({
      portfolioState,
      onRetry,
      isRetrying,
      onCategoryClick,
      pieChartData,
      categorySummaries,
    }) => (
      <div data-testid="portfolio-overview">
        {portfolioState?.isLoading && (
          <div data-testid="portfolio-loading">Loading portfolio...</div>
        )}
        {portfolioState?.hasError && (
          <div data-testid="portfolio-error">
            <span>{portfolioState.errorMessage || "An error occurred"}</span>
            {onRetry && (
              <button
                data-testid="portfolio-retry"
                onClick={onRetry}
                disabled={isRetrying}
              >
                {isRetrying ? "Retrying..." : "Retry"}
              </button>
            )}
          </div>
        )}
        {!portfolioState?.isLoading && !portfolioState?.hasError && (
          <div data-testid="portfolio-content">
            <div data-testid="chart-data">
              {pieChartData?.length || 0} categories
            </div>
            <div data-testid="category-summaries">
              {categorySummaries?.length || 0} summaries
            </div>
            {onCategoryClick && (
              <div data-testid="category-buttons">
                {categorySummaries?.map((category, index) => (
                  <button
                    key={index}
                    data-testid={`category-${category.id}`}
                    onClick={() => onCategoryClick(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  ),
}));

vi.mock("../../src/components/wallet/WalletHeader", () => ({
  WalletHeader: vi.fn(
    ({
      onAnalyticsClick,
      onWalletManagerClick,
      onToggleBalance,
      balanceHidden,
    }) => (
      <div data-testid="wallet-header">
        {onAnalyticsClick && (
          <button data-testid="analytics-button" onClick={onAnalyticsClick}>
            View Analytics
          </button>
        )}
        <button
          data-testid="wallet-manager-button"
          onClick={onWalletManagerClick}
        >
          Manage Wallets
        </button>
        <button data-testid="balance-toggle-button" onClick={onToggleBalance}>
          {balanceHidden ? "Show Balance" : "Hide Balance"}
        </button>
        <div data-testid="balance-visibility">
          {balanceHidden ? "hidden" : "visible"}
        </div>
      </div>
    )
  ),
}));

vi.mock("../../src/components/wallet/WalletMetrics", () => ({
  WalletMetrics: vi.fn(({ portfolioState, balanceHidden, userId }) => (
    <div data-testid="wallet-metrics">
      <div data-testid="connection-indicator">
        {portfolioState?.isConnected ? "Connected" : "Disconnected"}
      </div>
      <div data-testid="user-indicator">
        {userId ? `User: ${userId}` : "No user"}
      </div>
      {portfolioState?.isLoading ? (
        <div data-testid="metrics-loading">Loading metrics...</div>
      ) : portfolioState?.hasError ? (
        <div data-testid="metrics-error">
          Error: {portfolioState.errorMessage}
        </div>
      ) : (
        <div data-testid="total-balance">
          {balanceHidden ? "****" : `$${portfolioState?.totalValue || 0}`}
        </div>
      )}
    </div>
  )),
}));

vi.mock("../../src/components/wallet/WalletActions", () => ({
  WalletActions: vi.fn(({ onZapInClick, onZapOutClick, onOptimizeClick }) => (
    <div data-testid="wallet-actions">
      {onZapInClick && (
        <button data-testid="zap-in-action" onClick={onZapInClick}>
          Zap In
        </button>
      )}
      {onZapOutClick && (
        <button data-testid="zap-out-action" onClick={onZapOutClick}>
          Zap Out
        </button>
      )}
      {onOptimizeClick && (
        <button data-testid="optimize-action" onClick={onOptimizeClick}>
          Optimize Portfolio
        </button>
      )}
    </div>
  )),
}));

vi.mock("../../src/components/WalletManager", () => ({
  WalletManager: vi.fn(({ isOpen, onClose }) =>
    isOpen ? (
      <div data-testid="wallet-manager-modal">
        <div data-testid="wallet-manager-content">
          <h2>Wallet Manager</h2>
          <button data-testid="add-wallet">Add Wallet</button>
          <button data-testid="remove-wallet">Remove Wallet</button>
          <button data-testid="close-modal" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    ) : null
  ),
}));

vi.mock("../../src/components/ui", () => ({
  GlassCard: vi.fn(({ children }) => (
    <div data-testid="glass-card">{children}</div>
  )),
}));

vi.mock("../../src/components/errors/ErrorBoundary", () => ({
  ErrorBoundary: vi.fn(({ children }) => (
    <div data-testid="error-boundary">{children}</div>
  )),
}));

// Mock implementations
const mockUseUser = vi.mocked(useUser);
const mockUsePortfolio = vi.mocked(usePortfolio);
const mockUseLandingPageData = vi.mocked(useLandingPageData);
const mockUseWalletModal = vi.mocked(useWalletModal);
const mockUsePortfolioState = vi.mocked(usePortfolioState);
const mockUsePortfolioStateHelpers = vi.mocked(usePortfolioStateHelpers);

describe("WalletPortfolio - Critical User Flows (Regression Tests)", () => {
  const defaultUserInfo = {
    userId: "user-123",
    address: "0x742d35Cc6676C3D6c2b8e73C857c42e7A53d0C54",
    email: "user@example.com",
  };

  const defaultPortfolioData = {
    user_id: "user-123",
    total_net_usd: 15000,
    total_assets_usd: 15000,
    total_debt_usd: 0,
    weighted_apr: 8.5,
    estimated_monthly_income: 106.25,
    portfolio_allocation: {
      btc: { total_value: 6000, percentage_of_portfolio: 40 },
      eth: { total_value: 4500, percentage_of_portfolio: 30 },
      stablecoins: { total_value: 3000, percentage_of_portfolio: 20 },
      others: { total_value: 1500, percentage_of_portfolio: 10 },
    },
    category_summary_debt: {
      btc: 0,
      eth: 0,
      stablecoins: 0,
      others: 0,
    },
  };

  const mockCategorySummaries = [
    { id: "btc", name: "Bitcoin", value: 6000, percentage: 40 },
    { id: "eth", name: "Ethereum", value: 4500, percentage: 30 },
    { id: "stablecoins", name: "Stablecoins", value: 3000, percentage: 20 },
    { id: "others", name: "Others", value: 1500, percentage: 10 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default implementations
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
      data: defaultPortfolioData,
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

    // Setup portfolio state mocks
    mockUsePortfolioState.mockReturnValue({
      type: "has_data",
      isConnected: true,
      isLoading: false,
      hasError: false,
      hasZeroData: false,
      totalValue: 15000,
      errorMessage: null,
      isRetrying: false,
    });

    mockUsePortfolioStateHelpers.mockReturnValue({
      shouldShowLoading: false,
      shouldShowConnectPrompt: false,
      shouldShowNoDataMessage: false,
      shouldShowPortfolioContent: true,
      shouldShowError: false,
      getDisplayTotalValue: () => 15000,
    });

    // Mock createCategoriesFromApiData
    vi.mocked(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../../src/utils/portfolio.utils").createCategoriesFromApiData
    ).mockReturnValue(mockCategorySummaries);
  });

  describe("User Onboarding Flow", () => {
    it("should handle wallet connection flow correctly", async () => {
      // Start with disconnected state
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
      });

      const { rerender } = render(<WalletPortfolio />);

      // Should show disconnected state
      expect(screen.getByTestId("connection-indicator")).toHaveTextContent(
        "Disconnected"
      );
      expect(screen.getByTestId("user-indicator")).toHaveTextContent("No user");

      // Simulate wallet connection
      mockUseUser.mockReturnValue({
        userInfo: defaultUserInfo,
        isConnected: true,
      });

      rerender(<WalletPortfolio />);

      // Should now show connected state with user info
      expect(screen.getByTestId("connection-indicator")).toHaveTextContent(
        "Connected"
      );
      expect(screen.getByTestId("user-indicator")).toHaveTextContent(
        "User: user-123"
      );
    });

    it("should handle initial portfolio data loading", async () => {
      // Start with loading state
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      const { rerender } = render(<WalletPortfolio />);

      // Should show loading states
      expect(screen.getByTestId("metrics-loading")).toBeInTheDocument();
      expect(screen.getByTestId("portfolio-loading")).toBeInTheDocument();

      // Simulate data loaded
      mockUseLandingPageData.mockReturnValue({
        data: defaultPortfolioData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      rerender(<WalletPortfolio />);

      // Should show loaded content
      expect(screen.getByTestId("total-balance")).toHaveTextContent("$15000");
      expect(screen.getByTestId("portfolio-content")).toBeInTheDocument();
      expect(screen.getByTestId("chart-data")).toHaveTextContent(
        "4 categories"
      );
    });
  });

  describe("Portfolio Management Flow", () => {
    it("should handle complete portfolio interaction flow", async () => {
      const user = userEvent.setup();
      const onCategoryClick = vi.fn();

      render(<WalletPortfolio onCategoryClick={onCategoryClick} />);

      // 1. View portfolio overview
      expect(screen.getByTestId("portfolio-content")).toBeInTheDocument();
      expect(screen.getByTestId("category-summaries")).toHaveTextContent(
        "4 summaries"
      );

      // 2. Click on a category
      await user.click(screen.getByTestId("category-btc"));
      expect(onCategoryClick).toHaveBeenCalledWith("btc");

      // 3. Toggle balance visibility
      const balanceToggle = screen.getByTestId("balance-toggle-button");
      expect(screen.getByTestId("balance-visibility")).toHaveTextContent(
        "visible"
      );
      expect(screen.getByTestId("total-balance")).toHaveTextContent("$15000");

      await user.click(balanceToggle);
      expect(mockUsePortfolio().toggleBalanceVisibility).toHaveBeenCalled();
    });

    it("should handle portfolio optimization flow", async () => {
      const user = userEvent.setup();
      const onOptimizeClick = vi.fn();
      const onAnalyticsClick = vi.fn();

      render(
        <WalletPortfolio
          onOptimizeClick={onOptimizeClick}
          onAnalyticsClick={onAnalyticsClick}
        />
      );

      // 1. View analytics
      await user.click(screen.getByTestId("analytics-button"));
      expect(onAnalyticsClick).toHaveBeenCalled();

      // 2. Optimize portfolio
      await user.click(screen.getByTestId("optimize-action"));
      expect(onOptimizeClick).toHaveBeenCalled();
    });

    it("should handle DeFi actions flow", async () => {
      const user = userEvent.setup();
      const onZapInClick = vi.fn();
      const onZapOutClick = vi.fn();

      render(
        <WalletPortfolio
          onZapInClick={onZapInClick}
          onZapOutClick={onZapOutClick}
        />
      );

      // 1. Zap in to position
      await user.click(screen.getByTestId("zap-in-action"));
      expect(onZapInClick).toHaveBeenCalled();

      // 2. Zap out of position
      await user.click(screen.getByTestId("zap-out-action"));
      expect(onZapOutClick).toHaveBeenCalled();
    });
  });

  describe("Wallet Management Flow", () => {
    it("should handle complete wallet management flow", async () => {
      const user = userEvent.setup();
      const openModal = vi.fn();
      const closeModal = vi.fn();

      mockUseWalletModal.mockReturnValue({
        isOpen: false,
        openModal,
        closeModal,
      });

      const { rerender } = render(<WalletPortfolio />);

      // 1. Open wallet manager
      await user.click(screen.getByTestId("wallet-manager-button"));
      expect(openModal).toHaveBeenCalled();

      // 2. Simulate modal opening
      mockUseWalletModal.mockReturnValue({
        isOpen: true,
        openModal,
        closeModal,
      });

      rerender(<WalletPortfolio />);

      // 3. Should show wallet manager modal
      expect(screen.getByTestId("wallet-manager-modal")).toBeInTheDocument();
      expect(screen.getByTestId("add-wallet")).toBeInTheDocument();
      expect(screen.getByTestId("remove-wallet")).toBeInTheDocument();

      // 4. Close modal
      await user.click(screen.getByTestId("close-modal"));
      expect(closeModal).toHaveBeenCalled();
    });
  });

  describe("Error Recovery Flow", () => {
    it("should handle API error and recovery flow", async () => {
      const user = userEvent.setup();
      const refetch = vi.fn().mockResolvedValue(undefined);

      // Start with error state
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: "Failed to load portfolio data" },
        refetch,
        isRefetching: false,
      });

      const { rerender } = render(<WalletPortfolio />);

      // Should show error states
      expect(screen.getByTestId("metrics-error")).toHaveTextContent(
        "Failed to load portfolio data"
      );
      expect(screen.getByTestId("portfolio-error")).toBeInTheDocument();

      // Click retry
      await user.click(screen.getByTestId("portfolio-retry"));
      expect(refetch).toHaveBeenCalled();

      // Simulate retry in progress
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: "Failed to load portfolio data" },
        refetch,
        isRefetching: true,
      });

      rerender(<WalletPortfolio />);

      // Should show retrying state
      expect(screen.getByTestId("portfolio-retry")).toHaveTextContent(
        "Retrying..."
      );

      // Simulate successful recovery
      mockUseLandingPageData.mockReturnValue({
        data: defaultPortfolioData,
        isLoading: false,
        error: null,
        refetch,
        isRefetching: false,
      });

      rerender(<WalletPortfolio />);

      // Should show recovered content
      expect(screen.getByTestId("total-balance")).toHaveTextContent("$15000");
      expect(screen.getByTestId("portfolio-content")).toBeInTheDocument();
    });

    it("should handle network disconnection and reconnection", async () => {
      // Start connected
      const { rerender } = render(<WalletPortfolio />);
      expect(screen.getByTestId("connection-indicator")).toHaveTextContent(
        "Connected"
      );

      // Simulate disconnection
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
      });

      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: "Network error" },
        refetch: vi.fn(),
        isRefetching: false,
      });

      rerender(<WalletPortfolio />);

      expect(screen.getByTestId("connection-indicator")).toHaveTextContent(
        "Disconnected"
      );
      expect(screen.getByTestId("portfolio-error")).toBeInTheDocument();

      // Simulate reconnection
      mockUseUser.mockReturnValue({
        userInfo: defaultUserInfo,
        isConnected: true,
      });

      mockUseLandingPageData.mockReturnValue({
        data: defaultPortfolioData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      rerender(<WalletPortfolio />);

      expect(screen.getByTestId("connection-indicator")).toHaveTextContent(
        "Connected"
      );
      expect(screen.getByTestId("portfolio-content")).toBeInTheDocument();
    });
  });

  describe("Privacy and Security Flow", () => {
    it("should handle balance hiding throughout the application", async () => {
      const user = userEvent.setup();
      const toggleBalanceVisibility = vi.fn();

      // Start with balance visible
      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        toggleBalanceVisibility,
        positions: [],
        isLoading: false,
        error: null,
      });

      const { rerender } = render(<WalletPortfolio />);

      expect(screen.getByTestId("total-balance")).toHaveTextContent("$15000");
      expect(screen.getByTestId("balance-visibility")).toHaveTextContent(
        "visible"
      );

      // Hide balance
      await user.click(screen.getByTestId("balance-toggle-button"));
      expect(toggleBalanceVisibility).toHaveBeenCalled();

      // Simulate balance hidden
      mockUsePortfolio.mockReturnValue({
        balanceHidden: true,
        toggleBalanceVisibility,
        positions: [],
        isLoading: false,
        error: null,
      });

      rerender(<WalletPortfolio />);

      expect(screen.getByTestId("total-balance")).toHaveTextContent("****");
      expect(screen.getByTestId("balance-visibility")).toHaveTextContent(
        "hidden"
      );
      expect(screen.getByTestId("balance-toggle-button")).toHaveTextContent(
        "Show Balance"
      );
    });
  });

  describe("Performance Critical Paths", () => {
    it("should handle rapid user interactions without breaking", async () => {
      const user = userEvent.setup();
      const onCategoryClick = vi.fn();
      const toggleBalance = vi.fn();
      const openModal = vi.fn();

      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        toggleBalanceVisibility: toggleBalance,
        positions: [],
        isLoading: false,
        error: null,
      });

      mockUseWalletModal.mockReturnValue({
        isOpen: false,
        openModal,
        closeModal: vi.fn(),
      });

      render(<WalletPortfolio onCategoryClick={onCategoryClick} />);

      // Perform rapid interactions
      const balanceToggle = screen.getByTestId("balance-toggle-button");
      const walletButton = screen.getByTestId("wallet-manager-button");
      const categoryButton = screen.getByTestId("category-btc");

      // Rapid fire clicks
      await user.click(balanceToggle);
      await user.click(walletButton);
      await user.click(categoryButton);
      await user.click(balanceToggle);
      await user.click(categoryButton);

      expect(toggleBalance).toHaveBeenCalledTimes(2);
      expect(openModal).toHaveBeenCalledTimes(1);
      expect(onCategoryClick).toHaveBeenCalledTimes(2);
    });

    it("should handle large portfolio data efficiently", () => {
      const largePortfolioData = {
        ...defaultPortfolioData,
        total_net_usd: 1000000,
        portfolio_allocation: {
          btc: { total_value: 500000, percentage_of_portfolio: 50 },
          eth: { total_value: 300000, percentage_of_portfolio: 30 },
          stablecoins: { total_value: 150000, percentage_of_portfolio: 15 },
          others: { total_value: 50000, percentage_of_portfolio: 5 },
        },
      };

      mockUseLandingPageData.mockReturnValue({
        data: largePortfolioData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("total-balance")).toHaveTextContent("$1000000");
      expect(screen.getByTestId("portfolio-content")).toBeInTheDocument();
    });
  });

  describe("Accessibility and UX Flow", () => {
    it("should maintain accessible interaction patterns", async () => {
      const user = userEvent.setup();
      const onAnalyticsClick = vi.fn();

      render(<WalletPortfolio onAnalyticsClick={onAnalyticsClick} />);

      // Test keyboard navigation would be more appropriate with real components
      // Here we test that buttons are properly rendered and clickable
      const analyticsButton = screen.getByTestId("analytics-button");
      const balanceToggle = screen.getByTestId("balance-toggle-button");
      const walletManager = screen.getByTestId("wallet-manager-button");

      expect(analyticsButton).toBeInTheDocument();
      expect(balanceToggle).toBeInTheDocument();
      expect(walletManager).toBeInTheDocument();

      // All buttons should be interactive
      await user.click(analyticsButton);
      await user.click(balanceToggle);
      await user.click(walletManager);

      expect(onAnalyticsClick).toHaveBeenCalled();
    });
  });
});
