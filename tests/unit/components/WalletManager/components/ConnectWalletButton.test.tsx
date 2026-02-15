import { describe, expect, it } from "vitest";

import { ConnectWalletButton } from "@/components/WalletManager/components/ConnectWalletButton";

import { render, screen } from "../../../../test-utils";

describe("ConnectWalletButton", () => {
  it("renders Connect Wallet text", () => {
    render(<ConnectWalletButton />);
    expect(screen.getByText("Connect Wallet")).toBeInTheDocument();
  });

  it("renders a button element", () => {
    render(<ConnectWalletButton />);
    const button = screen.getByRole("button", { name: "Connect Wallet" });
    expect(button).toBeInTheDocument();
  });

  it("applies custom className to wrapper div", () => {
    const { container } = render(
      <ConnectWalletButton className="custom-class" />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("custom-class");
  });

  it("uses default empty className when not provided", () => {
    const { container } = render(<ConnectWalletButton />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toBe("");
  });
});
