import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { vi } from "vitest";

import { AllocationTooltip } from "@/components/wallet/portfolio/components/allocation/AllocationTooltip";

// Mock createPortal to render in-place for testing
vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

describe("AllocationTooltip", () => {
  beforeEach(() => {
    // Mock getBoundingClientRect for position calculations
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 100,
      height: 50,
      top: 100,
      left: 200,
      bottom: 150,
      right: 300,
      x: 200,
      y: 100,
      toJSON: () => ({}),
    }));

    // Mock window dimensions
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });

    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 0,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render children without tooltip initially", () => {
    render(
      <AllocationTooltip label="BTC" percentage={5.5} color="#F7931A">
        <div data-testid="child-content">Child Content</div>
      </AllocationTooltip>
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.queryByText("BTC")).not.toBeInTheDocument();
  });

  it("should show tooltip on mouse enter", async () => {
    const user = userEvent.setup();

    render(
      <AllocationTooltip label="BTC" percentage={5.5} color="#F7931A">
        <div data-testid="child-content">Child Content</div>
      </AllocationTooltip>
    );

    const container = screen.getByTestId("child-content").parentElement!;

    await user.hover(container);

    // Wait for tooltip to appear
    expect(await screen.findByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("5.50%")).toBeInTheDocument();
  });

  it("should hide tooltip on mouse leave", async () => {
    const user = userEvent.setup();

    render(
      <AllocationTooltip label="ETH" percentage={3.2} color="#627EEA">
        <div data-testid="child-content">Child Content</div>
      </AllocationTooltip>
    );

    const container = screen.getByTestId("child-content").parentElement!;

    await user.hover(container);
    expect(await screen.findByText("ETH")).toBeInTheDocument();

    await user.unhover(container);

    // Tooltip should be hidden (visibility: hidden)
    const tooltip = screen.queryByText("ETH");
    expect(tooltip).not.toBeInTheDocument();
  });

  it("should apply custom color to label", async () => {
    const user = userEvent.setup();
    const customColor = "#F7931A";

    render(
      <AllocationTooltip label="BTC" percentage={7.5} color={customColor}>
        <div data-testid="child-content">Child Content</div>
      </AllocationTooltip>
    );

    const container = screen.getByTestId("child-content").parentElement!;
    await user.hover(container);

    const label = await screen.findByText("BTC");
    expect(label).toHaveStyle({ color: customColor });
  });

  it("should format percentage to 2 decimal places", async () => {
    const user = userEvent.setup();

    render(
      <AllocationTooltip label="SOL" percentage={12.3456} color="#14F195">
        <div data-testid="child-content">Child Content</div>
      </AllocationTooltip>
    );

    const container = screen.getByTestId("child-content").parentElement!;
    await user.hover(container);

    expect(await screen.findByText("12.35%")).toBeInTheDocument();
  });

  it("should handle tooltip positioning with viewport bounds", async () => {
    const user = userEvent.setup();

    // Mock container at left edge
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 100,
      height: 50,
      top: 100,
      left: 10, // Near left edge
      bottom: 150,
      right: 110,
      x: 10,
      y: 100,
      toJSON: () => ({}),
    }));

    render(
      <AllocationTooltip label="BTC" percentage={5.5} color="#F7931A">
        <div data-testid="child-content">Child Content</div>
      </AllocationTooltip>
    );

    const container = screen.getByTestId("child-content").parentElement!;
    await user.hover(container);

    const tooltip = await screen.findByText("BTC");
    // Tooltip should be rendered in a fixed position container with z-index
    expect(tooltip.closest(".fixed")).toBeInTheDocument();
  });

  it("should handle tooltip positioning near right edge", async () => {
    const user = userEvent.setup();

    // Mock container at right edge
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 100,
      height: 50,
      top: 100,
      left: 900, // Near right edge (window.innerWidth = 1024)
      bottom: 150,
      right: 1000,
      x: 900,
      y: 100,
      toJSON: () => ({}),
    }));

    render(
      <AllocationTooltip label="ETH" percentage={3.2} color="#627EEA">
        <div data-testid="child-content">Child Content</div>
      </AllocationTooltip>
    );

    const container = screen.getByTestId("child-content").parentElement!;
    await user.hover(container);

    const tooltip = await screen.findByText("ETH");
    // Tooltip should be rendered in a fixed position container with z-index
    expect(tooltip.closest(".fixed")).toBeInTheDocument();
  });

  it("should render tooltip arrow", async () => {
    const user = userEvent.setup();

    render(
      <AllocationTooltip label="BTC" percentage={5.5} color="#F7931A">
        <div data-testid="child-content">Child Content</div>
      </AllocationTooltip>
    );

    const container = screen.getByTestId("child-content").parentElement!;
    await user.hover(container);

    // Find the tooltip container
    const label = await screen.findByText("BTC");
    const tooltipContainer = label.closest(".fixed");
    expect(tooltipContainer).toBeInTheDocument();

    // Arrow is a child div with rotation transform
    const arrow = tooltipContainer?.querySelector("div[style*='rotate']");
    expect(arrow).toBeInTheDocument();
  });

  it("should handle mouse out event", async () => {
    const user = userEvent.setup();

    render(
      <AllocationTooltip label="STABLES" percentage={45.0}>
        <div data-testid="child-content">Child Content</div>
      </AllocationTooltip>
    );

    const container = screen.getByTestId("child-content").parentElement!;

    await user.hover(container);
    expect(await screen.findByText("STABLES")).toBeInTheDocument();

    // Trigger mouse out (using unhover which triggers both mouseleave and mouseout)
    await user.unhover(container);

    expect(screen.queryByText("STABLES")).not.toBeInTheDocument();
  });

  it("should use default color when no color provided", async () => {
    const user = userEvent.setup();

    render(
      <AllocationTooltip label="ALT" percentage={2.5}>
        <div data-testid="child-content">Child Content</div>
      </AllocationTooltip>
    );

    const container = screen.getByTestId("child-content").parentElement!;
    await user.hover(container);

    const label = await screen.findByText("ALT");
    expect(label).toHaveStyle({ color: "#10b981" }); // Default color
  });

  it("should handle multiple tooltip instances independently", async () => {
    const user = userEvent.setup();

    render(
      <div>
        <AllocationTooltip label="BTC" percentage={40.0} color="#F7931A">
          <div data-testid="btc-bar">BTC Bar</div>
        </AllocationTooltip>
        <AllocationTooltip label="ETH" percentage={30.0} color="#627EEA">
          <div data-testid="eth-bar">ETH Bar</div>
        </AllocationTooltip>
      </div>
    );

    // Hover over BTC
    const btcContainer = screen.getByTestId("btc-bar").parentElement!;
    await user.hover(btcContainer);
    expect(await screen.findByText("40.00%")).toBeInTheDocument();

    // ETH tooltip should not be visible
    expect(screen.queryByText("30.00%")).not.toBeInTheDocument();
  });
});
