import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WalletPortfolio } from "../../src/components/WalletPortfolio";
import { useUser } from "../../src/contexts/UserContext";
import { useLandingPageData } from "../../src/hooks/queries/usePortfolioQuery";
import { usePortfolio } from "../../src/hooks/usePortfolio";
import {
  usePortfolioState,
  usePortfolioStateHelpers,
} from "../../src/hooks/usePortfolioState";
import { useWalletModal } from "../../src/hooks/useWalletModal";
import { createCategoriesFromApiData } from "../../src/utils/portfolio.utils";
import { render } from "../test-utils";

// Mock only the external dependencies, not the child components
vi.mock("../../src/contexts/UserContext");
vi.mock("../../src/hooks/usePortfolio");
vi.mock("../../src/hooks/queries/usePortfolioQuery");
vi.mock("../../src/hooks/useWalletModal");
vi.mock("../../src/hooks/usePortfolioState");
vi.mock("../../src/utils/portfolio.utils");
vi.mock("../../src/components/PortfolioOverview");

// Mock logger to avoid console spam during tests
vi.mock("../../src/utils/logger", () => ({
  logger: {
    createContextLogger: vi.fn(() => ({
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    })),
  },
}));

// Mock dynamic imports
vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: vi.fn(factory => {
    // Handle the promise returned by factory
    const importPromise = factory();
    if (importPromise && typeof importPromise.then === "function") {
      // Return a mock component that will be resolved
      return vi.fn(({ isOpen, onClose }) =>
        isOpen ? (
          <div data-testid="wallet-manager-modal">
            <h2>Bundle Wallets</h2>
            <button data-testid="close-wallet-manager" onClick={onClose}>
              Close
            </button>
          </div>
        ) : null
      );
    }
    // Fallback mock component for WalletManager
    return vi.fn(({ isOpen, onClose }) =>
      isOpen ? (
        <div data-testid="wallet-manager-modal">
          <h2>Bundle Wallets</h2>
          <button data-testid="close-wallet-manager" onClick={onClose}>
            Close
          </button>
        </div>
      ) : null
    );
  }),
}));

// Mock WalletManager specifically since it's dynamically imported
vi.mock("../../src/components/WalletManager", () => ({
  WalletManager: vi.fn(({ isOpen, onClose }) =>
    isOpen ? (
      <div data-testid="wallet-manager-modal">
        <div data-testid="wallet-manager-content">
          <h2>Bundle Wallets</h2>
          <div data-testid="wallet-list">
            <div data-testid="wallet-item">Main Wallet: 0x123...456</div>
            <div data-testid="wallet-item">Secondary Wallet: 0x789...abc</div>
          </div>
          <button data-testid="add-wallet-btn">Add Wallet</button>
          <button data-testid="close-wallet-manager" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    ) : null
  ),
}));

