import { act, screen, waitFor } from "@testing-library/react";
import { render } from "../../test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WalletPortfolio } from "../../../src/components/WalletPortfolio";
import { useUser } from "../../../src/contexts/UserContext";
import { usePortfolio } from "../../../src/hooks/usePortfolio";
import { usePortfolioDisplayData } from "../../../src/hooks/queries/usePortfolioQuery";
import { useWalletModal } from "../../../src/hooks/useWalletModal";
import { preparePortfolioDataWithBorrowing } from "../../../src/utils/portfolioTransformers";

// Mock all dependencies
vi.mock("../../../src/contexts/UserContext");
vi.mock("../../../src/hooks/usePortfolio");
vi.mock("../../../src/hooks/queries/usePortfolioQuery");
vi.mock("../../../src/hooks/useWalletModal");
vi.mock("../../../src/utils/portfolioTransformers");

// Mock child components to focus on hook integration
vi.mock("../../../src/components/PortfolioOverview", () => ({
  PortfolioOverview: vi.fn(
    ({ portfolioData, pieChartData, isLoading, apiError, onRetry }) => (
      <div data-testid="portfolio-overview">
        <div data-testid="portfolio-data">
          {portfolioData ? "has-portfolio-data" : "no-portfolio-data"}
        </div>
        <div data-testid="pie-chart-data">
          {pieChartData ? "has-pie-data" : "no-pie-data"}
        </div>
        <div data-testid="loading-state">
          {isLoading ? "loading" : "not-loading"}
        </div>
        <div data-testid="error-state">{apiError || "no-error"}</div>
        {onRetry && (
          <button data-testid="retry-button" onClick={onRetry}>
            Retry
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
        <button data-testid="close-modal" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null
  ),
}));

vi.mock("../../../src/components/wallet/WalletHeader", () => ({
  WalletHeader: vi.fn(
    ({ onToggleBalance, balanceHidden, onWalletManagerClick }) => (
      <div data-testid="wallet-header">
        <button data-testid="toggle-balance" onClick={onToggleBalance}>
          {balanceHidden ? "Show Balance" : "Hide Balance"}
        </button>
        <button
          data-testid="open-wallet-manager"
          onClick={onWalletManagerClick}
        >
          Open Wallet Manager
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
          {balanceHidden ? "***" : totalValue}
        </div>
        <div data-testid="metrics-loading">
          {isLoading ? "loading" : "loaded"}
        </div>
        <div data-testid="metrics-error">{error || "no-error"}</div>
        <div data-testid="change-percentage">{portfolioChangePercentage}</div>
      </div>
    )
  ),
}));

vi.mock("../../../src/components/wallet/WalletActions", () => ({
  WalletActions: vi.fn(({ onZapInClick, onZapOutClick, onOptimizeClick }) => (
    <div data-testid="wallet-actions">
      <button data-testid="zap-in" onClick={onZapInClick}>
        Zap In
      </button>
      <button data-testid="zap-out" onClick={onZapOutClick}>
        Zap Out
      </button>
      <button data-testid="optimize" onClick={onOptimizeClick}>
        Optimize
      </button>
    </div>
  )),
}));

vi.mock("../../../src/components/ui", () => ({
  GlassCard: vi.fn(({ children }) => (
    <div data-testid="glass-card">{children}</div>
  )),
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>),
  },
}));

// Test data
const mockUserInfo = { userId: "test-user-123" };
const mockCategories = [
  {
    id: "btc",
    name: "BTC",
    totalValue: 7500,
    percentage: 50,
    color: "#F7931A",
    change24h: 5.2,
    assets: [],
  },
  {
    id: "eth",
    name: "ETH",
    totalValue: 4500,
    percentage: 30,
    color: "#627EEA",
    change24h: 3.1,
    assets: [],
  },
];

const mockPieChartData = [
  { label: "BTC", value: 7500, percentage: 50, color: "#F7931A" },
  { label: "ETH", value: 4500, percentage: 30, color: "#627EEA" },
];

const mockPortfolioMetrics = {
  totalValue: 12000,
  totalChangePercentage: 4.2,
  totalChangeValue: 480,
};

describe("WalletPortfolio - Hook Integration Tests", () => {
  const mockUseUser = vi.mocked(useUser);
  const mockUsePortfolio = vi.mocked(usePortfolio);
  const mockUsePortfolioDisplayData = vi.mocked(usePortfolioDisplayData);
  const mockUseWalletModal = vi.mocked(useWalletModal);
  const mockPreparePortfolioDataWithBorrowing = vi.mocked(
    preparePortfolioDataWithBorrowing
  );

  beforeEach(() => {
    // Default mock implementations
    mockUseUser.mockReturnValue({
      userInfo: mockUserInfo,
      isConnected: true,
      loading: false,
    });

    mockUsePortfolioDisplayData.mockReturnValue({
      totalValue: 12000,
      categories: mockCategories,
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

    mockPreparePortfolioDataWithBorrowing.mockReturnValue({
      portfolioData: mockCategories,
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

  describe("Hook Call Sequence and Dependencies", () => {
    it("should call hooks in the correct order with proper dependencies", async () => {
      render(<WalletPortfolio />);

      // Verify hook call order and dependencies
      expect(mockUseUser).toHaveBeenCalled();
      expect(mockUsePortfolioDisplayData).toHaveBeenCalledWith(
        mockUserInfo.userId
      );
      expect(mockUsePortfolio).toHaveBeenCalledWith(mockCategories);
      expect(mockUseWalletModal).toHaveBeenCalled();
      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        mockCategories,
        12000,
        "WalletPortfolio"
      );
    });

    it("should handle null userId gracefully", async () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
        loading: false,
      });

      render(<WalletPortfolio />);

      // Should pass null to usePortfolioDisplayData
      expect(mockUsePortfolioDisplayData).toHaveBeenCalledWith(null);

      // Should pass empty array to usePortfolio when no categories
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      expect(mockUsePortfolio).toHaveBeenCalledWith([]);
    });

    it("should pass correct data to data transformation utility", async () => {
      render(<WalletPortfolio />);

      await waitFor(() => {
        expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
          mockCategories, // from usePortfolioDisplayData
          12000, // totalValue from usePortfolioDisplayData
          "WalletPortfolio" // context identifier
        );
      });
    });
  });

  describe("Data Flow Between Hooks", () => {
    it("should pass usePortfolioDisplayData results to usePortfolio", async () => {
      const customCategories = [
        {
          id: "custom",
          name: "Custom",
          totalValue: 5000,
          percentage: 100,
          color: "#000",
          change24h: 1,
          assets: [],
        },
      ];

      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 5000,
        categories: customCategories,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(mockUsePortfolio).toHaveBeenCalledWith(customCategories);
    });

    it("should handle empty categories array properly", async () => {
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 0,
        categories: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(mockUsePortfolio).toHaveBeenCalledWith([]);
      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        [],
        0,
        "WalletPortfolio"
      );
    });

    it("should handle loading state correctly", async () => {
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      // Should show loading state
      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading");
      expect(screen.getByTestId("metrics-loading")).toHaveTextContent(
        "loading"
      );

      // Should still pass empty array to usePortfolio
      expect(mockUsePortfolio).toHaveBeenCalledWith([]);
    });
  });

  describe("Error State Propagation", () => {
    it("should propagate API errors from usePortfolioDisplayData", async () => {
      const errorMessage = "Failed to fetch portfolio data";
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: false,
        error: errorMessage,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(screen.getByTestId("error-state")).toHaveTextContent(errorMessage);
      expect(screen.getByTestId("metrics-error")).toHaveTextContent(
        errorMessage
      );
    });

    it("should handle hook errors gracefully", async () => {
      // Simulate usePortfolio throwing an error
      mockUsePortfolio.mockImplementation(() => {
        throw new Error("Portfolio calculation failed");
      });

      // Component should still render with error boundary handling
      expect(() => render(<WalletPortfolio />)).toThrow(
        "Portfolio calculation failed"
      );
    });
  });

  describe("Interactive Hook Integration", () => {
    it("should integrate balance visibility toggle between hooks", async () => {
      const mockToggleBalance = vi.fn();

      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: mockPortfolioMetrics,
        toggleBalanceVisibility: mockToggleBalance,
        toggleCategoryExpansion: vi.fn(),
      });

      render(<WalletPortfolio />);

      // Click toggle balance button
      const toggleButton = screen.getByTestId("toggle-balance");
      await act(async () => {
        toggleButton.click();
      });

      expect(mockToggleBalance).toHaveBeenCalled();
    });

    it("should integrate wallet modal state with useWalletModal", async () => {
      const mockOpenModal = vi.fn();
      const mockCloseModal = vi.fn();

      mockUseWalletModal.mockReturnValue({
        isOpen: false,
        openModal: mockOpenModal,
        closeModal: mockCloseModal,
      });

      const { rerender } = render(<WalletPortfolio />);

      // Initially modal should be closed
      expect(screen.queryByTestId("wallet-manager")).not.toBeInTheDocument();

      // Click open wallet manager
      const openButton = screen.getByTestId("open-wallet-manager");
      await act(async () => {
        openButton.click();
      });

      expect(mockOpenModal).toHaveBeenCalled();

      // Simulate modal open state
      mockUseWalletModal.mockReturnValue({
        isOpen: true,
        openModal: mockOpenModal,
        closeModal: mockCloseModal,
      });

      rerender(<WalletPortfolio />);

      // Modal should now be visible
      expect(screen.getByTestId("wallet-manager")).toBeInTheDocument();

      // Click close modal
      const closeButton = screen.getByTestId("close-modal");
      await act(async () => {
        closeButton.click();
      });

      expect(mockCloseModal).toHaveBeenCalled();
    });

    it("should handle retry functionality from usePortfolioDisplayData", async () => {
      const mockRetry = vi.fn();

      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: false,
        error: "Network error",
        refetch: mockRetry,
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      const retryButton = screen.getByTestId("retry-button");
      await act(async () => {
        retryButton.click();
      });

      expect(mockRetry).toHaveBeenCalled();
    });
  });

  describe("Performance and Re-rendering", () => {
    it("should not cause unnecessary re-renders when data doesn't change", async () => {
      const { rerender } = render(<WalletPortfolio />);

      const initialCallCount = mockUsePortfolio.mock.calls.length;

      // Rerender with same data
      rerender(<WalletPortfolio />);

      // Hooks should still be called but with same parameters
      expect(mockUsePortfolio).toHaveBeenCalledTimes(initialCallCount + 1);
      expect(mockUsePortfolio).toHaveBeenLastCalledWith(mockCategories);
    });

    it("should handle rapid state changes correctly", async () => {
      const { rerender } = render(<WalletPortfolio />);

      // Simulate rapid data changes
      for (let i = 0; i < 5; i++) {
        mockUsePortfolioDisplayData.mockReturnValue({
          totalValue: 1000 * (i + 1),
          categories: mockCategories,
          isLoading: i % 2 === 0, // Alternate loading state
          error: null,
          refetch: vi.fn(),
          isRefetching: false,
        });

        rerender(<WalletPortfolio />);
      }

      // Component should handle rapid changes without crashing
      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
    });
  });

  describe("Hook Dependencies and Error Recovery", () => {
    it("should recover from temporary hook failures", async () => {
      // First render with error
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: false,
        error: "Temporary error",
        refetch: vi.fn(),
        isRefetching: false,
      });

      const { rerender } = render(<WalletPortfolio />);

      expect(screen.getByTestId("error-state")).toHaveTextContent(
        "Temporary error"
      );

      // Simulate recovery
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 12000,
        categories: mockCategories,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      rerender(<WalletPortfolio />);

      expect(screen.getByTestId("error-state")).toHaveTextContent("no-error");
      expect(screen.getByTestId("portfolio-data")).toHaveTextContent(
        "has-portfolio-data"
      );
    });

    it("should handle partial data scenarios", async () => {
      // Scenario: User data available but portfolio data loading
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      // Should show user is connected but portfolio is loading
      expect(mockUsePortfolioDisplayData).toHaveBeenCalledWith(
        mockUserInfo.userId
      );
      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading");
    });
  });

  describe("Component Props Integration", () => {
    it("should pass component props to child components correctly", async () => {
      const mockOnZapIn = vi.fn();
      const mockOnZapOut = vi.fn();
      const mockOnOptimize = vi.fn();

      render(
        <WalletPortfolio
          onZapInClick={mockOnZapIn}
          onZapOutClick={mockOnZapOut}
          onOptimizeClick={mockOnOptimize}
        />
      );

      // Test prop integration with wallet actions
      await act(async () => {
        screen.getByTestId("zap-in").click();
      });
      expect(mockOnZapIn).toHaveBeenCalled();

      await act(async () => {
        screen.getByTestId("zap-out").click();
      });
      expect(mockOnZapOut).toHaveBeenCalled();

      await act(async () => {
        screen.getByTestId("optimize").click();
      });
      expect(mockOnOptimize).toHaveBeenCalled();
    });
  });

  describe("Complex State Combinations", () => {
    it("should handle user disconnected + portfolio error combination", async () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
        loading: false,
      });

      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: false,
        error: "User not authenticated",
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(mockUsePortfolioDisplayData).toHaveBeenCalledWith(null);
      expect(screen.getByTestId("error-state")).toHaveTextContent(
        "User not authenticated"
      );
    });

    it("should handle loading + modal open combination", async () => {
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockUseWalletModal.mockReturnValue({
        isOpen: true,
        openModal: vi.fn(),
        closeModal: vi.fn(),
      });

      render(<WalletPortfolio />);

      // Both loading and modal should be visible
      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading");
      expect(screen.getByTestId("wallet-manager")).toBeInTheDocument();
    });

    it("should handle balance hidden + error state combination", async () => {
      mockUsePortfolio.mockReturnValue({
        balanceHidden: true,
        expandedCategory: null,
        portfolioMetrics: mockPortfolioMetrics,
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
      });

      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: false,
        error: "API Error",
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      // Balance should be hidden and error should show
      expect(screen.getByTestId("total-value")).toHaveTextContent("***");
      expect(screen.getByTestId("error-state")).toHaveTextContent("API Error");
    });
  });
});
