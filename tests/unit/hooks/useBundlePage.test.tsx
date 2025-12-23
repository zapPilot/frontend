/**
 * useBundlePage - Integration Tests with React
 *
 * This file contains comprehensive integration tests for the useBundlePage hook
 * with full React rendering, component interaction, and mocked dependencies.
 * These tests verify the hook's behavior with React state, effects, navigation,
 * and user interactions.
 *
 * For fast unit tests of the isolated pure helper functions without React
 * overhead, see useBundlePage.test.ts
 *
 * Test Coverage:
 * - Switch prompt banner visibility and behavior
 * - Email subscription banner flow (show/dismiss/subscribe)
 * - Navigation redirects (disconnected user, own bundle)
 * - Bundle not found error handling
 * - Loading state behavior
 * - User interaction flows (clicks, state updates)
 *
 * Mocked Dependencies:
 * - next/navigation (router.replace)
 * - UserContext (useUser hook)
 * - bundleService (getBundleUser, isOwnBundle, generateBundleUrl)
 */

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBundlePage } from "../../../src/hooks/useBundlePage";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockUseUser = vi.fn();
vi.mock("../../../src/contexts/UserContext", () => ({
  useUser: () => mockUseUser(),
}));

const mockGetBundleUser = vi.fn();
const mockIsOwnBundle = vi.fn((uid: string, cur?: string) => uid === cur);
const mockGenerateBundleUrl = vi.fn((uid: string) => `/bundle?userId=${uid}`);
vi.mock("../../../src/services/bundleService", () => ({
  getBundleUser: (...args: any[]) => mockGetBundleUser(...args),
  isOwnBundle: (...args: any[]) => mockIsOwnBundle(...args),
  generateBundleUrl: (...args: any[]) => mockGenerateBundleUrl(...args),
}));

function Host({ userId }: { userId: string }) {
  const vm = useBundlePage(userId);
  return (
    <div>
      <div data-testid="switch-show">{String(vm.switchPrompt.show)}</div>
      <div data-testid="quick-switch">
        {String(vm.overlays.showQuickSwitch)}
      </div>
      <div data-testid="email-banner">{String(vm.emailBanner.show)}</div>
      <div data-testid="bundle-not-found">{String(vm.bundleNotFound)}</div>
      <button onClick={vm.switchPrompt.onStay}>stay</button>
      <button onClick={vm.emailBanner.onSubscribe}>email-subscribe</button>
      <button onClick={vm.emailBanner.onDismiss}>email-dismiss</button>
      <button onClick={vm.overlays.onEmailSubscribed}>email-complete</button>
    </div>
  );
}

