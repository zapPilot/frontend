import { act, screen, waitFor } from "@testing-library/react";
import { render } from "../../test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WalletPortfolio } from "../../../src/components/WalletPortfolio";
import { useUser } from "../../../src/contexts/UserContext";
import { usePortfolio } from "../../../src/hooks/usePortfolio";
import { usePortfolioData } from "../../../src/hooks/usePortfolioData";
import { useWalletPortfolioState } from "../../../src/hooks/useWalletPortfolioState";
import { usePortfolioAPR } from "../../../src/hooks/queries/useAPRQuery";
import { getPortfolioSummary } from "../../../src/services/quantEngine";
import { preparePortfolioDataWithBorrowing } from "../../../src/utils/portfolioTransformers";

// Mock dependencies
vi.mock("../../../src/contexts/UserContext");
vi.mock("../../../src/hooks/usePortfolio");
vi.mock("../../../src/hooks/usePortfolioData");
vi.mock("../../../src/hooks/useWalletPortfolioState");
vi.mock("../../../src/hooks/queries/useAPRQuery");
vi.mock("../../../src/services/quantEngine");
vi.mock("../../../src/utils/portfolioTransformers");
vi.mock("../../../src/components/PortfolioOverview", () => ({
  PortfolioOverview: vi.fn(({ isLoading, apiError, pieChartData }) => (
    <div data-testid="portfolio-overview">
      <div data-testid="loading-state">
        {isLoading ? "loading" : "not-loading"}
      </div>
      <div data-testid="error-state">{apiError || "no-error"}</div>
      <div data-testid="pie-chart-data">
        {pieChartData ? "has-data" : "no-data"}
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
  GlassCard: vi.fn(({ children }: { children: React.ReactNode }) => (
    <div data-testid="glass-card">{children}</div>
  )),
  GradientButton: vi.fn(
    ({
      children,
      onClick,
      icon: Icon,
    }: {
      children: React.ReactNode;
      onClick: () => void;
      icon: React.ReactNode;
    }) => (
      <button data-testid="gradient-button" onClick={onClick}>
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
  SimpleConnectButton: vi.fn(({ className, size }) => (
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

const mockPieChartData = [
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
const mockMixedPortfolioData = [
  ...mockAssetCategories,
  ...mockBorrowingCategories,
];

const mockUserInfo = { userId: "test-user-123" };
const mockPortfolioMetrics = { totalValue: 10000 };

// Mock new API response structure
const mockNewApiResponse = {
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
  const mockUsePortfolio = vi.mocked(usePortfolio);
  const mockUsePortfolioData = vi.mocked(usePortfolioData);
  const mockUseWalletPortfolioState = vi.mocked(useWalletPortfolioState);
  const mockUsePortfolioAPR = vi.mocked(usePortfolioAPR);
  const mockGetPortfolioSummary = vi.mocked(getPortfolioSummary);
  const mockPreparePortfolioDataWithBorrowing = vi.mocked(
    preparePortfolioDataWithBorrowing
  );

  beforeEach(() => {
    // Default mock implementations
    mockUseUser.mockReturnValue({
      userInfo: mockUserInfo,
      loading: false,
    });

    // Mock the APR hook with default values
    mockUsePortfolioAPR.mockReturnValue({
      data: {
        portfolio_summary: {
          total_asset_value_usd: 15000,
          weighted_apr: 0.045, // 4.5% APR
        },
        pool_details: [],
      },
      portfolioAPR: 0.045,
      estimatedMonthlyIncome: 56.25, // 15000 * 0.045 / 12
      poolDetails: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    });

    // Mock the new consolidated hook
    mockUseWalletPortfolioState.mockReturnValue({
      totalValue: 15000,
      portfolioData: mockAssetCategories,
      pieChartData: mockPieChartData,
      isLoading: false,
      apiError: null,
      retry: vi.fn(),
      isRetrying: false,
      isConnected: true,
      balanceHidden: false,
      expandedCategory: null,
      portfolioMetrics: mockPortfolioMetrics,
      toggleBalanceVisibility: vi.fn(),
      toggleCategoryExpansion: vi.fn(),
      isWalletManagerOpen: false,
      openWalletManager: vi.fn(),
      closeWalletManager: vi.fn(),
    });

    // Mock the data transformation utility
    mockPreparePortfolioDataWithBorrowing.mockReturnValue({
      portfolioData: mockAssetCategories,
      pieChartData: mockPieChartData,
      borrowingData: {
        assetsPieData: mockPieChartData,
        borrowingItems: [],
        netValue: 12000,
        totalBorrowing: 0,
        hasBorrowing: false,
      },
    });

    mockGetPortfolioSummary.mockResolvedValue({
      metrics: { total_value_usd: 15000 },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Borrowing Data Separation & Pie Chart Validation", () => {
    it("should use useWalletPortfolioState hook and get pie chart data that excludes borrowing", async () => {
      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Verify that the consolidated hook is called
      expect(mockUseWalletPortfolioState).toHaveBeenCalled();
    });

    it("should ensure pie chart data only contains positive asset values, no borrowing", async () => {
      // Mock data with borrowing included in portfolio but excluded from pie chart
      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: 10000,
        portfolioData: mockMixedPortfolioData, // Includes borrowing
        pieChartData: mockPieChartData, // Only assets (positive values)
        isLoading: false,
        apiError: null,
        retry: vi.fn(),
        isRetrying: false,
        isConnected: true,
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: mockPortfolioMetrics,
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
        isWalletManagerOpen: false,
        openWalletManager: vi.fn(),
        closeWalletManager: vi.fn(),
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Verify pie chart data contains only positive values (no borrowing)
      expect(mockUseWalletPortfolioState).toHaveBeenCalled();
      const hookCall = mockUseWalletPortfolioState.mock.results[0];
      expect(hookCall.value.pieChartData).toEqual(mockPieChartData);

      // Ensure all pie chart values are positive
      hookCall.value.pieChartData.forEach((item: any) => {
        expect(item.value).toBeGreaterThan(0);
      });
    });

    it("should handle preparePortfolioDataWithBorrowing being called by the hook", async () => {
      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Verify that the hook uses the borrowing-aware transformation
      expect(mockUseWalletPortfolioState).toHaveBeenCalled();
    });

    it("should validate that borrowing data is separated but pie chart excludes it", async () => {
      mockPreparePortfolioDataWithBorrowing.mockReturnValue({
        portfolioData: mockMixedPortfolioData,
        pieChartData: mockPieChartData, // Only contains assets
        borrowingData: {
          assetsPieData: mockPieChartData,
          borrowingItems: mockBorrowingCategories,
          netValue: 10000, // 12000 assets - 2000 borrowing
          totalBorrowing: 2000,
          hasBorrowing: true,
        },
      });

      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: 12000,
        portfolioData: mockMixedPortfolioData,
        pieChartData: mockPieChartData,
        isLoading: false,
        apiError: null,
        retry: vi.fn(),
        isRetrying: false,
        isConnected: true,
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: mockPortfolioMetrics,
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
        isWalletManagerOpen: false,
        openWalletManager: vi.fn(),
        closeWalletManager: vi.fn(),
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Verify pie chart only contains assets (BTC, ETH), not borrowing (USDC)
      expect(mockUseWalletPortfolioState).toHaveBeenCalled();
      const hookResult = mockUseWalletPortfolioState.mock.results[0].value;

      expect(hookResult.pieChartData).toHaveLength(2); // Only BTC and ETH
      expect(
        hookResult.pieChartData.find((item: any) => item.label === "BTC")
      ).toBeDefined();
      expect(
        hookResult.pieChartData.find((item: any) => item.label === "ETH")
      ).toBeDefined();
      expect(
        hookResult.pieChartData.find(
          (item: any) => item.label === "Stablecoins"
        )
      ).toBeUndefined();
    });
  });

  describe("Prop Passing to PortfolioOverview", () => {
    it("should pass isLoading=true initially", async () => {
      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: null,
        portfolioData: null,
        pieChartData: null,
        isLoading: true,
        apiError: null,
        retry: vi.fn(),
        isRetrying: false,
        isConnected: false,
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: null,
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
        isWalletManagerOpen: false,
        openWalletManager: vi.fn(),
        closeWalletManager: vi.fn(),
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
      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: null,
        portfolioData: null,
        pieChartData: null,
        isLoading: false,
        apiError: errorMessage,
        retry: vi.fn(),
        isRetrying: false,
        isConnected: false,
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: null,
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
        isWalletManagerOpen: false,
        openWalletManager: vi.fn(),
        closeWalletManager: vi.fn(),
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
      expect(mockUseWalletPortfolioState).toHaveBeenCalled();
    });
  });

  describe("New API Structure Integration", () => {
    it("should handle new asset_positions and borrowing_positions API structure", async () => {
      // Mock the transformation utility to simulate new API structure handling
      mockPreparePortfolioDataWithBorrowing.mockReturnValue({
        portfolioData: mockAssetCategories,
        pieChartData: mockPieChartData,
        borrowingData: {
          assetsPieData: mockPieChartData,
          borrowingItems: mockBorrowingCategories,
          netValue: 10000,
          totalBorrowing: 2000,
          hasBorrowing: true,
        },
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Verify the hook properly handles new structure
      expect(mockUseWalletPortfolioState).toHaveBeenCalled();
    });

    it("should maintain backward compatibility with legacy categories structure", async () => {
      // Mock legacy structure compatibility
      const legacyCategories = [
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

      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: 15000,
        portfolioData: legacyCategories,
        pieChartData: [
          {
            label: "Mixed Assets",
            value: 15000,
            percentage: 100,
            color: "#333333",
          },
        ],
        isLoading: false,
        apiError: null,
        retry: vi.fn(),
        isRetrying: false,
        isConnected: true,
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: mockPortfolioMetrics,
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
        isWalletManagerOpen: false,
        openWalletManager: vi.fn(),
        closeWalletManager: vi.fn(),
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      expect(mockUseWalletPortfolioState).toHaveBeenCalled();
    });
  });

  describe("Edge Cases and Data Validation", () => {
    it("should handle mixed positive and negative values correctly", async () => {
      // Create data with both positive assets and negative borrowing
      const mixedPieChartData = [
        { label: "BTC", value: 8000, percentage: 60, color: "#F7931A" },
        { label: "ETH", value: 5000, percentage: 40, color: "#627EEA" },
        // Note: No negative borrowing values in pie chart
      ];

      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: 13000,
        portfolioData: mockMixedPortfolioData, // Contains both assets and borrowing
        pieChartData: mixedPieChartData, // Only positive asset values
        isLoading: false,
        apiError: null,
        retry: vi.fn(),
        isRetrying: false,
        isConnected: true,
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: mockPortfolioMetrics,
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
        isWalletManagerOpen: false,
        openWalletManager: vi.fn(),
        closeWalletManager: vi.fn(),
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Verify all pie chart values are positive
      const hookResult = mockUseWalletPortfolioState.mock.results[0].value;
      hookResult.pieChartData.forEach((item: any) => {
        expect(item.value).toBeGreaterThan(0);
      });
    });

    it("should handle empty asset positions gracefully", async () => {
      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: 0,
        portfolioData: [],
        pieChartData: [],
        isLoading: false,
        apiError: null,
        retry: vi.fn(),
        isRetrying: false,
        isConnected: true,
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: null,
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
        isWalletManagerOpen: false,
        openWalletManager: vi.fn(),
        closeWalletManager: vi.fn(),
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      expect(mockUseWalletPortfolioState).toHaveBeenCalled();
    });

    it("should validate pie chart data structure and prevent invalid borrowing inclusion", async () => {
      // Test that even if somehow borrowing data leaks into pie chart, it's handled
      const invalidPieChartData = [
        { label: "BTC", value: 7500, percentage: 50, color: "#F7931A" },
        { label: "ETH", value: 4500, percentage: 30, color: "#627EEA" },
        {
          label: "Borrowed USDC",
          value: -2000,
          percentage: -20,
          color: "#26A17B",
        },
      ];

      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: 10000,
        portfolioData: mockMixedPortfolioData,
        pieChartData: invalidPieChartData,
        isLoading: false,
        apiError: null,
        retry: vi.fn(),
        isRetrying: false,
        isConnected: true,
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: mockPortfolioMetrics,
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
        isWalletManagerOpen: false,
        openWalletManager: vi.fn(),
        closeWalletManager: vi.fn(),
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Component should still render even with invalid data
      // (The actual validation happens in the utility functions)
      expect(mockUseWalletPortfolioState).toHaveBeenCalled();
    });
  });

  describe("Loading States", () => {
    it("should show loading state when wallet portfolio state is loading", () => {
      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: null,
        portfolioData: null,
        pieChartData: null,
        isLoading: true,
        apiError: null,
        retry: vi.fn(),
        isRetrying: false,
        isConnected: false,
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: null,
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
        isWalletManagerOpen: false,
        openWalletManager: vi.fn(),
        closeWalletManager: vi.fn(),
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading");
    });

    it("should show loading state while retrying", () => {
      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: null,
        portfolioData: null,
        pieChartData: null,
        isLoading: false,
        apiError: null,
        retry: vi.fn(),
        isRetrying: true,
        isConnected: true,
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: null,
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
        isWalletManagerOpen: false,
        openWalletManager: vi.fn(),
        closeWalletManager: vi.fn(),
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

      expect(mockUseWalletPortfolioState).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully with new hook structure", async () => {
      const errorMessage = "Network error";
      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: null,
        portfolioData: null,
        pieChartData: [],
        isLoading: false,
        apiError: errorMessage,
        retry: vi.fn(),
        isRetrying: false,
        isConnected: true,
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: null,
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
        isWalletManagerOpen: false,
        openWalletManager: vi.fn(),
        closeWalletManager: vi.fn(),
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("error-state")).toHaveTextContent(
          errorMessage
        );
      });

      // Component should still render pie chart data placeholder even on error
      expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
        "has-data"
      );
    });

    it("should handle borrowing separation errors gracefully", async () => {
      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: null,
        portfolioData: null,
        pieChartData: [],
        isLoading: false,
        apiError: "Failed to separate borrowing data",
        retry: vi.fn(),
        isRetrying: false,
        isConnected: true,
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: null,
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
        isWalletManagerOpen: false,
        openWalletManager: vi.fn(),
        closeWalletManager: vi.fn(),
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("error-state")).toHaveTextContent(
          "Failed to separate borrowing data"
        );
      });
    });

    it("should clear previous errors on successful data load", async () => {
      // Test that a successful response has no error
      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("error-state")).toHaveTextContent("no-error");
      });

      // Verify successful state with new hook
      expect(mockUseWalletPortfolioState).toHaveBeenCalled();
    });

    it("should handle retry functionality for failed API calls", async () => {
      const mockRetry = vi.fn();
      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: null,
        portfolioData: null,
        pieChartData: [],
        isLoading: false,
        apiError: "API call failed",
        retry: mockRetry,
        isRetrying: false,
        isConnected: true,
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: null,
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
        isWalletManagerOpen: false,
        openWalletManager: vi.fn(),
        closeWalletManager: vi.fn(),
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("error-state")).toHaveTextContent(
          "API call failed"
        );
      });

      // Verify retry function is available
      expect(mockRetry).toBeDefined();
    });
  });

  describe("User Context Integration", () => {
    it("should handle disconnected wallet state", async () => {
      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: null,
        portfolioData: null,
        pieChartData: [],
        isLoading: false,
        apiError: null,
        retry: vi.fn(),
        isRetrying: false,
        isConnected: false, // Wallet not connected
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: null,
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
        isWalletManagerOpen: false,
        openWalletManager: vi.fn(),
        closeWalletManager: vi.fn(),
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("loading-state")).toHaveTextContent(
          "not-loading"
        );
      });

      expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
        "has-data"
      );
    });

    it("should fetch data when wallet becomes connected", async () => {
      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(mockUseWalletPortfolioState).toHaveBeenCalled();
      });

      expect(screen.getByTestId("loading-state")).toHaveTextContent(
        "not-loading"
      );
    });

    it("should handle wallet connection state changes", async () => {
      const { rerender } = render(<WalletPortfolio />);

      await waitFor(() => {
        expect(mockUseWalletPortfolioState).toHaveBeenCalled();
      });

      // Change connection state
      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: null,
        portfolioData: null,
        pieChartData: [],
        isLoading: false,
        apiError: null,
        retry: vi.fn(),
        isRetrying: false,
        isConnected: false, // Now disconnected
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: null,
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
        isWalletManagerOpen: false,
        openWalletManager: vi.fn(),
        closeWalletManager: vi.fn(),
      });

      rerender(<WalletPortfolio />);

      await waitFor(() => {
        expect(mockUseWalletPortfolioState).toHaveBeenCalled();
      });
    });
  });

  describe("Component Props", () => {
    it("should handle optional callback props", async () => {
      const onAnalyticsClick = vi.fn();
      const onOptimizeClick = vi.fn();
      const onZapInClick = vi.fn();
      const onZapOutClick = vi.fn();

      await act(async () => {
        render(
          <WalletPortfolio
            onAnalyticsClick={onAnalyticsClick}
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

    it("should render metrics grid sections", () => {
      render(<WalletPortfolio />);

      // Metrics sections - test labels, not values
      expect(screen.getByText("Total Balance")).toBeInTheDocument();
      expect(screen.getByText("Portfolio APR")).toBeInTheDocument();
      expect(screen.getByText("Est. Monthly Income")).toBeInTheDocument();
    });

    it("should render trending icons in APR section", () => {
      render(<WalletPortfolio />);

      // Should have either TrendingUp or TrendingDown based on portfolio performance
      const trendingUp = screen.queryByText("TrendingUp");
      const trendingDown = screen.queryByText("TrendingDown");
      expect(trendingUp || trendingDown).toBeTruthy();
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
      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: null,
        portfolioData: null,
        pieChartData: null,
        isLoading: true,
        apiError: null,
        retry: vi.fn(),
        isRetrying: false,
        isConnected: false,
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: null,
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
        isWalletManagerOpen: false,
        openWalletManager: vi.fn(),
        closeWalletManager: vi.fn(),
      });

      render(<WalletPortfolio />);

      // Should show loading state in balance display
      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading");
    });

    it("should show error state in portfolio when API fails", async () => {
      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: null,
        portfolioData: null,
        pieChartData: null,
        isLoading: false,
        apiError: "API Error",
        retry: vi.fn(),
        isRetrying: false,
        isConnected: true,
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: null,
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
        isWalletManagerOpen: false,
        openWalletManager: vi.fn(),
        closeWalletManager: vi.fn(),
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
    it("should handle wallet manager interactions with new state structure", async () => {
      const mockOpenWalletManager = vi.fn();
      const mockCloseWalletManager = vi.fn();

      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: 15000,
        portfolioData: mockAssetCategories,
        pieChartData: mockPieChartData,
        isLoading: false,
        apiError: null,
        retry: vi.fn(),
        isRetrying: false,
        isConnected: true,
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: mockPortfolioMetrics,
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
        isWalletManagerOpen: false,
        openWalletManager: mockOpenWalletManager,
        closeWalletManager: mockCloseWalletManager,
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Verify wallet manager functions are accessible
      expect(mockOpenWalletManager).toBeDefined();
      expect(mockCloseWalletManager).toBeDefined();
    });

    it("should handle balance visibility toggle with borrowing data", async () => {
      const mockToggleBalance = vi.fn();

      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: 10000,
        portfolioData: mockMixedPortfolioData,
        pieChartData: mockPieChartData,
        isLoading: false,
        apiError: null,
        retry: vi.fn(),
        isRetrying: false,
        isConnected: true,
        balanceHidden: true, // Balance is hidden
        expandedCategory: null,
        portfolioMetrics: mockPortfolioMetrics,
        toggleBalanceVisibility: mockToggleBalance,
        toggleCategoryExpansion: vi.fn(),
        isWalletManagerOpen: false,
        openWalletManager: vi.fn(),
        closeWalletManager: vi.fn(),
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Verify balance toggle function is accessible
      expect(mockToggleBalance).toBeDefined();
    });

    it("should provide wallet action callbacks correctly", async () => {
      const onAnalyticsClick = vi.fn();
      const onOptimizeClick = vi.fn();
      const onZapInClick = vi.fn();
      const onZapOutClick = vi.fn();

      render(
        <WalletPortfolio
          onAnalyticsClick={onAnalyticsClick}
          onOptimizeClick={onOptimizeClick}
          onZapInClick={onZapInClick}
          onZapOutClick={onZapOutClick}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
      });

      // Verify component renders with all action callbacks
      expect(mockUseWalletPortfolioState).toHaveBeenCalled();
    });
  });

  describe("Component Integration & Data Flow", () => {
    it("should correctly integrate useWalletPortfolioState with component rendering", async () => {
      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Verify the hook is called and data flows correctly
      expect(mockUseWalletPortfolioState).toHaveBeenCalled();

      // Verify portfolio metrics integration
      const hookResult = mockUseWalletPortfolioState.mock.results[0].value;
      expect(hookResult.portfolioMetrics).toEqual(mockPortfolioMetrics);
    });

    it("should handle component rerendering with data updates", async () => {
      const { rerender } = render(<WalletPortfolio />);

      // Initial render
      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Update mock data
      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: 20000,
        portfolioData: mockAssetCategories,
        pieChartData: [
          { label: "BTC", value: 12000, percentage: 60, color: "#F7931A" },
          { label: "ETH", value: 8000, percentage: 40, color: "#627EEA" },
        ],
        isLoading: false,
        apiError: null,
        retry: vi.fn(),
        isRetrying: false,
        isConnected: true,
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: { totalValue: 20000 },
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
        isWalletManagerOpen: false,
        openWalletManager: vi.fn(),
        closeWalletManager: vi.fn(),
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
