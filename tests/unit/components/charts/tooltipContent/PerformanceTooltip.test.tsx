import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PerformanceTooltip } from "@/components/charts/tooltipContent/PerformanceTooltip";
import type { PerformanceHoverData } from "@/types/ui/chartHover";

const baseData: PerformanceHoverData = {
  chartType: "performance",
  x: 100,
  y: 100,
  date: "2024-01-01",
  value: 12000,
  benchmark: 10000,
};

describe("PerformanceTooltip", () => {
  it("renders portfolio value and benchmark", () => {
    render(<PerformanceTooltip data={baseData} />);

    expect(screen.getByText("Portfolio Value")).toBeInTheDocument();
    expect(screen.getByText("$12,000.00")).toBeInTheDocument();
    expect(screen.getByText("BTC Benchmark")).toBeInTheDocument();
    expect(screen.getByText("$10,000.00")).toBeInTheDocument();
  });

  it("calculates relative performance correctly (positive)", () => {
    // 12000 vs 10000 = +20%
    render(<PerformanceTooltip data={baseData} />);

    expect(screen.getByText("Relative")).toBeInTheDocument();
    expect(screen.getByText("+20.0%")).toBeInTheDocument();
  });

  it("calculates relative performance correctly (negative)", () => {
    // 8000 vs 10000 = -20%
    render(
      <PerformanceTooltip
        data={{ ...baseData, value: 8000, benchmark: 10000 }}
      />
    );

    expect(screen.getByText("Relative")).toBeInTheDocument();
    expect(screen.getByText("-20.0%")).toBeInTheDocument();
  });

  it("displays methodology explanation text", () => {
    render(<PerformanceTooltip data={baseData} />);

    expect(
      screen.getByText("Value if initial capital was held in BTC")
    ).toBeInTheDocument();
  });

  it("handles missing benchmark gracefuly", () => {
    render(
      <PerformanceTooltip data={{ ...baseData, benchmark: undefined }} />
    );

    // Benchmark row should be hidden or show placeholder?
    // Implementation shows row if value passed, but here undefined.
    // Looking at source: value={data.benchmark}, if undefined passed to TooltipRow it might crash or render empty.
    // PerformanceTooltip.tsx logic:
    // const benchmark = data.benchmark;
    // ...
    // <TooltipRow value={data.benchmark} ... />
    // We should check what TooltipRow does with undefined.
    // But more importantly, check that "Relative" row is NOT shown.

    expect(screen.queryByText("Relative")).not.toBeInTheDocument();
    // Methodology text is static, so it should still be there
    expect(
      screen.getByText("Value if initial capital was held in BTC")
    ).toBeInTheDocument();
  });
});
