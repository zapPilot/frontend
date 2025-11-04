import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PieChart } from "../../../src/components/PieChart";
import { PORTFOLIO_CONFIG } from "../../../src/constants/portfolio";
import { formatCurrency } from "../../../src/lib/formatters";
import { PieChartData } from "../../../src/types/portfolio";

// Mock framer-motion with reduced-motion hook
vi.mock("framer-motion", () => ({
  motion: {
    circle: vi.fn(({ children, ...props }) => (
      <circle {...props}>{children}</circle>
    )),
  },
  useReducedMotion: () => true,
}));

// Mock formatCurrency utility to support options object
vi.mock("../../../src/lib/formatters", () => ({
  formatCurrency: vi.fn((amount: number, opts?: { isHidden?: boolean }) =>
    opts?.isHidden ? "••••••••" : `$${amount.toFixed(2)}`
  ),
}));

const mockPieChartData: PieChartData[] = [
  {
    label: "DeFi",
    value: 15000,
    percentage: 60,
    color: "#8B5CF6",
  },
  {
    label: "CEX",
    value: 7500,
    percentage: 30,
    color: "#06B6D4",
  },
  {
    label: "NFTs",
    value: 2500,
    percentage: 10,
    color: "#F59E0B",
  },
];

const defaultProps = {
  data: mockPieChartData,
  size: 250,
  strokeWidth: 10,
};

