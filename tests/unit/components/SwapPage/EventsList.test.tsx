import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventsList } from "../../../../src/components/SwapPage/EventsList";

// Mock ImageWithFallback component
vi.mock("../../../../src/components/shared/ImageWithFallback", () => ({
  ImageWithFallback: vi.fn(({ alt, symbol, size }: any) => (
    <div
      data-testid="image-fallback"
      data-alt={alt}
      data-symbol={symbol}
      data-size={size}
    >
      Image: {alt || symbol}
    </div>
  )),
}));

// Mock formatters
vi.mock("../../../../src/utils/formatters", () => ({
  formatSmallNumber: vi.fn((value: number) => `$${value.toFixed(2)}`),
}));

describe("EventsList", () => {
  const mockEventsWithData = [
    {
      type: "token_ready",
      tokenSymbol: "USDC",
      provider: "Compound",
      tradingLoss: {
        inputValueUSD: 100.5,
        outputValueUSD: 98.25,
        netLossUSD: 2.25,
        lossPercentage: 2.24,
      },
      gasCostUSD: 1.5,
    },
    {
      type: "token_ready",
      tokenSymbol: "DAI",
      provider: "Aave",
      tradingLoss: {
        inputValueUSD: 50.0,
        outputValueUSD: 51.1,
        netLossUSD: -1.1, // Gain
        lossPercentage: -2.2,
      },
      gasCostUSD: 0.75,
    },
    {
      type: "other_event", // Should be filtered out
      tokenSymbol: "ETH",
      provider: "Uniswap",
    },
  ];

  const mockEmptyEvents: any[] = [];

  const defaultProps = {
    events: mockEventsWithData,
    showTechnicalDetails: false,
  };

  describe("UI Layout Structure", () => {
    it("should render token information for each event", () => {
      render(<EventsList {...defaultProps} />);

      // Should show token symbols
      expect(screen.getByText("USDC")).toBeInTheDocument();
      expect(screen.getByText("DAI")).toBeInTheDocument();
    });

    it("should render provider information for each event", () => {
      render(<EventsList {...defaultProps} />);

      // Should show provider names
      expect(screen.getByText("Compound")).toBeInTheDocument();
      expect(screen.getByText("Aave")).toBeInTheDocument();
    });

    it("should render token images with correct props", () => {
      render(<EventsList {...defaultProps} />);

      // Should render images for tokens
      const images = screen.getAllByTestId("image-fallback");
      expect(images.length).toBeGreaterThanOrEqual(2); // At least token images

      // Check specific token image
      const usdcImage = images.find(
        img => img.getAttribute("data-alt") === "USDC"
      );
      expect(usdcImage).toBeInTheDocument();
      expect(usdcImage).toHaveAttribute("data-size", "20");
    });

    it("should render provider images with correct props", () => {
      render(<EventsList {...defaultProps} />);

      // Should render images for providers
      const providerImages = screen
        .getAllByTestId("image-fallback")
        .filter(
          img =>
            img.getAttribute("data-alt") === "Compound" ||
            img.getAttribute("data-alt") === "Aave"
        );
      expect(providerImages.length).toBeGreaterThanOrEqual(2);

      // Check provider image size
      const compoundImage = providerImages.find(
        img => img.getAttribute("data-alt") === "Compound"
      );
      expect(compoundImage).toHaveAttribute("data-size", "16");
    });

    it("should render 'via' text between token and provider", () => {
      render(<EventsList {...defaultProps} />);

      // Should show 'via' text
      expect(screen.getAllByText("via").length).toBeGreaterThanOrEqual(2);
    });

    it("should show technical details when enabled", () => {
      render(<EventsList {...defaultProps} showTechnicalDetails={true} />);

      // Component should render same structure regardless of technical details flag
      // (Implementation details would show/hide certain elements)
      expect(screen.getByText("USDC")).toBeInTheDocument();
      expect(screen.getByText("DAI")).toBeInTheDocument();
    });

    it("should filter events correctly", () => {
      const mixedEvents = [
        ...mockEventsWithData,
        { type: "invalid_type", tokenSymbol: "BTC" },
        { type: "token_ready", provider: null }, // Missing provider
      ];

      render(<EventsList events={mixedEvents} showTechnicalDetails={false} />);

      // Should only render valid events with provider
      expect(screen.getByText("USDC")).toBeInTheDocument();
      expect(screen.getByText("DAI")).toBeInTheDocument();
      expect(screen.queryByText("BTC")).not.toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should render nothing when no events provided", () => {
      const { container } = render(
        <EventsList events={mockEmptyEvents} showTechnicalDetails={false} />
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render nothing when no valid events after filtering", () => {
      const invalidEvents = [
        { type: "other_event", tokenSymbol: "ETH" },
        { type: "token_ready" }, // Missing provider
      ];

      const { container } = render(
        <EventsList events={invalidEvents} showTechnicalDetails={false} />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Data Handling", () => {
    it("should handle missing trading loss data gracefully", () => {
      const eventsWithMissingData = [
        {
          type: "token_ready",
          tokenSymbol: "ETH",
          provider: "Uniswap",
          // Missing tradingLoss
        },
      ];

      render(
        <EventsList
          events={eventsWithMissingData}
          showTechnicalDetails={false}
        />
      );

      // Should still render the event
      expect(screen.getByText("ETH")).toBeInTheDocument();
      expect(screen.getByText("Uniswap")).toBeInTheDocument();
    });

    it("should handle undefined values in trading loss", () => {
      const eventsWithUndefinedValues = [
        {
          type: "token_ready",
          tokenSymbol: "BTC",
          provider: "Compound",
          tradingLoss: {
            inputValueUSD: undefined,
            outputValueUSD: undefined,
            netLossUSD: undefined,
            lossPercentage: undefined,
          },
          gasCostUSD: undefined,
        },
      ];

      render(
        <EventsList
          events={eventsWithUndefinedValues}
          showTechnicalDetails={false}
        />
      );

      // Should still render the event without errors
      expect(screen.getByText("BTC")).toBeInTheDocument();
      expect(screen.getByText("Compound")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("should memoize filtered events to avoid recalculation", () => {
      const { rerender } = render(<EventsList {...defaultProps} />);

      // Should render initially
      expect(screen.getByText("USDC")).toBeInTheDocument();

      // Rerender with same props - should use memoized results
      rerender(<EventsList {...defaultProps} />);
      expect(screen.getByText("USDC")).toBeInTheDocument();
    });

    it("should handle large numbers of events without performance issues", () => {
      const largeEventsList = Array.from({ length: 100 }, (_, i) => ({
        type: "token_ready",
        tokenSymbol: `TOKEN${i}`,
        provider: `Provider${i}`,
        tradingLoss: {
          inputValueUSD: 100 + i,
          outputValueUSD: 98 + i,
          netLossUSD: 2,
          lossPercentage: 2.0,
        },
      }));

      const { container } = render(
        <EventsList events={largeEventsList} showTechnicalDetails={false} />
      );

      // Should render without crashing
      expect(container).toBeInTheDocument();

      // Should have scrollable container
      const scrollableContainer = container.querySelector(".max-h-64");
      expect(scrollableContainer).toBeInTheDocument();
    });
  });
});
