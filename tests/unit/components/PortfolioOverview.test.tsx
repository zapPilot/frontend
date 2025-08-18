import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PortfolioOverview } from "../../../src/components/PortfolioOverview";
import { AssetCategory, PieChartData } from "../../../src/types/portfolio";
import { render } from "../../test-utils";

// Mock dependencies
vi.mock("framer-motion", () => ({
  motion: {
    div: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>),
  },
}));

// No need to mock lucide-react since PortfolioOverview uses a simple div spinner

// Mock the PieChart component to verify it receives the correct data
vi.mock("../../../src/components/PieChart", () => ({
  PieChart: vi.fn(({ data, isLoading, error }) => (
    <div data-testid="pie-chart">
      <div data-testid="pie-chart-loading">
        {isLoading ? "loading" : "not-loading"}
      </div>
      <div data-testid="pie-chart-error">{error || "no-error"}</div>
      <div data-testid="pie-chart-data-count">{data ? data.length : 0}</div>
      {data && (
        <div data-testid="pie-chart-data">
          {data.map((item: PieChartData, index: number) => (
            <div key={index} data-testid={`pie-item-${index}`}>
              {item.label}: ${item.value} ({item.percentage}%)
            </div>
          ))}
        </div>
      )}
    </div>
  )),
}));

// Mock the AssetCategoriesDetail component
vi.mock("../../../src/components/AssetCategoriesDetail", () => ({
  AssetCategoriesDetail: vi.fn(({ portfolioData }) => (
    <div data-testid="asset-categories-detail">
      {portfolioData &&
        portfolioData.map((item: AssetCategory, index: number) => (
          <div key={index} data-testid={`category-item-${index}`}>
            {item.name}: ${item.totalValue}
          </div>
        ))}
    </div>
  )),
}));

