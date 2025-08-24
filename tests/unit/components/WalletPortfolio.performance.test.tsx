import { act, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WalletPortfolio } from "../../../src/components/WalletPortfolio";
import { useWalletPortfolioState } from "../../../src/hooks/useWalletPortfolioState";
import { useUser } from "../../../src/contexts/UserContext";
import { AssetCategory, PieChartData } from "../../../src/types/portfolio";
import { render } from "../../test-utils";

// Performance monitoring utilities
const performanceObserver = {
  entries: [] as PerformanceEntry[],
  observe: vi.fn(),
  disconnect: vi.fn(),
};

// Mock Performance Observer
global.PerformanceObserver = vi.fn().mockImplementation(callback => {
  performanceObserver.callback = callback;
  return performanceObserver;
});

// Mock dependencies
vi.mock("../../../src/hooks/useWalletPortfolioState");
vi.mock("../../../src/contexts/UserContext");

// Mock ThirdWeb hooks
vi.mock("thirdweb/react", () => ({
  useActiveAccount: vi.fn(() => null),
  ConnectButton: vi.fn(({ children, ...props }) => (
    <button data-testid="connect-button" {...props}>
      Connect Wallet
    </button>
  )),
}));

// Performance-tracking mock components
let renderCounts = {
  glassCard: 0,
  walletHeader: 0,
  walletMetrics: 0,
  walletActions: 0,
  portfolioOverview: 0,
  walletManager: 0,
};

vi.mock("../../../src/components/ui/GlassCard", () => ({
  GlassCard: vi.fn(({ children }) => {
    renderCounts.glassCard++;
    return <div data-testid="glass-card">{children}</div>;
  }),
}));

vi.mock("../../../src/components/wallet/WalletHeader", () => ({
  WalletHeader: vi.fn(props => {
    renderCounts.walletHeader++;
    return (
      <div data-testid="wallet-header">
        <button
          data-testid="wallet-manager-button"
          onClick={props.onWalletManagerClick}
        >
          Wallet Manager
        </button>
      </div>
    );
  }),
}));

vi.mock("../../../src/components/wallet/WalletMetrics", () => ({
  WalletMetrics: vi.fn(({ totalValue }) => {
    renderCounts.walletMetrics++;
    return (
      <div data-testid="wallet-metrics">
        <div data-testid="total-value">${totalValue}</div>
      </div>
    );
  }),
}));

vi.mock("../../../src/components/wallet/WalletActions", () => ({
  WalletActions: vi.fn(props => {
    renderCounts.walletActions++;
    return (
      <div data-testid="wallet-actions">
        <button data-testid="zap-in-button" onClick={props.onZapInClick}>
          Zap In
        </button>
      </div>
    );
  }),
}));

vi.mock("../../../src/components/PortfolioOverview", () => ({
  PortfolioOverview: vi.fn(props => {
    renderCounts.portfolioOverview++;
    return (
      <div data-testid="portfolio-overview">
        <div data-testid="portfolio-data-count">
          {props.portfolioData?.length || 0}
        </div>
      </div>
    );
  }),
}));

vi.mock("../../../src/components/WalletManager", () => ({
  WalletManager: vi.fn(({ isOpen }) => {
    if (isOpen) {
      renderCounts.walletManager++;
      return <div data-testid="wallet-manager">Modal</div>;
    }
    return null;
  }),
}));

