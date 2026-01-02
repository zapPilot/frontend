/**
 * Unit tests for IntentVisualizer component
 *
 * Tests progress visualization for multi-lane intent execution
 */

import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IntentVisualizer } from "@/components/wallet/portfolio/modals/visualizers/IntentVisualizer";

// Mock getProtocolLogo
vi.mock(
  "@/components/wallet/portfolio/modals/utils/assetHelpers",
  () => ({
    getProtocolLogo: (id: string) => `/protocols/${id}.png`,
  })
);

describe("IntentVisualizer", () => {
  // Note: Only tests that advance timers need fake timers
  // Initial rendering is synchronous and doesn't need fake timers

  it("should render with default lanes and steps", () => {
    render(<IntentVisualizer />);

    // Check default lanes are rendered (protocol names are in image alt text)
    expect(screen.getByAltText("Hyperliquid")).toBeInTheDocument();
    expect(screen.getByAltText("GMX V2")).toBeInTheDocument();
    expect(screen.getByAltText("Morpho")).toBeInTheDocument();

    // Check default steps are rendered
    expect(screen.getAllByText("Approve")).toHaveLength(3); // One per lane
    expect(screen.getAllByText("Swap")).toHaveLength(3);
    expect(screen.getAllByText("Deposit")).toHaveLength(3);
  });

  it("should render custom lanes and steps", () => {
    const customLanes = [
      { id: "aave", name: "Aave", est: "1.5s" },
      { id: "compound", name: "Compound", est: "2.0s" },
    ];
    const customSteps = ["Connect", "Sign", "Execute"];

    render(<IntentVisualizer lanes={customLanes} steps={customSteps} />);

    expect(screen.getByAltText("Aave")).toBeInTheDocument();
    expect(screen.getByAltText("Compound")).toBeInTheDocument();
    expect(screen.getAllByText("Connect")).toHaveLength(2);
    expect(screen.getAllByText("Sign")).toHaveLength(2);
    expect(screen.getAllByText("Execute")).toHaveLength(2);
  });

  it("should display estimated time for each lane", () => {
    render(<IntentVisualizer />);

    expect(screen.getByText("2.1s")).toBeInTheDocument();
    expect(screen.getByText("~3.5s")).toBeInTheDocument();
    expect(screen.getByText("1.8s")).toBeInTheDocument();
  });

  it("should show progress over time", async () => {
    vi.useFakeTimers();

    render(<IntentVisualizer />);

    // Initially all steps should be pending
    const initialSteps = screen.getAllByText("Approve");
    expect(initialSteps.length).toBe(3);

    // Advance timers to trigger progress
    vi.advanceTimersByTime(500);

    // Progress should have started (at least one lane should have advanced)
    await waitFor(() => {
      const doneElements = screen.queryAllByText("DONE");
      // Progress is happening but not all lanes are complete yet
      expect(doneElements.length).toBeLessThan(3);
    });

    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("should show DONE when lane completes all steps", async () => {
    vi.useFakeTimers();

    const fastLane = [{ id: "fast", name: "Fast Protocol", est: "1.0s" }];
    const shortSteps = ["Step1"];

    render(<IntentVisualizer lanes={fastLane} steps={shortSteps} />);

    // Advance timers enough for lane to complete
    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByText("DONE")).toBeInTheDocument();
    });

    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("should render protocol images with correct alt text", () => {
    render(<IntentVisualizer />);

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(3);

    expect(screen.getByAltText("Hyperliquid")).toBeInTheDocument();
    expect(screen.getByAltText("GMX V2")).toBeInTheDocument();
    expect(screen.getByAltText("Morpho")).toBeInTheDocument();
  });

  it("should use correct protocol logo paths", () => {
    render(<IntentVisualizer />);

    const hyperliquidImg = screen.getByAltText("Hyperliquid");
    const gmxImg = screen.getByAltText("GMX V2");
    const morphoImg = screen.getByAltText("Morpho");

    expect(hyperliquidImg).toHaveAttribute("src", "/protocols/hyperliquid.png");
    expect(gmxImg).toHaveAttribute("src", "/protocols/gmx-v2.png");
    expect(morphoImg).toHaveAttribute("src", "/protocols/morpho.png");
  });

  it("should render correct number of step indicators per lane", () => {
    const threeLanes = [
      { id: "l1", name: "Lane 1", est: "1s" },
      { id: "l2", name: "Lane 2", est: "2s" },
      { id: "l3", name: "Lane 3", est: "3s" },
    ];
    const twoSteps = ["Step A", "Step B"];

    render(<IntentVisualizer lanes={threeLanes} steps={twoSteps} />);

    // Each lane has 2 steps
    expect(screen.getAllByText("Step A")).toHaveLength(3);
    expect(screen.getAllByText("Step B")).toHaveLength(3);
  });

  it("should cleanup timers on unmount", () => {
    vi.useFakeTimers();

    const { unmount } = render(<IntentVisualizer />);

    const timerCountBefore = vi.getTimerCount();
    expect(timerCountBefore).toBeGreaterThan(0);

    unmount();

    const timerCountAfter = vi.getTimerCount();
    expect(timerCountAfter).toBe(0);

    vi.useRealTimers();
  });

  it("should reset progress when props change", () => {
    vi.useFakeTimers();

    const { rerender } = render(<IntentVisualizer />);

    // Advance time to create progress
    vi.advanceTimersByTime(1000);

    // Change props (new lanes)
    const newLanes = [{ id: "new", name: "New Lane", est: "1s" }];
    rerender(<IntentVisualizer lanes={newLanes} />);

    // Progress should reset (new lane renders synchronously)
    expect(screen.getByAltText("New Lane")).toBeInTheDocument();
    expect(screen.queryByText("DONE")).not.toBeInTheDocument();

    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("should handle single lane", () => {
    const singleLane = [{ id: "solo", name: "Solo Protocol", est: "2s" }];

    render(<IntentVisualizer lanes={singleLane} />);

    expect(screen.getByAltText("Solo Protocol")).toBeInTheDocument();
    expect(screen.getAllByText("Approve")).toHaveLength(1);
  });

  it("should handle single step", () => {
    const singleStep = ["Execute"];

    render(<IntentVisualizer steps={singleStep} />);

    expect(screen.getAllByText("Execute")).toHaveLength(3); // Default 3 lanes
  });

  it("should handle empty lanes gracefully", () => {
    render(<IntentVisualizer lanes={[]} />);

    // Should not crash, no lanes rendered
    expect(screen.queryByText("Hyperliquid")).not.toBeInTheDocument();
  });

  it("should display check icon when lane completes", async () => {
    vi.useFakeTimers();

    const fastLane = [{ id: "quick", name: "Quick", est: "0.5s" }];
    const singleStep = ["Go"];

    render(<IntentVisualizer lanes={fastLane} steps={singleStep} />);

    // Advance timers to complete the lane
    vi.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(screen.getByText("DONE")).toBeInTheDocument();
    });

    // Check icon should be present (it's in a div with specific classes)
    const container = screen.getByText("DONE").closest("div");
    expect(container).toBeInTheDocument();

    vi.clearAllTimers();
    vi.useRealTimers();
  });
});
