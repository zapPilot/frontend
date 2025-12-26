import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AssetBadge } from "../../../../src/components/ui/AssetBadge";

describe("AssetBadge", () => {
  describe("Snapshot Tests - UI Design Freeze", () => {
    it("should match snapshot with default variant", () => {
      const { container } = render(<AssetBadge symbol="eth" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it("should match snapshot with highlight variant", () => {
      const { container } = render(
        <AssetBadge symbol="btc" variant="highlight" />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe("Behavior Tests", () => {
    it("should uppercase the symbol", () => {
      render(<AssetBadge symbol="eth" />);
      expect(screen.getByText("ETH")).toBeInTheDocument();
    });

    it("should apply default variant classes", () => {
      render(<AssetBadge symbol="usdc" />);
      const badge = screen.getByText("USDC");
      expect(badge).toHaveClass("bg-gray-700/50", "text-gray-300");
    });

    it("should apply highlight variant classes", () => {
      render(<AssetBadge symbol="sol" variant="highlight" />);
      const badge = screen.getByText("SOL");
      expect(badge).toHaveClass("bg-purple-600/20", "text-purple-300");
    });
  });
});
