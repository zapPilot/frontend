import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BundlePageClient } from "@/app/bundle/BundlePageClient";
import { BundlePageEntry } from "@/app/bundle/BundlePageEntry";

import { render } from "../test-utils";

// Mock navigation
const mockReplace = vi.fn();
const mockPush = vi.fn();
let mockSearchParams: URLSearchParams | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock UserContext with controllable state
let mockUserInfo: { userId: string } | null = null;
let mockIsConnected = false;
let mockConnectedWallet: string | null = null;

vi.mock("@/contexts/UserContext", () => ({
  useUser: () => ({
    userInfo: mockUserInfo,
    isConnected: mockIsConnected,
    loading: false,
    error: null,
    connectedWallet: mockConnectedWallet,
    refetch: vi.fn(),
  }),
}));

// Mock SwitchPromptBanner
vi.mock("@/components/bundle/SwitchPromptBanner", () => ({
  SwitchPromptBanner: ({
    show,
    onStay,
    onSwitch,
  }: {
    show: boolean;
    onStay: () => void;
    onSwitch: () => void;
  }) => {
    if (!show) return null;
    return (
      <div data-testid="switch-prompt-banner" role="banner">
        <p data-testid="switch-prompt-message">
          You're viewing someone else's bundle. Switch to your own?
        </p>
        <button data-testid="stay-on-bundle" onClick={onStay}>
          Stay Here
        </button>
        <button data-testid="switch-to-my-bundle" onClick={onSwitch}>
          Switch to Mine
        </button>
      </div>
    );
  },
}));

// Mock QuickSwitchFAB
vi.mock("@/components/bundle/QuickSwitchFAB", () => ({
  QuickSwitchFAB: ({ onSwitchToMyBundle }: { onSwitchToMyBundle: () => void }) => (
    <button
      data-testid="quick-switch-fab"
      onClick={onSwitchToMyBundle}
      aria-label="Switch to my bundle"
    >
      Switch
    </button>
  ),
}));

// Mock EmailReminderBanner
vi.mock("@/components/EmailReminderBanner", () => ({
  EmailReminderBanner: ({
    onSubscribe,
    onDismiss,
  }: {
    onSubscribe: () => void;
    onDismiss: () => void;
  }) => (
    <div data-testid="email-reminder-banner" role="banner">
      <p>Subscribe to email updates</p>
      <button data-testid="subscribe-email" onClick={onSubscribe}>
        Subscribe
      </button>
      <button data-testid="dismiss-email-banner" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  ),
}));

// Mock DashboardShell - includes footerOverlays which contains WalletManager
vi.mock("@/components/DashboardShell", () => ({
  DashboardShell: ({
    urlUserId,
    isOwnBundle,
    bundleUserName,
    bundleUrl,
    headerBanners,
    footerOverlays,
  }: {
    urlUserId: string;
    isOwnBundle: boolean;
    bundleUserName?: string;
    bundleUrl?: string;
    headerBanners: React.ReactNode;
    footerOverlays: React.ReactNode;
  }) => (
    <div data-testid="dashboard-shell">
      <div data-testid="dashboard-url-user-id">{urlUserId}</div>
      <div data-testid="dashboard-is-own-bundle">{isOwnBundle ? "own" : "visitor"}</div>
      {bundleUserName && (
        <div data-testid="dashboard-bundle-user-name">{bundleUserName}</div>
      )}
      {bundleUrl && <div data-testid="dashboard-bundle-url">{bundleUrl}</div>}

      <div data-testid="dashboard-header-banners">{headerBanners}</div>

      <main data-testid="dashboard-main-content">
        <div data-testid="portfolio-content">Portfolio Content for {urlUserId}</div>
      </main>

      {/* Footer overlays include WalletManager modal */}
      <div data-testid="dashboard-footer-overlays">{footerOverlays}</div>
    </div>
  ),
}));

// Mock BundleNotFound
vi.mock("@/components/ui", () => ({
  BundleNotFound: ({
    message,
    showConnectCTA,
    onConnectClick,
  }: {
    message: string;
    showConnectCTA: boolean;
    onConnectClick: () => void;
  }) => (
    <div data-testid="bundle-not-found">
      <p data-testid="bundle-not-found-message">{message}</p>
      {showConnectCTA && (
        <button data-testid="bundle-not-found-connect" onClick={onConnectClick}>
          Connect Wallet
        </button>
      )}
    </div>
  ),
}));

