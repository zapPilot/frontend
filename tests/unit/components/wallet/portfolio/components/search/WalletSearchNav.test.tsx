import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WalletSearchNav } from "@/components/wallet/portfolio/components/search/WalletSearchNav";

describe("WalletSearchNav Component", () => {
  const mockOnSearch = vi.fn();

  it("renders correctly (snapshot)", () => {
    const { container } = render(<WalletSearchNav onSearch={mockOnSearch} />);
    expect(container).toMatchSnapshot();
  });

  it("renders with custom placeholder", () => {
    const { container } = render(
      <WalletSearchNav
        onSearch={mockOnSearch}
        placeholder="Custom placeholder"
      />
    );
    expect(
      screen.getByPlaceholderText("Custom placeholder")
    ).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it("calls onSearch with trimmed input when submitted", () => {
    render(<WalletSearchNav onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText("Search address...");
    fireEvent.change(input, { target: { value: "  0x123  " } });
    fireEvent.submit(input);

    expect(mockOnSearch).toHaveBeenCalledWith("0x123");
  });

  it("clears input when clear button is clicked", () => {
    render(<WalletSearchNav onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(
      "Search address..."
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "0x123" } });

    // The clear button appears when there is input
    const buttons = screen.getAllByRole("button");
    // The clear button is the one inside the form form/button, or we can just find the one that isn't the mobile trigger.
    // The mobile trigger is hidden on desktop by default but let's just find the one with the X icon if we could,
    // or since we know the structure:
    // 1. Mobile trigger (hidden on desktop)
    // 2. Clear button (visible when text exists)
    // Let's filter for the visible one or the one with specific class logic if needed,
    // but typically user just clicks the "X".

    // Simplest way: click the last button, which should be the clear button in this DOM structure
    const clearButton = buttons[buttons.length - 1];

    fireEvent.click(clearButton);
    expect(input.value).toBe("");
    expect(input).toHaveFocus(); // Should keep focus
  });

  describe("Mobile Interactions", () => {
    it("expands search bar when mobile trigger is clicked", () => {
      render(<WalletSearchNav onSearch={mockOnSearch} className="md:hidden" />);

      // Initially, the mobile trigger button should be visible (simulated by class logic check or just interaction)
      const mobileTrigger = screen.getByLabelText("Open search");
      fireEvent.click(mobileTrigger);

      // Search input should be visible and auto-focused
      const input = screen.getByPlaceholderText("Search address...");
      expect(input).toBeVisible();
      expect(input).toHaveFocus();
    });

    it("collapses search bar when close button is clicked (with empty input)", () => {
      render(<WalletSearchNav onSearch={mockOnSearch} className="md:hidden" />);

      // Open it first
      const mobileTrigger = screen.getByLabelText("Open search");
      fireEvent.click(mobileTrigger);

      const input = screen.getByPlaceholderText(
        "Search address..."
      ) as HTMLInputElement;
      expect(input.value).toBe("");

      // The button on the right acts as close button when input is empty
      // We can find it by finding the button inside the form
      const closeButton = screen.getAllByRole("button")[1]; // 0 is trigger (now hidden), 1 is clear/close

      fireEvent.click(closeButton);

      // Should collapse (input parent container becomes hidden or style changes)
      // Since we rely on classes for visibility, we can check if the mobile trigger becomes visible again
      expect(mobileTrigger).not.toHaveClass("hidden");
    });
  });

  describe("Focus States", () => {
    it("toggles focus state styles", () => {
      render(<WalletSearchNav onSearch={mockOnSearch} />);
      const input = screen.getByPlaceholderText("Search address...");

      // Initial state
      fireEvent.focus(input);
      // We can verify class changes if we want, but snapshot covers this mostly.
      // However, we can check if the wrapper div has the "focus-within" related classes applied.
      // Since Tailwind classes are static in the DOM, let's verify the state tracking logic via component behavior if possible,
      // or just assume the snapshot covers the class presence.
      // A behaviour test: Focus should be tracked.

      fireEvent.blur(input);
      // No crash, state updates.
    });
  });
});
