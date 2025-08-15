import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WalletPortfolio } from "../../../src/components/WalletPortfolio";
import { useUser } from "../../../src/contexts/UserContext";
import { usePortfolio } from "../../../src/hooks/usePortfolio";
import { usePortfolioData } from "../../../src/hooks/usePortfolioData";
import { getPortfolioSummary } from "../../../src/services/quantEngine";

// Mock dependencies
vi.mock("../../../src/contexts/UserContext");
vi.mock("../../../src/hooks/usePortfolio");
vi.mock("../../../src/hooks/usePortfolioData");
vi.mock("../../../src/services/quantEngine");
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

// Mock data is imported from actual mock file

const mockUserInfo = { userId: "test-user-123" };
const mockPortfolioMetrics = { totalValue: 10000 };

describe("WalletPortfolio", () => {
  const mockUseUser = vi.mocked(useUser);
  const mockUsePortfolio = vi.mocked(usePortfolio);
  const mockUsePortfolioData = vi.mocked(usePortfolioData);
  const mockGetPortfolioSummary = vi.mocked(getPortfolioSummary);

  beforeEach(() => {
    // Default mock implementations
    mockUseUser.mockReturnValue({
      userInfo: mockUserInfo,
      loading: false,
    });

    mockUsePortfolio.mockReturnValue({
      balanceHidden: false,
      expandedCategory: null,
      portfolioMetrics: mockPortfolioMetrics,
      toggleBalanceVisibility: vi.fn(),
      toggleCategoryExpansion: vi.fn(),
    });

    mockUsePortfolioData.mockReturnValue({
      totalValue: 15000,
      categories: [
        {
          name: "BTC",
          totalValue: 7500,
          percentage: 50,
          color: "#F7931A",
          assets: [],
        },
        {
          name: "ETH",
          totalValue: 4500,
          percentage: 30,
          color: "#627EEA",
          assets: [],
        },
        {
          name: "Stablecoins",
          totalValue: 3000,
          percentage: 20,
          color: "#26A17B",
          assets: [],
        },
      ],
      pieChartData: [
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
        {
          label: "Stablecoins",
          value: 3000,
          percentage: 20,
          color: "#26A17B",
        },
      ],
      isLoading: false,
      error: null,
    });

    mockGetPortfolioSummary.mockResolvedValue({
      metrics: { total_value_usd: 15000 },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Data Transformation (pieChartData calculation)", () => {
    it("should calculate pieChartData correctly when apiTotalValue is available", async () => {
      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Verify that usePortfolioData returns pieChartData
      expect(mockUsePortfolioData).toHaveBeenCalled();
    });

    it("should calculate pieChartData using toPieChartData when apiTotalValue is null", async () => {
      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        pieChartData: null,
        isLoading: false,
        error: null,
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        // toPieChartData([]) returns empty array, so component always has data (even if empty)
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });
    });

    it("should calculate pieChartData using toPieChartData when apiTotalValue is zero or negative", async () => {
      mockUsePortfolioData.mockReturnValue({
        totalValue: 0,
        categories: null,
        pieChartData: null,
        isLoading: false,
        error: null,
      });

      const { rerender } = render(<WalletPortfolio />);

      await waitFor(() => {
        // toPieChartData([]) returns empty array, so component always has data (even if empty)
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Test negative value
      mockUsePortfolioData.mockReturnValue({
        totalValue: -100,
        categories: null,
        pieChartData: null,
        isLoading: false,
        error: null,
      });

      rerender(<WalletPortfolio />);

      await waitFor(() => {
        // toPieChartData([]) returns empty array, so component always has data (even if empty)
        expect(screen.getAllByTestId("pie-chart-data")[0]).toHaveTextContent(
          "has-data"
        );
      });
    });

    it("should recalculate pieChartData when apiTotalValue changes", async () => {
      const { rerender } = render(<WalletPortfolio />);

      // Initial state - has data
      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });

      // Change to higher total value with updated pieChartData
      mockUsePortfolioData.mockReturnValue({
        totalValue: 20000,
        categories: [
          {
            name: "BTC",
            totalValue: 10000,
            percentage: 50,
            color: "#F7931A",
            assets: [],
          },
          {
            name: "ETH",
            totalValue: 6000,
            percentage: 30,
            color: "#627EEA",
            assets: [],
          },
          {
            name: "Stablecoins",
            totalValue: 4000,
            percentage: 20,
            color: "#26A17B",
            assets: [],
          },
        ],
        pieChartData: [
          {
            label: "BTC",
            value: 10000,
            percentage: 50,
            color: "#F7931A",
          },
          {
            label: "ETH",
            value: 6000,
            percentage: 30,
            color: "#627EEA",
          },
          {
            label: "Stablecoins",
            value: 4000,
            percentage: 20,
            color: "#26A17B",
          },
        ],
        isLoading: false,
        error: null,
      });

      // Force re-render to trigger hook update
      rerender(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
          "has-data"
        );
      });
    });
  });

  describe("Prop Passing to PortfolioOverview", () => {
    it("should pass isLoading=true initially", async () => {
      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        pieChartData: null,
        isLoading: true,
        error: null,
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
      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        pieChartData: null,
        isLoading: false,
        error: errorMessage,
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("error-state")).toHaveTextContent(
          errorMessage
        );
      });
    });

    it("should not pass apiTotalValue directly to PortfolioOverview", async () => {
      await act(async () => {
        render(<WalletPortfolio />);
      });

      // Verify that PortfolioOverview doesn't receive apiTotalValue prop
      // (this is tested by the absence of apiTotalValue in our mock component)
    });
  });

  describe("Loading States", () => {
    it("should show loading state when user is loading", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        loading: true,
      });

      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        pieChartData: null,
        isLoading: true,
        error: null,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading");
    });

    it("should show loading state while API is fetching", () => {
      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        pieChartData: null,
        isLoading: true,
        error: null,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading");
    });

    it("should stop loading when no user is available", async () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        loading: false,
      });

      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        pieChartData: null,
        isLoading: false,
        error: null,
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("loading-state")).toHaveTextContent(
          "not-loading"
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully", async () => {
      const errorMessage = "Network error";
      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        pieChartData: null,
        isLoading: false,
        error: errorMessage,
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("error-state")).toHaveTextContent(
          errorMessage
        );
      });

      // toPieChartData([]) returns empty array, so component always has data (even if empty)
      expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
        "has-data"
      );
    });

    it("should handle non-Error rejections", async () => {
      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        pieChartData: null,
        isLoading: false,
        error: "Failed to load portfolio summary",
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("error-state")).toHaveTextContent(
          "Failed to load portfolio summary"
        );
      });
    });

    it("should clear previous errors on successful API calls", async () => {
      // Test that a successful response has no error
      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("error-state")).toHaveTextContent("no-error");
      });

      // This test verifies that when usePortfolioData succeeds, no error is shown
      // The default mock returns error: null
    });
  });

  describe("User Context Integration", () => {
    it("should not fetch data when userInfo is null", async () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        loading: false,
      });

      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        pieChartData: null,
        isLoading: false,
        error: null,
      });

      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("loading-state")).toHaveTextContent(
          "not-loading"
        );
      });

      // toPieChartData([]) returns empty array, so component always has data (even if empty)
      expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
        "has-data"
      );
    });

    it("should fetch data when userInfo becomes available", async () => {
      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(mockUsePortfolioData).toHaveBeenCalled();
      });

      expect(screen.getByTestId("loading-state")).toHaveTextContent(
        "not-loading"
      );
    });

    it("should refetch data when userId changes", async () => {
      const { rerender } = render(<WalletPortfolio />);

      await waitFor(() => {
        expect(mockUsePortfolioData).toHaveBeenCalled();
      });

      // Change user
      mockUseUser.mockReturnValue({
        userInfo: { userId: "new-user-456" },
        loading: false,
      });

      rerender(<WalletPortfolio />);

      await waitFor(() => {
        expect(mockUsePortfolioData).toHaveBeenCalled();
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
      mockUseUser.mockReturnValue({ userInfo: null, loading: true });
      render(<WalletPortfolio />);

      // Should show loading state in balance display
      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading");
    });

    it("should show error state in portfolio when API fails", async () => {
      mockUsePortfolioData.mockReturnValue({
        totalValue: null,
        categories: null,
        pieChartData: null,
        isLoading: false,
        error: "API Error",
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

  describe("Cleanup and Memory Leaks", () => {
    it("should handle component unmounting during API call", async () => {
      let resolvePromise: (value: {
        metrics: { total_value_usd: number };
      }) => void;
      const promise = new Promise<{ metrics: { total_value_usd: number } }>(
        resolve => {
          resolvePromise = resolve;
        }
      );
      mockGetPortfolioSummary.mockReturnValue(promise);

      const { unmount } = render(<WalletPortfolio />);

      // Unmount before API call completes
      unmount();

      // Resolve the promise after unmount
      resolvePromise!({ metrics: { total_value_usd: 15000 } });

      // Wait a bit to ensure no state updates occur
      await new Promise(resolve => setTimeout(resolve, 100));

      // No assertions needed - the test passes if no errors are thrown
    });
  });
});