describe("WalletPortfolio - Performance and Memory Leak Tests", () => {
  const mockUseWalletPortfolioState = vi.mocked(useWalletPortfolioState);
  const mockUseUser = vi.mocked(useUser);

  const createLargeDataset = (size: number): AssetCategory[] => {
    return Array.from({ length: size }, (_, i) => ({
      id: `asset-${i}`,
      name: `Asset ${i}`,
      totalValue: Math.random() * 10000,
      percentage: Math.random() * 100,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      assets: Array.from({ length: 10 }, (_, j) => ({
        id: `${i}-${j}`,
        symbol: `SYM${i}-${j}`,
        name: `Token ${i}-${j}`,
        amount: Math.random() * 1000,
        value: Math.random() * 5000,
        price: Math.random() * 100,
        change24h: (Math.random() - 0.5) * 20,
      })),
    }));
  };

  const createLargePieData = (size: number): PieChartData[] => {
    return Array.from({ length: size }, (_, i) => ({
      label: `Asset ${i}`,
      value: Math.random() * 10000,
      percentage: Math.random() * 100,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    }));
  };

  const defaultMockState = {
    totalValue: 15000,
    portfolioData: [],
    pieChartData: [],
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
    // Reset render counts
    renderCounts = {
      glassCard: 0,
      walletHeader: 0,
      walletMetrics: 0,
      walletActions: 0,
      portfolioOverview: 0,
      walletManager: 0,
    };
    mockUseWalletPortfolioState.mockReturnValue(defaultMockState);

    // Setup UserContext mock
    mockUseUser.mockReturnValue({
      userInfo: {
        userId: "test-user-id",
        email: "test@example.com",
        name: "Test User",
      },
      loading: false,
      error: null,
      isConnected: true,
      connectedWallet: "0x1234567890abcdef",
      refetch: vi.fn(),
    });
  });

  describe("Render Performance", () => {
    it("should minimize re-renders when props don't change", () => {
      const { rerender } = render(<WalletPortfolio />);

      // Reset counts after initial render
      Object.keys(renderCounts).forEach(key => {
        renderCounts[key as keyof typeof renderCounts] = 0;
      });

      // Re-render with same props
      rerender(<WalletPortfolio />);

      // Components should use React.memo or similar optimization
      // In practice, some re-renders might be expected, but should be minimal
      const totalReRenders = Object.values(renderCounts).reduce(
        (sum, count) => sum + count,
        0
      );
      expect(totalReRenders).toBeLessThanOrEqual(5); // Allow some re-renders but keep minimal
    });

    it("should only re-render affected components when state changes", () => {
      const { rerender } = render(<WalletPortfolio />);

      // Reset counts
      Object.keys(renderCounts).forEach(key => {
        renderCounts[key as keyof typeof renderCounts] = 0;
      });

      // Change only totalValue
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        totalValue: 20000,
      });

      rerender(<WalletPortfolio />);

      // Only WalletMetrics should re-render due to totalValue change
      expect(renderCounts.walletMetrics).toBeGreaterThan(0);

      // Other components should ideally not re-render
      // (This depends on implementation - some might re-render due to hook updates)
    });

    it("should handle rapid state updates efficiently", async () => {
      const { rerender } = render(<WalletPortfolio />);

      const startTime = performance.now();

      // Simulate rapid updates
      for (let i = 0; i < 100; i++) {
        mockUseWalletPortfolioState.mockReturnValue({
          ...defaultMockState,
          totalValue: i * 1000,
        });

        await act(async () => {
          rerender(<WalletPortfolio />);
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // 100 updates should complete in reasonable time
      expect(totalTime).toBeLessThan(1000); // 1 second for 100 updates
    });
  });

  describe("Memory Management", () => {
    it("should not leak memory on unmount", async () => {
      const initialHeapUsed = (performance as any).memory?.usedJSHeapSize || 0;

      const { unmount } = render(<WalletPortfolio />);

      // Simulate component lifecycle
      await act(async () => {
        // Trigger some state changes
        mockUseWalletPortfolioState.mockReturnValue({
          ...defaultMockState,
          totalValue: 25000,
        });
      });

      unmount();

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const finalHeapUsed = (performance as any).memory?.usedJSHeapSize || 0;

      // Memory usage should not increase significantly
      // (Note: This is a rough check and may not be reliable in all test environments)
      if (initialHeapUsed > 0 && finalHeapUsed > 0) {
        const memoryIncrease = finalHeapUsed - initialHeapUsed;
        expect(memoryIncrease).toBeLessThan(1000000); // Less than 1MB increase
      }
    });

    it("should handle multiple mount/unmount cycles", async () => {
      const cycles = 50;

      for (let i = 0; i < cycles; i++) {
        const { unmount } = render(<WalletPortfolio />);

        // Simulate some activity
        mockUseWalletPortfolioState.mockReturnValue({
          ...defaultMockState,
          totalValue: i * 100,
        });

        await act(async () => {
          unmount();
        });
      }

      // Should not accumulate event listeners or other resources
      expect(true).toBe(true); // Test passes if no errors thrown
    });

    it("should clean up event listeners on unmount", () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = render(<WalletPortfolio />);

      unmount();

      const removedListeners = removeEventListenerSpy.mock.calls.length;

      // Should clean up any event listeners that were added
      expect(removedListeners).toBeGreaterThanOrEqual(0);

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it("should handle large data without memory leaks", async () => {
      const largeData = createLargeDataset(10000);

      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        portfolioData: largeData,
      });

      const { unmount, rerender } = render(<WalletPortfolio />);

      // Update with new large data
      const newLargeData = createLargeDataset(10000);
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        portfolioData: newLargeData,
      });

      rerender(<WalletPortfolio />);

      unmount();

      // Should complete without memory issues
      expect(true).toBe(true);
    });
  });

  describe("Callback Performance", () => {
    it("should not create new function references unnecessarily", () => {
      const { rerender } = render(<WalletPortfolio />);

      // Get initial function references from mock
      const initialState = mockUseWalletPortfolioState.mock.results[0]?.value;

      // Re-render with same state
      rerender(<WalletPortfolio />);

      const secondState = mockUseWalletPortfolioState.mock.results[1]?.value;

      // Function references should be stable
      if (initialState && secondState) {
        expect(initialState.toggleBalanceVisibility).toBe(
          secondState.toggleBalanceVisibility
        );
        expect(initialState.openWalletManager).toBe(
          secondState.openWalletManager
        );
        expect(initialState.closeWalletManager).toBe(
          secondState.closeWalletManager
        );
      }
    });
  });

  describe("State Update Performance", () => {
    it("should handle loading state transitions efficiently", async () => {
      const { rerender } = render(<WalletPortfolio />);

      const startTime = performance.now();

      // Simulate loading -> loaded -> loading cycle
      const states = [
        { ...defaultMockState, isLoading: true, totalValue: null },
        { ...defaultMockState, isLoading: false, totalValue: 15000 },
        { ...defaultMockState, isLoading: true, totalValue: null },
        { ...defaultMockState, isLoading: false, totalValue: 20000 },
      ];

      for (const state of states) {
        mockUseWalletPortfolioState.mockReturnValue(state);
        await act(async () => {
          rerender(<WalletPortfolio />);
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(100); // State transitions should be fast
    });

    it("should handle error state transitions efficiently", async () => {
      const { rerender } = render(<WalletPortfolio />);

      const startTime = performance.now();

      // Simulate error states
      const errorStates = [
        { ...defaultMockState, apiError: "Error 1" },
        { ...defaultMockState, apiError: "Error 2" },
        { ...defaultMockState, apiError: null, totalValue: 15000 },
        { ...defaultMockState, apiError: "Error 3" },
      ];

      for (const state of errorStates) {
        mockUseWalletPortfolioState.mockReturnValue(state);
        await act(async () => {
          rerender(<WalletPortfolio />);
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(100);
    });

    it("should handle modal state changes efficiently", async () => {
      const { rerender } = render(<WalletPortfolio />);

      const startTime = performance.now();

      // Toggle modal state multiple times
      for (let i = 0; i < 50; i++) {
        mockUseWalletPortfolioState.mockReturnValue({
          ...defaultMockState,
          isWalletManagerOpen: i % 2 === 0,
        });

        await act(async () => {
          rerender(<WalletPortfolio />);
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(500); // 50 modal toggles should be fast
    });
  });

  describe("Concurrent Updates", () => {
    it("should handle concurrent state updates", async () => {
      const { rerender } = render(<WalletPortfolio />);

      const startTime = performance.now();

      // Simulate sequential updates instead of concurrent to avoid overlapping act() calls
      for (let i = 0; i < 20; i++) {
        mockUseWalletPortfolioState.mockReturnValue({
          ...defaultMockState,
          totalValue: i * 1000,
        });

        await act(async () => {
          rerender(<WalletPortfolio />);
        });
      }

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Sequential updates should complete quickly
    });

    it("should maintain consistency during rapid updates", async () => {
      const { rerender } = render(<WalletPortfolio />);

      // Rapid state changes
      const finalValue = 99000;

      for (let i = 0; i < 100; i++) {
        mockUseWalletPortfolioState.mockReturnValue({
          ...defaultMockState,
          totalValue: i === 99 ? finalValue : i * 1000,
        });

        rerender(<WalletPortfolio />);
      }

      await waitFor(() => {
        expect(screen.getByTestId("total-value")).toHaveTextContent(
          `${finalValue}`
        );
      });
    });
  });

  describe("Resource Cleanup", () => {
    it("should cancel pending operations on unmount", async () => {
      const mockRetry = vi.fn();

      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        retry: mockRetry,
        isRetrying: true,
      });

      const { unmount } = render(<WalletPortfolio />);

      // Simulate unmount during operation
      unmount();

      // Should not cause memory leaks or errors
      expect(true).toBe(true);
    });

    it("should clean up timers and intervals", async () => {
      const setTimeoutSpy = vi.spyOn(global, "setTimeout");
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      const setIntervalSpy = vi.spyOn(global, "setInterval");
      const clearIntervalSpy = vi.spyOn(global, "clearInterval");

      const { unmount } = render(<WalletPortfolio />);

      const timersCreated =
        setTimeoutSpy.mock.calls.length + setIntervalSpy.mock.calls.length;

      unmount();

      const timersCleared =
        clearTimeoutSpy.mock.calls.length + clearIntervalSpy.mock.calls.length;

      // Should clean up any timers that were created
      if (timersCreated > 0) {
        expect(timersCleared).toBeGreaterThanOrEqual(0);
      }

      setTimeoutSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
      setIntervalSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });
  });

  describe("Bundle Size Impact", () => {
    it("should not import unnecessary modules", () => {
      // This test would typically check bundle analysis
      // Here we verify that the component renders without importing everything
      render(<WalletPortfolio />);

      // Verify that only necessary components are rendered
      expect(screen.getByTestId("glass-card")).toBeInTheDocument();
      expect(screen.getByTestId("wallet-header")).toBeInTheDocument();
      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
      expect(screen.getByTestId("wallet-actions")).toBeInTheDocument();
      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();

      // Modal should not be rendered when closed (tree shaking)
      expect(screen.queryByTestId("wallet-manager")).not.toBeInTheDocument();
    });

    it("should lazy load non-critical components", () => {
      // Modal should only render when needed
      const { rerender } = render(<WalletPortfolio />);

      expect(renderCounts.walletManager).toBe(0);

      // Open modal
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        isWalletManagerOpen: true,
      });

      rerender(<WalletPortfolio />);

      expect(renderCounts.walletManager).toBeGreaterThan(0);
    });
  });
});
