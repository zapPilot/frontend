/**
 * AllocationBars Component Tests
 *
 * Tests for the AllocationBars component including:
 * - Bar rendering for crypto and stable assets
 * - Tooltip behavior for small allocations (< 8%)
 * - Label visibility based on allocation size
 * - Edge cases (empty assets, zero percentages)
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AllocationBars } from "@/components/wallet/portfolio/components/AllocationBars";
import type { AllocationConstituent } from "@/types/portfolio-allocation";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Mock createPortal to render tooltip inline for testing
vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return {
    ...actual,
    createPortal: (children: React.ReactNode) => children,
  };
});

// Test fixtures
const largeCryptoAssets: AllocationConstituent[] = [
  {
    asset: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    value: 40,
    color: "#F7931A",
  },
  {
    asset: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    value: 30,
    color: "#627EEA",
  },
];

const smallCryptoAssets: AllocationConstituent[] = [
  {
    asset: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    value: 5,
    color: "#F7931A",
  },
  {
    asset: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    value: 3,
    color: "#627EEA",
  },
];

const mixedCryptoAssets: AllocationConstituent[] = [
  {
    asset: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    value: 40,
    color: "#F7931A",
  },
  {
    asset: "altcoins",
    symbol: "ALT",
    name: "Altcoins",
    value: 5,
    color: "#8B5CF6",
  },
];

describe("AllocationBars", () => {
  beforeEach(() => {
    // Mock getBoundingClientRect for tooltip positioning tests
    Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
      width: 100,
      height: 50,
      top: 200,
      left: 100,
      right: 200,
      bottom: 250,
      x: 100,
      y: 200,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("renders crypto asset bars with correct test ids", () => {
      render(
        <AllocationBars
          cryptoAssets={largeCryptoAssets}
          cryptoPercentage={70}
          stablePercentage={30}
        />
      );

      expect(screen.getByTestId("composition-btc")).toBeInTheDocument();
      expect(screen.getByTestId("composition-eth")).toBeInTheDocument();
    });

    it("renders stables bar when stablePercentage > 0", () => {
      render(
        <AllocationBars
          cryptoAssets={largeCryptoAssets}
          cryptoPercentage={60}
          stablePercentage={40}
        />
      );

      expect(screen.getByTestId("composition-stables")).toBeInTheDocument();
    });

    it("does not render stables bar when stablePercentage is 0", () => {
      render(
        <AllocationBars
          cryptoAssets={largeCryptoAssets}
          cryptoPercentage={100}
          stablePercentage={0}
        />
      );

      expect(
        screen.queryByTestId("composition-stables")
      ).not.toBeInTheDocument();
    });

    it("does not render crypto section when cryptoAssets is empty", () => {
      render(
        <AllocationBars
          cryptoAssets={[]}
          cryptoPercentage={0}
          stablePercentage={100}
        />
      );

      expect(screen.queryByTestId("composition-btc")).not.toBeInTheDocument();
      expect(screen.getByTestId("composition-stables")).toBeInTheDocument();
    });
  });

  describe("Large Allocation Labels (>= 8%)", () => {
    it("displays inline symbol text for large allocations", () => {
      render(
        <AllocationBars
          cryptoAssets={largeCryptoAssets}
          cryptoPercentage={70}
          stablePercentage={30}
        />
      );

      expect(screen.getByText("BTC")).toBeInTheDocument();
      expect(screen.getByText("ETH")).toBeInTheDocument();
    });

    it("displays STABLES text for large stable allocation", () => {
      render(
        <AllocationBars
          cryptoAssets={largeCryptoAssets}
          cryptoPercentage={60}
          stablePercentage={40}
        />
      );

      expect(screen.getByText("STABLES")).toBeInTheDocument();
    });

    it("displays percentage on hover for large allocations", () => {
      render(
        <AllocationBars
          cryptoAssets={largeCryptoAssets}
          cryptoPercentage={70}
          stablePercentage={30}
        />
      );

      // Percentage text should be in the DOM but hidden (opacity-0)
      expect(screen.getByText("40.00%")).toBeInTheDocument();
      // 30% appears twice: ETH (30%) and STABLES (30%)
      expect(screen.getAllByText("30.00%")).toHaveLength(2);
    });
  });

  describe("Small Allocation Tooltips (< 8%)", () => {
    it("does not display inline symbol for small allocations", () => {
      render(
        <AllocationBars
          cryptoAssets={smallCryptoAssets}
          cryptoPercentage={8}
          stablePercentage={92}
        />
      );

      // Small allocations should not have inline text
      const btcBar = screen.getByTestId("composition-btc");
      const inlineText = btcBar.querySelector(".font-bold.text-white");
      expect(inlineText).not.toBeInTheDocument();
    });

    it("shows tooltip on hover for small allocations", async () => {
      render(
        <AllocationBars
          cryptoAssets={smallCryptoAssets}
          cryptoPercentage={8}
          stablePercentage={92}
        />
      );

      // Find the wrapper div that has the mouse events
      const btcBar = screen.getByTestId("composition-btc");
      const tooltipWrapper = btcBar.closest(".relative.h-full.w-full");

      if (tooltipWrapper) {
        fireEvent.mouseEnter(tooltipWrapper);

        await waitFor(() => {
          // Tooltip should show the symbol and percentage
          expect(screen.getByText("BTC")).toBeInTheDocument();
          expect(screen.getByText("5.00%")).toBeInTheDocument();
        });
      }
    });

    it("hides tooltip on mouse leave", async () => {
      render(
        <AllocationBars
          cryptoAssets={smallCryptoAssets}
          cryptoPercentage={8}
          stablePercentage={92}
        />
      );

      const btcBar = screen.getByTestId("composition-btc");
      const tooltipWrapper = btcBar.closest(".relative.h-full.w-full");

      if (tooltipWrapper) {
        // Show tooltip
        fireEvent.mouseEnter(tooltipWrapper);
        await waitFor(() => {
          expect(screen.getByText("BTC")).toBeInTheDocument();
        });

        // Hide tooltip
        fireEvent.mouseLeave(tooltipWrapper);
        await waitFor(() => {
          // After mouse leave, tooltip content should be hidden
          // Since we mock createPortal, we check visibility state
          const tooltip = screen.queryByText("5.00%");
          // Tooltip might still be in DOM but hidden
          if (tooltip) {
            const tooltipContainer = tooltip.closest(".fixed");
            expect(tooltipContainer).toHaveStyle({ visibility: "hidden" });
          }
        });
      }
    });

    it("shows tooltip for small stables allocation", async () => {
      render(
        <AllocationBars
          cryptoAssets={largeCryptoAssets}
          cryptoPercentage={95}
          stablePercentage={5}
        />
      );

      const stablesBar = screen.getByTestId("composition-stables");
      const tooltipWrapper = stablesBar.closest(".relative.h-full.w-full");

      if (tooltipWrapper) {
        fireEvent.mouseEnter(tooltipWrapper);

        await waitFor(() => {
          expect(screen.getByText("STABLES")).toBeInTheDocument();
          expect(screen.getByText("5.00%")).toBeInTheDocument();
        });
      }
    });
  });

  describe("Mixed Allocations", () => {
    it("handles mix of large and small allocations correctly", () => {
      render(
        <AllocationBars
          cryptoAssets={mixedCryptoAssets}
          cryptoPercentage={45}
          stablePercentage={55}
        />
      );

      // BTC (40%) should have inline text
      expect(screen.getByText("BTC")).toBeInTheDocument();
      expect(screen.getByText("40.00%")).toBeInTheDocument();

      // ALT (5%) should not have inline text (it will appear in tooltip on hover)
      const altBar = screen.getByTestId("composition-alt");
      const altInlineText = altBar.querySelector(".font-bold.text-white");
      expect(altInlineText).not.toBeInTheDocument();

      // STABLES should have inline text
      expect(screen.getByText("STABLES")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("renders with exactly 8% allocation (boundary)", () => {
      const boundaryAsset: AllocationConstituent[] = [
        {
          asset: "bitcoin",
          symbol: "BTC",
          name: "Bitcoin",
          value: 8,
          color: "#F7931A",
        },
      ];

      render(
        <AllocationBars
          cryptoAssets={boundaryAsset}
          cryptoPercentage={8}
          stablePercentage={92}
        />
      );

      // At exactly 8%, should still show inline (>= 8 is the threshold)
      expect(screen.getByText("BTC")).toBeInTheDocument();
    });

    it("renders with 7.99% allocation (just under boundary)", () => {
      const smallBoundaryAsset: AllocationConstituent[] = [
        {
          asset: "bitcoin",
          symbol: "BTC",
          name: "Bitcoin",
          value: 7.99,
          color: "#F7931A",
        },
      ];

      render(
        <AllocationBars
          cryptoAssets={smallBoundaryAsset}
          cryptoPercentage={7.99}
          stablePercentage={92.01}
        />
      );

      // At 7.99%, should use tooltip (< 8 threshold)
      const btcBar = screen.getByTestId("composition-btc");
      const inlineText = btcBar.querySelector(".font-bold.text-white");
      expect(inlineText).not.toBeInTheDocument();
    });

    it("handles single asset correctly", () => {
      const singleAsset: AllocationConstituent[] = [
        {
          asset: "bitcoin",
          symbol: "BTC",
          name: "Bitcoin",
          value: 100,
          color: "#F7931A",
        },
      ];

      render(
        <AllocationBars
          cryptoAssets={singleAsset}
          cryptoPercentage={100}
          stablePercentage={0}
        />
      );

      expect(screen.getByTestId("composition-btc")).toBeInTheDocument();
      expect(screen.getByText("BTC")).toBeInTheDocument();
      expect(
        screen.queryByTestId("composition-stables")
      ).not.toBeInTheDocument();
    });
  });

  describe("Snapshot Tests", () => {
    it("matches snapshot for large allocations", () => {
      const { container } = render(
        <AllocationBars
          cryptoAssets={largeCryptoAssets}
          cryptoPercentage={70}
          stablePercentage={30}
        />
      );

      expect(container).toMatchSnapshot();
    });

    it("matches snapshot for small allocations", () => {
      const { container } = render(
        <AllocationBars
          cryptoAssets={smallCryptoAssets}
          cryptoPercentage={8}
          stablePercentage={92}
        />
      );

      expect(container).toMatchSnapshot();
    });

    it("matches snapshot for mixed allocations", () => {
      const { container } = render(
        <AllocationBars
          cryptoAssets={mixedCryptoAssets}
          cryptoPercentage={45}
          stablePercentage={55}
        />
      );

      expect(container).toMatchSnapshot();
    });
  });
});
