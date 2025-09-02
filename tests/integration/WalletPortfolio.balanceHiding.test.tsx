import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WalletPortfolio } from "../../src/components/WalletPortfolio";
import { useUser } from "../../src/contexts/UserContext";
import { useLandingPageData } from "../../src/hooks/queries/usePortfolioQuery";
import { usePortfolio } from "../../src/hooks/usePortfolio";
import { useWalletModal } from "../../src/hooks/useWalletModal";
import { render } from "../test-utils";

// Mock dependencies
vi.mock("../../src/hooks/queries/usePortfolioQuery");
vi.mock("../../src/hooks/usePortfolio");
vi.mock("../../src/hooks/useWalletModal");
vi.mock("../../src/utils/portfolio.utils");
vi.mock("../../src/services/analyticsEngine");
vi.mock("../../src/contexts/UserContext");

// Mock framer-motion for simpler testing
vi.mock("framer-motion", () => ({
  motion: {
    div: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>),
    circle: vi.fn(({ children, ...props }) => (
      <circle {...props}>{children}</circle>
    )),
  },
}));

// Mock child components with testable outputs
vi.mock("../../src/components/WalletManager", () => ({
  WalletManager: vi.fn(
    ({ isOpen }: { isOpen: boolean; onClose: () => void }) =>
      isOpen ? <div data-testid="wallet-manager">Wallet Manager</div> : null
  ),
}));

vi.mock("../../src/components/ui", () => ({
  GlassCard: vi.fn(({ children }: { children: React.ReactNode }) => (
    <div data-testid="glass-card">{children}</div>
  )),
  WalletConnectionPrompt: vi.fn(() => (
    <div data-testid="wallet-connection-prompt">Connect Wallet</div>
  )),
}));

// Mock wallet components that show/hide balance
vi.mock("../../src/components/wallet/WalletHeader", () => ({
  WalletHeader: vi.fn(
    ({
      onToggleBalance,
      balanceHidden,
    }: {
      onToggleBalance: () => void;
      balanceHidden: boolean;
      onAnalyticsClick?: () => void;
      onWalletManagerClick?: () => void;
    }) => (
      <div data-testid="wallet-header">
        <button
          data-testid="toggle-balance-btn"
          onClick={onToggleBalance}
          aria-label={balanceHidden ? "Show Balance" : "Hide Balance"}
        >
          {balanceHidden ? "Show Balance" : "Hide Balance"}
        </button>
        <span data-testid="balance-state">
          {balanceHidden ? "hidden" : "visible"}
        </span>
      </div>
    )
  ),
}));

vi.mock("../../src/components/wallet/WalletMetrics", () => ({
  WalletMetrics: vi.fn(
    ({
      totalValue,
      balanceHidden,
    }: {
      totalValue: number | null;
      balanceHidden: boolean;
      isLoading?: boolean;
      error?: string | null;
      portfolioChangePercentage?: number;
      onRetry?: () => void;
      isRetrying?: boolean;
    }) => (
      <div data-testid="wallet-metrics">
        <div data-testid="total-value">
          {balanceHidden
            ? "••••••••"
            : `$${totalValue?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}`}
        </div>
        <div data-testid="balance-visibility">
          {balanceHidden ? "hidden" : "visible"}
        </div>
      </div>
    )
  ),
}));

vi.mock("../../src/components/wallet/WalletActions", () => ({
  WalletActions: vi.fn(() => <div data-testid="wallet-actions">Actions</div>),
}));

// Mock PortfolioOverview to verify props are passed correctly
vi.mock("../../src/components/PortfolioOverview", () => ({
  PortfolioOverview: vi.fn(
    ({
      renderBalanceDisplay,
      balanceHidden,
      pieChartData,
      totalValue,
    }: {
      renderBalanceDisplay?: () => React.ReactNode;
      balanceHidden?: boolean;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pieChartData: any[];
      totalValue?: number;
    }) => {
      const calculatedTotal =
        totalValue ||
        pieChartData?.reduce((sum, item) => sum + (item.value || 0), 0) ||
        0;

      const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      };

      return (
        <div data-testid="portfolio-overview">
          <div data-testid="pie-chart-mock">
            <div data-testid="pie-chart-balance">
              {renderBalanceDisplay
                ? renderBalanceDisplay()
                : balanceHidden
                  ? "••••••••"
                  : formatCurrency(calculatedTotal)}
            </div>
            <div data-testid="pie-chart-visibility-state">
              {balanceHidden ? "hidden" : "visible"}
            </div>
          </div>
          <div data-testid="portfolio-data-count">
            {pieChartData?.length || 0}
          </div>
        </div>
      );
    }
  ),
}));

