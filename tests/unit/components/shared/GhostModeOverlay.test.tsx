/**
 * GhostModeOverlay Component Tests
 *
 * Tests for the Ghost Mode blur overlay including:
 * - Conditional rendering based on enabled prop
 * - CTA visibility controlled by showCTA prop
 * - Blur effect application
 * - Preview badge display
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GhostModeOverlay } from "@/components/shared/GhostModeOverlay";

// Mock the ConnectWalletButton to avoid thirdweb dependencies
vi.mock("@/components/WalletManager/components/ConnectWalletButton", () => ({
  ConnectWalletButton: () => (
    <button data-testid="connect-wallet-button">Connect Wallet</button>
  ),
}));

describe("GhostModeOverlay", () => {
  const testContent = <div data-testid="test-content">Test Content</div>;

  describe("when disabled", () => {
    it("renders children without blur or overlay", () => {
      render(
        <GhostModeOverlay enabled={false}>{testContent}</GhostModeOverlay>
      );

      expect(screen.getByTestId("test-content")).toBeInTheDocument();
      expect(screen.queryByText("Preview")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("connect-wallet-button")
      ).not.toBeInTheDocument();
    });

    it("does not apply blur classes when disabled", () => {
      const { container } = render(
        <GhostModeOverlay enabled={false}>{testContent}</GhostModeOverlay>
      );

      expect(
        container.querySelector(".blur-\\[2px\\]")
      ).not.toBeInTheDocument();
    });
  });

  describe("when enabled", () => {
    it("renders children with blur effect", () => {
      const { container } = render(
        <GhostModeOverlay enabled={true}>{testContent}</GhostModeOverlay>
      );

      expect(screen.getByTestId("test-content")).toBeInTheDocument();
      expect(container.querySelector(".blur-\\[2px\\]")).toBeInTheDocument();
    });

    it("shows Preview badge", () => {
      render(<GhostModeOverlay enabled={true}>{testContent}</GhostModeOverlay>);

      expect(screen.getByText("Preview")).toBeInTheDocument();
    });

    it("shows Connect Wallet button by default", () => {
      render(<GhostModeOverlay enabled={true}>{testContent}</GhostModeOverlay>);

      expect(screen.getByTestId("connect-wallet-button")).toBeInTheDocument();
    });

    it("applies pointer-events-none to blurred content", () => {
      const { container } = render(
        <GhostModeOverlay enabled={true}>{testContent}</GhostModeOverlay>
      );

      expect(
        container.querySelector(".pointer-events-none")
      ).toBeInTheDocument();
    });
  });

  describe("showCTA prop", () => {
    it("hides Connect button when showCTA is false", () => {
      render(
        <GhostModeOverlay enabled={true} showCTA={false}>
          {testContent}
        </GhostModeOverlay>
      );

      expect(screen.getByTestId("test-content")).toBeInTheDocument();
      expect(
        screen.queryByTestId("connect-wallet-button")
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Preview")).not.toBeInTheDocument();
    });

    it("still applies blur when showCTA is false", () => {
      const { container } = render(
        <GhostModeOverlay enabled={true} showCTA={false}>
          {testContent}
        </GhostModeOverlay>
      );

      expect(container.querySelector(".blur-\\[2px\\]")).toBeInTheDocument();
    });

    it("shows Connect button by default (showCTA=true)", () => {
      render(
        <GhostModeOverlay enabled={true} showCTA={true}>
          {testContent}
        </GhostModeOverlay>
      );

      expect(screen.getByTestId("connect-wallet-button")).toBeInTheDocument();
    });
  });
});