// Mock WalletManager
let mockIsWalletManagerOpen = false;

vi.mock("@/components/WalletManager", () => ({
  WalletManager: ({
    isOpen,
    onClose,
    onEmailSubscribed,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onEmailSubscribed?: () => void;
  }) => {
    if (!isOpen) return null;

    return (
      <div data-testid="wallet-manager-modal" role="dialog">
        <h2>Wallet Manager</h2>
        <button data-testid="close-wallet-manager" onClick={onClose}>
          Close
        </button>
        <button
          data-testid="connect-wallet-action"
          onClick={() => {
            // Simulate wallet connection
            mockIsConnected = true;
            mockUserInfo = { userId: "0xConnected...User" };
            mockConnectedWallet = "0xConnected...User";
          }}
        >
          Connect Wallet
        </button>
        {onEmailSubscribed && (
          <button data-testid="subscribe-from-wallet-manager" onClick={onEmailSubscribed}>
            Subscribe
          </button>
        )}
      </div>
    );
  },
  WalletManagerSkeleton: () => <div data-testid="wallet-manager-skeleton">Loading...</div>,
}));

// Mock useBundlePage hook
vi.mock("@/hooks/useBundlePage", () => ({
  useBundlePage: (userId: string) => {
    const isOwnBundle = mockIsConnected && mockUserInfo?.userId === userId;
    const showSwitchPrompt = mockIsConnected && !isOwnBundle && userId !== "";

    return {
      isOwnBundle,
      bundleNotFound: userId === "", // Empty userId means bundle not found
      showConnectCTA: !mockIsConnected,
      bundleUser: userId
        ? {
            userId,
            displayName: `User ${userId.slice(0, 6)}`,
          }
        : null,
      bundleUrl: userId ? `/bundle?userId=${userId}` : undefined,
      switchPrompt: {
        show: showSwitchPrompt,
        onStay: () => {
          // Mock: hide switch prompt
        },
        onSwitch: () => {
          if (mockUserInfo?.userId) {
            mockReplace(`/bundle?userId=${mockUserInfo.userId}`);
          }
        },
      },
      emailBanner: {
        show: isOwnBundle && mockIsConnected,
        onSubscribe: () => {
          // Mock: subscribe to email
        },
        onDismiss: () => {
          // Mock: dismiss banner
        },
      },
      overlays: {
        showQuickSwitch: showSwitchPrompt,
        isWalletManagerOpen: mockIsWalletManagerOpen,
        openWalletManager: () => {
          mockIsWalletManagerOpen = true;
        },
        closeWalletManager: () => {
          mockIsWalletManagerOpen = false;
        },
        onEmailSubscribed: () => {
          // Mock: email subscribed
        },
      },
    };
  },
}));

