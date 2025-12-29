import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StrategyAllocationDisplay } from "@/components/wallet/portfolio/components/strategy/StrategyAllocationDisplay";

describe("StrategyAllocationDisplay", () => {
  const targetAllocation = {
    spot: 40,
    lp: 30,
    stable: 30,
  };

  it("should render all allocation bars", () => {
    render(
      <StrategyAllocationDisplay targetAllocation={targetAllocation} />
    );

    expect(screen.getByText("Target Spot")).toBeInTheDocument();
    expect(screen.getByText("Target LP")).toBeInTheDocument();
    expect(screen.getByText("Target Stable")).toBeInTheDocument();
  });

  it("should display correct percentages", () => {
    render(
      <StrategyAllocationDisplay targetAllocation={targetAllocation} />
    );

    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getAllByText("30%")).toHaveLength(2); // LP and Stable both 30%
  });

  it("should render progress bars with correct widths", () => {
    const { container } = render(
      <StrategyAllocationDisplay targetAllocation={targetAllocation} />
    );

    const progressBars = container.querySelectorAll(".bg-purple-500, .bg-blue-500, .bg-emerald-500");

    expect(progressBars[0]).toHaveStyle({ width: "40%" }); // Spot
    expect(progressBars[1]).toHaveStyle({ width: "30%" }); // LP
    expect(progressBars[2]).toHaveStyle({ width: "30%" }); // Stable
  });

  it("should show maintain position message when hideAllocationTarget is true", () => {
    render(
      <StrategyAllocationDisplay
        targetAllocation={targetAllocation}
        hideAllocationTarget={true}
      />
    );

    expect(screen.getByText("Maintain current position")).toBeInTheDocument();
    expect(screen.queryByText("Target Spot")).not.toBeInTheDocument();
  });

  it("should handle zero allocations", () => {
    const zeroAllocation = {
      spot: 0,
      lp: 0,
      stable: 100,
    };

    render(<StrategyAllocationDisplay targetAllocation={zeroAllocation} />);

    expect(screen.getAllByText("0%")).toHaveLength(2); // Spot and LP both 0%
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("should render with correct color classes", () => {
    const { container } = render(
      <StrategyAllocationDisplay targetAllocation={targetAllocation} />
    );

    expect(container.querySelector(".bg-purple-500")).toBeInTheDocument(); // Spot
    expect(container.querySelector(".bg-blue-500")).toBeInTheDocument(); // LP
    expect(container.querySelector(".bg-emerald-500")).toBeInTheDocument(); // Stable
  });

  it("should show pulse animation on maintain position indicator", () => {
    const { container } = render(
      <StrategyAllocationDisplay
        targetAllocation={targetAllocation}
        hideAllocationTarget={true}
      />
    );

    const pulseIndicator = container.querySelector(".animate-pulse");
    expect(pulseIndicator).toBeInTheDocument();
  });
});
