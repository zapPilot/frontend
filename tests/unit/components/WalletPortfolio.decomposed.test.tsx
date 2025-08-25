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

// Mock child components
vi.mock("../../../src/components/errors/ErrorBoundary", () => ({
  ErrorBoundary: vi.fn(({ children, onError, resetKeys }) => {
    // Store the error handler for testing
    (global as any).__errorBoundaryOnError = onError;
    (global as any).__errorBoundaryResetKeys = resetKeys;
    return <div data-testid="error-boundary">{children}</div>;
  }),
}));

vi.mock("../../../src/components/ui", () => ({
  GlassCard: vi.fn(({ children }) => (
    <div data-testid="glass-card">{children}</div>
  )),
}));

vi.mock("../../../src/components/PortfolioOverview", () => ({
  PortfolioOverview: vi.fn(
    ({ portfolioData, pieChartData, isLoading, apiError }) => (
      <div data-testid="portfolio-overview">
        <div data-testid="portfolio-data">
          {portfolioData ? JSON.stringify(portfolioData) : "no-data"}
        </div>
        <div data-testid="pie-chart-data">
          {pieChartData ? JSON.stringify(pieChartData) : "no-chart"}
        </div>
        <div data-testid="loading">{isLoading ? "loading" : "not-loading"}</div>
        <div data-testid="error">{apiError || "no-error"}</div>
      </div>
    )
  ),
}));