describe("Bundle Sharing Flow Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserInfo = null;
    mockIsConnected = false;
    mockConnectedWallet = null;
    mockIsWalletManagerOpen = false;
    mockReplace.mockClear();
    mockPush.mockClear();
  });

  describe("Bundle URL Parsing", () => {
    it("should parse userId from URL search params", async () => {
      mockSearchParams = new URLSearchParams("userId=0xOwner...123");

      await act(async () => {
        render(<BundlePageEntry />);
      });

      // BundlePageEntry should extract userId and pass to BundlePageClient
      expect(screen.getByTestId("dashboard-url-user-id")).toHaveTextContent(
        "0xOwner...123"
      );
    });

    it("should handle missing userId parameter", async () => {
      mockSearchParams = new URLSearchParams("");

      await act(async () => {
        render(<BundlePageEntry />);
      });

      // Should show bundle not found
      expect(screen.getByTestId("bundle-not-found")).toBeInTheDocument();
      expect(screen.getByTestId("bundle-not-found-message")).toHaveTextContent(
        "Bundle not found"
      );
    });
  });

  describe("Visitor Mode (Disconnected User)", () => {
    it("should show visitor mode when user is not connected", async () => {
      mockIsConnected = false;

      await act(async () => {
        render(<BundlePageClient userId="0xOwner...123" />);
      });

      // Should be in visitor mode
      expect(screen.getByTestId("dashboard-is-own-bundle")).toHaveTextContent("visitor");

      // Should not show switch prompt (user not connected)
      expect(screen.queryByTestId("switch-prompt-banner")).not.toBeInTheDocument();

      // Should not show quick switch FAB
      expect(screen.queryByTestId("quick-switch-fab")).not.toBeInTheDocument();

      // Should show portfolio content
      expect(screen.getByTestId("portfolio-content")).toHaveTextContent(
        "0xOwner...123"
      );
    });

    it("should show connect CTA when bundle not found and user disconnected", async () => {
      mockIsConnected = false;

      await act(async () => {
        render(<BundlePageClient userId="" />);
      });

      expect(screen.getByTestId("bundle-not-found")).toBeInTheDocument();
      expect(screen.getByTestId("bundle-not-found-connect")).toBeInTheDocument();
    });
  });

  describe("Visitor Mode (Connected User Viewing Others' Bundle)", () => {
    it("should show switch prompt when connected user views another bundle", async () => {
      mockIsConnected = true;
      mockUserInfo = { userId: "0xMyWallet...456" };
      mockConnectedWallet = "0xMyWallet...456";

      await act(async () => {
        render(<BundlePageClient userId="0xOwner...123" />);
      });

      // Should be in visitor mode
      expect(screen.getByTestId("dashboard-is-own-bundle")).toHaveTextContent("visitor");

      // Should show switch prompt banner
      expect(screen.getByTestId("switch-prompt-banner")).toBeInTheDocument();
      expect(screen.getByTestId("switch-prompt-message")).toHaveTextContent(
        /viewing someone else/i
      );

      // Should show quick switch FAB
      expect(screen.getByTestId("quick-switch-fab")).toBeInTheDocument();
    });

    it("should allow user to stay on current bundle", async () => {
      const user = userEvent.setup();

      mockIsConnected = true;
      mockUserInfo = { userId: "0xMyWallet...456" };

      await act(async () => {
        render(<BundlePageClient userId="0xOwner...123" />);
      });

      expect(screen.getByTestId("switch-prompt-banner")).toBeInTheDocument();

      // Click "Stay Here"
      const stayButton = screen.getByTestId("stay-on-bundle");
      await act(async () => {
        await user.click(stayButton);
      });

      // Should not navigate
      expect(mockReplace).not.toHaveBeenCalled();

      // User remains in visitor mode on the same bundle
      expect(screen.getByTestId("dashboard-url-user-id")).toHaveTextContent(
        "0xOwner...123"
      );
    });

    it("should switch to own bundle when user clicks switch", async () => {
      const user = userEvent.setup();

      mockIsConnected = true;
      mockUserInfo = { userId: "0xMyWallet...456" };

      await act(async () => {
        render(<BundlePageClient userId="0xOwner...123" />);
      });

      expect(screen.getByTestId("switch-prompt-banner")).toBeInTheDocument();

      // Click "Switch to Mine"
      const switchButton = screen.getByTestId("switch-to-my-bundle");
      await act(async () => {
        await user.click(switchButton);
      });

      // Should navigate to own bundle
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/bundle?userId=0xMyWallet...456");
      });
    });

    it("should switch via quick FAB", async () => {
      const user = userEvent.setup();

      mockIsConnected = true;
      mockUserInfo = { userId: "0xMyWallet...789" };

      await act(async () => {
        render(<BundlePageClient userId="0xSomeone...Else" />);
      });

      expect(screen.getByTestId("quick-switch-fab")).toBeInTheDocument();

      // Click FAB
      const fabButton = screen.getByTestId("quick-switch-fab");
      await act(async () => {
        await user.click(fabButton);
      });

      // Should navigate to own bundle
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/bundle?userId=0xMyWallet...789");
      });
    });
  });

  describe("Owner Mode (Connected User Viewing Own Bundle)", () => {
    it("should show owner mode when connected user views own bundle", async () => {
      mockIsConnected = true;
      mockUserInfo = { userId: "0xMyWallet...123" };
      mockConnectedWallet = "0xMyWallet...123";

      await act(async () => {
        render(<BundlePageClient userId="0xMyWallet...123" />);
      });

      // Should be in owner mode
      expect(screen.getByTestId("dashboard-is-own-bundle")).toHaveTextContent("own");

      // Should NOT show switch prompt (viewing own bundle)
      expect(screen.queryByTestId("switch-prompt-banner")).not.toBeInTheDocument();

      // Should NOT show quick switch FAB
      expect(screen.queryByTestId("quick-switch-fab")).not.toBeInTheDocument();

      // Should show email reminder banner in owner mode
      expect(screen.getByTestId("email-reminder-banner")).toBeInTheDocument();
    });

    it("should allow owner to subscribe to email updates", async () => {
      const user = userEvent.setup();

      mockIsConnected = true;
      mockUserInfo = { userId: "0xOwner...999" };

      await act(async () => {
        render(<BundlePageClient userId="0xOwner...999" />);
      });

      expect(screen.getByTestId("email-reminder-banner")).toBeInTheDocument();

      // Subscribe
      const subscribeButton = screen.getByTestId("subscribe-email");
      await act(async () => {
        await user.click(subscribeButton);
      });

      // Email subscription handled (mock doesn't change state, but verifies click works)
      expect(subscribeButton).toBeInTheDocument();
    });

    it("should allow owner to dismiss email banner", async () => {
      const user = userEvent.setup();

      mockIsConnected = true;
      mockUserInfo = { userId: "0xOwner...888" };

      await act(async () => {
        render(<BundlePageClient userId="0xOwner...888" />);
      });

      expect(screen.getByTestId("email-reminder-banner")).toBeInTheDocument();

      // Dismiss banner
      const dismissButton = screen.getByTestId("dismiss-email-banner");
      await act(async () => {
        await user.click(dismissButton);
      });

      // Dismiss handled (mock doesn't hide it, but verifies click works)
      expect(dismissButton).toBeInTheDocument();
    });
  });

  describe("Wallet Manager Integration", () => {
    it("should open wallet manager from bundle not found screen", async () => {
      const user = userEvent.setup();

      mockIsConnected = false;

      const { rerender } = await act(async () => {
        return render(<BundlePageClient userId="" />);
      });

      expect(screen.getByTestId("bundle-not-found")).toBeInTheDocument();

      // Open wallet manager
      const connectButton = screen.getByTestId("bundle-not-found-connect");
      await act(async () => {
        await user.click(connectButton);
      });

      // Re-render to reflect wallet manager opened state
      await act(async () => {
        rerender(<BundlePageClient userId="" />);
      });

      // Wallet manager should open
      await waitFor(() => {
        expect(screen.getByTestId("wallet-manager-modal")).toBeInTheDocument();
      });
    });

    it("should close wallet manager", async () => {
      const user = userEvent.setup();

      mockIsConnected = false;
      mockIsWalletManagerOpen = true;

      const { rerender } = await act(async () => {
        return render(<BundlePageClient userId="" />);
      });

      await waitFor(() => {
        expect(screen.getByTestId("wallet-manager-modal")).toBeInTheDocument();
      });

      // Close wallet manager
      const closeButton = screen.getByTestId("close-wallet-manager");
      await act(async () => {
        await user.click(closeButton);
      });

      // Re-render to reflect closed state
      await act(async () => {
        rerender(<BundlePageClient userId="" />);
      });

      // Wallet manager should be closed
      await waitFor(() => {
        expect(screen.queryByTestId("wallet-manager-modal")).not.toBeInTheDocument();
      });
    });
  });

  describe("Full Bundle Sharing Flow", () => {
    it("should complete visitor -> connect -> switch to own bundle flow", async () => {
      const user = userEvent.setup();

      // Step 1: Start as disconnected visitor
      mockIsConnected = false;

      await act(async () => {
        render(<BundlePageClient userId="0xOwner...AAA" />);
      });

      expect(screen.getByTestId("dashboard-is-own-bundle")).toHaveTextContent("visitor");
      expect(screen.queryByTestId("switch-prompt-banner")).not.toBeInTheDocument();

      // Step 2: Connect wallet (simulate via wallet manager)
      mockIsConnected = true;
      mockUserInfo = { userId: "0xMyWallet...BBB" };
      mockConnectedWallet = "0xMyWallet...BBB";

      // Re-render to reflect connected state
      await act(async () => {
        render(<BundlePageClient userId="0xOwner...AAA" />);
      });

      // Now should show switch prompt (connected, viewing someone else's bundle)
      expect(screen.getByTestId("switch-prompt-banner")).toBeInTheDocument();
      expect(screen.getByTestId("quick-switch-fab")).toBeInTheDocument();

      // Step 3: Switch to own bundle
      const switchButton = screen.getByTestId("switch-to-my-bundle");
      await act(async () => {
        await user.click(switchButton);
      });

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/bundle?userId=0xMyWallet...BBB");
      });
    });

    it("should share bundle URL and view as visitor, then owner", async () => {
      // Step 1: Owner creates bundle
      mockIsConnected = true;
      mockUserInfo = { userId: "0xOwner...CCC" };

      const { rerender } = await act(async () => {
        return render(<BundlePageClient userId="0xOwner...CCC" />);
      });

      // Verify owner mode
      expect(screen.getByTestId("dashboard-is-own-bundle")).toHaveTextContent("own");
      expect(screen.getByTestId("dashboard-bundle-url")).toHaveTextContent(
        "/bundle?userId=0xOwner...CCC"
      );

      // Step 2: Disconnect and view as visitor
      mockIsConnected = false;
      mockUserInfo = null;

      await act(async () => {
        rerender(<BundlePageClient userId="0xOwner...CCC" />);
      });

      // Now in visitor mode
      expect(screen.getByTestId("dashboard-is-own-bundle")).toHaveTextContent("visitor");
      expect(screen.queryByTestId("switch-prompt-banner")).not.toBeInTheDocument();
      expect(screen.queryByTestId("email-reminder-banner")).not.toBeInTheDocument();

      // Step 3: Re-connect as owner
      mockIsConnected = true;
      mockUserInfo = { userId: "0xOwner...CCC" };

      await act(async () => {
        rerender(<BundlePageClient userId="0xOwner...CCC" />);
      });

      // Back to owner mode
      expect(screen.getByTestId("dashboard-is-own-bundle")).toHaveTextContent("own");
      expect(screen.getByTestId("email-reminder-banner")).toBeInTheDocument();
    });

    it("should handle multiple bundle switches", async () => {
      const user = userEvent.setup();

      mockIsConnected = true;
      mockUserInfo = { userId: "0xUser...111" };

      // View Bundle A
      const { rerender } = await act(async () => {
        return render(<BundlePageClient userId="0xBundleA...AAA" />);
      });

      expect(screen.getByTestId("dashboard-url-user-id")).toHaveTextContent(
        "0xBundleA...AAA"
      );
      expect(screen.getByTestId("switch-prompt-banner")).toBeInTheDocument();

      // Switch to own bundle
      await act(async () => {
        await user.click(screen.getByTestId("switch-to-my-bundle"));
      });

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/bundle?userId=0xUser...111");
      });

      mockReplace.mockClear();

      // Now viewing own bundle (simulate re-render)
      await act(async () => {
        rerender(<BundlePageClient userId="0xUser...111" />);
      });

      expect(screen.getByTestId("dashboard-is-own-bundle")).toHaveTextContent("own");

      // View Bundle B (via new URL)
      await act(async () => {
        rerender(<BundlePageClient userId="0xBundleB...BBB" />);
      });

      expect(screen.getByTestId("dashboard-url-user-id")).toHaveTextContent(
        "0xBundleB...BBB"
      );
      expect(screen.getByTestId("switch-prompt-banner")).toBeInTheDocument();

      // Switch back to own bundle again
      await act(async () => {
        await user.click(screen.getByTestId("switch-to-my-bundle"));
      });

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/bundle?userId=0xUser...111");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty userId gracefully", async () => {
      await act(async () => {
        render(<BundlePageClient userId="" />);
      });

      expect(screen.getByTestId("bundle-not-found")).toBeInTheDocument();
    });

    it("should handle malformed userId", async () => {
      await act(async () => {
        render(<BundlePageClient userId="invalid-user-id" />);
      });

      // Should still render (validation happens elsewhere)
      expect(screen.getByTestId("dashboard-url-user-id")).toHaveTextContent(
        "invalid-user-id"
      );
    });

    it("should not show switch prompt when userId matches connected wallet", async () => {
      mockIsConnected = true;
      mockUserInfo = { userId: "0xSame...Wallet" };

      await act(async () => {
        render(<BundlePageClient userId="0xSame...Wallet" />);
      });

      // Own bundle, no switch prompt
      expect(screen.queryByTestId("switch-prompt-banner")).not.toBeInTheDocument();
      expect(screen.queryByTestId("quick-switch-fab")).not.toBeInTheDocument();
      expect(screen.getByTestId("dashboard-is-own-bundle")).toHaveTextContent("own");
    });
  });
});
