import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SwapPage } from "../../../../src/components/SwapPage/SwapPage";
import type { InvestmentOpportunity } from "../../../../src/types/investment";

// Mock child components
vi.mock("../../../../src/components/SwapPage/SwapPageHeader", () => ({
  SwapPageHeader: vi.fn(({ strategy, onBack }: any) => (
    <div data-testid="swap-page-header">
      <h1 data-testid="strategy-name">{strategy?.name}</h1>
      <button onClick={onBack} data-testid="back-button">
        Back
      </button>
    </div>
  )),
}));

vi.mock("../../../../src/components/SwapPage/TabNavigation", () => ({
  TabNavigation: vi.fn(
    ({ activeOperationMode, onOperationModeChange }: any) => (
      <div data-testid="tab-navigation">
        <button
          onClick={() => onOperationModeChange?.("zapIn")}
          data-testid="operation-zapIn"
          aria-pressed={activeOperationMode === "zapIn"}
        >
          Zap In
        </button>
        <button
          onClick={() => onOperationModeChange?.("zapOut")}
          data-testid="operation-zapOut"
          aria-pressed={activeOperationMode === "zapOut"}
        >
          Zap Out
        </button>
        <button
          onClick={() => onOperationModeChange?.("rebalance")}
          data-testid="operation-rebalance"
          aria-pressed={activeOperationMode === "rebalance"}
        >
          Optimize
        </button>
      </div>
    )
  ),
}));

vi.mock("../../../../src/components/PortfolioAllocation", () => ({
  PortfolioAllocationContainer: vi.fn(
    ({ operationMode, assetCategories }: any) => (
      <div data-testid="portfolio-allocation">
        <div data-testid="operation-mode">{operationMode}</div>
        <div data-testid="asset-categories-count">
          {assetCategories?.length || 0}
        </div>
      </div>
    )
  ),
}));

vi.mock("../../../../src/components/SwapPage/OptimizeTab", () => ({
  OptimizeTab: vi.fn(() => (
    <div data-testid="optimize-tab-content">Optimize Tab Content</div>
  )),
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>),
  },
}));

// Mock chain hook to avoid wallet provider dependency
vi.mock("../../../../src/hooks/useChain", () => ({
  useChain: () => ({
    chain: { id: 8453, name: "Base", symbol: "ETH" },
    switchChain: vi.fn(),
    isChainSupported: vi.fn().mockReturnValue(true),
    getChainInfo: vi.fn(),
    getSupportedChains: vi.fn(),
  }),
}));

// Mock strategies hooks
vi.mock("../../../../src/hooks/queries/useStrategiesQuery", () => ({
  useStrategiesData: vi.fn(() => ({
    strategies: [
      {
        id: "btc",
        name: "BTC",
        color: "#F59E0B",
        protocols: [
          {
            id: "btc-1",
            name: "Compound BTC",
            allocationPercentage: 100,
            chain: "Ethereum",
            apy: 3.2,
            tvl: 120000,
          },
        ],
      },
      {
        id: "eth",
        name: "ETH",
        color: "#8B5CF6",
        protocols: [
          {
            id: "eth-1",
            name: "Lido Staking",
            allocationPercentage: 100,
            chain: "Ethereum",
            apy: 5.2,
            tvl: 250000,
          },
        ],
      },
      {
        id: "stablecoins",
        name: "Stablecoins",
        color: "#10B981",
        protocols: [
          {
            id: "stable-1",
            name: "USDC Compound",
            allocationPercentage: 100,
            chain: "Ethereum",
            apy: 2.5,
            tvl: 320000,
          },
        ],
      },
    ],
    isError: false,
    error: null,
    isInitialLoading: false,
    refetch: vi.fn(),
  })),
  useStrategiesWithPortfolioData: vi.fn((_userId?: string) => ({
    strategies: [
      {
        id: "btc",
        name: "BTC",
        color: "#F59E0B",
        protocols: [
          {
            id: "btc-1",
            name: "Compound BTC",
            allocationPercentage: 100,
            chain: "Ethereum",
            apy: 3.2,
            tvl: 120000,
          },
        ],
      },
      {
        id: "eth",
        name: "ETH",
        color: "#8B5CF6",
        protocols: [
          {
            id: "eth-1",
            name: "Lido Staking",
            allocationPercentage: 100,
            chain: "Ethereum",
            apy: 5.2,
            tvl: 250000,
          },
        ],
      },
      {
        id: "stablecoins",
        name: "Stablecoins",
        color: "#10B981",
        protocols: [
          {
            id: "stable-1",
            name: "USDC Compound",
            allocationPercentage: 100,
            chain: "Ethereum",
            apy: 2.5,
            tvl: 320000,
          },
        ],
      },
    ],
    isError: false,
    error: null,
    isInitialLoading: false,
    refetch: vi.fn(),
  })),
}));