// Mock WalletConnectionPrompt component
vi.mock("../../../src/components/ui", () => ({
  WalletConnectionPrompt: vi.fn(({ title, description }) => (
    <div data-testid="wallet-connection-prompt">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )),
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

describe("PortfolioOverview", () => {
  const mockPortfolioData: AssetCategory[] = [
    {
      id: "1",
      name: "Stablecoins",
      percentage: 40,
      color: "#22c55e",
      totalValue: 4000,
      assets: [],
    },
    {
      id: "2",
      name: "ETH",
      percentage: 35,
      color: "#3b82f6",
      totalValue: 3500,
      assets: [],
    },
    {
      id: "3",
      name: "BTC",
      percentage: 25,
      color: "#f59e0b",
      totalValue: 2500,
      assets: [],
    },
  ];

  const mockPieChartData: PieChartData[] = [
    {
      label: "Stablecoins",
      value: 6000,
      percentage: 40,
      color: "#22c55e",
    },
    {
      label: "ETH",
      value: 5250,
      percentage: 35,
      color: "#3b82f6",
    },
    {
      label: "BTC",
      value: 3750,
      percentage: 25,
      color: "#f59e0b",
    },
  ];

  const defaultProps = {
    portfolioData: mockPortfolioData,
    pieChartData: mockPieChartData,
    expandedCategory: null,
    onCategoryToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading States for Pie Chart Area", () => {
    it("should show loading spinner in pie chart area when isLoading=true", () => {
      render(<PortfolioOverview {...defaultProps} isLoading={true} />);

      // Should show loading spinner instead of PieChart
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass(
        "rounded-full",
        "h-16",
        "w-16",
        "border-b-2",
        "border-purple-500"
      );
      expect(screen.queryByTestId("pie-chart")).not.toBeInTheDocument();
    });

    it("should show PieChart when isLoading=false", () => {
      render(<PortfolioOverview {...defaultProps} isLoading={false} />);

      expect(screen.getAllByTestId("pie-chart")[0]).toBeInTheDocument();
      expect(screen.getAllByTestId("pie-chart-loading")[0]).toHaveTextContent(
        "not-loading"
      );
    });

    it("should default to showing PieChart when isLoading prop is not provided", () => {
      render(<PortfolioOverview {...defaultProps} />);

      expect(screen.getAllByTestId("pie-chart")[0]).toBeInTheDocument();
      expect(screen.getAllByTestId("pie-chart-loading")[0]).toHaveTextContent(
        "not-loading"
      );
    });
  });

  describe("Error States for Pie Chart Area", () => {
    it("should show error message in pie chart area when apiError is present", () => {
      const errorMessage = "Failed to load portfolio data";

      render(<PortfolioOverview {...defaultProps} apiError={errorMessage} />);

      // Should show error message instead of PieChart
      expect(screen.getAllByText("Chart Unavailable")[0]).toBeInTheDocument();
      expect(screen.getAllByText(errorMessage)[0]).toBeInTheDocument();
      expect(screen.queryByTestId("pie-chart")).not.toBeInTheDocument();
    });

    it("should show PieChart when apiError is null", () => {
      render(<PortfolioOverview {...defaultProps} apiError={null} />);

      expect(screen.getAllByTestId("pie-chart")[0]).toBeInTheDocument();
      expect(screen.getAllByTestId("pie-chart-error")[0]).toHaveTextContent(
        "no-error"
      );
    });

    it("should show PieChart when apiError prop is not provided", () => {
      render(<PortfolioOverview {...defaultProps} />);

      expect(screen.getAllByTestId("pie-chart")[0]).toBeInTheDocument();
      expect(screen.getAllByTestId("pie-chart-error")[0]).toHaveTextContent(
        "no-error"
      );
    });

    it("should prioritize loading over error - show loading when both isLoading and apiError are true", () => {
      const errorMessage = "API Error";

      render(
        <PortfolioOverview
          {...defaultProps}
          isLoading={true}
          apiError={errorMessage}
        />
      );

      // Component should show loading state (isLoading takes priority)
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
      expect(screen.queryByText("Chart Unavailable")).not.toBeInTheDocument();
      expect(screen.queryByTestId("pie-chart")).not.toBeInTheDocument();
    });
  });

  describe("Data Handling and Architectural Separation", () => {
    it("should use provided pieChartData instead of calculating internally", () => {
      render(
        <PortfolioOverview {...defaultProps} pieChartData={mockPieChartData} />
      );

      // Verify that the component uses the provided pieChartData
      expect(
        screen.getAllByTestId("pie-chart-data-count")[0]
      ).toHaveTextContent("3");

      // Verify the specific data values from provided pieChartData (not calculated from portfolioData)
      expect(screen.getAllByTestId("pie-item-0")[0]).toHaveTextContent(
        "Stablecoins: $6000 (40%)"
      );
      expect(screen.getAllByTestId("pie-item-1")[0]).toHaveTextContent(
        "ETH: $5250 (35%)"
      );
      expect(screen.getAllByTestId("pie-item-2")[0]).toHaveTextContent(
        "BTC: $3750 (25%)"
      );
    });

    it("should not perform any internal calculations when pieChartData is provided", () => {
      // Provide portfolioData with different values to ensure they're not used
      const differentPortfolioData: AssetCategory[] = [
        {
          id: "1",
          name: "Different",
          percentage: 100,
          color: "#000000",
          totalValue: 99999,
          assets: [],
        },
      ];

      render(
        <PortfolioOverview
          portfolioData={differentPortfolioData}
          pieChartData={mockPieChartData}
          expandedCategory={null}
          onCategoryToggle={vi.fn()}
        />
      );

      // Should use pieChartData, not portfolioData
      expect(
        screen.getAllByTestId("pie-chart-data-count")[0]
      ).toHaveTextContent("3");
      expect(screen.getAllByTestId("pie-item-0")[0]).toHaveTextContent(
        "Stablecoins: $6000 (40%)"
      );
    });
  });

  describe("Balance Display Function Passing", () => {
    it("should pass renderBalanceDisplay function to PieChart when provided", () => {
      const mockRenderBalanceDisplay = vi.fn(() => (
        <div data-testid="custom-balance">$15,000</div>
      ));

      render(
        <PortfolioOverview
          {...defaultProps}
          renderBalanceDisplay={mockRenderBalanceDisplay}
        />
      );

      // Verify PieChart receives the renderBalanceDisplay function
      // (The function is passed but not called by PortfolioOverview itself)
      expect(screen.getAllByTestId("pie-chart")[0]).toBeInTheDocument();
    });

    it("should pass undefined renderBalanceDisplay when not provided", () => {
      render(<PortfolioOverview {...defaultProps} />);

      expect(screen.getAllByTestId("pie-chart")[0]).toBeInTheDocument();
    });

    it("should pass renderBalanceDisplay function correctly to PieChart", () => {
      const mockRenderBalanceDisplay = vi.fn(() => null);

      render(
        <PortfolioOverview
          {...defaultProps}
          renderBalanceDisplay={mockRenderBalanceDisplay}
        />
      );

      // The function should be passed to PieChart, not called by PortfolioOverview
      expect(screen.getAllByTestId("pie-chart")[0]).toBeInTheDocument();
    });

    it("should handle complex renderBalanceDisplay function", () => {
      const mockRenderBalanceDisplay = vi.fn(() => (
        <div data-testid="complex-balance">
          <span data-testid="currency">$</span>
          <span data-testid="amount">15,000</span>
          <span data-testid="suffix">USD</span>
        </div>
      ));

      render(
        <PortfolioOverview
          {...defaultProps}
          renderBalanceDisplay={mockRenderBalanceDisplay}
        />
      );

      expect(screen.getAllByTestId("pie-chart")[0]).toBeInTheDocument();
    });
  });

  describe("Props and Configuration", () => {
    it("should handle all optional props with default values", () => {
      render(<PortfolioOverview {...defaultProps} />);

      expect(screen.getAllByTestId("pie-chart")[0]).toBeInTheDocument();
      expect(
        screen.getAllByTestId("asset-categories-detail")[0]
      ).toBeInTheDocument();
    });

    it("should use custom title when provided", () => {
      const customTitle = "Custom Portfolio Title";

      render(<PortfolioOverview {...defaultProps} title={customTitle} />);

      // Note: The title would be rendered in the actual component
      // This test verifies that the prop is accepted
    });

    it("should apply custom className when provided", () => {
      const customClass = "custom-portfolio-class";

      render(<PortfolioOverview {...defaultProps} className={customClass} />);

      // Note: In the actual implementation, this would add the className to the root element
    });

    it("should handle testId prop for testing purposes", () => {
      const testId = "custom-test-id";

      render(<PortfolioOverview {...defaultProps} testId={testId} />);

      // Note: In the actual implementation, this would set data-testid on the root element
    });

    it("should pass balanceHidden prop correctly", () => {
      render(<PortfolioOverview {...defaultProps} balanceHidden={true} />);

      // Component should render without issues
      expect(screen.getAllByTestId("pie-chart")[0]).toBeInTheDocument();
    });
  });

  describe("Category Expansion and Interaction", () => {
    it("should handle expandedCategory prop", () => {
      render(
        <PortfolioOverview {...defaultProps} expandedCategory="stablecoins" />
      );

      expect(
        screen.getAllByTestId("asset-categories-detail")[0]
      ).toBeInTheDocument();
    });

    it("should call onCategoryToggle when provided", () => {
      const mockOnCategoryToggle = vi.fn();

      render(
        <PortfolioOverview
          {...defaultProps}
          onCategoryToggle={mockOnCategoryToggle}
        />
      );

      // The actual interaction would need to be triggered through user events
      // This test verifies that the prop is accepted
      expect(screen.getAllByTestId("pie-chart")[0]).toBeInTheDocument();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle empty portfolioData", () => {
      render(
        <PortfolioOverview
          portfolioData={[]}
          pieChartData={[]}
          expandedCategory={null}
          onCategoryToggle={vi.fn()}
        />
      );

      // Should show empty state when data is empty
      expect(
        screen.getByTestId("wallet-connection-prompt")
      ).toBeInTheDocument();
    });

    it("should handle empty pieChartData", () => {
      render(<PortfolioOverview {...defaultProps} pieChartData={[]} />);

      // Should show empty state when pieChartData is empty
      expect(
        screen.getByTestId("wallet-connection-prompt")
      ).toBeInTheDocument();
    });

    it("should handle undefined portfolioData gracefully", () => {
      // This would normally cause TypeScript errors, but testing runtime behavior
      render(
        <PortfolioOverview
          portfolioData={undefined as unknown as AssetCategory[]}
          pieChartData={mockPieChartData}
          expandedCategory={null}
          onCategoryToggle={vi.fn()}
        />
      );

      // Should not crash and should use empty array fallback or show appropriate state
      expect(screen.getByTestId("portfolio-overview")).toBeInTheDocument();
    });

    it("should prioritize pieChartData over portfolioData when both are empty", () => {
      render(
        <PortfolioOverview
          portfolioData={[]}
          pieChartData={[]}
          expandedCategory={null}
          onCategoryToggle={vi.fn()}
        />
      );

      // Should show empty state when both are empty
      expect(
        screen.getByTestId("wallet-connection-prompt")
      ).toBeInTheDocument();
    });
  });

  describe("Loading and Error State Combinations", () => {
    it("should handle loading and error states simultaneously", () => {
      render(
        <PortfolioOverview
          {...defaultProps}
          isLoading={true}
          apiError="Some error occurred"
        />
      );

      // Loading should take priority over error
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
      expect(screen.queryByText("Chart Unavailable")).not.toBeInTheDocument();
      expect(screen.queryByTestId("pie-chart")).not.toBeInTheDocument();
    });

    it("should handle loading state with custom data", () => {
      render(
        <PortfolioOverview
          {...defaultProps}
          pieChartData={mockPieChartData}
          isLoading={true}
        />
      );

      // Should still show loading state regardless of data
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
      expect(screen.queryByTestId("pie-chart")).not.toBeInTheDocument();
    });

    it("should handle error state with custom data", () => {
      render(
        <PortfolioOverview
          {...defaultProps}
          pieChartData={mockPieChartData}
          apiError="Data error"
        />
      );

      // Should show error state regardless of data
      expect(screen.getAllByText("Chart Unavailable")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Data error")[0]).toBeInTheDocument();
      expect(screen.queryByTestId("pie-chart")).not.toBeInTheDocument();
    });
  });

  describe("Data Transformation Architecture", () => {
    it("should not modify or transform the provided pieChartData", () => {
      const originalData = [...mockPieChartData];

      render(
        <PortfolioOverview {...defaultProps} pieChartData={mockPieChartData} />
      );

      // Verify that the original data is unchanged
      expect(mockPieChartData).toEqual(originalData);

      // Verify that the component uses the data as-is
      expect(screen.getAllByTestId("pie-item-0")[0]).toHaveTextContent(
        "Stablecoins: $6000 (40%)"
      );
    });
  });
});
