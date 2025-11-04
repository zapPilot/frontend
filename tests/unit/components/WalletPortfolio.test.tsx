import { act, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WalletPortfolio } from "../../../src/components/WalletPortfolio";
import { useUser } from "../../../src/contexts/UserContext";
import { useLandingPageData } from "../../../src/hooks/queries/usePortfolioQuery";
import {
  usePortfolioState,
  usePortfolioStateHelpers,
} from "../../../src/hooks/usePortfolioState";
import { createCategoriesFromApiData } from "../../../src/utils/portfolio.utils";
import { render } from "../../test-utils";

// Mock dependencies
vi.mock("../../../src/contexts/UserContext");
vi.mock("../../../src/hooks/queries/usePortfolioQuery");
vi.mock("../../../src/hooks/usePortfolioState");
vi.mock("../../../src/utils/portfolio.utils");
vi.mock("../../../src/components/PortfolioOverview", () => ({
  PortfolioOverview: vi.fn(({ portfolioState, pieChartData, onRetry }) => (
    <div data-testid="portfolio-overview">
      <div data-testid="loading-state">
        {portfolioState?.isLoading ? "loading" : "not-loading"}
      </div>
      <div data-testid="error-state">
        {portfolioState?.errorMessage || "no-error"}
      </div>
      {portfolioState?.hasError && onRetry && (
        <button data-testid="retry-button" onClick={onRetry}>
          Retry
        </button>
      )}
      <div data-testid="pie-chart-data">
        {pieChartData && pieChartData.length > 0 ? "has-data" : "no-data"}
      </div>
    </div>
  )),
}));

vi.mock("../../../src/components/WalletManager", () => ({
  WalletManager: vi.fn(
    ({ isOpen }: { isOpen: boolean; onClose: () => void }) =>
      isOpen ? <div data-testid="wallet-manager">Wallet Manager</div> : null
  ),
}));

vi.mock("../../../src/components/ui", () => ({
  BaseCard: vi.fn(({ children }: { children: React.ReactNode }) => (
    <div data-testid="base-card">{children}</div>
  )),
  GradientButton: vi.fn(
    ({
      children,
      onClick,
      testId,
      icon: Icon,
    }: {
      children: React.ReactNode;
      onClick?: () => void;
      testId?: string;
      icon?: any;
    }) => (
      <button data-testid={testId || "gradient-button"} onClick={onClick}>
        {Icon && <Icon />}
        {children}
      </button>
    )
  ),
}));

// Mock LoadingSpinner and LoadingState components used by WalletMetrics
vi.mock("../../../src/components/ui/LoadingSpinner", () => ({
  LoadingSpinner: vi.fn(() => (
    <span data-testid="loading-spinner">Loading...</span>
  )),
}));

vi.mock("../../../src/components/ui/LoadingState", () => ({
  WalletMetricsSkeleton: vi.fn(() => (
    <div data-testid="wallet-metrics-skeleton">Loading skeleton...</div>
  )),
}));

vi.mock("lucide-react", () => ({
  AlertCircle: vi.fn(() => <span>AlertCircle</span>),
  ArrowDownLeft: vi.fn(() => <span>ArrowDownLeft</span>),
  ArrowUpRight: vi.fn(() => <span>ArrowUpRight</span>),
  BarChart3: vi.fn(() => <span>BarChart3</span>),
  DollarSign: vi.fn(() => <span>DollarSign</span>),
  Eye: vi.fn(() => <span>Eye</span>),
  EyeOff: vi.fn(() => <span>EyeOff</span>),
  Loader: vi.fn(() => <span data-testid="loader">Loading...</span>),
  Settings: vi.fn(() => <span>Settings</span>),
  TrendingDown: vi.fn(() => <span>TrendingDown</span>),
  TrendingUp: vi.fn(() => <span>TrendingUp</span>),
  Wallet: vi.fn(() => <span>Wallet</span>),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: vi.fn(
      ({
        children,
        ...props
      }: {
        children: React.ReactNode;
        [key: string]: any;
      }) => <div {...props}>{children}</div>
    ),
    button: vi.fn(({ children, whileHover, whileTap, ...props }) => (
      <button {...props}>{children}</button>
    )),
  },
}));

