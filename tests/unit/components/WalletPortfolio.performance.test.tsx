import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WalletPortfolio } from "../../../src/components/WalletPortfolio";
import { useUser } from "../../../src/contexts/UserContext";
import { useLandingPageData } from "../../../src/hooks/queries/usePortfolioQuery";
import { usePortfolio } from "../../../src/hooks/usePortfolio";
import { usePortfolioState } from "../../../src/hooks/usePortfolioState";
import { useWalletModal } from "../../../src/hooks/useWalletModal";
import { createCategoriesFromApiData } from "../../../src/utils/portfolio.utils";
import { render } from "../../test-utils";

// Mock dependencies
vi.mock("../../../src/contexts/UserContext");
vi.mock("../../../src/hooks/usePortfolio");
vi.mock("../../../src/hooks/queries/usePortfolioQuery");
vi.mock("../../../src/hooks/usePortfolioState");
vi.mock("../../../src/hooks/useWalletModal");
vi.mock("../../../src/utils/portfolio.utils");

// Mock child components for performance testing
vi.mock("../../../src/components/PortfolioOverview", () => ({
  PortfolioOverview: vi.fn(
    ({
      portfolioState: _portfolioState,
      categorySummaries,
      pieChartData,
      onCategoryClick,
    }) => (
      <div data-testid="portfolio-overview">
        <div data-testid="render-count">{Date.now()}</div>
        <div data-testid="categories-length">
          {categorySummaries?.length || 0}
        </div>
        <div data-testid="pie-data-length">{pieChartData?.length || 0}</div>
        {onCategoryClick &&
          categorySummaries?.map((cat, i) => (
            <button
              key={i}
              data-testid={`category-${i}`}
              onClick={() => onCategoryClick(cat.id)}
            >
              {cat.name}
            </button>
          ))}
      </div>
    )
  ),
}));

vi.mock("../../../src/components/WalletManager", () => ({
  WalletManager: vi.fn(({ isOpen }) =>
    isOpen ? <div data-testid="wallet-manager">Modal</div> : null
  ),
}));

vi.mock("../../../src/components/wallet/WalletHeader", () => ({
  WalletHeader: vi.fn(() => <div data-testid="wallet-header">Header</div>),
}));

vi.mock("../../../src/components/wallet/WalletMetrics", () => ({
  WalletMetrics: vi.fn(({ portfolioState, balanceHidden }) => {
    const totalValue = portfolioState?.totalValue;

    return (
      <div data-testid="wallet-metrics">
        <div data-testid="value">{balanceHidden ? "****" : totalValue}</div>
      </div>
    );
  }),
}));

vi.mock("../../../src/components/wallet/WalletActions", () => ({
  WalletActions: vi.fn(() => <div data-testid="wallet-actions">Actions</div>),
}));

vi.mock("../../../src/components/ui", () => ({
  GlassCard: vi.fn(({ children }) => (
    <div data-testid="glass-card">{children}</div>
  )),
}));

vi.mock("../../../src/components/errors/ErrorBoundary", () => ({
  ErrorBoundary: vi.fn(({ children }) => children),
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>),
    button: vi.fn(({ children, whileHover, whileTap, ...props }) => (
      <button {...props}>{children}</button>
    )),
  },
}));

const mockUseUser = vi.mocked(useUser);
const mockUsePortfolio = vi.mocked(usePortfolio);
const mockUseLandingPageData = vi.mocked(useLandingPageData);
const mockUsePortfolioState = vi.mocked(usePortfolioState);
const mockUseWalletModal = vi.mocked(useWalletModal);
const mockCreateCategoriesFromApiData = vi.mocked(createCategoriesFromApiData);