// Mock PortfolioOverview to include retry functionality
vi.mock("../../src/components/PortfolioOverview", () => ({
  PortfolioOverview: vi.fn(
    ({
      portfolioState,
      pieChartData,
      categorySummaries,
      onCategoryClick,
      onRetry,
      isRetrying,
    }) => {
      const isLoading = portfolioState?.isLoading;
      const hasError = portfolioState?.hasError;
      const errorMessage = portfolioState?.errorMessage;

      return (
        <div data-testid="portfolio-overview">
          {isLoading && <div data-testid="portfolio-loading">Loading...</div>}
          {hasError && (
            <div data-testid="portfolio-error">
              <div>Error: {errorMessage}</div>
              <button onClick={onRetry} disabled={isRetrying}>
                Retry
              </button>
            </div>
          )}
          {!isLoading && !hasError && (
            <div data-testid="portfolio-content">
              <div data-testid="asset-distribution">Asset Distribution</div>
              {pieChartData && <div data-testid="pie-chart">Pie Chart</div>}
              {categorySummaries?.map(cat => (
                <div
                  key={cat.id}
                  data-testid={`category-${cat.id}`}
                  onClick={() => onCategoryClick?.(cat.id)}
                >
                  {cat.name}: ${cat.value}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
  ),
}));

// Mock Lucide React icons
vi.mock("lucide-react", () => ({
  AlertCircle: vi.fn(() => <span data-testid="alert-circle-icon" />),
  ArrowDownLeft: vi.fn(() => <span data-testid="arrow-down-left-icon" />),
  ArrowRight: vi.fn(() => <span data-testid="arrow-right-icon" />),
  ArrowUpRight: vi.fn(() => <span data-testid="arrow-up-right-icon" />),
  BarChart3: vi.fn(() => <span data-testid="bar-chart-icon" />),
  DollarSign: vi.fn(() => <span data-testid="dollar-sign-icon" />),
  Eye: vi.fn(() => <span data-testid="eye-icon" />),
  EyeOff: vi.fn(() => <span data-testid="eye-off-icon" />),
  Loader: vi.fn(() => <span data-testid="loader-icon" />),
  Settings: vi.fn(() => <span data-testid="settings-icon" />),
  TrendingDown: vi.fn(() => <span data-testid="trending-down-icon" />),
  TrendingUp: vi.fn(() => <span data-testid="trending-up-icon" />),
  Wallet: vi.fn(() => <span data-testid="wallet-icon" />),
  RefreshCw: vi.fn(() => <span data-testid="refresh-icon" />),
}));

// Mock framer-motion
vi.mock("framer-motion", () => {
  // Helper to filter out framer-motion specific props
  const filterMotionProps = (props: Record<string, any>) => {
    const {
      initial,
      animate,
      exit,
      transition,
      variants,
      whileHover,
      whileTap,
      whileInView,
      whileFocus,
      whileDrag,
      drag,
      dragControls,
      dragConstraints,
      dragElastic,
      dragMomentum,
      layoutId,
      layout,
      ...domProps
    } = props;
    return domProps;
  };

  return {
    motion: {
      div: vi.fn(({ children, ...props }) => (
        <div {...filterMotionProps(props)}>{children}</div>
      )),
      button: vi.fn(({ children, ...props }) => (
        <button {...filterMotionProps(props)}>{children}</button>
      )),
      circle: vi.fn(({ children, ...props }) => (
        <circle {...filterMotionProps(props)}>{children}</circle>
      )),
    },
    AnimatePresence: vi.fn(({ children }) => children),
  };
});

const mockUseUser = vi.mocked(useUser);
const mockUsePortfolio = vi.mocked(usePortfolio);
const mockUseLandingPageData = vi.mocked(useLandingPageData);
const mockUseWalletModal = vi.mocked(useWalletModal);
const mockCreateCategoriesFromApiData = vi.mocked(createCategoriesFromApiData);
const mockUsePortfolioState = vi.mocked(usePortfolioState);
const mockUsePortfolioStateHelpers = vi.mocked(usePortfolioStateHelpers);

describe("WalletPortfolio - Integration Tests", () => {
  const defaultUserInfo = {
    userId: "test-user-123",
    address: "0x742d35Cc6676C3D6c2b8e73C857c42e7A53d0C54",
    email: "test@example.com",
  };

  const defaultLandingPageData = {
    user_id: "test-user-123",
    total_net_usd: 45000,
    total_assets_usd: 45000,
    total_debt_usd: 0,
    weighted_apr: 15.2,
    estimated_monthly_income: 570,
    portfolio_allocation: {
      btc: { total_value: 20000, percentage_of_portfolio: 44.4 },
      eth: { total_value: 15000, percentage_of_portfolio: 33.3 },
      stablecoins: { total_value: 8000, percentage_of_portfolio: 17.8 },
      others: { total_value: 2000, percentage_of_portfolio: 4.4 },
    },
    category_summary_debt: {
      btc: 0,
      eth: 0,
      stablecoins: 0,
      others: 0,
    },
  };

  const mockCategorySummaries = [
    { id: "btc", name: "Bitcoin", value: 20000, percentage: 44.4 },
    { id: "eth", name: "Ethereum", value: 15000, percentage: 33.3 },
    { id: "stablecoins", name: "Stablecoins", value: 8000, percentage: 17.8 },
    { id: "others", name: "Others", value: 2000, percentage: 4.4 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock returns
    mockUseUser.mockReturnValue({
      userInfo: defaultUserInfo,
      isConnected: true,
    });

    mockUsePortfolio.mockReturnValue({
      balanceHidden: false,
      toggleBalanceVisibility: vi.fn(),
      positions: [],
      isLoading: false,
      error: null,
    });

    mockUseLandingPageData.mockReturnValue({
      data: defaultLandingPageData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    });

    mockUseWalletModal.mockReturnValue({
      isOpen: false,
      openModal: vi.fn(),
      closeModal: vi.fn(),
    });

    mockCreateCategoriesFromApiData.mockReturnValue(mockCategorySummaries);

    // Setup portfolio state mock
    mockUsePortfolioState.mockReturnValue({
      type: "has_data",
      isConnected: true,
      isLoading: false,
      hasError: false,
      hasZeroData: false,
      totalValue: 45000,
      errorMessage: null,
      isRetrying: false,
    });

    mockUsePortfolioStateHelpers.mockReturnValue({
      shouldShowLoading: false,
      shouldShowConnectPrompt: false,
      shouldShowNoDataMessage: false,
      shouldShowPortfolioContent: true,
      shouldShowError: false,
      getDisplayTotalValue: () => 45000,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Complete Component Integration", () => {
    it("should render all child components correctly", async () => {
      render(<WalletPortfolio />);

      // Should render main structure without errors
      await waitFor(() => {
        expect(screen.getByText("My Wallet")).toBeInTheDocument();
      });

      // Should render wallet header section
      expect(screen.getByText("My Wallet")).toBeInTheDocument();
      expect(screen.getByText("DeFi Portfolio Overview")).toBeInTheDocument();

      // Should render wallet metrics
      expect(screen.getAllByText(/\$45,?000/)).toHaveLength(1); // Total Balance displayed once

      // Should render wallet actions
      expect(screen.getByText("Zap In")).toBeInTheDocument();
      expect(screen.getByText("Zap Out")).toBeInTheDocument();
      expect(screen.getByText("Optimize")).toBeInTheDocument();

      // Should render portfolio overview
      expect(screen.getAllByText("Asset Distribution")).toHaveLength(1); // Portfolio overview section
    });

    it("should handle complex user interaction flows", async () => {
      const user = userEvent.setup();
      const onCategoryClick = vi.fn();
      const onAnalyticsClick = vi.fn();
      const onOptimizeClick = vi.fn();

      render(
        <WalletPortfolio
          onCategoryClick={onCategoryClick}
          onAnalyticsClick={onAnalyticsClick}
          onOptimizeClick={onOptimizeClick}
        />
      );

      // Test analytics flow - click analytics button by title
      const analyticsButton = screen.getByTitle("View Analytics");
      await user.click(analyticsButton);
      expect(onAnalyticsClick).toHaveBeenCalled();

      // Test optimization flow
      await user.click(screen.getByText("Optimize"));
      expect(onOptimizeClick).toHaveBeenCalled();

      // Test category interaction if available
      const categoryElements = screen.queryAllByTestId(/^category-/);
      if (categoryElements.length > 0) {
        await user.click(categoryElements[0]);
        expect(onCategoryClick).toHaveBeenCalled();
      }
    });

    it("should manage wallet modal state correctly", async () => {
      const user = userEvent.setup();
      const openModal = vi.fn();
      const closeModal = vi.fn();

      mockUseWalletModal.mockReturnValue({
        isOpen: false,
        openModal,
        closeModal,
      });

      const { rerender } = render(<WalletPortfolio />);

      // Click to open wallet manager
      const walletManagerButton = screen.getByTitle("Manage Wallets");
      await user.click(walletManagerButton);
      expect(openModal).toHaveBeenCalled();

      // Simulate modal opening
      mockUseWalletModal.mockReturnValue({
        isOpen: true,
        openModal,
        closeModal,
      });

      rerender(<WalletPortfolio />);

      // Modal should be visible
      await waitFor(() => {
        expect(screen.getByTestId("wallet-manager-modal")).toBeInTheDocument();
      });
      expect(screen.getByText("Bundle Wallets")).toBeInTheDocument();

      // Close modal
      await user.click(screen.getByTestId("close-wallet-manager"));
      expect(closeModal).toHaveBeenCalled();
    });
  });

  describe("Data Flow Integration", () => {
    it("should handle loading states across all components", async () => {
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      // Update portfolio state mock for loading scenario
      mockUsePortfolioState.mockReturnValue({
        type: "loading",
        isConnected: true,
        isLoading: true,
        hasError: false,
        hasZeroData: false,
        totalValue: null,
        errorMessage: null,
        isRetrying: false,
      });

      mockUsePortfolioStateHelpers.mockReturnValue({
        shouldShowLoading: true,
        shouldShowConnectPrompt: false,
        shouldShowNoDataMessage: false,
        shouldShowPortfolioContent: false,
        shouldShowError: false,
        getDisplayTotalValue: () => null,
      });

      render(<WalletPortfolio />);

      // Should show loading spinners in metrics
      await waitFor(() => {
        expect(
          screen.getAllByTestId("loading-skeleton").length
        ).toBeGreaterThan(0);
      });

      // Should show skeleton loading states
      expect(screen.getByTestId("balance-loading")).toBeInTheDocument();
    });

    it("should handle error states and recovery", async () => {
      const refetch = vi.fn();
      const user = userEvent.setup();

      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: "API connection failed" },
        refetch,
        isRefetching: false,
      });

      // Update portfolio state mock for error scenario
      mockUsePortfolioState.mockReturnValue({
        type: "error",
        isConnected: true,
        isLoading: false,
        hasError: true,
        hasZeroData: false,
        totalValue: null,
        errorMessage: "API connection failed",
        isRetrying: false,
      });

      mockUsePortfolioStateHelpers.mockReturnValue({
        shouldShowLoading: false,
        shouldShowConnectPrompt: false,
        shouldShowNoDataMessage: false,
        shouldShowPortfolioContent: false,
        shouldShowError: true,
        getDisplayTotalValue: () => null,
      });

      render(<WalletPortfolio />);

      // Should show error states
      await waitFor(() => {
        expect(
          screen.getAllByText("API connection failed")[0]
        ).toBeInTheDocument();
      });

      // Test retry functionality
      const retryButton = screen.getByText("Retry");
      await user.click(retryButton);
      expect(refetch).toHaveBeenCalled();
    });

    it("should transform and display data correctly", async () => {
      render(<WalletPortfolio />);

      await waitFor(() => {
        // Should display formatted total value
        expect(screen.getAllByText(/\$45,?000/)[0]).toBeInTheDocument();

        // Should show APR
        expect(screen.getByText(/1520\.00%/)).toBeInTheDocument();

        // Should show monthly income
        expect(screen.getByText(/\$570/)).toBeInTheDocument();
      });

      // Verify data transformation was called
      expect(mockCreateCategoriesFromApiData).toHaveBeenCalledWith(
        {
          btc: 20000,
          eth: 15000,
          stablecoins: 8000,
          others: 2000,
        },
        45000
      );
    });
  });

  describe("Balance Privacy Integration", () => {
    it("should hide/show balances across all components", async () => {
      const user = userEvent.setup();
      const toggleBalanceVisibility = vi.fn();

      mockUsePortfolio.mockReturnValue({
        balanceHidden: false,
        toggleBalanceVisibility,
        positions: [],
        isLoading: false,
        error: null,
      });

      const { rerender } = render(<WalletPortfolio />);

      // Should show actual values
      expect(screen.getAllByText(/\$45,?000/)[0]).toBeInTheDocument();

      // Click to hide balance
      const eyeButton = screen.getByTestId("eye-icon").closest("button");
      if (eyeButton) {
        await user.click(eyeButton);
        expect(toggleBalanceVisibility).toHaveBeenCalled();
      }

      // Simulate balance hidden
      mockUsePortfolio.mockReturnValue({
        balanceHidden: true,
        toggleBalanceVisibility,
        positions: [],
        isLoading: false,
        error: null,
      });

      rerender(<WalletPortfolio />);

      // Should show hidden values
      await waitFor(() => {
        expect(screen.getByText("••••••••")).toBeInTheDocument();
      });

      // Should show eye-off icon
      expect(screen.getByTestId("eye-off-icon")).toBeInTheDocument();
    });
  });

  describe("Responsive Behavior Integration", () => {
    it("should handle component resize and reflow", () => {
      // Mock window resize
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 768, // Tablet width
      });

      render(<WalletPortfolio />);

      // Components should render without layout issues
      expect(screen.getByText("Asset Distribution")).toBeInTheDocument();
      expect(screen.getByText("Asset Distribution")).toBeInTheDocument();

      // Change to mobile width
      Object.defineProperty(window, "innerWidth", {
        value: 375,
      });

      // Trigger resize event
      act(() => {
        window.dispatchEvent(new Event("resize"));
      });

      // Should still render correctly
      expect(screen.getByText("Asset Distribution")).toBeInTheDocument();
    });
  });

  describe("Performance Integration", () => {
    it("should handle rapid data updates without performance issues", async () => {
      const { rerender } = render(<WalletPortfolio />);

      // Simulate rapid data updates
      for (let i = 0; i < 10; i++) {
        const updatedData = {
          ...defaultLandingPageData,
          total_net_usd: 45000 + i * 1000,
        };

        mockUseLandingPageData.mockReturnValue({
          data: updatedData,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isRefetching: false,
        });

        rerender(<WalletPortfolio />);
      }

      // Should handle updates gracefully
      await waitFor(() => {
        expect(screen.getByText(/\$54,?000/)).toBeInTheDocument();
      });
    });

    it("should memoize expensive calculations", () => {
      const { rerender } = render(<WalletPortfolio />);

      // Clear calls from initial render
      mockCreateCategoriesFromApiData.mockClear();

      // Rerender with same data
      rerender(<WalletPortfolio />);

      // Should not call expensive transformation again
      expect(mockCreateCategoriesFromApiData).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility Integration", () => {
    it("should maintain proper ARIA attributes and labels", () => {
      render(<WalletPortfolio />);

      // Check for semantic structure
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);

      // Verify buttons have accessible text
      buttons.forEach(button => {
        expect(
          button.textContent ||
            button.getAttribute("aria-label") ||
            button.getAttribute("title")
        ).toBeTruthy();
      });
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<WalletPortfolio />);

      // Test Tab navigation through interactive elements
      const interactiveElements = screen.getAllByRole("button");

      if (interactiveElements.length > 0) {
        await user.tab();
        expect(document.activeElement).toBe(interactiveElements[0]);
      }
    });
  });

  describe("Error Boundary Integration", () => {
    it("should catch and handle component errors gracefully", async () => {
      // Simulate a component error
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Force an error in a child component by providing invalid data
      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: "Critical error" },
        refetch: vi.fn(),
        isRefetching: false,
      });

      render(<WalletPortfolio />);

      // Should handle error state gracefully
      expect(screen.getAllByText("Critical error")[0]).toBeInTheDocument();

      consoleError.mockRestore();
    });
  });

  describe("Real-world Scenarios", () => {
    it("should handle user switching between multiple wallets", async () => {
      // Start with first wallet
      const { rerender } = render(<WalletPortfolio />);

      expect(screen.getByText("My Wallet")).toBeInTheDocument();

      // Switch to different wallet
      const newUserInfo = {
        userId: "user-456",
        address: "0x987fEdCbA9876543210",
        email: "user2@example.com",
      };

      mockUseUser.mockReturnValue({
        userInfo: newUserInfo,
        isConnected: true,
      });

      const newData = {
        ...defaultLandingPageData,
        user_id: "user-456",
        total_net_usd: 25000,
      };

      mockUseLandingPageData.mockReturnValue({
        data: newData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      rerender(<WalletPortfolio />);

      // Should show updated wallet data
      await waitFor(() => {
        expect(screen.getByText(/\$25,?000/)).toBeInTheDocument();
      });
    });

    it("should handle network switching scenarios", async () => {
      render(<WalletPortfolio />);

      // Initial state - connected with data
      expect(screen.getAllByText(/\$45,?000/)[0]).toBeInTheDocument();

      // Simulate network switch causing temporary disconnection
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
      });

      mockUseLandingPageData.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      const { rerender } = render(<WalletPortfolio />);

      // Should show loading/disconnected state
      await waitFor(() => {
        expect(
          screen.getAllByTestId("loading-skeleton").length
        ).toBeGreaterThan(0);
      });

      // Reconnect with updated data
      mockUseUser.mockReturnValue({
        userInfo: defaultUserInfo,
        isConnected: true,
      });

      mockUseLandingPageData.mockReturnValue({
        data: defaultLandingPageData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      });

      rerender(<WalletPortfolio />);

      // Should restore data display
      await waitFor(() => {
        expect(screen.getAllByText(/\$45,?000/)[0]).toBeInTheDocument();
      });
    });
  });
});
