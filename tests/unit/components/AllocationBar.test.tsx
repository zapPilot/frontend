import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AllocationBar } from "../../../src/components/wallet/portfolio/views/backtesting/components/AllocationBar";

describe("AllocationBar", () => {
  it("renders simple spot/stable/lp allocation", () => {
    const constituents = {
      spot: 50,
      stable: 30,
      lp: 20,
    };
    render(
      <AllocationBar
        displayName="Simple Strategy"
        constituents={constituents}
      />
    );

    expect(screen.getByText("Simple Strategy")).toBeDefined();
    expect(screen.getByTitle(/Spot: 50.0%/)).toBeDefined();
    expect(screen.getByTitle(/Stable: 30.0%/)).toBeDefined();
    expect(screen.getByTitle(/LP: 20.0%/)).toBeDefined();
  });

  it("renders detailed spot breakdown (BTC/ETH)", () => {
    const constituents = {
      spot: { btc: 6000, eth: 4000 },
      stable: 0,
      lp: 0,
    };
    render(
      <AllocationBar
        displayName="Detailed Strategy"
        constituents={constituents}
      />
    );

    // Total = 10000. BTC = 60%, ETH = 40%
    expect(screen.getByTitle(/BTC: 60.0%/)).toBeDefined();
    expect(screen.getByTitle(/ETH: 40.0%/)).toBeDefined();
    
    // Check for legend
    expect(screen.getByText(/BTC: 60.0%/)).toBeDefined();
    expect(screen.getByText(/ETH: 40.0%/)).toBeDefined();
  });

  it("renders detailed LP breakdown", () => {
    const constituents = {
      spot: 0,
      stable: 0,
      lp: { btc: 100, eth: 100 },
    };
    render(
      <AllocationBar
        displayName="LP Strategy"
        constituents={constituents}
      />
    );

    expect(screen.getByTitle(/LP BTC: 50.0%/)).toBeDefined();
    expect(screen.getByTitle(/LP ETH: 50.0%/)).toBeDefined();
  });

  it("handles zero values correctly", () => {
    const constituents = {
      spot: { btc: 0, eth: 100 },
      stable: 0,
      lp: 0,
    };
    render(
      <AllocationBar
        displayName="Zero Check"
        constituents={constituents}
      />
    );

    expect(screen.queryByTitle(/BTC/)).toBeNull();
    expect(screen.getByTitle(/ETH: 100.0%/)).toBeDefined();
  });

  it("returns null when total is zero", () => {
    const constituents = {
      spot: 0,
      stable: 0,
      lp: 0,
    };
    const { container } = render(
      <AllocationBar
        displayName="Empty"
        constituents={constituents}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
