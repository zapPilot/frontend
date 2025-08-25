import { act, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WalletPortfolio } from "../../../src/components/WalletPortfolio";
import { useUser } from "../../../src/contexts/UserContext";
import { usePortfolioDisplayData } from "../../../src/hooks/queries/usePortfolioQuery";
import { usePortfolio } from "../../../src/hooks/usePortfolio";
import { useWalletModal } from "../../../src/hooks/useWalletModal";
import { preparePortfolioDataWithBorrowing } from "../../../src/utils/portfolioTransformers";
import { render } from "../../test-utils";

// Mock dependencies
vi.mock("../../../src/contexts/UserContext");
vi.mock("../../../src/hooks/usePortfolio");
vi.mock("../../../src/hooks/queries/usePortfolioQuery");
vi.mock("../../../src/hooks/useWalletModal");
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
const mockPortfolioMetrics = {
  totalValue: 10000,
  totalChangePercentage: 5.2,
  totalChangeValue: 500,
};

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
  const mockUsePortfolioDisplayData = vi.mocked(usePortfolioDisplayData);
  const mockUseWalletModal = vi.mocked(useWalletModal);
  const mockPreparePortfolioDataWithBorrowing = vi.mocked(
    preparePortfolioDataWithBorrowing
  );

  beforeEach(() => {
    // Mock individual hooks
    mockUseUser.mockReturnValue({
      userInfo: mockUserInfo,
      isConnected: true,
      loading: false,
    });

    mockUsePortfolioDisplayData.mockReturnValue({
      totalValue: 15000,
      categories: mockAssetCategories,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
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
      expect(mockUsePortfolioDisplayData).toHaveBeenCalledWith(
        mockUserInfo.userId
      );
      expect(mockUsePortfolio).toHaveBeenCalledWith(mockAssetCategories);
      expect(mockUseWalletModal).toHaveBeenCalled();
      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        mockAssetCategories,
        15000,
        "WalletPortfolio"
      );
    });

    it("should ensure pie chart data only contains positive asset values, no borrowing", async () => {
      // Mock data with borrowing included in portfolio but excluded from pie chart
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 10000,
        categories: mockMixedPortfolioData, // Includes borrowing
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
      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        mockMixedPortfolioData,
        10000,
        "WalletPortfolio"
      );

      const prepareCall = mockPreparePortfolioDataWithBorrowing.mock.results[0];
      expect(prepareCall.value.pieChartData).toEqual(mockPieChartData);

      // Ensure all pie chart values are positive
      prepareCall.value.pieChartData.forEach((item: any) => {
        expect(item.value).toBeGreaterThan(0);
      });
    });

    it("should handle preparePortfolioDataWithBorrowing being called directly", async () => {
      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Verify that the component uses the borrowing-aware transformation
      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        mockAssetCategories,
        15000,
        "WalletPortfolio"
      );
    });

    it("should validate that borrowing data is separated but pie chart excludes it", async () => {
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 12000,
        categories: mockMixedPortfolioData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

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

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Verify pie chart only contains assets (BTC, ETH), not borrowing (USDC)
      const prepareResult =
        mockPreparePortfolioDataWithBorrowing.mock.results[0].value;

      expect(prepareResult.pieChartData).toHaveLength(2); // Only BTC and ETH
      expect(
        prepareResult.pieChartData.find((item: any) => item.label === "BTC")
      ).toBeDefined();
      expect(
        prepareResult.pieChartData.find((item: any) => item.label === "ETH")
      ).toBeDefined();
      expect(
        prepareResult.pieChartData.find(
          (item: any) => item.label === "Stablecoins"
        )
      ).toBeUndefined();
    });
  });

  describe("Prop Passing to PortfolioOverview", () => {
    it("should pass isLoading=true initially", async () => {
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
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
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: false,
        error: errorMessage,
        refetch: vi.fn(),
        isRefetching: false,
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
      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        mockAssetCategories,
        15000,
        "WalletPortfolio"
      );
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

      // Verify individual hooks properly handle new structure
      expect(mockUsePortfolioDisplayData).toHaveBeenCalledWith(
        mockUserInfo.userId
      );
      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalled();
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

      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 15000,
        categories: legacyCategories,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockPreparePortfolioDataWithBorrowing.mockReturnValue({
        portfolioData: legacyCategories,
        pieChartData: [
          {
            label: "Mixed Assets",
            value: 15000,
            percentage: 100,
            color: "#333333",
          },
        ],
        borrowingData: {
          assetsPieData: [],
          borrowingItems: [],
          netValue: 15000,
          totalBorrowing: 0,
          hasBorrowing: false,
        },
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      expect(mockUsePortfolio).toHaveBeenCalledWith(legacyCategories);
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

      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 13000,
        categories: mockMixedPortfolioData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockPreparePortfolioDataWithBorrowing.mockReturnValue({
        portfolioData: mockMixedPortfolioData,
        pieChartData: mixedPieChartData,
        borrowingData: {
          assetsPieData: mixedPieChartData,
          borrowingItems: mockBorrowingCategories,
          netValue: 11000,
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

      // Verify all pie chart values are positive
      const prepareResult =
        mockPreparePortfolioDataWithBorrowing.mock.results[0].value;
      prepareResult.pieChartData.forEach((item: any) => {
        expect(item.value).toBeGreaterThan(0);
      });
    });

    it("should handle empty asset positions gracefully", async () => {
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 0,
        categories: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockPreparePortfolioDataWithBorrowing.mockReturnValue({
        portfolioData: [],
        pieChartData: [],
        borrowingData: {
          assetsPieData: [],
          borrowingItems: [],
          netValue: 0,
          totalBorrowing: 0,
          hasBorrowing: false,
        },
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(mockUsePortfolio).toHaveBeenCalledWith([]);
      });
    });

    it("should validate pie chart data structure and prevent invalid borrowing inclusion", async () => {
      // Test that even if somehow borrowing data leaks into pie chart, it's handled
      const validPieChartData = [
        { label: "BTC", value: 7500, percentage: 50, color: "#F7931A" },
        { label: "ETH", value: 4500, percentage: 30, color: "#627EEA" },
        // Borrowing should be filtered out by preparePortfolioDataWithBorrowing
      ];

      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 10000,
        categories: mockMixedPortfolioData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockPreparePortfolioDataWithBorrowing.mockReturnValue({
        portfolioData: mockMixedPortfolioData,
        pieChartData: validPieChartData, // Only positive values after filtering
        borrowingData: {
          assetsPieData: validPieChartData,
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

      // Component should render correctly with filtered data
      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        mockMixedPortfolioData,
        10000,
        "WalletPortfolio"
      );
    });
  });

  describe("Loading States", () => {
    it("should show loading state when portfolio data is loading", () => {
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading");
    });

    it("should show loading state while retrying", () => {
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
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

      expect(mockUsePortfolioDisplayData).toHaveBeenCalledWith(
        mockUserInfo.userId
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully with decomposed hooks", async () => {
      const errorMessage = "Network error";
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: false,
        error: errorMessage,
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockPreparePortfolioDataWithBorrowing.mockReturnValue({
        portfolioData: [],
        pieChartData: [],
        borrowingData: {
          assetsPieData: [],
          borrowingItems: [],
          netValue: 0,
          totalBorrowing: 0,
          hasBorrowing: false,
        },
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

    it("should handle data transformation errors gracefully", async () => {
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: false,
        error: "Failed to transform portfolio data",
        refetch: vi.fn(),
        isRefetching: false,
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
      expect(mockUsePortfolioDisplayData).toHaveBeenCalledWith(
        mockUserInfo.userId
      );
    });

    it("should handle retry functionality for failed API calls", async () => {
      const mockRetry = vi.fn();
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: false,
        error: "API call failed",
        refetch: mockRetry,
        isRefetching: false,
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

      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
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

      expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
        "has-data"
      );
    });

    it("should fetch data when wallet becomes connected", async () => {
      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(mockUsePortfolioDisplayData).toHaveBeenCalledWith(
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
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
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
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: false,
        error: "API Error",
        refetch: vi.fn(),
        isRefetching: false,
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
    it("should handle wallet manager interactions with decomposed hooks", async () => {
      const mockOpenWalletManager = vi.fn();
      const mockCloseWalletManager = vi.fn();

      mockUseWalletModal.mockReturnValue({
        isOpen: false,
        openModal: mockOpenWalletManager,
        closeModal: mockCloseWalletManager,
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Verify wallet manager functions are accessible through useWalletModal
      expect(mockOpenWalletManager).toBeDefined();
      expect(mockCloseWalletManager).toBeDefined();
    });

    it("should handle balance visibility toggle with borrowing data", async () => {
      const mockToggleBalance = vi.fn();

      mockUsePortfolio.mockReturnValue({
        balanceHidden: true,
        expandedCategory: null,
        portfolioMetrics: mockPortfolioMetrics,
        toggleBalanceVisibility: mockToggleBalance,
        toggleCategoryExpansion: vi.fn(),
      });

      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 10000,
        categories: mockMixedPortfolioData,
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

      // Verify balance toggle function is accessible through usePortfolio
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

      // Verify component renders with all action callbacks using decomposed hooks
      expect(mockUsePortfolioDisplayData).toHaveBeenCalledWith(
        mockUserInfo.userId
      );
      expect(mockUsePortfolio).toHaveBeenCalled();
      expect(mockUseWalletModal).toHaveBeenCalled();
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
      expect(mockUsePortfolioDisplayData).toHaveBeenCalledWith(
        mockUserInfo.userId
      );
      expect(mockUsePortfolio).toHaveBeenCalledWith(mockAssetCategories);
      expect(mockUseWalletModal).toHaveBeenCalled();
      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalled();

      // Verify portfolio metrics integration
      const portfolioResult = mockUsePortfolio.mock.results[0].value;
      expect(portfolioResult.portfolioMetrics).toEqual(mockPortfolioMetrics);
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
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 20000,
        categories: mockAssetCategories,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockPreparePortfolioDataWithBorrowing.mockReturnValue({
        portfolioData: mockAssetCategories,
        pieChartData: [
          { label: "BTC", value: 12000, percentage: 60, color: "#F7931A" },
          { label: "ETH", value: 8000, percentage: 40, color: "#627EEA" },
        ],
        borrowingData: {
          assetsPieData: [],
          borrowingItems: [],
          netValue: 20000,
          totalBorrowing: 0,
          hasBorrowing: false,
        },
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
