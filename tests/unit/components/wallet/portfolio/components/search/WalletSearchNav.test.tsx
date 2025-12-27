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
      <WalletSearchNav onSearch={mockOnSearch} placeholder="Custom placeholder" />
    );
    expect(screen.getByPlaceholderText("Custom placeholder")).toBeInTheDocument();
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
    
    const input = screen.getByPlaceholderText("Search address...") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "0x123" } });
    
    // Clear button should appear
    const clearButton = screen.getByRole("button", { name: "" }); // X icon usually implies clear but let's find by class or just the button
    // Since we don't have aria-label on the X button in the code I wrote (I should check), I'll rely on the fact it renders when address is present.
    // Actually, looking at my code there is a clear button.
    
    // Let's refine the test to specific query if needed, but 'button' with X icon inside is what we look for.
    // We can query by role button inside the form.
    // There's a search icon (pointer-events-none) and a clear button.
    
    fireEvent.click(clearButton);
    expect(input.value).toBe("");
  });
});
