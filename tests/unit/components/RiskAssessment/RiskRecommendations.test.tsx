/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { RiskRecommendations } from "../../../../src/components/RiskAssessment/components/RiskRecommendations";

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

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  AlertCircle: ({ className, ...props }: any) => (
    <svg className={className} {...props} data-testid="alert-circle-icon" />
  ),
}));

// Mock the getRiskRecommendations function
vi.mock("../../../../src/utils/risk", () => ({
  getRiskRecommendations: vi.fn(),
}));

import { getRiskRecommendations } from "../../../../src/utils/risk";
const mockGetRiskRecommendations = vi.mocked(getRiskRecommendations);

describe("RiskRecommendations", () => {
  const defaultProps = {
    volatilityPct: 45.5,
    drawdownPct: -18.2,
  };

  const mockRecommendations = [
    {
      title: "High Volatility",
      description:
        "Consider position sizing strategies and avoid over-leveraging to manage the significant price swings.",
    },
    {
      title: "Significant Drawdowns",
      description:
        "Implement stop-loss strategies or hedging mechanisms to limit downside exposure during market stress.",
    },
    {
      title: "Diversification",
      description:
        "Review portfolio concentration and consider diversification across asset classes, sectors, and geographic regions.",
    },
    {
      title: "Regular Monitoring",
      description:
        "These metrics can change as market conditions evolve. Regular reassessment helps maintain appropriate risk levels.",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRiskRecommendations.mockReturnValue(mockRecommendations);
  });

  it("renders correctly with default props", () => {
    render(<RiskRecommendations {...defaultProps} />);

    expect(
      screen.getByText("Risk Management Considerations")
    ).toBeInTheDocument();
    expect(mockGetRiskRecommendations).toHaveBeenCalledWith(45.5, -18.2);
  });

  it("displays all recommendations returned by utility function", () => {
    render(<RiskRecommendations {...defaultProps} />);

    mockRecommendations.forEach(recommendation => {
      expect(screen.getByText(recommendation.title + ":")).toBeInTheDocument();
      expect(screen.getByText(recommendation.description)).toBeInTheDocument();
    });
  });

  it("renders the alert circle icon with correct styling", () => {
    render(<RiskRecommendations {...defaultProps} />);

    const icon = screen.getByTestId("alert-circle-icon");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass(
      "w-5",
      "h-5",
      "text-yellow-400",
      "mt-1",
      "flex-shrink-0"
    );
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("applies correct styling classes", () => {
    render(<RiskRecommendations {...defaultProps} />);

    const glassCard = screen.getByTestId("glass-card");
    expect(glassCard).toHaveClass(
      "p-6",
      "bg-yellow-900/20",
      "border",
      "border-yellow-800/30"
    );
  });

  it("applies custom className when provided", () => {
    const { container } = render(
      <RiskRecommendations {...defaultProps} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("handles custom delay prop", () => {
    render(<RiskRecommendations {...defaultProps} delay={0.5} />);

    // Component should render without errors
    expect(
      screen.getByText("Risk Management Considerations")
    ).toBeInTheDocument();
  });

  it("handles default delay when not provided", () => {
    render(<RiskRecommendations {...defaultProps} />);

    // Component should render without errors
    expect(
      screen.getByText("Risk Management Considerations")
    ).toBeInTheDocument();
  });

  it("renders with proper semantic structure", () => {
    render(<RiskRecommendations {...defaultProps} />);

    // Check heading structure
    const heading = screen.getByRole("heading", { level: 4 });
    expect(heading).toHaveTextContent("Risk Management Considerations");
    expect(heading).toHaveClass(
      "text-lg",
      "font-medium",
      "text-yellow-300",
      "mb-3"
    );

    // Check list structure
    const list = screen.getByRole("list");
    expect(list).toBeInTheDocument();
    expect(list).toHaveClass("space-y-3", "text-sm", "text-yellow-200");

    // Check list items
    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(mockRecommendations.length);
  });

  it("formats recommendation items correctly", () => {
    render(<RiskRecommendations {...defaultProps} />);

    // Check that each recommendation has the proper structure
    mockRecommendations.forEach(recommendation => {
      const titleElement = screen.getByText(recommendation.title + ":");
      expect(titleElement.tagName.toLowerCase()).toBe("strong");

      const container = titleElement.closest(".flex.items-start.space-x-2");
      expect(container).toBeInTheDocument();

      // Check for bullet point
      const bullet = container?.querySelector(
        ".w-1.h-1.rounded-full.bg-yellow-400"
      );
      expect(bullet).toBeInTheDocument();
      expect(bullet).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("handles empty recommendations array", () => {
    mockGetRiskRecommendations.mockReturnValue([]);

    render(<RiskRecommendations {...defaultProps} />);

    expect(
      screen.getByText("Risk Management Considerations")
    ).toBeInTheDocument();

    const list = screen.getByRole("list");
    expect(list).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("handles recommendations with long descriptions", () => {
    const longRecommendations = [
      {
        title: "Complex Strategy",
        description:
          "This is a very long description that provides comprehensive guidance on risk management strategies that should be implemented to ensure portfolio stability and long-term growth while maintaining appropriate risk levels across different market conditions and economic cycles.",
      },
    ];

    mockGetRiskRecommendations.mockReturnValue(longRecommendations);

    render(<RiskRecommendations {...defaultProps} />);

    expect(screen.getByText("Complex Strategy:")).toBeInTheDocument();
    expect(
      screen.getByText(longRecommendations[0].description)
    ).toBeInTheDocument();
  });

  it("handles recommendations with special characters", () => {
    const specialRecommendations = [
      {
        title: "Risk > 50%",
        description:
          "Consider strategies with <10% allocation & proper diversification—especially in volatile markets!",
      },
    ];

    mockGetRiskRecommendations.mockReturnValue(specialRecommendations);

    render(<RiskRecommendations {...defaultProps} />);

    expect(screen.getByText("Risk > 50%:")).toBeInTheDocument();
    expect(
      screen.getByText(specialRecommendations[0].description)
    ).toBeInTheDocument();
  });

  it("calls getRiskRecommendations with correct parameters", () => {
    const customProps = {
      volatilityPct: 75.8,
      drawdownPct: -25.4,
    };

    render(<RiskRecommendations {...customProps} />);

    expect(mockGetRiskRecommendations).toHaveBeenCalledWith(75.8, -25.4);
    expect(mockGetRiskRecommendations).toHaveBeenCalledTimes(1);
  });

  it("handles zero values", () => {
    const zeroProps = {
      volatilityPct: 0,
      drawdownPct: 0,
    };

    render(<RiskRecommendations {...zeroProps} />);

    expect(mockGetRiskRecommendations).toHaveBeenCalledWith(0, 0);
    expect(
      screen.getByText("Risk Management Considerations")
    ).toBeInTheDocument();
  });

  it("applies proper accessibility attributes", () => {
    render(<RiskRecommendations {...defaultProps} />);

    // Check that decorative elements have aria-hidden
    const icon = screen.getByTestId("alert-circle-icon");
    expect(icon).toHaveAttribute("aria-hidden", "true");

    const bullets = document.querySelectorAll(".w-1.h-1.rounded-full");
    bullets.forEach(bullet => {
      expect(bullet).toHaveAttribute("aria-hidden", "true");
    });
  });
});