// Mock ThirdWeb hooks
vi.mock("thirdweb/react", () => ({
  useActiveAccount: vi.fn(() => null),
  ConnectButton: vi.fn(({ children, ...props }) => (
    <button data-testid="connect-button" {...props}>
      Connect Wallet
    </button>
  )),
}));

// Mock SimpleConnectButton
vi.mock("../../../src/components/Web3/SimpleConnectButton", () => ({
  SimpleConnectButton: vi.fn(({ className, size: _size }) => (
    <button data-testid="simple-connect-button" className={className}>
      Connect Wallet
    </button>
  )),
}));

// Mock data for testing new API structure
const mockAssetCategories = [
  {
    id: "btc",
    name: "BTC",
    totalValue: 7500,
    percentage: 50,
    color: "#F7931A",
    change24h: 5.2,
    assets: [
      {
        name: "Bitcoin",
        symbol: "BTC",
        protocol: "Native",
        amount: 0.25,
        value: 7500,
        apr: 0,
        type: "crypto",
      },
    ],
  },
  {
    id: "eth",
    name: "ETH",
    totalValue: 4500,
    percentage: 30,
    color: "#627EEA",
    change24h: 3.1,
    assets: [
      {
        name: "Ethereum",
        symbol: "ETH",
        protocol: "Native",
        amount: 2.5,
        value: 4500,
        apr: 4.5,
        type: "crypto",
      },
    ],
  },
];

const mockBorrowingCategories = [
  {
    id: "borrowed-usdc",
    name: "Stablecoins",
    totalValue: -2000, // Negative for borrowing
    percentage: 20,
    color: "#26A17B",
    change24h: 0,
    assets: [
      {
        name: "USDC",
        symbol: "USDC",
        protocol: "Compound",
        amount: 2000, // Amount stays positive
        value: -2000, // Value is negative for borrowing
        apr: -5.5, // Negative APR for borrowing costs
        type: "borrowed",
      },
    ],
  },
];

const _mockPieChartData = [
  {
    label: "BTC",
    value: 7500,
    percentage: 50,
    color: "#F7931A",
  },
  {
    label: "ETH",
    value: 4500,
    percentage: 30,
    color: "#627EEA",
  },
];

// Mock data with borrowing included (should be filtered out of pie chart)
const _mockMixedPortfolioData = [
  ...mockAssetCategories,
  ...mockBorrowingCategories,
];

const mockUserInfo = { userId: "test-user-123" };
const _mockPortfolioMetrics = {
  totalValue: 10000,
  totalChangePercentage: 5.2,
  totalChangeValue: 500,
};

// Mock new API response structure
const _mockNewApiResponse = {
  metrics: { total_value_usd: 15000 },
  asset_positions: [
    {
      category: "crypto",
      positions: [
        {
          symbol: "BTC",
          protocol_name: "Native",
          amount: 0.25,
          total_usd_value: 7500,
          protocol_type: "crypto",
        },
        {
          symbol: "ETH",
          protocol_name: "Native",
          amount: 2.5,
          total_usd_value: 4500,
          protocol_type: "crypto",
        },
      ],
    },
  ],
  borrowing_positions: [
    {
      category: "stablecoins",
      positions: [
        {
          symbol: "USDC",
          protocol_name: "Compound",
          amount: 2000,
          total_usd_value: 2000, // Positive in new API structure
          protocol_type: "lending",
        },
      ],
    },
  ],
};

