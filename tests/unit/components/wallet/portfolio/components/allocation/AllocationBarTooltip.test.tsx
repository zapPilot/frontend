import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AllocationBarTooltip } from "@/components/wallet/portfolio/components/allocation/AllocationBarTooltip";

describe("AllocationBarTooltip", () => {
  let rafCallbacks: FrameRequestCallback[];

  beforeEach(() => {
    rafCallbacks = [];
    // Capture rAF callbacks without executing them immediately
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(cb => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const getWrapper = (container: HTMLElement) =>
    container.querySelector(".relative.h-full.w-full")!;

  it("renders children", () => {
    render(
      <AllocationBarTooltip label="USDC" percentage={45.5}>
        <div>Child content</div>
      </AllocationBarTooltip>
    );

    expect(screen.getByText("Child content")).toBeDefined();
  });

  it("shows tooltip on mouseEnter and hides on mouseLeave", () => {
    const { container } = render(
      <AllocationBarTooltip label="USDC" percentage={45.5}>
        <div>Hover me</div>
      </AllocationBarTooltip>
    );

    expect(screen.queryByText("45.50%")).toBeNull();

    fireEvent.mouseEnter(getWrapper(container));
    expect(screen.getByText("USDC")).toBeDefined();
    expect(screen.getByText("45.50%")).toBeDefined();

    fireEvent.mouseLeave(getWrapper(container));
    expect(screen.queryByText("45.50%")).toBeNull();
  });

  it("formats percentage to 2 decimal places", () => {
    const { container } = render(
      <AllocationBarTooltip label="ETH" percentage={33.333}>
        <div>Hover</div>
      </AllocationBarTooltip>
    );

    fireEvent.mouseEnter(getWrapper(container));
    expect(screen.getByText("33.33%")).toBeDefined();
  });

  it("applies custom color prop to label", () => {
    const { container } = render(
      <AllocationBarTooltip label="BTC" percentage={50} color="#f59e0b">
        <div>Hover</div>
      </AllocationBarTooltip>
    );

    fireEvent.mouseEnter(getWrapper(container));
    const label = screen.getByText("BTC");
    expect(label.style.color).toBe("rgb(245, 158, 11)");
  });

  it("uses default color when no color prop", () => {
    const { container } = render(
      <AllocationBarTooltip label="DAI" percentage={20}>
        <div>Hover</div>
      </AllocationBarTooltip>
    );

    fireEvent.mouseEnter(getWrapper(container));
    const label = screen.getByText("DAI");
    expect(label.style.color).toBe("rgb(16, 185, 129)");
  });

  it("hides tooltip on mouseOut", () => {
    const { container } = render(
      <AllocationBarTooltip label="BTC" percentage={50}>
        <div>Hover</div>
      </AllocationBarTooltip>
    );

    const wrapper = getWrapper(container);
    fireEvent.mouseEnter(wrapper);
    expect(screen.getByText("BTC")).toBeDefined();

    fireEvent.mouseOut(wrapper);
    expect(screen.queryByText("BTC")).toBeNull();
  });

  it("calculates position with left overflow clamping", () => {
    // Mock getBoundingClientRect: container near left edge
    vi.spyOn(
      HTMLDivElement.prototype,
      "getBoundingClientRect"
    ).mockImplementation(function (this: HTMLDivElement) {
      if (this.className?.includes("relative")) {
        return {
          left: 5,
          top: 100,
          width: 30,
          height: 20,
          right: 35,
          bottom: 120,
          x: 5,
          y: 100,
          toJSON: () => ({}),
        } as DOMRect;
      }
      return {
        width: 120,
        height: 40,
        left: 0,
        top: 0,
        right: 120,
        bottom: 40,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect;
    });

    const { container } = render(
      <AllocationBarTooltip label="USDC" percentage={45.5}>
        <div>Hover</div>
      </AllocationBarTooltip>
    );

    fireEvent.mouseEnter(getWrapper(container));

    // Flush rAF callbacks to trigger calculatePosition
    act(() => {
      for (const cb of rafCallbacks) cb(0);
      rafCallbacks = [];
    });

    expect(screen.getByText("USDC")).toBeDefined();
  });

  it("calculates position with right overflow clamping", () => {
    // Container near right edge of 1024px viewport
    vi.spyOn(
      HTMLDivElement.prototype,
      "getBoundingClientRect"
    ).mockImplementation(function (this: HTMLDivElement) {
      if (this.className?.includes("relative")) {
        return {
          left: 950,
          top: 100,
          width: 50,
          height: 20,
          right: 1000,
          bottom: 120,
          x: 950,
          y: 100,
          toJSON: () => ({}),
        } as DOMRect;
      }
      return {
        width: 120,
        height: 40,
        left: 0,
        top: 0,
        right: 120,
        bottom: 40,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect;
    });

    const { container } = render(
      <AllocationBarTooltip label="ETH" percentage={33}>
        <div>Hover</div>
      </AllocationBarTooltip>
    );

    fireEvent.mouseEnter(getWrapper(container));

    act(() => {
      for (const cb of rafCallbacks) cb(0);
      rafCallbacks = [];
    });

    expect(screen.getByText("ETH")).toBeDefined();
  });

  it("calculates center position with no overflow", () => {
    vi.spyOn(
      HTMLDivElement.prototype,
      "getBoundingClientRect"
    ).mockImplementation(function (this: HTMLDivElement) {
      if (this.className?.includes("relative")) {
        return {
          left: 450,
          top: 200,
          width: 60,
          height: 30,
          right: 510,
          bottom: 230,
          x: 450,
          y: 200,
          toJSON: () => ({}),
        } as DOMRect;
      }
      return {
        width: 100,
        height: 50,
        left: 0,
        top: 0,
        right: 100,
        bottom: 50,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect;
    });

    const { container } = render(
      <AllocationBarTooltip label="DAI" percentage={25}>
        <div>Hover</div>
      </AllocationBarTooltip>
    );

    fireEvent.mouseEnter(getWrapper(container));

    act(() => {
      for (const cb of rafCallbacks) cb(0);
      rafCallbacks = [];
    });

    expect(screen.getByText("DAI")).toBeDefined();
    expect(screen.getByText("25.00%")).toBeDefined();
  });
});