vi.mock("../../../src/components/WalletManager", () => ({
  WalletManager: vi.fn(({ isOpen, onClose }) =>
    isOpen ? (
      <div data-testid="wallet-manager">
        <button data-testid="close-wallet" onClick={onClose}>
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
        <button data-testid="analytics-btn" onClick={onAnalyticsClick}>
          Analytics
        </button>
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
  WalletMetrics: vi.fn(({ totalValue, isLoading, error, isConnected }) => (
    <div data-testid="wallet-metrics">
      <div data-testid="total-value">{totalValue || "no-value"}</div>
      <div data-testid="loading">{isLoading ? "loading" : "not-loading"}</div>
      <div data-testid="error">{error || "no-error"}</div>
      <div data-testid="connection">
        {isConnected ? "connected" : "disconnected"}
      </div>
    </div>
  )),
}));

vi.mock("../../../src/components/wallet/WalletActions", () => ({
  WalletActions: vi.fn(({ onZapInClick, onZapOutClick, onOptimizeClick }) => (
    <div data-testid="wallet-actions">
      <button data-testid="zap-in-btn" onClick={onZapInClick}>
        Zap In
      </button>
      <button data-testid="zap-out-btn" onClick={onZapOutClick}>
        Zap Out
      </button>
      <button data-testid="optimize-btn" onClick={onOptimizeClick}>
        Optimize
      </button>
    </div>
  )),
}));

describe("WalletPortfolio - Decomposed Hooks Integration Tests", () => {
  const mockUseUser = vi.mocked(useUser);
  const mockUsePortfolioDisplayData = vi.mocked(usePortfolioDisplayData);
  const mockUsePortfolio = vi.mocked(usePortfolio);
  const mockUseWalletModal = vi.mocked(useWalletModal);
  const mockPreparePortfolioDataWithBorrowing = vi.mocked(
    preparePortfolioDataWithBorrowing
  );

  const mockUserInfo = { userId: "test-user-123" };
  const mockCategories = [
    {
      id: "1",
      name: "BTC",
      totalValue: 10000,
      percentage: 60,
      color: "#F7931A",
      assets: [],
    },
    {
      id: "2",
      name: "ETH",
      totalValue: 6000,
      percentage: 40,
      color: "#627EEA",
      assets: [],
    },
  ];
  const mockPortfolioData = mockCategories;
  const mockPieChartData = [
    { label: "BTC", value: 10000, percentage: 60, color: "#F7931A" },
    { label: "ETH", value: 6000, percentage: 40, color: "#627EEA" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks for all hooks
    mockUseUser.mockReturnValue({
      userInfo: mockUserInfo,
      isConnected: true,
      error: null,
    });

    mockUsePortfolioDisplayData.mockReturnValue({
      totalValue: 16000,
      categories: mockCategories,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    });

    mockUsePortfolio.mockReturnValue({
      balanceHidden: false,
      expandedCategory: null,
      portfolioMetrics: { totalChangePercentage: 8.5 },
      toggleBalanceVisibility: vi.fn(),
      toggleCategoryExpansion: vi.fn(),
    });

    mockUseWalletModal.mockReturnValue({
      isOpen: false,
      openModal: vi.fn(),
      closeModal: vi.fn(),
    });

    mockPreparePortfolioDataWithBorrowing.mockReturnValue({
      portfolioData: mockPortfolioData,
      pieChartData: mockPieChartData,
    });
  });

  describe("Hook Integration", () => {
    it("should call all hooks with correct parameters", () => {
      render(<WalletPortfolio />);

      expect(mockUseUser).toHaveBeenCalledTimes(1);
      expect(mockUsePortfolioDisplayData).toHaveBeenCalledWith(
        mockUserInfo.userId
      );
      expect(mockUsePortfolio).toHaveBeenCalledWith(mockCategories);
      expect(mockUseWalletModal).toHaveBeenCalledTimes(1);
      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        mockCategories,
        16000,
        "WalletPortfolio"
      );
    });

    it("should handle undefined userInfo gracefully", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
        error: null,
      });

      render(<WalletPortfolio />);

      expect(mockUsePortfolioDisplayData).toHaveBeenCalledWith(null);
      expect(mockUsePortfolio).toHaveBeenCalledWith([]);
    });

    it("should pass empty array to usePortfolio when categories is null", () => {
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(mockUsePortfolio).toHaveBeenCalledWith([]);
    });

    it("should pass data correctly to data transformation", () => {
      render(<WalletPortfolio />);

      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        mockCategories,
        16000,
        "WalletPortfolio"
      );
    });
  });

  describe("Data Flow Integration", () => {
    it("should pass transformed data to child components", () => {
      render(<WalletPortfolio />);

      expect(screen.getByTestId("portfolio-data")).toHaveTextContent(
        JSON.stringify(mockPortfolioData)
      );
      expect(screen.getByTestId("pie-chart-data")).toHaveTextContent(
        JSON.stringify(mockPieChartData)
      );
    });

    it("should pass loading states correctly", () => {
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: null,
        categories: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(
        screen
          .getByTestId("wallet-metrics")
          .querySelector('[data-testid="loading"]')
      ).toHaveTextContent("loading");
      expect(
        screen
          .getByTestId("portfolio-overview")
          .querySelector('[data-testid="loading"]')
      ).toHaveTextContent("loading");
    });

    it("should pass error states correctly", () => {
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

      expect(
        screen
          .getByTestId("wallet-metrics")
          .querySelector('[data-testid="error"]')
      ).toHaveTextContent(errorMessage);
      expect(
        screen
          .getByTestId("portfolio-overview")
          .querySelector('[data-testid="error"]')
      ).toHaveTextContent(errorMessage);
    });
  });

  describe("User Interactions", () => {
    it("should handle balance visibility toggle", async () => {
      const mockToggleBalance = vi.fn();
      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: { totalChangePercentage: 8.5 },
        toggleBalanceVisibility: mockToggleBalance,
        toggleCategoryExpansion: vi.fn(),
      });

      render(<WalletPortfolio />);

      const toggleButton = screen.getByTestId("toggle-balance-btn");
      await act(async () => {
        toggleButton.click();
      });

      expect(mockToggleBalance).toHaveBeenCalledTimes(1);
    });

    it("should handle wallet manager modal", async () => {
      const mockOpenModal = vi.fn();
      const mockCloseModal = vi.fn();

      mockUseWalletModal.mockReturnValue({
        isOpen: false,
        openModal: mockOpenModal,
        closeModal: mockCloseModal,
      });

      const { rerender } = render(<WalletPortfolio />);

      // Open modal
      const openButton = screen.getByTestId("wallet-manager-btn");
      await act(async () => {
        openButton.click();
      });

      expect(mockOpenModal).toHaveBeenCalledTimes(1);

      // Mock modal as open
      mockUseWalletModal.mockReturnValue({
        isOpen: true,
        openModal: mockOpenModal,
        closeModal: mockCloseModal,
      });

      rerender(<WalletPortfolio />);

      // Close modal
      const closeButton = screen.getByTestId("close-wallet");
      await act(async () => {
        closeButton.click();
      });

      expect(mockCloseModal).toHaveBeenCalledTimes(1);
    });

    it("should handle prop-based callbacks", async () => {
      const mockCallbacks = {
        onAnalyticsClick: vi.fn(),
        onOptimizeClick: vi.fn(),
        onZapInClick: vi.fn(),
        onZapOutClick: vi.fn(),
      };

      render(<WalletPortfolio {...mockCallbacks} />);

      await act(async () => {
        screen.getByTestId("analytics-btn").click();
      });
      expect(mockCallbacks.onAnalyticsClick).toHaveBeenCalledTimes(1);

      await act(async () => {
        screen.getByTestId("optimize-btn").click();
      });
      expect(mockCallbacks.onOptimizeClick).toHaveBeenCalledTimes(1);

      await act(async () => {
        screen.getByTestId("zap-in-btn").click();
      });
      expect(mockCallbacks.onZapInClick).toHaveBeenCalledTimes(1);

      await act(async () => {
        screen.getByTestId("zap-out-btn").click();
      });
      expect(mockCallbacks.onZapOutClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error Boundary Integration", () => {
    it("should configure error boundaries with correct resetKeys", () => {
      render(<WalletPortfolio />);

      expect((global as any).__errorBoundaryResetKeys).toEqual([
        mockUserInfo.userId,
        "connected",
      ]);
    });

    it("should update resetKeys when user changes", () => {
      const { rerender } = render(<WalletPortfolio />);

      // Change user
      mockUseUser.mockReturnValue({
        userInfo: { userId: "new-user" },
        isConnected: true,
        error: null,
      });

      rerender(<WalletPortfolio />);

      expect((global as any).__errorBoundaryResetKeys).toEqual([
        "new-user",
        "connected",
      ]);
    });

    it("should update resetKeys when connection changes", () => {
      const { rerender } = render(<WalletPortfolio />);

      // Change connection
      mockUseUser.mockReturnValue({
        userInfo: mockUserInfo,
        isConnected: false,
        error: null,
      });

      rerender(<WalletPortfolio />);

      expect((global as any).__errorBoundaryResetKeys).toEqual([
        mockUserInfo.userId,
        "disconnected",
      ]);
    });

    it("should handle no user gracefully in resetKeys", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
        error: null,
      });

      render(<WalletPortfolio />);

      expect((global as any).__errorBoundaryResetKeys).toEqual([
        "no-user",
        "disconnected",
      ]);
    });

    it("should configure error logging", () => {
      render(<WalletPortfolio />);

      const onError = (global as any).__errorBoundaryOnError;
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const testError = new Error("Test error");
      onError(testError);

      expect(consoleSpy).toHaveBeenCalledWith(
        "WalletPortfolio Error:",
        testError
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Hook Dependencies and Re-renders", () => {
    it("should re-call hooks when dependencies change", () => {
      const { rerender } = render(<WalletPortfolio />);

      // Change user ID
      mockUseUser.mockReturnValue({
        userInfo: { userId: "new-user-id" },
        isConnected: true,
        error: null,
      });

      rerender(<WalletPortfolio />);

      expect(mockUsePortfolioDisplayData).toHaveBeenCalledWith("new-user-id");
    });

    it("should handle categories change in usePortfolio", () => {
      const newCategories = [
        {
          id: "3",
          name: "ADA",
          totalValue: 5000,
          percentage: 100,
          color: "#0033AD",
          assets: [],
        },
      ];

      const { rerender } = render(<WalletPortfolio />);

      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 5000,
        categories: newCategories,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      rerender(<WalletPortfolio />);

      expect(mockUsePortfolio).toHaveBeenCalledWith(newCategories);
    });

    it("should handle data transformation with updated values", () => {
      const { rerender } = render(<WalletPortfolio />);

      const newCategories = [
        {
          id: "4",
          name: "SOL",
          totalValue: 8000,
          percentage: 100,
          color: "#9945FF",
          assets: [],
        },
      ];

      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 8000,
        categories: newCategories,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      rerender(<WalletPortfolio />);

      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        newCategories,
        8000,
        "WalletPortfolio"
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle hook throwing errors gracefully", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockUsePortfolioDisplayData.mockImplementation(() => {
        throw new Error("Portfolio data hook failed");
      });

      expect(() => render(<WalletPortfolio />)).toThrow(
        "Portfolio data hook failed"
      );

      consoleSpy.mockRestore();
    });

    it("should handle data transformation throwing errors", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockPreparePortfolioDataWithBorrowing.mockImplementation(() => {
        throw new Error("Data transformation failed");
      });

      expect(() => render(<WalletPortfolio />)).toThrow(
        "Data transformation failed"
      );

      consoleSpy.mockRestore();
    });

    it("should handle extreme data values", () => {
      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: Number.MAX_SAFE_INTEGER,
        categories: mockCategories,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        mockCategories,
        Number.MAX_SAFE_INTEGER,
        "WalletPortfolio"
      );
    });

    it("should handle empty categories array", () => {
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
  });

  describe("Performance", () => {
    it("should not cause unnecessary re-renders with stable references", () => {
      const stableRefetch = vi.fn();
      const stableToggleBalance = vi.fn();
      const stableToggleCategory = vi.fn();
      const stableOpenModal = vi.fn();
      const stableCloseModal = vi.fn();

      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 16000,
        categories: mockCategories,
        isLoading: false,
        error: null,
        refetch: stableRefetch,
        isRefetching: false,
      });

      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: { totalChangePercentage: 8.5 },
        toggleBalanceVisibility: stableToggleBalance,
        toggleCategoryExpansion: stableToggleCategory,
      });

      mockUseWalletModal.mockReturnValue({
        isOpen: false,
        openModal: stableOpenModal,
        closeModal: stableCloseModal,
      });

      const { rerender } = render(<WalletPortfolio />);

      // Rerender with same values
      rerender(<WalletPortfolio />);

      // Hooks should be called but with same stable references
      expect(mockUsePortfolioDisplayData).toHaveReturnedWith(
        expect.objectContaining({ refetch: stableRefetch })
      );
      expect(mockUsePortfolio).toHaveReturnedWith(
        expect.objectContaining({
          toggleBalanceVisibility: stableToggleBalance,
          toggleCategoryExpansion: stableToggleCategory,
        })
      );
      expect(mockUseWalletModal).toHaveReturnedWith(
        expect.objectContaining({
          openModal: stableOpenModal,
          closeModal: stableCloseModal,
        })
      );
    });
  });
});