describe("useBundlePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBundleUser.mockResolvedValue({ displayName: "Alice" });
    mockUseUser.mockReturnValue({
      userInfo: { userId: "me" },
      isConnected: true,
      loading: false,
    });
    mockReplace.mockReset();
    if (typeof window !== "undefined") {
      localStorage.clear();
      // Reset URL without triggering jsdom navigation side effects
      window.history.pushState({}, "", "/");
    }
  });

  it("shows switch prompt when connected and viewing another user's bundle", async () => {
    await act(async () => {
      render(<Host userId="other" />);
    });
    await waitFor(() =>
      expect(screen.getByTestId("switch-show")).toHaveTextContent("true")
    );
    await waitFor(() =>
      expect(screen.getByTestId("quick-switch")).toHaveTextContent("true")
    );
  });

  it("always shows switch prompt when viewing different bundle (no dismissal)", async () => {
    // NEW: Banner always shows when viewing different user's bundle
    const { unmount } = render(<Host userId="other" />);
    await waitFor(() =>
      expect(screen.getByTestId("switch-show")).toHaveTextContent("true")
    );

    // Even with localStorage, banner should still show (no persistence)
    localStorage.setItem("dismissed-switch-other", "true");

    // Unmount and re-mount to test persistence
    unmount();
    await act(async () => {
      render(<Host userId="other" />);
    });
    await waitFor(() =>
      expect(screen.getByTestId("switch-show")).toHaveTextContent("true")
    );
  });

  it("redirects when disconnected from own bundle", async () => {
    mockUseUser.mockReturnValue({
      userInfo: { userId: "me" },
      isConnected: false,
      loading: false,
    });
    await act(async () => {
      render(<Host userId="me" />);
    });
    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    const arg = mockReplace.mock.calls[0]?.[0];
    expect(arg).toMatch(/^\/(\?userId=[^&]+)?$/);
  });

  it("shows email banner only when connected, own bundle, no email and not dismissed", async () => {
    mockUseUser.mockReturnValue({
      userInfo: { userId: "me", email: undefined },
      isConnected: true,
      loading: false,
    });
    await act(async () => {
      render(<Host userId="me" />);
    });
    await waitFor(() =>
      expect(screen.getByTestId("email-banner")).toHaveTextContent("true")
    );
  });

  it("sets bundleNotFound when getBundleUser returns null", async () => {
    mockGetBundleUser.mockResolvedValueOnce(null);
    await act(async () => {
      render(<Host userId="ghost" />);
    });
    await waitFor(() =>
      expect(screen.getByTestId("bundle-not-found")).toHaveTextContent("true")
    );
  });

  it("switchPrompt.onStay is no-op (banner persists)", async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<Host userId="other" />);
    });
    await waitFor(() =>
      expect(screen.getByTestId("switch-show")).toHaveTextContent("true")
    );

    // Click stay button (no-op in new implementation)
    await user.click(screen.getByText("stay"));

    // Banner should still be visible (no dismissal)
    await waitFor(() =>
      expect(screen.getByTestId("switch-show")).toHaveTextContent("true")
    );
  });

  it("email banner toggles: dismiss hides; subscribe flow hides after completion", async () => {
    const user = userEvent.setup();
    mockUseUser.mockReturnValue({
      userInfo: { userId: "me", email: undefined },
      isConnected: true,
      loading: false,
    });
    let unmount: () => void;
    await act(async () => {
      const res = render(<Host userId="me" />);
      unmount = res.unmount;
    });
    // Dismiss path
    await waitFor(() =>
      expect(screen.getByTestId("email-banner")).toHaveTextContent("true")
    );
    await user.click(screen.getByText("email-dismiss"));
    await waitFor(() =>
      expect(screen.getByTestId("email-banner")).toHaveTextContent("false")
    );
    // Subscribe + complete path (fresh mount to reset banner dismissal state)
    await act(async () => {
      unmount!();
    });
    await act(async () => {
      render(<Host userId="me" />);
    });
    await waitFor(() =>
      expect(screen.getByTestId("email-banner")).toHaveTextContent("true")
    );
    await user.click(screen.getByText("email-subscribe"));
    await user.click(screen.getByText("email-complete"));
    await waitFor(() =>
      expect(screen.getByTestId("email-banner")).toHaveTextContent("false")
    );
  });

  it("should not show banner while userInfo is loading", async () => {
    mockUseUser.mockReturnValue({
      userInfo: null,
      isConnected: true,
      loading: true,
    });

    await act(async () => {
      render(<Host userId="other" />);
    });

    // Banner should NOT show while loading
    await waitFor(() =>
      expect(screen.getByTestId("switch-show")).toHaveTextContent("false")
    );
  });

  it("shows banner after loading completes with different userId", async () => {
    // Start with loading
    mockUseUser.mockReturnValue({
      userInfo: null,
      isConnected: true,
      loading: true,
    });

    const { rerender } = render(<Host userId="other" />);

    // Verify banner hidden during loading
    await waitFor(() =>
      expect(screen.getByTestId("switch-show")).toHaveTextContent("false")
    );

    // Simulate loading complete
    mockUseUser.mockReturnValue({
      userInfo: { userId: "me" },
      isConnected: true,
      loading: false,
    });

    rerender(<Host userId="other" />);

    // Banner should NOW appear
    await waitFor(() =>
      expect(screen.getByTestId("switch-show")).toHaveTextContent("true")
    );
  });
});