const mockUseUser = vi.mocked(useUser);
const mockUseLandingPageData = vi.mocked(useLandingPageData);
const mockUsePortfolio = vi.mocked(usePortfolio);
const mockUseWalletModal = vi.mocked(useWalletModal);

// Mock data
const mockUserInfo = {
  userId: "test-user-123",
  email: "test@example.com",
};

// Removed unused mockPortfolioData - data is mocked via hooks

describe("WalletPortfolio - Balance Hiding Integration", () => {
  let mockToggleBalance: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockToggleBalance = vi.fn();

    // Setup user mock
    mockUseUser.mockReturnValue({
      userInfo: mockUserInfo,
      isConnected: true,
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    // Setup portfolio data mock
    mockUseLandingPageData.mockReturnValue({
      data: {
        total_net_usd: 25000,
        weighted_apr: 0.125,
        estimated_monthly_income: 1000,
        portfolio_allocation: {
          btc: {
            total_value: 15000,
            percentage_of_portfolio: 60,
            wallet_tokens_value: 2000,
            other_sources_value: 13000,
          },
          eth: {
            total_value: 7500,
            percentage_of_portfolio: 30,
            wallet_tokens_value: 1200,
            other_sources_value: 6300,
          },
          stablecoins: {
            total_value: 2500,
            percentage_of_portfolio: 10,
            wallet_tokens_value: 500,
            other_sources_value: 2000,
          },
          others: {
            total_value: 0,
            percentage_of_portfolio: 0,
            wallet_tokens_value: 0,
            other_sources_value: 0,
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
        total_assets_usd: 25000,
        total_debt_usd: 0,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    });

    // Setup portfolio mock - initial state with balance visible
    mockUsePortfolio.mockReturnValue({
      balanceHidden: false,
      expandedCategory: null,
      portfolioMetrics: { totalValue: 25000, changePercent: 5.2 },
      toggleBalanceVisibility: mockToggleBalance,
      toggleCategoryExpansion: vi.fn(),
    });

    // Setup wallet modal mock
    mockUseWalletModal.mockReturnValue({
      isOpen: false,
      openModal: vi.fn(),
      closeModal: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Balance Toggle Functionality", () => {
    it("should initially show balance by default", () => {
      render(<WalletPortfolio />);

      // Verify initial state shows balance
      expect(screen.getByTestId("balance-state")).toHaveTextContent("visible");
      expect(screen.getByTestId("balance-visibility")).toHaveTextContent(
        "visible"
      );
      expect(
        screen.getByTestId("pie-chart-visibility-state")
      ).toHaveTextContent("visible");

      // Verify actual values are displayed
      expect(screen.getByTestId("total-value")).toHaveTextContent("$25,000.00");
      expect(screen.getByTestId("pie-chart-balance")).toHaveTextContent(
        "$25,000.00"
      );
    });

    it("should hide balance when toggle button is clicked", async () => {
      const { rerender } = render(<WalletPortfolio />);

      // Click the toggle button
      const toggleButton = screen.getByTestId("toggle-balance-btn");
      await act(async () => {
        fireEvent.click(toggleButton);
      });

      expect(mockToggleBalance).toHaveBeenCalledTimes(1);

      // Update mock to hidden state and re-render
      mockUsePortfolio.mockReturnValue({
        balanceHidden: true,
        expandedCategory: null,
        portfolioMetrics: { totalValue: 25000, changePercent: 5.2 },
        toggleBalanceVisibility: mockToggleBalance,
        toggleCategoryExpansion: vi.fn(),
      });

      rerender(<WalletPortfolio />);

      // Verify balance is now hidden
      expect(screen.getByTestId("balance-state")).toHaveTextContent("hidden");
      expect(screen.getByTestId("balance-visibility")).toHaveTextContent(
        "hidden"
      );
      expect(
        screen.getByTestId("pie-chart-visibility-state")
      ).toHaveTextContent("hidden");

      // Verify hidden placeholders are displayed
      expect(screen.getByTestId("total-value")).toHaveTextContent("••••••••");
      expect(screen.getByTestId("pie-chart-balance")).toHaveTextContent(
        "••••••••"
      );

      // Verify button text changed
      expect(toggleButton).toHaveTextContent("Show Balance");
    });

    it("should show balance again when toggle button is clicked twice", async () => {
      const { rerender } = render(<WalletPortfolio />);

      const toggleButton = screen.getByTestId("toggle-balance-btn");

      // Hide balance - first click
      await act(async () => {
        fireEvent.click(toggleButton);
      });

      // Update mock to hidden state and re-render
      mockUsePortfolio.mockReturnValue({
        balanceHidden: true,
        expandedCategory: null,
        portfolioMetrics: { totalValue: 25000, changePercent: 5.2 },
        toggleBalanceVisibility: mockToggleBalance,
        toggleCategoryExpansion: vi.fn(),
      });
      rerender(<WalletPortfolio />);

      expect(screen.getByTestId("balance-state")).toHaveTextContent("hidden");

      // Show balance again - second click
      await act(async () => {
        fireEvent.click(toggleButton);
      });

      expect(mockToggleBalance).toHaveBeenCalledTimes(2);

      // Update mock back to visible state and re-render
      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: { totalValue: 25000, changePercent: 5.2 },
        toggleBalanceVisibility: mockToggleBalance,
        toggleCategoryExpansion: vi.fn(),
      });
      rerender(<WalletPortfolio />);

      expect(screen.getByTestId("balance-state")).toHaveTextContent("visible");
      expect(screen.getByTestId("balance-visibility")).toHaveTextContent(
        "visible"
      );
      expect(
        screen.getByTestId("pie-chart-visibility-state")
      ).toHaveTextContent("visible");

      // Verify actual values are displayed again
      expect(screen.getByTestId("total-value")).toHaveTextContent("$25,000.00");
      expect(screen.getByTestId("pie-chart-balance")).toHaveTextContent(
        "$25,000.00"
      );
      expect(toggleButton).toHaveTextContent("Hide Balance");
    });

    it("should synchronize balance visibility across all components", async () => {
      const { rerender } = render(<WalletPortfolio />);

      // Verify all components start in sync
      expect(screen.getByTestId("balance-state")).toHaveTextContent("visible");
      expect(screen.getByTestId("balance-visibility")).toHaveTextContent(
        "visible"
      );
      expect(
        screen.getByTestId("pie-chart-visibility-state")
      ).toHaveTextContent("visible");

      // Toggle balance
      await act(async () => {
        fireEvent.click(screen.getByTestId("toggle-balance-btn"));
      });

      // Update mock to hidden state and re-render
      mockUsePortfolio.mockReturnValue({
        balanceHidden: true,
        expandedCategory: null,
        portfolioMetrics: { totalValue: 25000, changePercent: 5.2 },
        toggleBalanceVisibility: mockToggleBalance,
        toggleCategoryExpansion: vi.fn(),
      });
      rerender(<WalletPortfolio />);

      // Verify all components are updated synchronously
      expect(screen.getByTestId("balance-state")).toHaveTextContent("hidden");
      expect(screen.getByTestId("balance-visibility")).toHaveTextContent(
        "hidden"
      );
      expect(
        screen.getByTestId("pie-chart-visibility-state")
      ).toHaveTextContent("hidden");

      // Verify all display the hidden state
      expect(screen.getByTestId("total-value")).toHaveTextContent("••••••••");
      expect(screen.getByTestId("pie-chart-balance")).toHaveTextContent(
        "••••••••"
      );
    });
  });
});