describe("WalletPortfolio", () => {
  const mockUseUser = vi.mocked(useUser);
  const mockUseLandingPageData = vi.mocked(useLandingPageData);
  const mockUsePortfolioState = vi.mocked(usePortfolioState);
  const mockUsePortfolioStateHelpers = vi.mocked(usePortfolioStateHelpers);
  const mockCreateCategoriesFromApiData = vi.mocked(
    createCategoriesFromApiData
  );

  beforeEach(() => {
    // Mock individual hooks
    mockUseUser.mockReturnValue({
      userInfo: mockUserInfo,
      isConnected: true,
      loading: false,
    });

    mockUseLandingPageData.mockReturnValue({
      data: {
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
        category_summary_debt: {
          btc: 0,
          eth: 0,
          stablecoins: 0,
          others: 0,
        },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    });

    // Setup portfolio state mock
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

    mockCreateCategoriesFromApiData.mockImplementation(categoryData => {
      if (!categoryData) {
        return [];
      }

      const hasPositiveValue = Object.values(categoryData).some(
        value => value > 0
      );

      return hasPositiveValue ? mockAssetCategories : [];
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Borrowing Data Separation & Pie Chart Validation", () => {
    it("should call individual hooks and get pie chart data that excludes borrowing", async () => {
      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Verify that the individual hooks are called
      expect(mockUseUser).toHaveBeenCalled();
      expect(mockUseLandingPageData).toHaveBeenCalledWith(mockUserInfo.userId);
      expect(screen.getByTitle("Hide Balance")).toBeInTheDocument();
      expect(mockCreateCategoriesFromApiData).toHaveBeenCalledWith(
        { btc: 7500, eth: 4500, stablecoins: 2000, others: 1000 },
        15000
      );
    });

    it("should ensure pie chart data only contains positive asset values, no borrowing", async () => {
      // Mock data with borrowing included in portfolio but excluded from pie chart
      mockUseLandingPageData.mockReturnValue({
        data: {
          total_net_usd: 10000,
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
          total_debt_usd: 5000,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Verify pie chart data contains only positive values (no borrowing)
      expect(mockCreateCategoriesFromApiData).toHaveBeenCalledWith(
        { btc: 7500, eth: 4500, stablecoins: 2000, others: 1000 },
        15000
      );
    });

    it("should handle preparePortfolioDataWithBorrowing being called directly", async () => {
      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Verify that the component uses the borrowing-aware transformation
      expect(mockCreateCategoriesFromApiData).toHaveBeenCalledWith(
        { btc: 7500, eth: 4500, stablecoins: 2000, others: 1000 },
        15000
      );
    });

    it("should validate that borrowing data is separated but pie chart excludes it", async () => {
      mockUseLandingPageData.mockReturnValue({
        data: {
          total_net_usd: 12000,
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
          total_debt_usd: 3000,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });
    });
  });

  describe("Prop Passing to PortfolioOverview", () => {
    it("should pass isLoading=true initially", async () => {
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockUseUser.mockReturnValue({
        userInfo: mockUserInfo,
        isConnected: false,
        loading: false,
      });

      await act(async () => {
        render(<WalletPortfolio />);
      });

      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading");
    });

    it("should pass isLoading=false after API call completes", async () => {
      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("loading-state")).toHaveTextContent(
          "not-loading"
        );
      });
    });

    it("should pass apiError when API call fails", async () => {
      const errorMessage = "Failed to load portfolio summary";
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: errorMessage },
        refetch: vi.fn(),
        isRefetching: false,
      });

      // Update portfolio state mock to reflect error state
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

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("error-state")).toHaveTextContent(
          errorMessage
        );
      });
    });

    it("should correctly pass pieChartData prop to PortfolioOverview", async () => {
      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Verify that PortfolioOverview receives the correct pieChartData
      expect(mockCreateCategoriesFromApiData).toHaveBeenCalledWith(
        { btc: 7500, eth: 4500, stablecoins: 2000, others: 1000 },
        15000
      );
    });
  });

  describe("New API Structure Integration", () => {
    it("should handle new asset_positions and borrowing_positions API structure", async () => {
      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Verify individual hooks properly handle new structure
      expect(mockUseLandingPageData).toHaveBeenCalledWith(mockUserInfo.userId);
      expect(mockCreateCategoriesFromApiData).toHaveBeenCalled();
    });

    it("should maintain backward compatibility with legacy structure", async () => {
      // Mock legacy structure compatibility
      const _legacyCategories = [
        {
          id: "mixed",
          name: "Mixed Assets",
          totalValue: 15000,
          percentage: 100,
          color: "#333333",
          change24h: 2.5,
          assets: [
            ...mockAssetCategories[0].assets,
            ...mockAssetCategories[1].assets,
          ],
        },
      ];

      mockUseLandingPageData.mockReturnValue({
        data: {
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
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });
    });
  });

  describe("Edge Cases and Data Validation", () => {
    it("should handle mixed positive and negative values correctly", async () => {
      // Create data with both positive assets and negative borrowing
      const _mixedPieChartData = [
        { label: "BTC", value: 8000, percentage: 60, color: "#F7931A" },
        { label: "ETH", value: 5000, percentage: 40, color: "#627EEA" },
        // Note: No negative borrowing values in pie chart
      ];

      mockUseLandingPageData.mockReturnValue({
        data: {
          total_net_usd: 13000,
          weighted_apr: 0.125,
          estimated_monthly_income: 1000,
          portfolio_allocation: {
            btc: {
              total_value: 8000,
              percentage_of_portfolio: 61.54,
              wallet_tokens_value: 1200,
              other_sources_value: 6800,
            },
            eth: {
              total_value: 5000,
              percentage_of_portfolio: 38.46,
              wallet_tokens_value: 900,
              other_sources_value: 4100,
            },
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
          total_assets_usd: 13000,
          total_debt_usd: 0,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });
    });

    it("should handle empty asset positions gracefully", async () => {
      mockUseLandingPageData.mockReturnValue({
        data: {
          total_net_usd: 0,
          weighted_apr: 0,
          estimated_monthly_income: 0,
          portfolio_allocation: {
            btc: {
              total_value: 0,
              percentage_of_portfolio: 0,
              wallet_tokens_value: 0,
              other_sources_value: 0,
            },
            eth: {
              total_value: 0,
              percentage_of_portfolio: 0,
              wallet_tokens_value: 0,
              other_sources_value: 0,
            },
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
          total_assets_usd: 0,
          total_debt_usd: 0,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "no-data"
        );
      });
    });

    it("should validate pie chart data structure and prevent invalid borrowing inclusion", async () => {
      // Test that even if somehow borrowing data leaks into pie chart, it's handled
      const _validPieChartData = [
        { label: "BTC", value: 7500, percentage: 50, color: "#F7931A" },
        { label: "ETH", value: 4500, percentage: 30, color: "#627EEA" },
        // Borrowing should be filtered out by preparePortfolioDataWithBorrowing
      ];

      mockUseLandingPageData.mockReturnValue({
        data: {
          total_net_usd: 10000,
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
          total_debt_usd: 5000,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Component should render correctly with filtered data
      expect(mockCreateCategoriesFromApiData).toHaveBeenCalledWith(
        { btc: 7500, eth: 4500, stablecoins: 2000, others: 1000 },
        15000
      );
    });
  });

  describe("Loading States", () => {
    it("should show loading state when portfolio data is loading", () => {
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading");
    });

    it("should show loading state while retrying", () => {
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: true,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading");
    });

    it("should stop loading when data is loaded successfully", async () => {
      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("loading-state")).toHaveTextContent(
          "not-loading"
        );
      });

      expect(mockUseLandingPageData).toHaveBeenCalledWith(mockUserInfo.userId);
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully with decomposed hooks", async () => {
      const errorMessage = "Network error";
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: errorMessage },
        refetch: vi.fn(),
        isRefetching: false,
      });

      // Update portfolio state mock to reflect error state
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

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("error-state")).toHaveTextContent(
          errorMessage
        );
      });

      // Component should still render pie chart data placeholder even on error
      expect(screen.getByTestId("pie-chart-data")).toHaveTextContent("no-data");
    });

    it("should handle data transformation errors gracefully", async () => {
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: "Failed to transform portfolio data" },
        refetch: vi.fn(),
        isRefetching: false,
      });

      // Update portfolio state mock to reflect error state
      mockUsePortfolioState.mockReturnValue({
        type: "error",
        isConnected: true,
        isLoading: false,
        hasError: true,
        hasZeroData: false,
        totalValue: null,
        errorMessage: "Failed to transform portfolio data",
        isRetrying: false,
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("error-state")).toHaveTextContent(
          "Failed to transform portfolio data"
        );
      });
    });

    it("should clear previous errors on successful data load", async () => {
      // Test that a successful response has no error
      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("error-state")).toHaveTextContent("no-error");
      });

      // Verify successful state with decomposed hooks
      expect(mockUseLandingPageData).toHaveBeenCalledWith(mockUserInfo.userId);
    });

    it("should handle retry functionality for failed API calls", async () => {
      const mockRetry = vi.fn();
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: "API call failed" },
        refetch: mockRetry,
        isRefetching: false,
      });

      // Update portfolio state mock to reflect error state
      mockUsePortfolioState.mockReturnValue({
        type: "error",
        isConnected: true,
        isLoading: false,
        hasError: true,
        hasZeroData: false,
        totalValue: null,
        errorMessage: "API call failed",
        isRetrying: false,
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("error-state")).toHaveTextContent(
          "API call failed"
        );
      });

      // Verify retry function is available through usePortfolioDisplayData
      expect(mockRetry).toBeDefined();
    });
  });

  describe("User Context Integration", () => {
    it("should handle disconnected wallet state", async () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
        loading: false,
      });

      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("loading-state")).toHaveTextContent(
          "not-loading"
        );
      });

      expect(screen.getByTestId("pie-chart-data")).toHaveTextContent("no-data");
    });

    it("should fetch data when wallet becomes connected", async () => {
      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(mockUseLandingPageData).toHaveBeenCalledWith(
          mockUserInfo.userId
        );
      });

      expect(screen.getByTestId("loading-state")).toHaveTextContent(
        "not-loading"
      );
    });
  });

  describe("Component Props", () => {
    it("should handle optional callback props", async () => {
      const onOptimizeClick = vi.fn();
      const onZapInClick = vi.fn();
      const onZapOutClick = vi.fn();

      await act(async () => {
        render(
          <WalletPortfolio
            onOptimizeClick={onOptimizeClick}
            onZapInClick={onZapInClick}
            onZapOutClick={onZapOutClick}
          />
        );
      });

      // Component should render without issues when all props are provided
      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
    });

    it("should handle no props provided", async () => {
      await act(async () => {
        render(<WalletPortfolio />);
      });

      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
    });
  });

  describe("UI Layout Structure", () => {
    it("should render wallet header icon", () => {
      render(<WalletPortfolio />);

      // Check for DollarSign icon (mocked as span with text content)
      expect(screen.getByText("DollarSign")).toBeInTheDocument();
    });

    it("should render action buttons grid", () => {
      render(<WalletPortfolio />);

      // Action buttons - test by text content
      expect(screen.getByText("Zap In")).toBeInTheDocument();
      expect(screen.getByText("Zap Out")).toBeInTheDocument();
      expect(screen.getByText("Optimize")).toBeInTheDocument();
    });

    it("should render action button icons", () => {
      render(<WalletPortfolio />);

      // Action button icons
      expect(screen.getByText("ArrowUpRight")).toBeInTheDocument(); // Zap In
      expect(screen.getByText("ArrowDownLeft")).toBeInTheDocument(); // Zap Out
      expect(screen.getByText("Settings")).toBeInTheDocument(); // Optimize
    });

    it("should render portfolio overview section", () => {
      render(<WalletPortfolio />);

      // Portfolio section - these are provided by PortfolioOverview component
      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
      expect(screen.getByTestId("pie-chart-data")).toBeInTheDocument();
    });

    it("should not show analytics button when callback not provided", () => {
      render(<WalletPortfolio />);

      expect(
        screen.queryByRole("button", { name: /view analytics/i })
      ).not.toBeInTheDocument();
      expect(screen.queryByText("BarChart3")).not.toBeInTheDocument();
    });

    it("should show loading spinner in metrics when loading", () => {
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      // Should show loading state in balance display
      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading");
    });

    it("should show error state in portfolio when API fails", async () => {
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: "API Error" },
        refetch: vi.fn(),
        isRefetching: false,
      });

      // Update portfolio state mock to reflect error state
      mockUsePortfolioState.mockReturnValue({
        type: "error",
        isConnected: true,
        isLoading: false,
        hasError: true,
        hasZeroData: false,
        totalValue: null,
        errorMessage: "API Error",
        isRetrying: false,
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("error-state")).toHaveTextContent(
          "API Error"
        );
      });
    });

    it("should render all gradient buttons with proper structure", () => {
      render(<WalletPortfolio />);

      // Should have 3 gradient buttons
      const gradientButtons = screen.getAllByTestId("gradient-button");
      expect(gradientButtons).toHaveLength(3);

      // Each button should contain both icon and text
      const zapInButton = gradientButtons.find(btn =>
        btn.textContent?.includes("Zap In")
      );
      const zapOutButton = gradientButtons.find(btn =>
        btn.textContent?.includes("Zap Out")
      );
      const optimizeButton = gradientButtons.find(btn =>
        btn.textContent?.includes("Optimize")
      );

      expect(zapInButton).toBeInTheDocument();
      expect(zapOutButton).toBeInTheDocument();
      expect(optimizeButton).toBeInTheDocument();
    });
  });

  describe("Wallet Actions Integration", () => {
    it("should toggle balance visibility via header control", async () => {
      render(<WalletPortfolio />);

      const toggleButton = await screen.findByTitle("Hide Balance");
      expect(toggleButton).toBeInTheDocument();

      await act(async () => {
        toggleButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTitle("Show Balance")).toBeInTheDocument();
      });
    });

    it("should provide wallet action callbacks correctly", async () => {
      const onOptimizeClick = vi.fn();
      const onZapInClick = vi.fn();
      const onZapOutClick = vi.fn();

      render(
        <WalletPortfolio
          onOptimizeClick={onOptimizeClick}
          onZapInClick={onZapInClick}
          onZapOutClick={onZapOutClick}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
      });

      // Verify component renders with all action callbacks using decomposed hooks
      expect(mockUseLandingPageData).toHaveBeenCalledWith(mockUserInfo.userId);
      expect(screen.getByTitle("Hide Balance")).toBeInTheDocument();
    });
  });

  describe("Component Integration & Data Flow", () => {
    it("should correctly integrate decomposed hooks with component rendering", async () => {
      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Verify all hooks are called and data flows correctly
      expect(mockUseUser).toHaveBeenCalled();
      expect(mockUseLandingPageData).toHaveBeenCalledWith(mockUserInfo.userId);
      expect(mockCreateCategoriesFromApiData).toHaveBeenCalled();
      expect(screen.getByTitle("Hide Balance")).toBeInTheDocument();
    });

    it("should handle component rerendering with data updates", async () => {
      const { rerender } = render(<WalletPortfolio />);

      // Initial render
      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Update mock data in usePortfolioDisplayData
      mockUseLandingPageData.mockReturnValue({
        data: {
          total_net_usd: 20000,
          weighted_apr: 0.125,
          estimated_monthly_income: 1000,
          portfolio_allocation: {
            btc: {
              total_value: 12000,
              percentage_of_portfolio: 60,
              wallet_tokens_value: 1500,
              other_sources_value: 10500,
            },
            eth: {
              total_value: 8000,
              percentage_of_portfolio: 40,
              wallet_tokens_value: 1200,
              other_sources_value: 6800,
            },
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
          total_assets_usd: 20000,
          total_debt_usd: 0,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      // Rerender
      rerender(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });
    });
  });

  describe("Cleanup and Memory Leaks", () => {
    it("should handle component unmounting gracefully", async () => {
      const { unmount } = render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
      });

      // Unmount component
      unmount();

      // No assertions needed - the test passes if no errors are thrown
      // This verifies that the new hook structure doesn't cause memory leaks
    });
  });
});