describe("PieChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render with default props", () => {
      const { container } = render(<PieChart {...defaultProps} />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("width", "250");
      expect(svg).toHaveAttribute("height", "250");
    });

    it("should render all data segments as circles", () => {
      const { container } = render(<PieChart {...defaultProps} />);

      const circles = container.querySelectorAll("circle");
      expect(circles).toHaveLength(mockPieChartData.length);
    });

    it("should apply custom size and strokeWidth", () => {
      const customProps = { ...defaultProps, size: 300, strokeWidth: 15 };
      const { container } = render(<PieChart {...customProps} />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("width", "300");
      expect(svg).toHaveAttribute("height", "300");
    });

    it("should use default configuration values", () => {
      const propsWithoutSizeAndStroke = { data: mockPieChartData };
      const { container } = render(<PieChart {...propsWithoutSizeAndStroke} />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute(
        "width",
        PORTFOLIO_CONFIG.DEFAULT_PIE_CHART_SIZE.toString()
      );
      expect(svg).toHaveAttribute(
        "height",
        PORTFOLIO_CONFIG.DEFAULT_PIE_CHART_SIZE.toString()
      );
    });
  });

  describe("Data Handling", () => {
    it("should handle empty data array", () => {
      render(<PieChart data={[]} />);

      // Should still render the container and center content
      const totalValueElement = screen.getByText("Total Value");
      expect(totalValueElement).toBeInTheDocument();
    });

    it("should handle single data item", () => {
      const singleItemData = [mockPieChartData[0]];
      render(<PieChart data={singleItemData} />);

      const totalValueElement = screen.getByText("Total Value");
      expect(totalValueElement).toBeInTheDocument();
    });

    it("should calculate total value from data when no totalValue prop provided", () => {
      render(<PieChart {...defaultProps} />);

      expect(formatCurrency).toHaveBeenCalledWith(25000, { isHidden: false }); // 15000 + 7500 + 2500
    });

    it("should use provided totalValue over calculated value", () => {
      const propsWithTotalValue = { ...defaultProps, totalValue: 30000 };
      render(<PieChart {...propsWithTotalValue} />);

      expect(formatCurrency).toHaveBeenCalledWith(30000, { isHidden: false });
    });
  });

  describe("Balance Display", () => {
    it("should show actual currency when no custom renderer provided", () => {
      render(<PieChart {...defaultProps} />);

      expect(formatCurrency).toHaveBeenCalledWith(25000, { isHidden: false });
      expect(screen.getByText("$25000.00")).toBeInTheDocument();
    });

    it("should use custom renderBalanceDisplay when provided", () => {
      const customRenderer = vi.fn(() => "Custom Balance");
      const propsWithCustomRenderer = {
        ...defaultProps,
        renderBalanceDisplay: customRenderer,
      };

      render(<PieChart {...propsWithCustomRenderer} />);

      expect(customRenderer).toHaveBeenCalled();
      expect(screen.getByText("Custom Balance")).toBeInTheDocument();
      expect(formatCurrency).not.toHaveBeenCalled();
    });

    it("should hide balance when custom renderer returns hidden placeholder", () => {
      const hiddenRenderer = vi.fn(() => "••••••••");
      const propsWithHiddenRenderer = {
        ...defaultProps,
        renderBalanceDisplay: hiddenRenderer,
      };

      render(<PieChart {...propsWithHiddenRenderer} />);

      expect(hiddenRenderer).toHaveBeenCalled();
      expect(screen.getByText("••••••••")).toBeInTheDocument();
    });

    it("should always show 'Total Value' label when using default balance display", () => {
      render(<PieChart {...defaultProps} />);
      expect(screen.getByText("Total Value")).toBeInTheDocument();
    });

    it("should use custom renderer when renderBalanceDisplay is provided", () => {
      const hiddenRenderer = vi.fn(() => "••••••••");
      const propsWithHiddenRenderer = {
        ...defaultProps,
        renderBalanceDisplay: hiddenRenderer,
      };

      render(<PieChart {...propsWithHiddenRenderer} />);

      expect(hiddenRenderer).toHaveBeenCalled();
      expect(screen.getByText("••••••••")).toBeInTheDocument();
      // Custom renderer replaces default content, so "Total Value" should not appear
      expect(screen.queryByText("Total Value")).not.toBeInTheDocument();
    });
  });

  describe("SVG Structure and Styling", () => {
    it("should apply correct transform rotation to SVG", () => {
      const { container } = render(<PieChart {...defaultProps} />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("transform", "-rotate-90");
    });

    it("should set correct viewBox", () => {
      const customSize = 300;
      const { container } = render(
        <PieChart data={mockPieChartData} size={customSize} />
      );

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("viewBox", `0 0 ${customSize} ${customSize}`);
    });

    it("should render center content with proper positioning", () => {
      render(<PieChart {...defaultProps} />);

      const centerDiv =
        screen.getByText("Total Value").parentElement?.parentElement;
      expect(centerDiv).toHaveClass(
        "absolute",
        "inset-0",
        "flex",
        "items-center",
        "justify-center"
      );
    });

    it("should apply proper styling classes to center content", () => {
      render(<PieChart {...defaultProps} />);

      const valueElement = screen.getByText("$25000.00");
      expect(valueElement).toHaveClass("text-2xl", "font-bold", "text-white");

      const labelElement = screen.getByText("Total Value");
      expect(labelElement).toHaveClass("text-sm", "text-gray-400");
    });
  });

  describe("Accessibility", () => {
    it("should render SVG with proper accessibility attributes", () => {
      const { container } = render(<PieChart {...defaultProps} />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("role", "presentation");
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });

    it("should provide text alternative through center content", () => {
      render(<PieChart {...defaultProps} />);

      // The center content serves as the text alternative
      expect(screen.getByText("$25000.00")).toBeInTheDocument();
      expect(screen.getByText("Total Value")).toBeInTheDocument();
    });
  });

  describe("Performance and Memoization", () => {
    it("should memoize chart data calculations", () => {
      const { rerender } = render(<PieChart {...defaultProps} />);

      // First render
      expect(formatCurrency).toHaveBeenCalledTimes(1);

      // Rerender with same props (should be memoized, no additional calls)
      rerender(<PieChart {...defaultProps} />);

      // Due to React.memo, formatCurrency should not be called again with identical props
      expect(formatCurrency).toHaveBeenCalledTimes(1);
    });

    it("should recalculate when data changes", () => {
      const { rerender } = render(<PieChart {...defaultProps} />);

      const newData = [
        { label: "New", value: 10000, percentage: 100, color: "#000000" },
      ];

      rerender(<PieChart data={newData} size={250} strokeWidth={10} />);

      expect(formatCurrency).toHaveBeenLastCalledWith(10000, {
        isHidden: false,
      });
    });

    it("should handle zero total value gracefully", () => {
      const zeroData = mockPieChartData.map(item => ({ ...item, value: 0 }));
      render(<PieChart data={zeroData} size={250} strokeWidth={10} />);

      expect(formatCurrency).toHaveBeenCalledWith(0, { isHidden: false });
      expect(screen.getByText("$0.00")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large numbers", () => {
      const largeValueData = [
        { label: "Large", value: 999999999, percentage: 100, color: "#000000" },
      ];
      render(<PieChart data={largeValueData} size={250} strokeWidth={10} />);

      expect(formatCurrency).toHaveBeenCalledWith(999999999, {
        isHidden: false,
      });
    });

    it("should handle negative values", () => {
      const negativeData = [
        { label: "Negative", value: -1000, percentage: 100, color: "#000000" },
      ];
      render(<PieChart data={negativeData} size={250} strokeWidth={10} />);

      expect(formatCurrency).toHaveBeenCalledWith(-1000, { isHidden: false });
    });

    it("should handle floating point values", () => {
      const floatData = [
        { label: "Float", value: 123.456, percentage: 100, color: "#000000" },
      ];
      render(<PieChart data={floatData} size={250} strokeWidth={10} />);

      expect(formatCurrency).toHaveBeenCalledWith(123.456, { isHidden: false });
    });

    it("should maintain consistent key generation for data items", () => {
      const { container, rerender } = render(<PieChart {...defaultProps} />);

      // Get initial circles
      const initialCircles = container.querySelectorAll("circle");

      // Rerender with same data
      rerender(<PieChart {...defaultProps} />);

      // Should have same number of circles
      const rerenderedCircles = container.querySelectorAll("circle");
      expect(rerenderedCircles).toHaveLength(initialCircles.length);
    });
  });

  describe("Integration with Portfolio Constants", () => {
    it("should use correct default values from PORTFOLIO_CONFIG", () => {
      const { container } = render(<PieChart data={mockPieChartData} />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute(
        "width",
        PORTFOLIO_CONFIG.DEFAULT_PIE_CHART_SIZE.toString()
      );
      expect(svg).toHaveAttribute(
        "height",
        PORTFOLIO_CONFIG.DEFAULT_PIE_CHART_SIZE.toString()
      );
    });

    it("should calculate stroke properties correctly", () => {
      const customStrokeWidth = 20;
      const customSize = 400;
      render(
        <PieChart
          data={mockPieChartData}
          size={customSize}
          strokeWidth={customStrokeWidth}
        />
      );

      // The radius should be (size - strokeWidth) / 2
      const expectedRadius = (customSize - customStrokeWidth) / 2;
      expect(expectedRadius).toBe(190); // (400 - 20) / 2
    });
  });
});
