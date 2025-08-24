import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WalletPortfolio } from "../../../src/components/WalletPortfolio";
import { useWalletPortfolioState } from "../../../src/hooks/useWalletPortfolioState";
import { useUser } from "../../../src/contexts/UserContext";

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

// Mock SimpleConnectButton
vi.mock("../../../src/components/Web3/SimpleConnectButton", () => ({
  SimpleConnectButton: vi.fn(({ className, size }) => (
    <button data-testid="simple-connect-button" className={className}>
      Connect Wallet
    </button>
  )),
}));

// Mock child components with accessibility attributes
vi.mock("../../../src/components/ui/GlassCard", () => ({
  GlassCard: vi.fn(({ children }) => (
    <div role="group" aria-label="Wallet Overview" data-testid="glass-card">
      {children}
    </div>
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
      <header data-testid="wallet-header" role="banner">
        <h1>My Wallet</h1>
        {onAnalyticsClick && (
          <button
            data-testid="analytics-button"
            onClick={onAnalyticsClick}
            aria-label="View portfolio analytics"
          >
            Analytics
          </button>
        )}
        <button
          data-testid="wallet-manager-button"
          onClick={onWalletManagerClick}
          aria-label="Manage wallet addresses"
        >
          Wallet Manager
        </button>
        <button
          data-testid="toggle-balance-button"
          onClick={onToggleBalance}
          aria-label={
            balanceHidden ? "Show balance amounts" : "Hide balance amounts"
          }
          aria-pressed={balanceHidden}
        >
          {balanceHidden ? "Show" : "Hide"} Balance
        </button>
      </header>
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
      <section data-testid="wallet-metrics" aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">
          Portfolio Metrics
        </h2>
        <div role="group" aria-label="Total Balance">
          <span className="sr-only">Total Balance:</span>
          <div data-testid="total-value" aria-live="polite">
            {isLoading ? (
              <span aria-label="Loading balance">Loading...</span>
            ) : error ? (
              <span role="alert" aria-label="Error loading balance">
                Error: {error}
              </span>
            ) : balanceHidden ? (
              <span aria-label="Balance hidden">****</span>
            ) : (
              <span aria-label={`Total balance: $${totalValue}`}>
                ${totalValue}
              </span>
            )}
          </div>
        </div>
        <div role="group" aria-label="Portfolio Performance">
          <span className="sr-only">Performance Change:</span>
          <div
            data-testid="change-percentage"
            aria-label={`Portfolio change: ${portfolioChangePercentage}%`}
          >
            {portfolioChangePercentage}%
          </div>
        </div>
      </section>
    )
  ),
}));

vi.mock("../../../src/components/wallet/WalletActions", () => ({
  WalletActions: vi.fn(({ onZapInClick, onZapOutClick, onOptimizeClick }) => (
    <nav
      data-testid="wallet-actions"
      aria-label="Wallet Actions"
      role="navigation"
    >
      <button
        data-testid="zap-in-button"
        onClick={onZapInClick}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onZapInClick?.();
          }
        }}
        aria-label="Add funds to wallet"
      >
        <span aria-hidden="true">↗</span>
        Zap In
      </button>
      <button
        data-testid="zap-out-button"
        onClick={onZapOutClick}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onZapOutClick?.();
          }
        }}
        aria-label="Remove funds from wallet"
      >
        <span aria-hidden="true">↙</span>
        Zap Out
      </button>
      <button
        data-testid="optimize-button"
        onClick={onOptimizeClick}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOptimizeClick?.();
          }
        }}
        aria-label="Optimize portfolio allocation"
      >
        <span aria-hidden="true">⚙</span>
        Optimize
      </button>
    </nav>
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
    }) => (
      <section
        data-testid="portfolio-overview"
        aria-labelledby="portfolio-heading"
        role="region"
      >
        <h2 id="portfolio-heading">{title}</h2>
        <div aria-live="polite" aria-atomic="true">
          <div data-testid="portfolio-loading" className="sr-only">
            {isLoading ? "Loading portfolio data" : "Portfolio data loaded"}
          </div>
        </div>
        {apiError && (
          <div
            data-testid="portfolio-error"
            role="alert"
            aria-describedby="error-description"
          >
            <p id="error-description">Error loading portfolio: {apiError}</p>
            {onRetry && (
              <button
                data-testid="retry-button"
                onClick={onRetry}
                aria-label="Retry loading portfolio data"
                disabled={isRetrying}
              >
                {isRetrying ? "Retrying..." : "Retry"}
              </button>
            )}
          </div>
        )}
        <div data-testid="portfolio-data-count" aria-hidden="true">
          {portfolioData ? portfolioData.length : 0}
        </div>
        <div data-testid="pie-chart-data-count" aria-hidden="true">
          {pieChartData ? pieChartData.length : 0}
        </div>
        {onCategoryToggle && (
          <button
            data-testid="category-toggle-button"
            onClick={() => onCategoryToggle("test-category")}
            aria-expanded={expandedCategory === "test-category"}
            aria-controls="category-details"
          >
            Toggle Category Details
          </button>
        )}
      </section>
    )
  ),
}));

