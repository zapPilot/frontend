/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { TrendingUp, TrendingDown } from "lucide-react";
import { RiskMetricCard } from "../../../../src/components/RiskAssessment/components/RiskMetricCard";
import type { RiskLevel, DrawdownLevel } from "../../../../src/utils/risk";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

// Mock GlassCard component
vi.mock("../../../../src/components/ui", () => ({
  GlassCard: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={`glass-card ${className || ""}`} data-testid="glass-card">
      {children}
    </div>
  ),
}));

// Mock the risk constants and colors
vi.mock("../../../../src/utils/risk", () => ({
  RISK_COLORS: {
    low: {
      value: "text-green-400",
      border: "border-green-800/30",
      bg: "bg-green-900/20",
      subtitle: "text-green-300",
      icon: "text-green-400",
      badge: "bg-green-900/30 text-green-400",
    },
    medium: {
      value: "text-yellow-400",
      border: "border-yellow-800/30",
      bg: "bg-yellow-900/20",
      subtitle: "text-yellow-300",
      icon: "text-yellow-400",
      badge: "bg-yellow-900/30 text-yellow-400",
    },
    high: {
      value: "text-orange-400",
      border: "border-orange-800/30",
      bg: "bg-orange-900/20",
      subtitle: "text-orange-300",
      icon: "text-orange-400",
      badge: "bg-orange-900/30 text-orange-400",
    },
    "very-high": {
      value: "text-red-400",
      border: "border-red-800/30",
      bg: "bg-red-900/20",
      subtitle: "text-red-300",
      icon: "text-red-400",
      badge: "bg-red-900/30 text-red-400",
    },
  },
  DRAWDOWN_COLORS: {
    low: {
      value: "text-green-400",
      border: "border-green-800/30",
      bg: "bg-green-900/20",
      subtitle: "text-green-300",
      icon: "text-green-400",
      badge: "bg-green-900/30 text-green-400",
    },
    moderate: {
      value: "text-yellow-400",
      border: "border-yellow-800/30",
      bg: "bg-yellow-900/20",
      subtitle: "text-yellow-300",
      icon: "text-yellow-400",
      badge: "bg-yellow-900/30 text-yellow-400",
    },
    high: {
      value: "text-orange-400",
      border: "border-orange-800/30",
      bg: "bg-orange-900/20",
      subtitle: "text-orange-300",
      icon: "text-orange-400",
      badge: "bg-orange-900/30 text-orange-400",
    },
    severe: {
      value: "text-red-400",
      border: "border-red-800/30",
      bg: "bg-red-900/20",
      subtitle: "text-red-300",
      icon: "text-red-400",
      badge: "bg-red-900/30 text-red-400",
    },
  },
  RISK_LABELS: {
    low: "Low",
    medium: "Medium",
    high: "High",
    "very-high": "Very High",
  },
  DRAWDOWN_LABELS: {
    low: "Low",
    moderate: "Moderate",
    high: "High",
    severe: "Severe",
  },
}));