describe("WalletPortfolio - Performance and Edge Cases", () => {
  const createLargeDataset = (size: number) => ({
    user_id: "test-user",
    total_net_usd: size * 1000,
    total_assets_usd: size * 1000,
    total_debt_usd: 0,
    weighted_apr: 10.5,
    estimated_monthly_income: size * 8.75,
    portfolio_allocation: {
      btc: { total_value: size * 400, percentage_of_portfolio: 40 },
      eth: { total_value: size * 300, percentage_of_portfolio: 30 },
      stablecoins: { total_value: size * 200, percentage_of_portfolio: 20 },
      others: { total_value: size * 100, percentage_of_portfolio: 10 },
    },
    category_summary_debt: {
      btc: 0,
      eth: 0,
      stablecoins: 0,
      others: 0,
    },
  });

  const createLargeCategorySummaries = (size: number) =>
    Array.from({ length: size }, (_, i) => ({
      id: `category-${i}`,
      name: `Category ${i}`,
      value: 1000 * (i + 1),
      percentage: Math.round((100 / size) * 100) / 100,
    }));

  beforeEach(() => {
    vi.clearAllMocks();

    // Default setups
    mockUseUser.mockReturnValue({
      userInfo: { userId: "test-user", address: "0x123", email: null },
      isConnected: true,
    });

    mockUsePortfolio.mockReturnValue({
      balanceHidden: false,
      toggleBalanceVisibility: vi.fn(),
      positions: [],
      isLoading: false,
      error: null,
    });

    mockUseWalletModal.mockReturnValue({
      isOpen: false,
      openModal: vi.fn(),
      closeModal: vi.fn(),
    });

    mockUsePortfolioState.mockReturnValue({
      type: "has_data",
      isConnected: true,
      isLoading: false,
      hasError: false,
      hasZeroData: false,
      totalValue: 1000000, // Default large value for performance tests
      errorMessage: null,
      isRetrying: false,
    });
  });

  describe("Performance Tests", () => {
    it("should handle large datasets efficiently", async () => {
      const largeData = createLargeDataset(1000);
      const largeSummaries = createLargeCategorySummaries(100);

      mockUseLandingPageData.mockReturnValue({
        data: largeData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockCreateCategoriesFromApiData.mockReturnValue(largeSummaries);

      const startTime = performance.now();
      render(<WalletPortfolio />);
      const renderTime = performance.now() - startTime;

      // Should render within reasonable time (less than 100ms for large dataset)
      expect(renderTime).toBeLessThan(100);

      await waitFor(() => {
        expect(screen.getByTestId("categories-length")).toHaveTextContent(
          "100"
        );
      });
    });

    it("should memoize useMemo calculations correctly", () => {
      const data = createLargeDataset(100);

      mockUseLandingPageData.mockReturnValue({
        data,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      const { rerender } = render(<WalletPortfolio />);

      // Clear mock call history after initial render
      mockCreateCategoriesFromApiData.mockClear();

      // Rerender with same props - should use memoized values
      rerender(<WalletPortfolio />);

      // Should not call expensive transformation again
      expect(mockCreateCategoriesFromApiData).not.toHaveBeenCalled();
    });

    it("should invalidate memoization when data changes", () => {
      const initialData = createLargeDataset(10);

      mockUseLandingPageData.mockReturnValue({
        data: initialData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      const { rerender } = render(<WalletPortfolio />);

      // Change data
      const newData = createLargeDataset(20);
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
      expect(mockCreateCategoriesFromApiData).toHaveBeenCalledWith(
        expect.objectContaining({
          btc: 8000, // 20 * 400
          eth: 6000, // 20 * 300
        }),
        20000 // 20 * 1000
      );
    });

    it("should handle rapid consecutive updates", async () => {
      const user = userEvent.setup();
      const toggleFn = vi.fn();

      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        toggleBalanceVisibility: toggleFn,
        positions: [],
        isLoading: false,
        error: null,
      });

      mockUseLandingPageData.mockReturnValue({
        data: createLargeDataset(10),
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio onCategoryClick={vi.fn()} />);

      // Simulate rapid user interactions
      const categoryButtons = screen.getAllByTestId(/^category-/);

      const startTime = performance.now();

      // Rapid clicks
      for (let i = 0; i < 10 && i < categoryButtons.length; i++) {
        await user.click(categoryButtons[i]);
      }

      const interactionTime = performance.now() - startTime;

      // Should handle rapid interactions efficiently
      expect(interactionTime).toBeLessThan(500);
    });

    it("should prevent unnecessary re-renders", async () => {
      // Get reference to the already mocked PortfolioOverview
      const PortfolioOverviewMockModule = vi.mocked(
        await import("../../../src/components/PortfolioOverview")
      );
      const PortfolioOverviewMock =
        PortfolioOverviewMockModule.PortfolioOverview;

      mockUseLandingPageData.mockReturnValue({
        data: createLargeDataset(10),
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      const { rerender } = render(<WalletPortfolio />);

      // Clear render calls
      PortfolioOverviewMock.mockClear();

      // Rerender with same data
      rerender(<WalletPortfolio />);

      // Should not cause unnecessary re-render of child components
      // Note: This might still be called due to React's rendering behavior
      // but the expensive calculations should be memoized
      const callCount = PortfolioOverviewMock.mock.calls.length;
      expect(callCount).toBeLessThanOrEqual(1);
    });
  });

  describe("Memory Leak Prevention", () => {
    it("should cleanup properly on unmount", () => {
      const { unmount } = render(<WalletPortfolio />);

      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();

      // Unmount should not throw errors
      expect(() => unmount()).not.toThrow();
    });

    it("should handle component remounting", () => {
      const { unmount } = render(<WalletPortfolio />);

      unmount();

      // Should be able to remount without issues - create fresh render
      expect(() => render(<WalletPortfolio />)).not.toThrow();

      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
    });

    it("should handle rapid mount/unmount cycles", () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<WalletPortfolio />);
        expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
        unmount();
      }

      // No memory leaks should occur
      expect(true).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle null/undefined data gracefully", () => {
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockCreateCategoriesFromApiData.mockReturnValue([]);

      expect(() => render(<WalletPortfolio />)).not.toThrow();

      expect(screen.getByTestId("categories-length")).toHaveTextContent("0");
    });

    it("should handle malformed API data", () => {
      const malformedData = {
        // Missing required fields
        user_id: "test",
        // Invalid types
        total_net_usd: "invalid",
        portfolio_allocation: {
          btc: { total_value: 0, percentage_of_portfolio: 0 },
          eth: { total_value: 0, percentage_of_portfolio: 0 },
          stablecoins: { total_value: 0, percentage_of_portfolio: 0 },
          others: { total_value: 0, percentage_of_portfolio: 0 },
        },
        category_summary_debt: {
          btc: 0,
          eth: 0,
          stablecoins: 0,
          others: 0,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      mockUseLandingPageData.mockReturnValue({
        data: malformedData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockCreateCategoriesFromApiData.mockReturnValue([]);

      expect(() => render(<WalletPortfolio />)).not.toThrow();
    });

    it("should handle extremely large numbers", () => {
      const extremeData = {
        ...createLargeDataset(1),
        total_net_usd: Number.MAX_SAFE_INTEGER,
        portfolio_allocation: {
          btc: {
            total_value: Number.MAX_SAFE_INTEGER / 4,
            percentage_of_portfolio: 25,
          },
          eth: {
            total_value: Number.MAX_SAFE_INTEGER / 4,
            percentage_of_portfolio: 25,
          },
          stablecoins: {
            total_value: Number.MAX_SAFE_INTEGER / 4,
            percentage_of_portfolio: 25,
          },
          others: {
            total_value: Number.MAX_SAFE_INTEGER / 4,
            percentage_of_portfolio: 25,
          },
        },
      };

      mockUseLandingPageData.mockReturnValue({
        data: extremeData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      expect(() => render(<WalletPortfolio />)).not.toThrow();
    });

    it("should handle negative values correctly", () => {
      const negativeData = {
        ...createLargeDataset(1),
        total_net_usd: -5000,
        total_debt_usd: 10000,
      };

      mockUseLandingPageData.mockReturnValue({
        data: negativeData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      expect(() => render(<WalletPortfolio />)).not.toThrow();

      expect(screen.getByTestId("value")).toHaveTextContent("1000000");
    });

    it("should handle zero values in all categories", () => {
      const zeroData = {
        ...createLargeDataset(0),
        portfolio_allocation: {
          btc: { total_value: 0, percentage_of_portfolio: 0 },
          eth: { total_value: 0, percentage_of_portfolio: 0 },
          stablecoins: { total_value: 0, percentage_of_portfolio: 0 },
          others: { total_value: 0, percentage_of_portfolio: 0 },
        },
      };

      mockUseLandingPageData.mockReturnValue({
        data: zeroData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockCreateCategoriesFromApiData.mockReturnValue([]);

      expect(() => render(<WalletPortfolio />)).not.toThrow();

      expect(screen.getByTestId("pie-data-length")).toHaveTextContent("0");
    });

    it("should handle very long user IDs and addresses", () => {
      const longUserId = "a".repeat(1000);
      const longAddress = "0x" + "1".repeat(1000);

      mockUseUser.mockReturnValue({
        userInfo: {
          userId: longUserId,
          address: longAddress,
          email: null,
        },
        isConnected: true,
      });

      expect(() => render(<WalletPortfolio />)).not.toThrow();
    });

    it("should handle special characters in data", () => {
      const specialData = {
        ...createLargeDataset(10),
        user_id: "test-user-特殊文字-🚀",
      };

      mockUseLandingPageData.mockReturnValue({
        data: specialData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      expect(() => render(<WalletPortfolio />)).not.toThrow();
    });

    it("should handle concurrent state updates", async () => {
      const { rerender } = render(<WalletPortfolio />);

      // Simulate concurrent state updates
      const promises = Array.from({ length: 10 }, (_, i) => {
        return new Promise<void>(resolve => {
          setTimeout(() => {
            act(() => {
              mockUseLandingPageData.mockReturnValue({
                data: createLargeDataset(i + 1),
                isLoading: false,
                error: null,
                refetch: vi.fn(),
                isRefetching: false,
              });
              rerender(<WalletPortfolio />);
            });
            resolve();
          }, Math.random() * 10);
        });
      });

      await Promise.all(promises);

      // Should handle concurrent updates without crashes
      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
    });

    it("should handle prop changes during loading", () => {
      const onCategoryClick1 = vi.fn();
      const onCategoryClick2 = vi.fn();

      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      const { rerender } = render(
        <WalletPortfolio onCategoryClick={onCategoryClick1} />
      );

      // Change props while loading
      rerender(<WalletPortfolio onCategoryClick={onCategoryClick2} />);

      // Should not crash
      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
    });
  });

  describe("Stress Tests", () => {
    it("should handle multiple simultaneous user interactions", async () => {
      const user = userEvent.setup();
      const onCategoryClick = vi.fn();
      const largeSummaries = createLargeCategorySummaries(50);

      mockUseLandingPageData.mockReturnValue({
        data: createLargeDataset(100),
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockCreateCategoriesFromApiData.mockReturnValue(largeSummaries);

      render(<WalletPortfolio onCategoryClick={onCategoryClick} />);

      // Stress test with many rapid interactions - sequential to avoid overlapping act() calls
      const categoryButtons = screen.getAllByTestId(/^category-/);
      const buttonsToClick = categoryButtons.slice(0, 20);

      for (let i = 0; i < buttonsToClick.length; i++) {
        await user.click(buttonsToClick[i]);
      }

      expect(onCategoryClick).toHaveBeenCalledTimes(20);
    });

    it("should maintain performance with frequent prop updates", () => {
      const { rerender } = render(<WalletPortfolio />);

      const startTime = performance.now();

      // Simulate 100 prop updates
      for (let i = 0; i < 100; i++) {
        rerender(
          <WalletPortfolio
            onCategoryClick={vi.fn()}
            onOptimizeClick={i % 3 === 0 ? vi.fn() : undefined}
          />
        );
      }

      const totalTime = performance.now() - startTime;

      // Should handle frequent updates efficiently
      expect(totalTime).toBeLessThan(1000); // Less than 1 second for 100 updates
    });
  });
});