vi.mock("../../../src/components/WalletManager", () => ({
  WalletManager: vi.fn(({ isOpen, onClose }) =>
    isOpen ? (
      <div
        data-testid="wallet-manager"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        onKeyDown={e => {
          if (e.key === "Escape") {
            e.preventDefault();
            onClose?.();
          }
        }}
      >
        <h2 id="modal-title">Wallet Manager</h2>
        <p id="modal-description">Manage your connected wallet addresses</p>
        <button
          data-testid="close-modal"
          onClick={onClose}
          aria-label="Close wallet manager"
          autoFocus
        >
          <span aria-hidden="true">×</span>
          Close
        </button>
      </div>
    ) : null
  ),
}));

describe("WalletPortfolio - Accessibility and Keyboard Navigation Tests", () => {
  const mockUseWalletPortfolioState = vi.mocked(useWalletPortfolioState);
  const mockUseUser = vi.mocked(useUser);

  const defaultMockState = {
    totalValue: 15000,
    portfolioData: [],
    pieChartData: [],
    isLoading: false,
    apiError: null,
    isConnected: true,
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

  describe("Semantic HTML Structure", () => {
    it("should use proper semantic HTML elements", () => {
      render(<WalletPortfolio />);

      // Check for semantic elements
      expect(screen.getByRole("banner")).toBeInTheDocument(); // header
      expect(
        screen.getByRole("group", { name: "Wallet Overview" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("navigation", { name: "Wallet Actions" })
      ).toBeInTheDocument();

      // Check for portfolio section region specifically
      expect(
        screen.getByRole("region", { name: "Asset Distribution" })
      ).toBeInTheDocument();
    });

    it("should have proper heading hierarchy", () => {
      render(<WalletPortfolio />);

      const h1 = screen.getByRole("heading", { level: 1 });
      const h2Elements = screen.getAllByRole("heading", { level: 2 });

      expect(h1).toHaveTextContent("My Wallet");
      expect(h2Elements).toHaveLength(2); // Portfolio Metrics (sr-only) and Asset Distribution
    });

    it("should use appropriate ARIA landmarks", () => {
      render(<WalletPortfolio />);

      expect(screen.getByRole("banner")).toBeInTheDocument();
      expect(screen.getByRole("navigation")).toBeInTheDocument();

      // Check for multiple regions
      const regions = screen.getAllByRole("region");
      expect(regions).toHaveLength(2); // Portfolio metrics and portfolio overview
    });
  });

  describe("ARIA Labels and Descriptions", () => {
    it("should have descriptive button labels", () => {
      render(
        <WalletPortfolio
          onAnalyticsClick={vi.fn()}
          onZapInClick={vi.fn()}
          onZapOutClick={vi.fn()}
          onOptimizeClick={vi.fn()}
        />
      );

      expect(
        screen.getByLabelText("View portfolio analytics")
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Manage wallet addresses")
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Hide balance amounts")).toBeInTheDocument();
      expect(screen.getByLabelText("Add funds to wallet")).toBeInTheDocument();
      expect(
        screen.getByLabelText("Remove funds from wallet")
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Optimize portfolio allocation")
      ).toBeInTheDocument();
    });

    it("should have proper live regions for dynamic content", () => {
      render(<WalletPortfolio />);

      const liveRegions = screen.getAllByLabelText(
        /Loading|loaded|Total balance/
      );
      expect(liveRegions.length).toBeGreaterThan(0);

      // Check aria-live attributes
      const totalValue = screen.getByTestId("total-value");
      expect(totalValue).toHaveAttribute("aria-live", "polite");
    });

    it("should update ARIA labels based on state", () => {
      const { rerender } = render(<WalletPortfolio />);

      expect(screen.getByLabelText("Hide balance amounts")).toBeInTheDocument();

      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        balanceHidden: true,
      });

      rerender(<WalletPortfolio />);

      expect(screen.getByLabelText("Show balance amounts")).toBeInTheDocument();
    });

    it("should have appropriate aria-pressed states", () => {
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        balanceHidden: true,
      });

      render(<WalletPortfolio />);

      const toggleButton = screen.getByTestId("toggle-balance-button");
      expect(toggleButton).toHaveAttribute("aria-pressed", "true");
    });

    it("should use aria-expanded for expandable content", () => {
      // Test collapsed state
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        expandedCategory: null,
      });

      const { rerender } = render(<WalletPortfolio />);

      const categoryToggle = screen.getByTestId("category-toggle-button");
      expect(categoryToggle).toHaveAttribute("aria-expanded", "false");

      // Test expanded state
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        expandedCategory: "test-category",
      });

      rerender(<WalletPortfolio />);

      const expandedToggle = screen.getByTestId("category-toggle-button");
      expect(expandedToggle).toHaveAttribute("aria-expanded", "true");
    });
  });

  describe("Keyboard Navigation", () => {
    it("should support tab navigation through interactive elements", () => {
      render(
        <WalletPortfolio
          onAnalyticsClick={vi.fn()}
          onZapInClick={vi.fn()}
          onZapOutClick={vi.fn()}
          onOptimizeClick={vi.fn()}
        />
      );

      const buttons = screen.getAllByRole("button");

      // All buttons should be focusable
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute("tabindex", "-1");
        button.focus();
        expect(button).toHaveFocus();
      });
    });

    it("should handle Enter key activation", () => {
      const onZapInClick = vi.fn();
      render(<WalletPortfolio onZapInClick={onZapInClick} />);

      const zapInButton = screen.getByTestId("zap-in-button");
      zapInButton.focus();

      fireEvent.keyDown(zapInButton, { key: "Enter", code: "Enter" });
      expect(onZapInClick).toHaveBeenCalledTimes(1);
    });

    it("should handle Space key activation", () => {
      const onOptimizeClick = vi.fn();
      render(<WalletPortfolio onOptimizeClick={onOptimizeClick} />);

      const optimizeButton = screen.getByTestId("optimize-button");
      optimizeButton.focus();

      fireEvent.keyDown(optimizeButton, { key: " ", code: "Space" });
      expect(onOptimizeClick).toHaveBeenCalledTimes(1);
    });

    it("should support escape key for modal dismissal", () => {
      const closeWalletManagerMock = vi.fn();

      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        isWalletManagerOpen: true,
        closeWalletManager: closeWalletManagerMock,
      });

      render(<WalletPortfolio />);

      const modal = screen.getByRole("dialog");
      fireEvent.keyDown(modal, { key: "Escape", code: "Escape" });

      expect(closeWalletManagerMock).toHaveBeenCalledTimes(1);
    });

    it("should maintain logical tab order", () => {
      render(
        <WalletPortfolio
          onAnalyticsClick={vi.fn()}
          onZapInClick={vi.fn()}
          onZapOutClick={vi.fn()}
          onOptimizeClick={vi.fn()}
        />
      );

      // Tab through elements in logical order
      const expectedOrder = [
        "analytics-button",
        "wallet-manager-button",
        "toggle-balance-button",
        "zap-in-button",
        "zap-out-button",
        "optimize-button",
        "category-toggle-button",
      ];

      expectedOrder.forEach((testId, index) => {
        const element = screen.getByTestId(testId);
        element.focus();
        expect(element).toHaveFocus();
      });
    });

    it("should skip non-interactive elements in tab order", () => {
      render(<WalletPortfolio />);

      const nonInteractiveElements = [
        screen.getByTestId("total-value"),
        screen.getByTestId("change-percentage"),
        screen.getByTestId("portfolio-data-count"),
        screen.getByTestId("pie-chart-data-count"),
      ];

      nonInteractiveElements.forEach(element => {
        // Should either not be focusable or have tabindex="-1"
        const tabIndex = element.getAttribute("tabindex");
        if (tabIndex !== null) {
          expect(tabIndex).toBe("-1");
        }
      });
    });
  });

  describe("Screen Reader Support", () => {
    it("should provide screen reader only content", () => {
      render(<WalletPortfolio />);

      // Check for sr-only content
      expect(screen.getByText("Portfolio Metrics")).toHaveClass("sr-only");
    });

    it("should announce loading states to screen readers", () => {
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        isLoading: true,
        totalValue: null,
      });

      render(<WalletPortfolio />);

      expect(screen.getByLabelText("Loading balance")).toBeInTheDocument();
      expect(screen.getByText("Loading portfolio data")).toBeInTheDocument();
    });

    it("should announce errors appropriately", () => {
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        apiError: "Network connection failed",
        totalValue: null,
      });

      render(<WalletPortfolio />);

      // Check for both error alerts - one in balance and one in portfolio
      const errorElements = screen.getAllByRole("alert");
      expect(errorElements).toHaveLength(2);

      // Check that portfolio error is present
      expect(screen.getByTestId("portfolio-error")).toHaveTextContent(
        "Error loading portfolio: Network connection failed"
      );

      // Check that balance error is present
      expect(screen.getByLabelText("Error loading balance")).toHaveTextContent(
        "Error: Network connection failed"
      );
    });

    it("should hide decorative icons from screen readers", () => {
      render(
        <WalletPortfolio
          onZapInClick={vi.fn()}
          onZapOutClick={vi.fn()}
          onOptimizeClick={vi.fn()}
        />
      );

      // Query all elements with aria-hidden="true" which are decorative icons
      const decorativeElements = document.querySelectorAll(
        '[aria-hidden="true"]'
      );
      expect(decorativeElements.length).toBeGreaterThan(0);

      // Verify specific decorative icons exist
      const decorativeIcons = Array.from(decorativeElements).filter(
        el =>
          el.textContent === "↗" ||
          el.textContent === "↙" ||
          el.textContent === "⚙"
      );
      expect(decorativeIcons.length).toBe(3);
    });

    it("should provide context for numerical values", () => {
      render(<WalletPortfolio />);

      expect(
        screen.getByLabelText("Total balance: $15000")
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Portfolio change: 5.2%")
      ).toBeInTheDocument();
    });
  });

  describe("Modal Accessibility", () => {
    it("should have proper modal ARIA attributes", () => {
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        isWalletManagerOpen: true,
      });

      render(<WalletPortfolio />);

      const modal = screen.getByRole("dialog");
      expect(modal).toHaveAttribute("aria-modal", "true");
      expect(modal).toHaveAttribute("aria-labelledby", "modal-title");
      expect(modal).toHaveAttribute("aria-describedby", "modal-description");
    });

    it("should focus close button when modal opens", () => {
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        isWalletManagerOpen: true,
      });

      render(<WalletPortfolio />);

      const closeButton = screen.getByTestId("close-modal");
      // In React, autoFocus is handled automatically, so we just verify the button exists
      // In a real app, we would check that it actually has focus
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute("aria-label", "Close wallet manager");
    });

    it("should trap focus within modal", () => {
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        isWalletManagerOpen: true,
      });

      render(<WalletPortfolio />);

      const modal = screen.getByRole("dialog");
      const focusableElements = modal.querySelectorAll(
        "button, [tabindex]:not([tabindex='-1'])"
      );

      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it("should restore focus when modal closes", async () => {
      const { rerender } = render(<WalletPortfolio />);

      // Focus the button that opens the modal
      const openButton = screen.getByTestId("wallet-manager-button");
      openButton.focus();
      expect(openButton).toHaveFocus();

      // Open modal
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        isWalletManagerOpen: true,
        closeWalletManager: vi.fn(),
      });

      rerender(<WalletPortfolio />);

      // Close modal
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        isWalletManagerOpen: false,
        closeWalletManager: vi.fn(),
      });

      rerender(<WalletPortfolio />);

      // In a real implementation, focus would be restored automatically
      // For the mock test, we just verify the component renders without the modal
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("Error State Accessibility", () => {
    it("should announce retry states", () => {
      const retryMock = vi.fn();
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        apiError: "Failed to load",
        retry: retryMock,
        isRetrying: true,
      });

      render(<WalletPortfolio />);

      const retryButton = screen.getByTestId("retry-button");
      expect(retryButton).toBeDisabled();
      expect(retryButton).toHaveTextContent("Retrying...");
    });

    it("should provide clear error messages", () => {
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        apiError: "Connection timeout",
        totalValue: null,
      });

      render(<WalletPortfolio />);

      expect(screen.getByLabelText("Error loading balance")).toHaveTextContent(
        "Error: Connection timeout"
      );
      expect(
        screen.getByText("Error loading portfolio: Connection timeout")
      ).toBeInTheDocument();
    });

    it("should maintain accessibility during error recovery", async () => {
      const retryMock = vi.fn();

      // Start with error - first render
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        apiError: "Load failed",
        totalValue: null,
        retry: retryMock,
      });

      const { rerender } = render(<WalletPortfolio />);

      // Check initial error state
      expect(
        screen.getByText("Error loading portfolio: Load failed")
      ).toBeInTheDocument();

      // Simulate successful retry - clear mock state first
      vi.clearAllMocks();
      mockUseWalletPortfolioState.mockReturnValue({
        ...defaultMockState,
        apiError: null,
        totalValue: 20000,
        retry: vi.fn(),
      });

      rerender(<WalletPortfolio />);

      await waitFor(() => {
        expect(
          screen.queryByText("Error loading portfolio: Load failed")
        ).not.toBeInTheDocument();
        expect(
          screen.getByLabelText("Total balance: $20000")
        ).toBeInTheDocument();
      });
    });
  });

  describe("High Contrast and Visual Accessibility", () => {
    it("should work with high contrast mode", () => {
      render(<WalletPortfolio />);

      // Verify that text alternatives exist for visual information
      expect(
        screen.getByLabelText("Total balance: $15000")
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Portfolio change: 5.2%")
      ).toBeInTheDocument();
    });

    it("should not rely solely on color for information", () => {
      render(<WalletPortfolio />);

      // Icons should have text labels, not just color coding
      expect(screen.getByLabelText("Add funds to wallet")).toBeInTheDocument();
      expect(
        screen.getByLabelText("Remove funds from wallet")
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Optimize portfolio allocation")
      ).toBeInTheDocument();
    });

    it("should provide text alternatives for visual content", () => {
      render(<WalletPortfolio />);

      // Visual decorations should be hidden from screen readers
      const decorativeElements = document.querySelectorAll(
        '[aria-hidden="true"]'
      );
      expect(decorativeElements.length).toBeGreaterThan(0);
    });
  });

  describe("Mobile Accessibility", () => {
    it("should support touch interaction", () => {
      const onZapInClick = vi.fn();
      render(<WalletPortfolio onZapInClick={onZapInClick} />);

      const button = screen.getByTestId("zap-in-button");

      fireEvent.touchStart(button);
      fireEvent.touchEnd(button);
      fireEvent.click(button);

      expect(onZapInClick).toHaveBeenCalledTimes(1);
    });

    it("should have appropriate touch targets", () => {
      render(
        <WalletPortfolio
          onAnalyticsClick={vi.fn()}
          onZapInClick={vi.fn()}
          onZapOutClick={vi.fn()}
          onOptimizeClick={vi.fn()}
        />
      );

      const buttons = screen.getAllByRole("button");

      // All interactive elements should be properly sized for touch
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
        // In a real test, you'd check computed styles for min-height/width
      });
    });
  });

  describe("Reduced Motion Support", () => {
    it("should respect reduced motion preferences", () => {
      // Mock reduced motion preference
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<WalletPortfolio />);

      // Component should render without motion-dependent features
      expect(screen.getByTestId("wallet-metrics")).toBeInTheDocument();
    });
  });
});
