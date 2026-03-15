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

  it("renders two legend items: Spot and Stable", () => {
    render(<ImpactVisual />);

    expect(screen.getByText("Spot")).toBeInTheDocument();
    expect(screen.getByText("Stable")).toBeInTheDocument();
  });

  it("renders 'Current' and 'Target' labels", () => {
    render(<ImpactVisual />);

    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByText("Target")).toBeInTheDocument();
  });

  it("renders target percentages (70%, 30%)", () => {
    render(<ImpactVisual />);

    expect(screen.getByText("70%")).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
  });

  it("renders ArrowRight connector", () => {
    render(<ImpactVisual />);

    expect(screen.getByTestId("arrow-right")).toBeInTheDocument();
  });
});
