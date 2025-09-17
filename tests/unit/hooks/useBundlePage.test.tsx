import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
    });
    mockReplace.mockReset();
    if (typeof window !== "undefined") {
      localStorage.clear();
      // @ts-expect-error jsdom location.search assignment for test setup
      window.location.search = "";
    }
  });

  it("shows switch prompt when connected and viewing another user's bundle", async () => {
    render(<Host userId="other" />);
    expect(screen.getByTestId("switch-show")).toHaveTextContent("true");
    expect(screen.getByTestId("quick-switch")).toHaveTextContent("true");
  });

  it("hides switch prompt if dismissed in localStorage", async () => {
    localStorage.setItem("dismissed-switch-other", "true");
    render(<Host userId="other" />);
    await waitFor(() =>
      expect(screen.getByTestId("switch-show")).toHaveTextContent("false")
    );
  });

  it("redirects when disconnected from own bundle", async () => {
    mockUseUser.mockReturnValue({
      userInfo: { userId: "me" },
      isConnected: false,
    });
    render(<Host userId="me" />);
    const arg = mockReplace.mock.calls[0]?.[0];
    expect(arg).toMatch(/^\/(\?foo=bar)?$/);
  });

  it("shows email banner only when connected, own bundle, no email and not dismissed", async () => {
    mockUseUser.mockReturnValue({
      userInfo: { userId: "me", email: undefined },
      isConnected: true,
    });
    render(<Host userId="me" />);
    expect(screen.getByTestId("email-banner")).toHaveTextContent("true");
  });

  it("sets bundleNotFound when getBundleUser returns null", async () => {
    mockGetBundleUser.mockResolvedValueOnce(null);
    render(<Host userId="ghost" />);
    await waitFor(() =>
      expect(screen.getByTestId("bundle-not-found")).toHaveTextContent("true")
    );
  });
});