describe("RiskMetricCard", () => {
  const baseProps = {
    title: "Annualized Volatility",
    value: 25.5,
    unit: "%",
    explanation:
      "This metric reflects how much your portfolio value fluctuates.",
    contextDescription: "This level is moderate for a growth portfolio.",
    supportingData: [
      { label: "Daily Volatility", value: "1.6%" },
      { label: "Analysis Period", value: "365 days" },
    ],
    periodInfo: {
      dateRange: "Jan 1, 2024 - Dec 31, 2024",
      dataPoints: 252,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("with RiskLevel", () => {
    it("renders correctly with low risk level", () => {
      const props = {
        ...baseProps,
        riskLevel: "low" as RiskLevel,
        icon: TrendingUp,
      };

      render(<RiskMetricCard {...props} />);

      expect(screen.getByText("Annualized Volatility")).toBeInTheDocument();
      expect(screen.getByText("25.5%")).toBeInTheDocument();
      expect(screen.getByText("Low")).toBeInTheDocument();
    });

    it("renders correctly with high risk level", () => {
      const props = {
        ...baseProps,
        riskLevel: "high" as RiskLevel,
        icon: TrendingUp,
      };

      render(<RiskMetricCard {...props} />);

      expect(screen.getByText("High")).toBeInTheDocument();
    });

    it("applies correct colors for very-high risk level", () => {
      const props = {
        ...baseProps,
        riskLevel: "very-high" as RiskLevel,
        icon: TrendingUp,
      };

      const { container } = render(<RiskMetricCard {...props} />);

      const valueElement = screen.getByText("25.5%");
      expect(valueElement).toHaveClass("text-red-400");

      const badgeElement = screen.getByText("Very High");
      expect(badgeElement).toHaveClass("bg-red-900/30", "text-red-400");
    });
  });

  describe("with DrawdownLevel", () => {
    it("renders correctly with drawdown level", () => {
      const props = {
        ...baseProps,
        title: "Maximum Drawdown",
        riskLevel: "moderate" as DrawdownLevel,
        icon: TrendingDown,
      };

      render(<RiskMetricCard {...props} />);

      expect(screen.getByText("Maximum Drawdown")).toBeInTheDocument();
      expect(screen.getByText("Moderate")).toBeInTheDocument();
    });

    it("applies correct colors for severe drawdown level", () => {
      const props = {
        ...baseProps,
        riskLevel: "severe" as DrawdownLevel,
        icon: TrendingDown,
      };

      const { container } = render(<RiskMetricCard {...props} />);

      const valueElement = screen.getByText("25.5%");
      expect(valueElement).toHaveClass("text-red-400");

      const badgeElement = screen.getByText("Severe");
      expect(badgeElement).toHaveClass("bg-red-900/30", "text-red-400");
    });
  });

  describe("supporting data", () => {
    it("renders supporting data when provided", () => {
      const props = {
        ...baseProps,
        riskLevel: "medium" as RiskLevel,
        icon: TrendingUp,
      };

      render(<RiskMetricCard {...props} />);

      expect(screen.getByText("Daily Volatility")).toBeInTheDocument();
      expect(screen.getByText("1.6%")).toBeInTheDocument();
      expect(screen.getByText("Analysis Period")).toBeInTheDocument();
      expect(screen.getByText("365 days")).toBeInTheDocument();
    });

    it("hides supporting data when empty array", () => {
      const props = {
        ...baseProps,
        riskLevel: "medium" as RiskLevel,
        icon: TrendingUp,
        supportingData: [],
      };

      const { container } = render(<RiskMetricCard {...props} />);

      expect(screen.queryByText("Daily Volatility")).not.toBeInTheDocument();
      expect(
        container.querySelector(".grid.grid-cols-2")
      ).not.toBeInTheDocument();
    });
  });

  describe("period information", () => {
    it("displays period information correctly", () => {
      const props = {
        ...baseProps,
        riskLevel: "low" as RiskLevel,
        icon: TrendingUp,
      };

      render(<RiskMetricCard {...props} />);

      expect(screen.getByText(/Analysis period:/)).toBeInTheDocument();
      expect(
        screen.getByText(/Jan 1, 2024 - Dec 31, 2024/)
      ).toBeInTheDocument();
      expect(screen.getByText(/252 data points/)).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("includes proper ARIA labels", () => {
      const props = {
        ...baseProps,
        riskLevel: "medium" as RiskLevel,
        icon: TrendingUp,
      };

      render(<RiskMetricCard {...props} />);

      const valueElement = screen.getByLabelText(
        "Annualized Volatility: 25.5%"
      );
      expect(valueElement).toBeInTheDocument();

      const badgeElement = screen.getByLabelText("Risk level: Medium");
      expect(badgeElement).toBeInTheDocument();
      expect(badgeElement).toHaveAttribute("role", "status");
    });

    it("includes aria-hidden on decorative icons", () => {
      const props = {
        ...baseProps,
        riskLevel: "low" as RiskLevel,
        icon: TrendingUp,
      };

      const { container } = render(<RiskMetricCard {...props} />);

      // The calendar icon should have aria-hidden
      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe("formatting and display", () => {
    it("formats value to one decimal place", () => {
      const props = {
        ...baseProps,
        value: 25.789,
        riskLevel: "medium" as RiskLevel,
        icon: TrendingUp,
      };

      render(<RiskMetricCard {...props} />);

      expect(screen.getByText("25.8%")).toBeInTheDocument();
    });

    it("handles zero value", () => {
      const props = {
        ...baseProps,
        value: 0,
        riskLevel: "low" as RiskLevel,
        icon: TrendingUp,
      };

      render(<RiskMetricCard {...props} />);

      expect(screen.getByText("0.0%")).toBeInTheDocument();
    });

    it("handles different units", () => {
      const props = {
        ...baseProps,
        value: 1000,
        unit: "$",
        riskLevel: "medium" as RiskLevel,
        icon: TrendingUp,
      };

      render(<RiskMetricCard {...props} />);

      expect(screen.getByText("1000.0$")).toBeInTheDocument();
    });
  });

  describe("custom styling", () => {
    it("applies custom className when provided", () => {
      const props = {
        ...baseProps,
        riskLevel: "low" as RiskLevel,
        icon: TrendingUp,
        className: "custom-class",
      };

      const { container } = render(<RiskMetricCard {...props} />);

      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("applies default delay when not provided", () => {
      const props = {
        ...baseProps,
        riskLevel: "medium" as RiskLevel,
        icon: TrendingUp,
      };

      render(<RiskMetricCard {...props} />);

      // Component should render without errors
      expect(screen.getByText("Annualized Volatility")).toBeInTheDocument();
    });

    it("handles custom delay", () => {
      const props = {
        ...baseProps,
        riskLevel: "high" as RiskLevel,
        icon: TrendingUp,
        delay: 0.5,
      };

      render(<RiskMetricCard {...props} />);

      // Component should render without errors
      expect(screen.getByText("Annualized Volatility")).toBeInTheDocument();
    });
  });

  describe("explanation and context", () => {
    it("displays explanation and context correctly", () => {
      const props = {
        ...baseProps,
        riskLevel: "medium" as RiskLevel,
        icon: TrendingUp,
      };

      render(<RiskMetricCard {...props} />);

      expect(screen.getByText(/What this means:/)).toBeInTheDocument();
      expect(screen.getByText(/In context:/)).toBeInTheDocument();
      expect(screen.getByText(baseProps.explanation)).toBeInTheDocument();
      expect(
        screen.getByText(baseProps.contextDescription)
      ).toBeInTheDocument();
    });
  });
});
