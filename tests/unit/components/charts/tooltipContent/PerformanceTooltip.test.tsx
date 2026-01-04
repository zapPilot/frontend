import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PerformanceTooltip } from "@/components/charts/tooltipContent/PerformanceTooltip";
import { TooltipWrapper } from "@/components/charts/tooltipContent/TooltipWrapper";
import type { PerformanceHoverData } from "@/types/ui/chartHover";

describe("TooltipWrapper", () => {
  it("renders date and children", () => {
    render(
      <TooltipWrapper date="2024-01-15">
        <div data-testid="child">Content</div>
      </TooltipWrapper>
    );

    expect(screen.getByText("2024-01-15")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("defaults to normal spacing", () => {
    const { container } = render(
      <TooltipWrapper date="2024-01-15">
        <div>Content</div>
      </TooltipWrapper>
    );

    expect(container.querySelector(".space-y-1\\.5")).toBeInTheDocument();
  });

  it("applies tight spacing when specified", () => {
    const { container } = render(
      <TooltipWrapper date="2024-01-15" spacing="tight">
        <div>Content</div>
      </TooltipWrapper>
    );

    expect(container.querySelector(".space-y-1")).toBeInTheDocument();
  });
});

describe("PerformanceTooltip", () => {
  it("renders portfolio value", () => {
    const data: PerformanceHoverData = {
      date: "2024-01-15",
      value: 10000,
      benchmark: 9000,
    };

    render(<PerformanceTooltip data={data} />);

    expect(screen.getByText("Portfolio Value")).toBeInTheDocument();
    expect(screen.getByText("BTC Benchmark")).toBeInTheDocument();
  });

  it("shows positive relative performance in green", () => {
    const data: PerformanceHoverData = {
      date: "2024-01-15",
      value: 11000,
      benchmark: 10000,
    };

    const { container } = render(<PerformanceTooltip data={data} />);

    // Relative should be +10%
    expect(screen.getByText("Relative")).toBeInTheDocument();
    const relativeValue = container.querySelector(".text-green-400");
    expect(relativeValue).toBeInTheDocument();
  });

  it("shows negative relative performance in red", () => {
    const data: PerformanceHoverData = {
      date: "2024-01-15",
      value: 9000,
      benchmark: 10000,
    };

    const { container } = render(<PerformanceTooltip data={data} />);

    const relativeValue = container.querySelector(".text-red-400");
    expect(relativeValue).toBeInTheDocument();
  });

  it("does not show relative when benchmark is undefined", () => {
    const data: PerformanceHoverData = {
      date: "2024-01-15",
      value: 10000,
      benchmark: undefined,
    };

    render(<PerformanceTooltip data={data} />);

    expect(screen.queryByText("Relative")).not.toBeInTheDocument();
  });

  it("renders explanatory text", () => {
    const data: PerformanceHoverData = {
      date: "2024-01-15",
      value: 10000,
      benchmark: 9000,
    };

    render(<PerformanceTooltip data={data} />);

    expect(
      screen.getByText("Value if initial capital was held in BTC")
    ).toBeInTheDocument();
  });
});
