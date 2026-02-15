import { describe, expect, it, vi } from "vitest";

import { ImpactVisual } from "@/components/wallet/portfolio/views/invest/trading/components/ImpactVisual";

import { render, screen } from "../../../../../../../../test-utils";

// Mock lucide-react icons - spread originals so transitive imports work
vi.mock("lucide-react", async importOriginal => ({
  ...(await importOriginal<typeof import("lucide-react")>()),
  ArrowRight: () => <svg data-testid="arrow-right" />,
}));

describe("ImpactVisual", () => {
  it("renders 'Allocation Impact' heading", () => {
    render(<ImpactVisual />);

    expect(screen.getByText("Allocation Impact")).toBeInTheDocument();
  });

  it("renders three legend items: BTC, LP, Stable", () => {
    render(<ImpactVisual />);

    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("LP")).toBeInTheDocument();
    expect(screen.getByText("Stable")).toBeInTheDocument();
  });

  it("renders 'Current' and 'Target' labels", () => {
    render(<ImpactVisual />);

    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByText("Target")).toBeInTheDocument();
  });

  it("renders target percentages (55%, 35%, 10%)", () => {
    render(<ImpactVisual />);

    // Target percentages for spot, lp, and stable
    expect(screen.getByText("55%")).toBeInTheDocument();
    expect(screen.getByText("35%")).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument();
  });

  it("renders ArrowRight connector", () => {
    render(<ImpactVisual />);

    expect(screen.getByTestId("arrow-right")).toBeInTheDocument();
  });
});
