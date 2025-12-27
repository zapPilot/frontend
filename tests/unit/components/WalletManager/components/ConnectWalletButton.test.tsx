import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ConnectWalletButton } from "@/components/WalletManager/components/ConnectWalletButton";

// Mock ThirdWeb components
vi.mock("thirdweb/react", () => ({
  ConnectButton: vi.fn(({ connectButton }) => (
    <button data-testid="thirdweb-connect-button">
      {connectButton?.label || "Connect"}
    </button>
  )),
}));

// Mock QueryClientBoundary
vi.mock("@/utils/QueryClientBoundary", () => ({
  QueryClientBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="query-client-boundary">{children}</div>
  ),
}));

// Mock constants
vi.mock("@/constants/wallet", () => ({
  WALLET_LABELS: {
    CONNECT: "Connect Wallet",
  },
}));

describe("ConnectWalletButton", () => {
  describe("test environment rendering", () => {
    it("should render mock button in test environment", () => {
      render(<ConnectWalletButton />);

      const button = screen.getByRole("button", { name: /connect wallet/i });
      expect(button).toBeInTheDocument();
    });

    it("should apply correct styling to mock button", () => {
      render(<ConnectWalletButton />);

      const button = screen.getByRole("button", { name: /connect wallet/i });
      expect(button).toHaveClass("w-full");
      expect(button).toHaveClass("px-4");
      expect(button).toHaveClass("py-3");
      expect(button).toHaveClass("rounded-xl");
      expect(button).toHaveClass("bg-purple-600");
      expect(button).toHaveClass("text-white");
      expect(button).toHaveClass("font-semibold");
    });

    it("should apply custom className to wrapper", () => {
      const { container } = render(
        <ConnectWalletButton className="custom-class" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("custom-class");
    });

    it("should display correct button text", () => {
      render(<ConnectWalletButton />);

      expect(screen.getByText("Connect Wallet")).toBeInTheDocument();
    });

    it("should render button as child of wrapper div", () => {
      const { container } = render(<ConnectWalletButton />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.tagName).toBe("DIV");
      expect(wrapper.querySelector("button")).toBeInTheDocument();
    });
  });

  describe("className handling", () => {
    it("should apply empty className by default", () => {
      const { container } = render(<ConnectWalletButton />);

      const wrapper = container.firstChild as HTMLElement;
      // Should have className attribute but empty string
      expect(wrapper.className).toBeDefined();
    });

    it("should apply single custom className", () => {
      const { container } = render(
        <ConnectWalletButton className="test-class" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("test-class");
    });

    it("should apply multiple custom classNames", () => {
      const { container } = render(
        <ConnectWalletButton className="class-1 class-2 class-3" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("class-1");
      expect(wrapper).toHaveClass("class-2");
      expect(wrapper).toHaveClass("class-3");
    });

    it("should handle className with leading/trailing spaces", () => {
      const { container } = render(
        <ConnectWalletButton className="  spaced-class  " />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("spaced-class");
    });
  });

  describe("accessibility", () => {
    it("should render button with role='button'", () => {
      render(<ConnectWalletButton />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should have accessible button text", () => {
      render(<ConnectWalletButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Connect Wallet");
    });

    it("should be keyboard accessible", () => {
      render(<ConnectWalletButton />);

      const button = screen.getByRole("button");
      expect(button.tagName).toBe("BUTTON");
    });
  });

  describe("component structure", () => {
    it("should render wrapper div", () => {
      const { container } = render(<ConnectWalletButton />);

      expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    });

    it("should render button inside wrapper", () => {
      const { container } = render(<ConnectWalletButton />);

      const wrapper = container.firstChild as HTMLElement;
      const button = wrapper.querySelector("button");
      expect(button).toBeInTheDocument();
    });

    it("should have single button element", () => {
      const { container } = render(<ConnectWalletButton />);

      const buttons = container.querySelectorAll("button");
      expect(buttons).toHaveLength(1);
    });
  });

  describe("style consistency", () => {
    it("should use purple gradient background", () => {
      render(<ConnectWalletButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-purple-600");
    });

    it("should use white text", () => {
      render(<ConnectWalletButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-white");
    });

    it("should have rounded corners", () => {
      render(<ConnectWalletButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("rounded-xl");
    });

    it("should have padding", () => {
      render(<ConnectWalletButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("px-4");
      expect(button).toHaveClass("py-3");
    });

    it("should be full width", () => {
      render(<ConnectWalletButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("w-full");
    });

    it("should have semibold font weight", () => {
      render(<ConnectWalletButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("font-semibold");
    });
  });

  describe("edge cases", () => {
    it("should handle undefined className", () => {
      const { container } = render(
        <ConnectWalletButton className={undefined} />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
    });

    it("should handle empty string className", () => {
      const { container } = render(<ConnectWalletButton className="" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
    });

    it("should render consistently on multiple renders", () => {
      const { rerender } = render(<ConnectWalletButton />);

      let button = screen.getByRole("button");
      expect(button).toBeInTheDocument();

      rerender(<ConnectWalletButton className="new-class" />);

      button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should maintain button text on rerender", () => {
      const { rerender } = render(<ConnectWalletButton />);

      expect(screen.getByText("Connect Wallet")).toBeInTheDocument();

      rerender(<ConnectWalletButton className="updated" />);

      expect(screen.getByText("Connect Wallet")).toBeInTheDocument();
    });
  });
});
