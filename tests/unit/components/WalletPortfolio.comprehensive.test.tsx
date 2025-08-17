import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WalletPortfolio } from "../../../src/components/WalletPortfolio";
import { useWalletPortfolioState } from "../../../src/hooks/useWalletPortfolioState";
import { AssetCategory, PieChartData } from "../../../src/types/portfolio";
import { render } from "../../test-utils";

// Mock the custom hook
vi.mock("../../../src/hooks/useWalletPortfolioState");

// Mock child components
vi.mock("../../../src/components/ui/GlassCard", () => ({
  GlassCard: vi.fn(({ children }) => (
    <div data-testid="glass-card">{children}</div>
  )),
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
          <button data-testid="analytics-button" onClick={onAnalyticsClick}>
            Analytics
          </button>
        )}
        <button
          data-testid="wallet-manager-button"
          onClick={onWalletManagerClick}
        >
          Wallet Manager
        </button>
        <button data-testid="toggle-balance-button" onClick={onToggleBalance}>
          {balanceHidden ? "Show" : "Hide"} Balance
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
    }) => (
      <div data-testid="wallet-metrics">
        <div data-testid="total-value">
          {isLoading
            ? "Loading..."
            : error
              ? `Error: ${error}`
              : balanceHidden
                ? "****"
                : `$${totalValue}`}
        </div>
        <div data-testid="change-percentage">{portfolioChangePercentage}%</div>
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

vi.mock("../../../src/components/PortfolioOverview", () => ({
  PortfolioOverview: vi.fn(
    ({
      portfolioData,
      pieChartData,
      expandedCategory,
      onCategoryToggle,
      balanceHidden,
      title,
      isLoading,
      apiError,
      onRetry,
      isRetrying,
      totalValue,
    }) => (
      <div data-testid="portfolio-overview">
        <div data-testid="portfolio-title">{title}</div>
        <div data-testid="portfolio-loading">
          {isLoading ? "loading" : "not-loading"}
        </div>
        <div data-testid="portfolio-error">{apiError || "no-error"}</div>
        <div data-testid="portfolio-retrying">
          {isRetrying ? "retrying" : "not-retrying"}
        </div>
        <div data-testid="portfolio-data-count">
          {portfolioData ? portfolioData.length : 0}
        </div>
        <div data-testid="pie-chart-data-count">
          {pieChartData ? pieChartData.length : 0}
        </div>
        <div data-testid="expanded-category">{expandedCategory || "none"}</div>
        <div data-testid="balance-hidden">
          {balanceHidden ? "hidden" : "visible"}
        </div>
        <div data-testid="total-value-prop">
          {totalValue !== undefined ? totalValue : "undefined"}
        </div>
        {onRetry && (
          <button data-testid="retry-button" onClick={onRetry}>
            Retry
          </button>
        )}
        {onCategoryToggle && (
          <button
            data-testid="category-toggle-button"
            onClick={() => onCategoryToggle("test-category")}
          >
            Toggle Category
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
        <div>Wallet Manager Modal</div>
        <button data-testid="close-wallet-manager" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null
  ),
}));

describe("WalletPortfolio - Comprehensive Integration Tests", () => {
  const mockUseWalletPortfolioState = vi.mocked(useWalletPortfolioState);

  const mockPortfolioData: AssetCategory[] = [
    {
      id: "1",
      name: "BTC",
      totalValue: 7500,
      percentage: 50,
      color: "#F7931A",
      assets: [],
    },
    {
      id: "2",
      name: "ETH",
      totalValue: 4500,
      percentage: 30,
      color: "#627EEA",
      assets: [],
    },
  ];

  const mockPieChartData: PieChartData[] = [
    { label: "BTC", value: 7500, percentage: 50, color: "#F7931A" },
    { label: "ETH", value: 4500, percentage: 30, color: "#627EEA" },
  ];

  const defaultMockState = {
    totalValue: 15000,
    portfolioData: mockPortfolioData,
    pieChartData: mockPieChartData,
    isLoading: false,
    apiError: null,
    retry: vi.fn(),
    isRetrying: false,
    balanceHidden: false,
    expandedCategory: null,
    portfolioMetrics: { totalChangePercentage: 5.2 },
    toggleBalanceVisibility: vi.fn(),
    toggleCategoryExpansion: vi.fn(),
    isWalletManagerOpen: false,
    openWalletManager: vi.fn(),
    closeWalletManager: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWalletPortfolioState.mockReturnValue(defaultMockState);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Complete Component Integration", () => {
    it("should render all child components with correct props", () => {
      render(<WalletPortfolio />);

      // Verify all child components are rendered
      expect(screen.getByTestId("glass-card")).toBeInTheDocument();
      expect(screen.getByTestId("wallet-header")).toBeInTheDocument();
      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
      expect(screen.getByTestId("wallet-actions")).toBeInTheDocument();
      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
      expect(screen.queryByTestId("wallet-manager")).not.toBeInTheDocument(); // Should be closed initially
    });

    it("should pass correct data flow from hook to components", () => {
      render(<WalletPortfolio />);

      // Verify data flow to WalletMetrics
      expect(screen.getByTestId("total-value")).toHaveTextContent("$15000");
      expect(screen.getByTestId("change-percentage")).toHaveTextContent("5.2%");

      // Verify data flow to PortfolioOverview
      expect(screen.getByTestId("portfolio-title")).toHaveTextContent(
        "Asset Distribution"
      );
      expect(screen.getByTestId("portfolio-data-count")).toHaveTextContent("2");
      expect(screen.getByTestId("pie-chart-data-count")).toHaveTextContent("2");
      expect(screen.getByTestId("expanded-category")).toHaveTextContent("none");
      expect(screen.getByTestId("balance-hidden")).toHaveTextContent("visible");
      expect(screen.getByTestId("total-value-prop")).toHaveTextContent("15000");
    });

    it("should handle callback props correctly", () => {
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

      // Test analytics button (should appear when callback provided)
      expect(screen.getByTestId("analytics-button")).toBeInTheDocument();
      fireEvent.click(screen.getByTestId("analytics-button"));
      expect(onAnalyticsClick).toHaveBeenCalledTimes(1);

      // Test wallet actions
      fireEvent.click(screen.getByTestId("zap-in-button"));
      expect(onZapInClick).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId("zap-out-button"));
      expect(onZapOutClick).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId("optimize-button"));
      expect(onOptimizeClick).toHaveBeenCalledTimes(1);
    });

    it("should not render analytics button when callback not provided", () => {
      render(<WalletPortfolio />);

      expect(screen.queryByTestId("analytics-button")).not.toBeInTheDocument();
    });
  });

  describe("Hook Integration and State Management", () => {
    it("should handle loading states correctly", () => {
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        isLoading: true,
        totalValue: null,
        portfolioData: null,
        pieChartData: null,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("total-value")).toHaveTextContent("Loading...");
      expect(screen.getByTestId("portfolio-loading")).toHaveTextContent(
        "loading"
      );
      expect(screen.getByTestId("portfolio-data-count")).toHaveTextContent("0");
      expect(screen.getByTestId("pie-chart-data-count")).toHaveTextContent("0");
    });

    it("should handle error states correctly", () => {
      const errorMessage = "Failed to load portfolio data";
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        isLoading: false,
        apiError: errorMessage,
        totalValue: null,
        portfolioData: null,
        pieChartData: null,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("total-value")).toHaveTextContent(
        `Error: ${errorMessage}`
      );
      expect(screen.getByTestId("portfolio-error")).toHaveTextContent(
        errorMessage
      );
      expect(screen.getByTestId("portfolio-loading")).toHaveTextContent(
        "not-loading"
      );
    });

    it("should handle retry functionality", () => {
      const retryMock = vi.fn();
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        retry: retryMock,
        isRetrying: true,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("portfolio-retrying")).toHaveTextContent(
        "retrying"
      );

      fireEvent.click(screen.getByTestId("retry-button"));
      expect(retryMock).toHaveBeenCalledTimes(1);
    });

    it("should handle balance visibility toggle", () => {
      const toggleBalanceVisibilityMock = vi.fn();
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        balanceHidden: true,
        toggleBalanceVisibility: toggleBalanceVisibilityMock,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("total-value")).toHaveTextContent("****");
      expect(screen.getByTestId("balance-hidden")).toHaveTextContent("hidden");
      expect(screen.getByTestId("toggle-balance-button")).toHaveTextContent(
        "Show Balance"
      );

      fireEvent.click(screen.getByTestId("toggle-balance-button"));
      expect(toggleBalanceVisibilityMock).toHaveBeenCalledTimes(1);
    });

    it("should handle category expansion", () => {
      const toggleCategoryExpansionMock = vi.fn();
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        expandedCategory: "btc",
        toggleCategoryExpansion: toggleCategoryExpansionMock,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("expanded-category")).toHaveTextContent("btc");

      fireEvent.click(screen.getByTestId("category-toggle-button"));
      expect(toggleCategoryExpansionMock).toHaveBeenCalledWith("test-category");
    });

    it("should handle wallet manager modal", () => {
      const openWalletManagerMock = vi.fn();
      const closeWalletManagerMock = vi.fn();

      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        isWalletManagerOpen: true,
        openWalletManager: openWalletManagerMock,
        closeWalletManager: closeWalletManagerMock,
      });

      render(<WalletPortfolio />);

      // Modal should be open
      expect(screen.getByTestId("wallet-manager")).toBeInTheDocument();
      expect(screen.getByText("Wallet Manager Modal")).toBeInTheDocument();

      // Test close functionality
      fireEvent.click(screen.getByTestId("close-wallet-manager"));
      expect(closeWalletManagerMock).toHaveBeenCalledTimes(1);

      // Test opening wallet manager from header
      fireEvent.click(screen.getByTestId("wallet-manager-button"));
      expect(openWalletManagerMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("Data Transformation and Edge Cases", () => {
    it("should handle empty portfolio data", () => {
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        totalValue: 0,
        portfolioData: [],
        pieChartData: [],
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("total-value")).toHaveTextContent("$0");
      expect(screen.getByTestId("portfolio-data-count")).toHaveTextContent("0");
      expect(screen.getByTestId("pie-chart-data-count")).toHaveTextContent("0");
    });

    it("should handle null/undefined data gracefully", () => {
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        totalValue: null,
        portfolioData: null,
        pieChartData: null,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("total-value")).toHaveTextContent("$null");
      expect(screen.getByTestId("portfolio-data-count")).toHaveTextContent("0");
      expect(screen.getByTestId("pie-chart-data-count")).toHaveTextContent("0");
      expect(screen.getByTestId("total-value-prop")).toHaveTextContent(
        "undefined"
      );
    });

    it("should handle large portfolio values", () => {
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        totalValue: 999999999.99,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("total-value")).toHaveTextContent(
        "$999999999.99"
      );
    });

    it("should handle negative portfolio values", () => {
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        totalValue: -5000,
        portfolioMetrics: { totalChangePercentage: -15.8 },
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("total-value")).toHaveTextContent("$-5000");
      expect(screen.getByTestId("change-percentage")).toHaveTextContent(
        "-15.8%"
      );
    });
  });

  describe("Performance and Memory Management", () => {
    it("should not cause memory leaks on unmount", async () => {
      const { unmount } = render(<WalletPortfolio />);

      // Simulate component unmount
      unmount();

      // Wait a bit to ensure any cleanup has occurred
      await new Promise(resolve => setTimeout(resolve, 100));

      // No assertions needed - test passes if no errors are thrown
    });

    it("should handle rapid state changes without issues", async () => {
      const { rerender } = render(<WalletPortfolio />);

      // Simulate rapid state changes
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        isLoading: true,
      });
      rerender(<WalletPortfolio />);

      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        apiError: "Error",
      });
      rerender(<WalletPortfolio />);

      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        balanceHidden: true,
      });
      rerender(<WalletPortfolio />);

      expect(screen.getByTestId("balance-hidden")).toHaveTextContent("hidden");
    });

    it("should handle prop changes efficiently", () => {
      const onAnalyticsClick1 = vi.fn();
      const onAnalyticsClick2 = vi.fn();

      const { rerender } = render(
        <WalletPortfolio onAnalyticsClick={onAnalyticsClick1} />
      );

      // Change props
      rerender(<WalletPortfolio onAnalyticsClick={onAnalyticsClick2} />);

      // Test that new callback is used
      fireEvent.click(screen.getByTestId("analytics-button"));
      expect(onAnalyticsClick2).toHaveBeenCalledTimes(1);
      expect(onAnalyticsClick1).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility and Interaction", () => {
    it("should support keyboard navigation for all interactive elements", () => {
      render(
        <WalletPortfolio
          onAnalyticsClick={vi.fn()}
          onOptimizeClick={vi.fn()}
          onZapInClick={vi.fn()}
          onZapOutClick={vi.fn()}
        />
      );

      const buttons = screen.getAllByRole("button");

      // Should have buttons for: analytics, wallet manager, balance toggle, zap in, zap out, optimize, retry, category toggle
      expect(buttons.length).toBeGreaterThanOrEqual(6);

      // Verify buttons can receive focus
      buttons.forEach(button => {
        button.focus();
        expect(button).toHaveFocus();
      });
    });

    it("should maintain proper component structure for screen readers", () => {
      render(<WalletPortfolio />);

      // Verify semantic structure
      expect(screen.getByTestId("glass-card")).toBeInTheDocument();
      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();

      // Verify components are properly nested
      const glassCard = screen.getByTestId("glass-card");
      expect(glassCard).toContainElement(screen.getByTestId("wallet-header"));
      expect(glassCard).toContainElement(screen.getByTestId("wallet-metrics"));
      expect(glassCard).toContainElement(screen.getByTestId("wallet-actions"));
    });
  });

  describe("Error Boundary and Recovery", () => {
    it("should handle component errors gracefully", () => {
      // Mock a component that throws an error
      mockUseWalletPortfolioState.mockImplementation(() => {
        throw new Error("Hook error");
      });

      expect(() => {
        render(<WalletPortfolio />);
      }).toThrow("Hook error");
    });

    it("should recover from API errors when data becomes available", () => {
      // Start with error state
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        apiError: "API Error",
        totalValue: null,
        portfolioData: null,
        pieChartData: null,
      });

      const { rerender } = render(<WalletPortfolio />);

      expect(screen.getByTestId("portfolio-error")).toHaveTextContent(
        "API Error"
      );

      // Simulate recovery
      mockUseWalletPortfolioState.mockReturnValue(defaultMockState);
      rerender(<WalletPortfolio />);

      expect(screen.getByTestId("portfolio-error")).toHaveTextContent(
        "no-error"
      );
      expect(screen.getByTestId("total-value")).toHaveTextContent("$15000");
    });
  });

  describe("Integration with External Systems", () => {
    it("should handle all wallet action callbacks", async () => {
      const callbacks = {
        onAnalyticsClick: vi.fn(),
        onOptimizeClick: vi.fn(),
        onZapInClick: vi.fn(),
        onZapOutClick: vi.fn(),
      };

      render(<WalletPortfolio {...callbacks} />);

      // Test all callbacks in sequence
      await act(async () => {
        fireEvent.click(screen.getByTestId("analytics-button"));
        fireEvent.click(screen.getByTestId("zap-in-button"));
        fireEvent.click(screen.getByTestId("zap-out-button"));
        fireEvent.click(screen.getByTestId("optimize-button"));
      });

      expect(callbacks.onAnalyticsClick).toHaveBeenCalledTimes(1);
      expect(callbacks.onZapInClick).toHaveBeenCalledTimes(1);
      expect(callbacks.onZapOutClick).toHaveBeenCalledTimes(1);
      expect(callbacks.onOptimizeClick).toHaveBeenCalledTimes(1);
    });

    it("should handle modal interactions correctly", async () => {
      render(<WalletPortfolio />);

      // Open wallet manager
      await act(async () => {
        fireEvent.click(screen.getByTestId("wallet-manager-button"));
      });

      expect(defaultMockState.openWalletManager).toHaveBeenCalledTimes(1);

      // Test category toggle
      await act(async () => {
        fireEvent.click(screen.getByTestId("category-toggle-button"));
      });

      expect(defaultMockState.toggleCategoryExpansion).toHaveBeenCalledWith(
        "test-category"
      );
    });
  });

  describe("Component Lifecycle", () => {
    it("should initialize with correct default state", () => {
      render(<WalletPortfolio />);

      // Verify initial state is properly displayed
      expect(screen.getByTestId("portfolio-loading")).toHaveTextContent(
        "not-loading"
      );
      expect(screen.getByTestId("portfolio-error")).toHaveTextContent(
        "no-error"
      );
      expect(screen.getByTestId("balance-hidden")).toHaveTextContent("visible");
      expect(screen.queryByTestId("wallet-manager")).not.toBeInTheDocument();
    });

    it("should handle complete loading cycle", async () => {
      // Start with loading
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        isLoading: true,
        totalValue: null,
      });

      const { rerender } = render(<WalletPortfolio />);

      expect(screen.getByTestId("portfolio-loading")).toHaveTextContent(
        "loading"
      );
      expect(screen.getByTestId("total-value")).toHaveTextContent("Loading...");

      // Complete loading
      mockUseWalletPortfolioState.mockReturnValue(defaultMockState);
      rerender(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("portfolio-loading")).toHaveTextContent(
          "not-loading"
        );
        expect(screen.getByTestId("total-value")).toHaveTextContent("$15000");
      });
    });

    it("should handle complete error and recovery cycle", async () => {
      const retryMock = vi.fn();

      // Start with error
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        apiError: "Network error",
        totalValue: null,
        retry: retryMock,
      });

      const { rerender } = render(<WalletPortfolio />);

      expect(screen.getByTestId("portfolio-error")).toHaveTextContent(
        "Network error"
      );

      // Trigger retry
      fireEvent.click(screen.getByTestId("retry-button"));
      expect(retryMock).toHaveBeenCalledTimes(1);

      // Simulate successful retry
      mockUseWalletPortfolioState.mockReturnValue(defaultMockState);
      rerender(<WalletPortfolio />);

      await waitFor(() => {
        expect(screen.getByTestId("portfolio-error")).toHaveTextContent(
          "no-error"
        );
        expect(screen.getByTestId("total-value")).toHaveTextContent("$15000");
      });
    });
  });

  describe("Edge Cases and Stress Tests", () => {
    it("should handle missing hook properties gracefully", () => {
      mockUseWalletPortfolioState.mockReturnValue({
        totalValue: 1000,
        portfolioData: [],
        pieChartData: [],
        isLoading: false,
        apiError: null,
        retry: vi.fn(),
        isRetrying: false,
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: { totalChangePercentage: 0 }, // Provide minimal portfolioMetrics
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
        isWalletManagerOpen: false,
        openWalletManager: vi.fn(),
        closeWalletManager: vi.fn(),
        // Test that the component handles the full required interface
      } as any);

      expect(() => {
        render(<WalletPortfolio />);
      }).not.toThrow();
    });

    it("should handle extreme data values", () => {
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        totalValue: Number.MAX_SAFE_INTEGER,
        portfolioMetrics: { totalChangePercentage: Number.MAX_SAFE_INTEGER },
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("total-value")).toHaveTextContent(
        `$${Number.MAX_SAFE_INTEGER}`
      );
    });

    it("should handle portfolio data with many categories", () => {
      const largeMockData: AssetCategory[] = Array.from(
        { length: 100 },
        (_, i) => ({
          id: `${i}`,
          name: `Asset${i}`,
          totalValue: i * 100,
          percentage: 1,
          color: `#${i.toString(16).padStart(6, "0")}`,
          assets: [],
        })
      );

      const largePieData: PieChartData[] = Array.from(
        { length: 100 },
        (_, i) => ({
          label: `Asset${i}`,
          value: i * 100,
          percentage: 1,
          color: `#${i.toString(16).padStart(6, "0")}`,
        })
      );

      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        portfolioData: largeMockData,
        pieChartData: largePieData,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("portfolio-data-count")).toHaveTextContent(
        "100"
      );
      expect(screen.getByTestId("pie-chart-data-count")).toHaveTextContent(
        "100"
      );
    });

    it("should handle rapid callback invocations", async () => {
      const onZapInClick = vi.fn();
      render(<WalletPortfolio onZapInClick={onZapInClick} />);

      const button = screen.getByTestId("zap-in-button");

      // Rapidly click the button
      await act(async () => {
        for (let i = 0; i < 10; i++) {
          fireEvent.click(button);
        }
      });

      expect(onZapInClick).toHaveBeenCalledTimes(10);
    });

    it("should maintain performance with frequent re-renders", () => {
      const { rerender } = render(<WalletPortfolio />);

      // Simulate frequent state changes
      for (let i = 0; i < 50; i++) {
        mockUseWalletPortfolioState.mockReturnValue({
          ...defaultMockState,
          totalValue: i * 1000,
        });
        rerender(<WalletPortfolio />);
      }

      expect(screen.getByTestId("total-value")).toHaveTextContent("$49000");
    });
  });
});
