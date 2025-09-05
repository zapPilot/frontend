import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "../../../test-utils";

// Mock lightweight child components to avoid heavy hooks
vi.mock("@/components/Navigation", () => ({
  Navigation: () => null,
}));

vi.mock("@/components/WalletPortfolio", () => ({
  WalletPortfolio: () => <div data-testid="wallet-portfolio" />,
}));

// Router mock
const replaceMock = vi.fn();
vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<any>("next/navigation");
  return {
    ...actual,
    useRouter: () => ({ replace: replaceMock }),
  };
});

// User context mock (we'll override return values per test)
let mockIsConnected = false;
let mockUserId: string | null = null;
vi.mock("@/contexts/UserContext", () => ({
  useUser: () => ({
    userInfo: mockUserId ? { userId: mockUserId } : null,
    isConnected: mockIsConnected,
    loading: false,
    error: null,
    connectedWallet: null,
    refetch: () => {},
  }),
}));

import { BundlePageClient } from "@/app/bundle/BundlePageClient";

describe("BundlePageClient switch prompt", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    mockIsConnected = false;
    mockUserId = null;
    // Default URL
    window.history.pushState({}, "", "/bundle?userId=OWNER123&foo=bar");
  });

  it("shows prompt and switches to connected user's bundle", async () => {
    mockIsConnected = true;
    mockUserId = "ME456"; // connected user is different from URL user

    render(<BundlePageClient userId="OWNER123" />);

    // Prompt visible
    const switchBtn = await screen.findByTestId("switch-to-my-bundle");
    expect(switchBtn).toBeInTheDocument();

    // Click switch
    await userEvent.click(switchBtn);

    // Should navigate to /bundle?userId=ME456&foo=bar
    expect(replaceMock).toHaveBeenCalledWith("/bundle?userId=ME456&foo=bar");
  });

  it("allows staying on the current bundle (hides prompt)", async () => {
    mockIsConnected = true;
    mockUserId = "ME456"; // different user

    render(<BundlePageClient userId="OWNER123" />);

    const switchBtn = await screen.findByTestId("switch-to-my-bundle");
    expect(switchBtn).toBeInTheDocument();

    // Click Stay
    await userEvent.click(screen.getByText(/stay/i));

    // Prompt should disappear and no navigation
    expect(screen.queryByTestId("switch-to-my-bundle")).not.toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("does not show prompt when viewing own bundle", () => {
    mockIsConnected = true;
    mockUserId = "OWNER123"; // same as URL

    render(<BundlePageClient userId="OWNER123" />);

    expect(screen.queryByTestId("switch-to-my-bundle")).not.toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
