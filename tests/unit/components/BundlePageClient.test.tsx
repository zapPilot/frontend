import { render, screen, fireEvent, act } from "../../test-utils";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BundlePageClient } from "../../../src/app/bundle/BundlePageClient";
import { useUser } from "../../../src/contexts/UserContext";
import * as bundleService from "../../../src/services/bundleService";

// Mock dependencies
vi.mock("../../../src/contexts/UserContext");
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

// Mock the bundleService
vi.mock("../../../src/services/bundleService", () => ({
  isOwnBundle: vi.fn(),
  generateBundleUrl: vi.fn(),
  getBundleUser: vi.fn(),
}));

// Mock DashboardShell to focus on banner logic
vi.mock("../../../src/components/DashboardShell", () => ({
  DashboardShell: vi.fn(({ headerBanners }) => (
    <div data-testid="dashboard-shell">{headerBanners}</div>
  )),
}));

// Mock BundleNotFound
vi.mock("../../../src/components/ui", () => ({
  BundleNotFound: vi.fn(({ message, onConnectClick }) => (
    <div data-testid="bundle-not-found">
      <span>{message}</span>
      {onConnectClick && (
        <button onClick={onConnectClick} data-testid="connect-button">
          Connect
        </button>
      )}
    </div>
  )),
}));

const mockUseUser = vi.mocked(useUser);
const mockBundleService = vi.mocked(bundleService);

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("BundlePageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUser.mockReturnValue({
      userInfo: { userId: "user-123", email: "user@example.com" },
      isConnected: true,
    } as any);

    // Setup bundleService mocks
    mockBundleService.isOwnBundle.mockReturnValue(false);
    mockBundleService.generateBundleUrl.mockReturnValue(
      "https://example.com/bundle?userId=other-user"
    );
    mockBundleService.getBundleUser.mockResolvedValue({
      userId: "other-user",
      displayName: "other-user",
    });
  });

  afterEach(() => {
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockReset();
  });

  describe("Banner dismissal persistence", () => {
    it("should read dismissed state from localStorage on mount", async () => {
      localStorageMock.getItem.mockReturnValue("true");

      await act(async () => {
        render(<BundlePageClient userId="other-user" />);
      });

      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        "dismissed-switch-other-user"
      );
      // Banner should not appear if dismissed
      expect(
        screen.queryByTestId("switch-to-my-bundle")
      ).not.toBeInTheDocument();
    });

    it("should persist banner dismissal to localStorage", async () => {
      localStorageMock.getItem.mockReturnValue("false");

      await act(async () => {
        render(<BundlePageClient userId="other-user" />);
      });

      // Wait for effects to run and banner to appear
      const stayButton = await screen.findByText("Stay");

      await act(async () => {
        fireEvent.click(stayButton);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "dismissed-switch-other-user",
        "true"
      );
    });

    it("should not show banner when not connected", async () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
      } as any);

      await act(async () => {
        render(<BundlePageClient userId="other-user" />);
      });

      expect(
        screen.queryByTestId("switch-to-my-bundle")
      ).not.toBeInTheDocument();
    });
  });

  describe("Bundle not found handling", () => {
    it("should show BundleNotFound when userId is empty", () => {
      render(<BundlePageClient userId="" />);

      expect(screen.getByTestId("bundle-not-found")).toBeInTheDocument();
    });

    it("should show BundleNotFound when bundle user is null", async () => {
      mockBundleService.getBundleUser.mockResolvedValue(null);

      render(<BundlePageClient userId="invalid-user" />);

      // Wait for async effect to complete
      expect(await screen.findByTestId("bundle-not-found")).toBeInTheDocument();
    });

    it("should show connect CTA when not connected", () => {
      mockUseUser.mockReturnValue({
        userInfo: null,
        isConnected: false,
      } as any);

      render(<BundlePageClient userId="" />);

      expect(screen.getByTestId("connect-button")).toBeInTheDocument();
    });
  });
});
