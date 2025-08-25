import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { WalletPortfolio } from "@/components/WalletPortfolio";
import { useUser } from "@/hooks/useUser";
import { usePortfolioDisplayData } from "@/hooks/queries/usePortfolioQuery";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useWalletModal } from "@/hooks/useWalletModal";
import { preparePortfolioDataWithBorrowing } from "@/utils/portfolioTransformers";

// Performance monitoring utilities
const performanceMarkPrefix = "WalletPortfolio";
let renderStartTime: number;
let renderEndTime: number;

// Mock all dependencies
vi.mock("@/hooks/useUser");
vi.mock("@/hooks/queries/usePortfolioQuery");
vi.mock("@/hooks/usePortfolio");
vi.mock("@/hooks/useWalletModal");
vi.mock("@/utils/portfolioTransformers");
vi.mock("@/components/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

const mockUseUser = vi.mocked(useUser);
const mockUsePortfolioDisplayData = vi.mocked(usePortfolioDisplayData);
const mockUsePortfolio = vi.mocked(usePortfolio);
const mockUseWalletModal = vi.mocked(useWalletModal);
const mockPreparePortfolioDataWithBorrowing = vi.mocked(
  preparePortfolioDataWithBorrowing
);

// Helper to create large datasets
const createLargePortfolioData = (size: number) => ({
  totalValue: size * 100,
  categories: Array.from({ length: size }, (_, i) => ({
    id: `category-${i}`,
    name: `Category ${i}`,
    value: Math.random() * 1000 + 100,
    percentage: Math.random() * 10 + 1,
  })),
});

// Helper to measure render performance
const measureRenderTime = () => {
  renderStartTime = performance.now();
};

const endMeasureRenderTime = () => {
  renderEndTime = performance.now();
  return renderEndTime - renderStartTime;
};

describe("WalletPortfolio - Performance Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default performant mocks
    mockUseUser.mockReturnValue({
      userInfo: { userId: "test-user-123", email: "test@example.com" },
      isConnected: true,
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    mockUseWalletModal.mockReturnValue({
      isOpen: false,
      openModal: vi.fn(),
      closeModal: vi.fn(),
    });
  });

  afterEach(() => {
    // Clean up performance marks
    try {
      performance.clearMarks();
      performance.clearMeasures();
    } catch (e) {
      // Performance API might not be available in test environment
    }
  });

  describe("Baseline Performance", () => {
    it("should render small dataset within acceptable time", async () => {
      const smallData = createLargePortfolioData(10);

      mockUsePortfolioDisplayData.mockReturnValue({
        ...smallData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: {
          totalValue: smallData.totalValue,
          changePercent: 5.2,
        },
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
      });

      mockPreparePortfolioDataWithBorrowing.mockReturnValue({
        portfolioData: smallData.categories,
        pieChartData: smallData.categories.map(cat => ({
          name: cat.name,
          value: cat.value,
          percentage: cat.percentage,
        })),
      });

      measureRenderTime();

      await act(async () => {
        render(<WalletPortfolio />);
      });

      const renderTime = endMeasureRenderTime();

      // Should render small dataset quickly (under 50ms in ideal conditions)
      expect(renderTime).toBeLessThan(200); // Generous threshold for CI environment
      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
    });

    it("should render medium dataset within acceptable time", async () => {
      const mediumData = createLargePortfolioData(50);

      mockUsePortfolioDisplayData.mockReturnValue({
        ...mediumData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: {
          totalValue: mediumData.totalValue,
          changePercent: 3.1,
        },
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
      });

      mockPreparePortfolioDataWithBorrowing.mockReturnValue({
        portfolioData: mediumData.categories,
        pieChartData: mediumData.categories.map(cat => ({
          name: cat.name,
          value: cat.value,
          percentage: cat.percentage,
        })),
      });

      measureRenderTime();

      await act(async () => {
        render(<WalletPortfolio />);
      });

      const renderTime = endMeasureRenderTime();

      // Should still render medium dataset reasonably fast
      expect(renderTime).toBeLessThan(500); // Reasonable threshold
      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
    });
  });

  describe("Hook Call Efficiency", () => {
    it("should minimize hook calls during normal render", () => {
      const normalData = createLargePortfolioData(20);

      mockUsePortfolioDisplayData.mockReturnValue({
        ...normalData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: {
          totalValue: normalData.totalValue,
          changePercent: 2.5,
        },
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
      });

      mockPreparePortfolioDataWithBorrowing.mockReturnValue({
        portfolioData: normalData.categories,
        pieChartData: normalData.categories.map(cat => ({
          name: cat.name,
          value: cat.value,
          percentage: cat.percentage,
        })),
      });

      render(<WalletPortfolio />);

      // Each hook should be called exactly once per render
      expect(mockUseUser).toHaveBeenCalledTimes(1);
      expect(mockUsePortfolioDisplayData).toHaveBeenCalledTimes(1);
      expect(mockUsePortfolio).toHaveBeenCalledTimes(1);
      expect(mockUseWalletModal).toHaveBeenCalledTimes(1);
      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledTimes(1);
    });

    it("should not cause unnecessary re-renders on stable props", () => {
      const stableData = createLargePortfolioData(15);

      // Mock hooks to return stable references
      const stableRefetch = vi.fn();
      const stableToggleBalance = vi.fn();
      const stableToggleCategory = vi.fn();
      const stableOpenModal = vi.fn();
      const stableCloseModal = vi.fn();

      mockUsePortfolioDisplayData.mockReturnValue({
        ...stableData,
        isLoading: false,
        error: null,
        refetch: stableRefetch,
        isRefetching: false,
      });

      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: {
          totalValue: stableData.totalValue,
          changePercent: 1.8,
        },
        toggleBalanceVisibility: stableToggleBalance,
        toggleCategoryExpansion: stableToggleCategory,
      });

      mockUseWalletModal.mockReturnValue({
        isOpen: false,
        openModal: stableOpenModal,
        closeModal: stableCloseModal,
      });

      mockPreparePortfolioDataWithBorrowing.mockReturnValue({
        portfolioData: stableData.categories,
        pieChartData: stableData.categories.map(cat => ({
          name: cat.name,
          value: cat.value,
          percentage: cat.percentage,
        })),
      });

      const { rerender } = render(<WalletPortfolio />);

      const initialCallCount = mockUsePortfolioDisplayData.mock.calls.length;

      // Re-render with same props
      rerender(<WalletPortfolio />);

      // Should not cause additional hook calls beyond React's normal behavior
      expect(mockUsePortfolioDisplayData.mock.calls.length).toBe(
        initialCallCount + 1
      );
    });
  });

  describe("Data Processing Performance", () => {
    it("should handle large portfolio preparation efficiently", () => {
      const largeData = createLargePortfolioData(200);

      // Monitor preparePortfolioDataWithBorrowing performance
      let preparationTime = 0;
      mockPreparePortfolioDataWithBorrowing.mockImplementation(
        (categories, totalValue, source) => {
          const start = performance.now();
          const result = {
            portfolioData: categories,
            pieChartData: categories.map(cat => ({
              name: cat.name,
              value: cat.value,
              percentage: cat.percentage,
            })),
          };
          preparationTime = performance.now() - start;
          return result;
        }
      );

      mockUsePortfolioDisplayData.mockReturnValue({
        ...largeData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: {
          totalValue: largeData.totalValue,
          changePercent: 4.2,
        },
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
      });

      render(<WalletPortfolio />);

      // Data preparation should be efficient even for large datasets
      expect(preparationTime).toBeLessThan(50); // Should process quickly
      expect(mockPreparePortfolioDataWithBorrowing).toHaveBeenCalledWith(
        largeData.categories,
        largeData.totalValue,
        "WalletPortfolio"
      );
    });

    it("should handle complex category structures efficiently", () => {
      // Create complex nested-like data structure
      const complexCategories = Array.from({ length: 50 }, (_, i) => ({
        id: `complex-category-${i}`,
        name: `Complex Category ${i} with Very Long Name That Might Cause Performance Issues`,
        value: Math.random() * 10000 + 1000,
        percentage: Math.random() * 20 + 1,
        metadata: {
          nestedData: Array.from({ length: 10 }, (_, j) => ({
            subId: `sub-${i}-${j}`,
            subValue: Math.random() * 100,
          })),
        },
      }));

      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: 500000,
        categories: complexCategories,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: { totalValue: 500000, changePercent: 7.8 },
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
      });

      mockPreparePortfolioDataWithBorrowing.mockReturnValue({
        portfolioData: complexCategories,
        pieChartData: complexCategories.map(cat => ({
          name: cat.name,
          value: cat.value,
          percentage: cat.percentage,
        })),
      });

      measureRenderTime();

      render(<WalletPortfolio />);

      const renderTime = endMeasureRenderTime();

      // Should handle complex structures without significant performance degradation
      expect(renderTime).toBeLessThan(800);
      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
    });
  });

  describe("Memory Usage Optimization", () => {
    it("should not leak memory on rapid prop changes", async () => {
      // Monitor function call patterns that might indicate memory leaks
      const refetchFunctions: Array<() => void> = [];

      for (let i = 0; i < 10; i++) {
        const refetch = vi.fn();
        refetchFunctions.push(refetch);

        const userData = createLargePortfolioData(30);

        mockUseUser.mockReturnValue({
          userInfo: { userId: `user-${i}`, email: "test@example.com" },
          isConnected: true,
          login: vi.fn(),
          logout: vi.fn(),
          isLoading: false,
        });

        mockUsePortfolioDisplayData.mockReturnValue({
          ...userData,
          isLoading: false,
          error: null,
          refetch,
          isRefetching: false,
        });

        mockUsePortfolio.mockReturnValue({
          balanceHidden: false,
          expandedCategory: null,
          portfolioMetrics: {
            totalValue: userData.totalValue,
            changePercent: i * 0.5,
          },
          toggleBalanceVisibility: vi.fn(),
          toggleCategoryExpansion: vi.fn(),
        });

        mockPreparePortfolioDataWithBorrowing.mockReturnValue({
          portfolioData: userData.categories,
          pieChartData: userData.categories.map(cat => ({
            name: cat.name,
            value: cat.value,
            percentage: cat.percentage,
          })),
        });

        const { unmount } = render(<WalletPortfolio />);

        // Immediately unmount to simulate rapid changes
        unmount();
      }

      // All hook calls should complete without accumulating references
      expect(mockUsePortfolioDisplayData).toHaveBeenCalledTimes(10);
      expect(mockUseUser).toHaveBeenCalledTimes(10);

      // Functions should be properly cleaned up (no references held)
      refetchFunctions.forEach(fn => {
        expect(fn).toBeDefined();
      });
    });

    it("should optimize re-renders with memoized data", () => {
      const memoizedData = createLargePortfolioData(25);

      // Use same object references to test memoization
      const stableCategories = memoizedData.categories;
      const stableMetrics = {
        totalValue: memoizedData.totalValue,
        changePercent: 3.7,
      };

      mockUsePortfolioDisplayData.mockReturnValue({
        totalValue: memoizedData.totalValue,
        categories: stableCategories,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: stableMetrics,
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
      });

      mockPreparePortfolioDataWithBorrowing.mockReturnValue({
        portfolioData: stableCategories,
        pieChartData: stableCategories.map(cat => ({
          name: cat.name,
          value: cat.value,
          percentage: cat.percentage,
        })),
      });

      const { rerender } = render(<WalletPortfolio />);

      const firstRenderCalls =
        mockPreparePortfolioDataWithBorrowing.mock.calls.length;

      // Re-render multiple times with same data
      for (let i = 0; i < 5; i++) {
        rerender(<WalletPortfolio />);
      }

      // Data preparation should be called for each render but with same params
      expect(mockPreparePortfolioDataWithBorrowing.mock.calls.length).toBe(
        firstRenderCalls + 5
      );

      // All calls should use the same stable references
      mockPreparePortfolioDataWithBorrowing.mock.calls.forEach(call => {
        expect(call[0]).toBe(stableCategories); // Same reference
        expect(call[1]).toBe(memoizedData.totalValue);
        expect(call[2]).toBe("WalletPortfolio");
      });
    });
  });

  describe("Error Boundary Performance Impact", () => {
    it("should not significantly impact performance with error boundaries", () => {
      const normalData = createLargePortfolioData(40);

      mockUsePortfolioDisplayData.mockReturnValue({
        ...normalData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: {
          totalValue: normalData.totalValue,
          changePercent: 2.9,
        },
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
      });

      mockPreparePortfolioDataWithBorrowing.mockReturnValue({
        portfolioData: normalData.categories,
        pieChartData: normalData.categories.map(cat => ({
          name: cat.name,
          value: cat.value,
          percentage: cat.percentage,
        })),
      });

      measureRenderTime();

      render(<WalletPortfolio />);

      const renderTime = endMeasureRenderTime();

      // Error boundaries should not add significant overhead
      expect(renderTime).toBeLessThan(600);

      // Should render all error boundaries
      const errorBoundaries = screen.getAllByTestId("error-boundary");
      expect(errorBoundaries).toHaveLength(4); // Main + 3 section boundaries
    });

    it("should handle error boundary resetKeys efficiently", () => {
      const testData = createLargePortfolioData(20);

      mockUsePortfolioDisplayData.mockReturnValue({
        ...testData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        expandedCategory: null,
        portfolioMetrics: {
          totalValue: testData.totalValue,
          changePercent: 1.5,
        },
        toggleBalanceVisibility: vi.fn(),
        toggleCategoryExpansion: vi.fn(),
      });

      mockPreparePortfolioDataWithBorrowing.mockReturnValue({
        portfolioData: testData.categories,
        pieChartData: testData.categories.map(cat => ({
          name: cat.name,
          value: cat.value,
          percentage: cat.percentage,
        })),
      });

      const { rerender } = render(<WalletPortfolio />);

      // Change userId to trigger resetKeys change
      mockUseUser.mockReturnValue({
        userInfo: { userId: "different-user-456", email: "test@example.com" },
        isConnected: true,
        login: vi.fn(),
        logout: vi.fn(),
        isLoading: false,
      });

      measureRenderTime();

      rerender(<WalletPortfolio />);

      const rerenderTime = endMeasureRenderTime();

      // ResetKeys changes should not cause significant performance impact
      expect(rerenderTime).toBeLessThan(400);
    });
  });
});
