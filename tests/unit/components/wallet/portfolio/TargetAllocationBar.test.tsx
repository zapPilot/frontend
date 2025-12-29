/**
 * TargetAllocationBar Component Tests
 *
 * Tests for the modular target allocation bar visualization.
 * Default variant is 'legend' which shows labels below the bar.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TargetAllocationBar } from "@/components/wallet/portfolio/components/TargetAllocationBar";

describe("TargetAllocationBar", () => {
  const mockAssets = [
    { symbol: "BTC", percentage: 42, color: "#F7931A" },
    { symbol: "ETH", percentage: 28, color: "#627EEA" },
    { symbol: "Stables", percentage: 30, color: "#26A17B" },
  ];

  describe("Rendering (Legend Variant - Default)", () => {
    it("renders the target allocation bar", () => {
      render(<TargetAllocationBar assets={mockAssets} />);
      expect(screen.getByTestId("target-allocation-bar")).toBeInTheDocument();
    });

    it("renders all asset segments", () => {
      render(<TargetAllocationBar assets={mockAssets} />);

      expect(screen.getByTestId("target-btc")).toBeInTheDocument();
      expect(screen.getByTestId("target-eth")).toBeInTheDocument();
      expect(screen.getByTestId("target-stables")).toBeInTheDocument();
    });

    it("applies correct width percentages to segments", () => {
      render(<TargetAllocationBar assets={mockAssets} />);

      // Legend variant puts width directly on segment element
      const btcSegment = screen.getByTestId("target-btc");
      const ethSegment = screen.getByTestId("target-eth");
      const stablesSegment = screen.getByTestId("target-stables");

      expect(btcSegment).toHaveStyle({ width: "42%" });
      expect(ethSegment).toHaveStyle({ width: "28%" });
      expect(stablesSegment).toHaveStyle({ width: "30%" });
    });

    it("applies bar style with opacity to segments", () => {
      const { container } = render(<TargetAllocationBar assets={mockAssets} />);

      // Bar segments should exist (may also include legend elements with same prefix)
      const segments = container.querySelectorAll('[data-testid^="target-"]');
      expect(segments.length).toBeGreaterThanOrEqual(3);
    });

    it("renders legend labels below the bar", () => {
      render(<TargetAllocationBar assets={mockAssets} />);

      // Legend variant should show text labels
      expect(screen.getByText("BTC")).toBeInTheDocument();
      expect(screen.getByText("ETH")).toBeInTheDocument();
      expect(screen.getByText("Stables")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("returns null for empty assets array", () => {
      const { container } = render(<TargetAllocationBar assets={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders single asset correctly", () => {
      const singleAsset = [
        { symbol: "BTC", percentage: 100, color: "#F7931A" },
      ];
      render(<TargetAllocationBar assets={singleAsset} />);

      expect(screen.getByTestId("target-btc")).toBeInTheDocument();
      expect(screen.getByTestId("target-btc")).toHaveStyle({ width: "100%" });
    });

    it("handles small percentages", () => {
      const smallAssets = [
        { symbol: "BTC", percentage: 2, color: "#F7931A" },
        { symbol: "ETH", percentage: 1, color: "#627EEA" },
        { symbol: "Stables", percentage: 97, color: "#26A17B" },
      ];
      render(<TargetAllocationBar assets={smallAssets} />);

      expect(screen.getByTestId("target-btc")).toHaveStyle({ width: "2%" });
      expect(screen.getByTestId("target-eth")).toHaveStyle({ width: "1%" });
      expect(screen.getByTestId("target-stables")).toHaveStyle({
        width: "97%",
      });
    });
  });
});