describe("SwapPage", () => {
  const mockStrategy: InvestmentOpportunity = {
    id: "test-strategy",
    name: "Test Strategy",
    description: "Test Description",
    navigationContext: "zapIn",
    apr: "12.5",
    risk: "Medium",
    tvl: "$1.2M",
    // Add other required fields
  } as InvestmentOpportunity;

  const mockOnBack = vi.fn();

  const defaultProps = {
    strategy: mockStrategy,
    onBack: mockOnBack,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("UI Layout Structure", () => {
    it("should render main container with proper structure", () => {
      render(<SwapPage {...defaultProps} />);

      // Main container should exist
      const container = screen.getByTestId("swap-page-header").closest("div");
      expect(container).toBeInTheDocument();
    });

    it("should render SwapPageHeader component", () => {
      render(<SwapPage {...defaultProps} />);

      expect(screen.getByTestId("swap-page-header")).toBeInTheDocument();
      expect(screen.getByTestId("strategy-name")).toHaveTextContent(
        "Test Strategy"
      );
    });

    it("should render TabNavigation component", () => {
      render(<SwapPage {...defaultProps} />);

      expect(screen.getByTestId("tab-navigation")).toBeInTheDocument();
      expect(screen.getByTestId("operation-zapIn")).toBeInTheDocument();
      expect(screen.getByTestId("operation-zapOut")).toBeInTheDocument();
      expect(screen.getByTestId("operation-rebalance")).toBeInTheDocument();
    });

    it("should render tab content based on active tab", () => {
      render(<SwapPage {...defaultProps} />);

      // Initially should show zapIn mode content (PortfolioAllocation)
      expect(screen.getByTestId("portfolio-allocation")).toBeInTheDocument();
    });

    it("should pass back handler to header component", () => {
      render(<SwapPage {...defaultProps} />);

      const backButton = screen.getByTestId("back-button");
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it("should initialize with correct operation mode based on navigation context", () => {
      render(<SwapPage {...defaultProps} />);

      // Should initialize with 'zapIn' based on navigationContext
      expect(screen.getByTestId("operation-mode")).toHaveTextContent("zapIn");
    });

    it("should render asset categories in portfolio allocation", () => {
      render(<SwapPage {...defaultProps} />);

      // Should have 3 mock asset categories (BTC, ETH, Stablecoins)
      expect(screen.getByTestId("asset-categories-count")).toHaveTextContent(
        "3"
      );
    });

    it("should handle different navigation contexts correctly", () => {
      const zapOutStrategy = {
        ...mockStrategy,
        navigationContext: "zapOut",
      } as InvestmentOpportunity;

      render(<SwapPage strategy={zapOutStrategy} onBack={mockOnBack} />);

      // Should initialize with 'zapOut' mode
      expect(screen.getByTestId("operation-mode")).toHaveTextContent("zapOut");
    });

    it("should handle invest navigation context as rebalance mode", () => {
      const investStrategy = {
        ...mockStrategy,
        navigationContext: "invest",
      } as InvestmentOpportunity;

      render(<SwapPage strategy={investStrategy} onBack={mockOnBack} />);

      // Should initialize with 'rebalance' mode
      expect(screen.getByTestId("operation-mode")).toHaveTextContent(
        "rebalance"
      );
    });

    it("should default to zapIn when navigationContext is undefined", () => {
      const defaultStrategy = {
        ...mockStrategy,
        navigationContext: undefined,
      } as InvestmentOpportunity;

      render(<SwapPage strategy={defaultStrategy} onBack={mockOnBack} />);

      // Should default to 'zapIn'
      expect(screen.getByTestId("operation-mode")).toHaveTextContent("zapIn");
    });

    it("should render all required UI sections", () => {
      render(<SwapPage {...defaultProps} />);

      // Header
      expect(screen.getByTestId("swap-page-header")).toBeInTheDocument();

      // Navigation
      expect(screen.getByTestId("tab-navigation")).toBeInTheDocument();

      // Content area
      expect(screen.getByTestId("portfolio-allocation")).toBeInTheDocument();
    });

    it("should maintain proper component hierarchy", () => {
      render(<SwapPage {...defaultProps} />);

      const container = screen.getByTestId("swap-page");
      const children = Array.from(container.children);

      // Should have proper structure: header, navigation, content
      expect(children).toHaveLength(3);

      // Header should be first
      expect(children[0]).toContainElement(
        screen.getByTestId("swap-page-header")
      );

      // Navigation should be second
      expect(children[1]).toContainElement(
        screen.getByTestId("tab-navigation")
      );

      // Content should be third
      expect(children[2]).toHaveAttribute("data-testid", "tab-content");
    });
  });

  describe("State Management", () => {
    it("should manage active operation mode state correctly", () => {
      render(<SwapPage {...defaultProps} />);

      // Initially zapIn should be active
      expect(screen.getByTestId("operation-zapIn")).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByTestId("operation-rebalance")).toHaveAttribute(
        "aria-pressed",
        "false"
      );

      // Click optimize tab
      fireEvent.click(screen.getByTestId("operation-rebalance"));

      // Rebalance/optimize should be active
      expect(screen.getByTestId("operation-rebalance")).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByTestId("operation-zapIn")).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    });

    it("should pass correct props to PortfolioAllocation", () => {
      render(<SwapPage {...defaultProps} />);

      // Should pass correct operation mode
      expect(screen.getByTestId("operation-mode")).toHaveTextContent("zapIn");

      // Should pass asset categories
      expect(screen.getByTestId("asset-categories-count")).toHaveTextContent(
        "3"
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle missing strategy gracefully", () => {
      // This would be a type error in TypeScript, but test runtime behavior
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Create a strategy with minimal required fields but missing navigationContext
      const incompleteStrategy = {
        id: "incomplete",
        name: "Incomplete Strategy",
      } as InvestmentOpportunity;

      render(<SwapPage strategy={incompleteStrategy} onBack={mockOnBack} />);

      // Should still render basic structure
      expect(screen.getByTestId("swap-page")).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it("should handle missing onBack prop", () => {
      render(<SwapPage strategy={mockStrategy} onBack={undefined as any} />);

      // Should still render
      expect(screen.getByTestId("swap-page-header")).toBeInTheDocument();
    });
  });
});
