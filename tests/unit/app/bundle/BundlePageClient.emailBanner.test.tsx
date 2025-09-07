import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "../../../test-utils";

// Lightweight stubs to isolate the banner logic
vi.mock("@/components/Navigation", () => ({
  Navigation: () => null,
}));

vi.mock("@/components/WalletPortfolio", () => ({
  WalletPortfolio: () => <div data-testid="wallet-portfolio" />,
}));

vi.mock("@/components/bundle", () => ({
  QuickSwitchFAB: () => null,
}));

// Stub WalletManager to expose a control that calls onEmailSubscribed
vi.mock("@/components/WalletManager", () => ({
  WalletManager: ({
    onEmailSubscribed,
  }: {
    onEmailSubscribed?: () => void;
  }) => (
    <button
      type="button"
      data-testid="confirm-email-subscribe"
      onClick={() => onEmailSubscribed && onEmailSubscribed()}
    >
      Confirm Subscribe
    </button>
  ),
}));

// Router mock
vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<any>("next/navigation");
  return {
    ...actual,
    useRouter: () => ({ replace: vi.fn() }),
  };
});

// User context mock (overridden per test)
let mockIsConnected = false;
let mockUserId: string | null = null;
let mockEmail: string | undefined = undefined;
vi.mock("@/contexts/UserContext", () => ({
  useUser: () => ({
    userInfo: mockUserId ? { userId: mockUserId, email: mockEmail } : null,
    isConnected: mockIsConnected,
    loading: false,
    error: null,
    connectedWallet: null,
    refetch: () => {},
  }),
}));

import { BundlePageClient } from "@/app/bundle/BundlePageClient";

describe("EmailReminderBanner behavior (no localStorage persistence)", () => {
  beforeEach(() => {
    mockIsConnected = true;
    mockUserId = "OWNER123"; // viewing own bundle
    mockEmail = undefined; // no email saved → banner eligible
    window.history.pushState({}, "", "/bundle?userId=OWNER123");

    // Reset spies across tests
    vi.restoreAllMocks();
  });

  it("shows banner initially and does not touch localStorage on render", () => {
    const getSpy = vi.spyOn(Storage.prototype, "getItem");
    const setSpy = vi.spyOn(Storage.prototype, "setItem");

    render(<BundlePageClient userId="OWNER123" />);

    expect(screen.getByText(/subscribe to email reports/i)).toBeInTheDocument();
    expect(getSpy).not.toHaveBeenCalled();
    expect(setSpy).not.toHaveBeenCalled();
  });

  it("hides when clicking Later, without using localStorage", async () => {
    const setSpy = vi.spyOn(Storage.prototype, "setItem");

    render(<BundlePageClient userId="OWNER123" />);
    await userEvent.click(screen.getByText(/later/i));

    expect(
      screen.queryByText(/subscribe to email reports/i)
    ).not.toBeInTheDocument();
    expect(setSpy).not.toHaveBeenCalled();
  });

  it("does not persist dismissal across remounts", async () => {
    const { unmount } = render(<BundlePageClient userId="OWNER123" />);
    await userEvent.click(screen.getByText(/later/i));
    expect(
      screen.queryByText(/subscribe to email reports/i)
    ).not.toBeInTheDocument();

    // Remount fresh
    unmount();
    render(<BundlePageClient userId="OWNER123" />);
    expect(screen.getByText(/subscribe to email reports/i)).toBeInTheDocument();
  });

  it("hides after completing subscription via WalletManager (onEmailSubscribed)", async () => {
    render(<BundlePageClient userId="OWNER123" />);

    // Open subscribe flow
    await userEvent.click(screen.getByText(/subscribe now/i));

    // Trigger mocked WalletManager success which calls onEmailSubscribed
    await userEvent.click(screen.getByTestId("confirm-email-subscribe"));

    expect(
      screen.queryByText(/subscribe to email reports/i)
    ).not.toBeInTheDocument();
  });
});
