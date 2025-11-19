import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BundlePageClient } from "@/app/bundle/BundlePageClient";
import type { PortfolioAllocationContainerProps } from "@/components/PortfolioAllocation/types";
import { SwapPage } from "@/components/SwapPage/SwapPage";

import {
  createMockStrategy,
  createMockSwapAction,
  createMockToken,
  setupSwapPageMocks,
  SwapPageTestScenarios,
} from "../helpers/swapPageTestUtils";
import { act, render, screen, waitFor } from "../test-utils";

const dynamicOverrideController = vi.hoisted(() => {
  const register = (globalThis as any).__registerDynamicOverride as
    | ((
        matcher: string | RegExp,
        renderer: (props: any) => JSX.Element | null
      ) => void)
    | undefined;

  let renderer: ((props: any) => JSX.Element | null) | null = null;

  register?.("shared/ZapExecutionProgress", (props: any) => {
    return renderer ? renderer(props) : null;
  });

  return {
    setRenderer(nextRenderer: ((props: any) => JSX.Element | null) | null) {
      renderer = nextRenderer;
    },
  };
});

const mockStrategy = createMockStrategy({ navigationContext: "zapIn" });
const mockPortfolioAction = createMockSwapAction({
  swapSettings: {
    amount: "1200",
    slippageTolerance: 0.5,
    fromToken: createMockToken({ address: "0xUSDC" }),
  },
});

const executeUnifiedZapMock = vi.fn().mockResolvedValue({
  success: true,
  intentType: "unifiedZap",
  mode: "streaming",
  intentId: "intent-unified-123",
  streamUrl: "wss://stream.example.com/intent-unified-123",
  metadata: {
    totalStrategies: 2,
    totalProtocols: 5,
    estimatedDuration: "30s",
    streamingEnabled: true,
  },
});

let swapMocks = setupSwapPageMocks(
  SwapPageTestScenarios.connectedWithStrategies()
);

vi.mock("@/contexts/UserContext", () => ({
  useUser: () => swapMocks.useUser(),
}));

vi.mock("@/hooks/useChain", () => ({
  useChain: () => swapMocks.useChain(),
}));

vi.mock("@/hooks/queries/useStrategiesQuery", () => ({
  useStrategiesWithPortfolioData: () =>
    swapMocks.useStrategiesWithPortfolioData(),
}));

vi.mock("@/services/intentService", () => ({
  executeUnifiedZap: (...args: unknown[]) => executeUnifiedZapMock(...args),
}));

function createPortfolioAllocationModuleMock() {
  return {
    __esModule: true as const,
    PortfolioAllocationContainer: ({
      onZapAction,
    }: PortfolioAllocationContainerProps) => (
      <div data-testid="mock-allocation">
        <button
          data-testid="trigger-zap"
          onClick={() => onZapAction?.(mockPortfolioAction)}
        >
          Execute Zap
        </button>
      </div>
    ),
  };
}
vi.mock("@/components/PortfolioAllocation", () =>
  createPortfolioAllocationModuleMock()
);
vi.mock("../../src/components/PortfolioAllocation", () =>
  createPortfolioAllocationModuleMock()
);

interface BundleVmMock {
  isOwnBundle: boolean;
  bundleUrl: string;
  bundleUser: { userId: string; displayName: string } | null;
  bundleNotFound: boolean;
  showConnectCTA: boolean;
  switchPrompt: {
    show: boolean;
    onStay: () => void;
    onSwitch: () => void;
  };
  emailBanner: {
    show: boolean;
    onSubscribe: () => void;
    onDismiss: () => void;
  };
  overlays: {
    showQuickSwitch: boolean;
    isWalletManagerOpen: boolean;
    openWalletManager: () => void;
    closeWalletManager: () => void;
    onEmailSubscribed: () => void;
  };
  bundleUrlParams?: Record<string, unknown>;
  bundleUserName?: string;
  bundleUrlWithParams?: string;
}

// Bundle page dependencies
let mockBundleVm: BundleVmMock;
vi.mock("@/hooks/useBundlePage", () => ({
  useBundlePage: () => mockBundleVm,
}));

vi.mock("@/components/DashboardShell", () => ({
  DashboardShell: ({ headerBanners, footerOverlays }: any) => (
    <div data-testid="dashboard-shell">
      {headerBanners}
      {footerOverlays}
    </div>
  ),
}));

vi.mock("@/components/bundle", () => ({
  QuickSwitchFAB: ({
    onSwitchToMyBundle,
  }: {
    onSwitchToMyBundle: () => void;
  }) => (
    <button data-testid="quick-switch" onClick={onSwitchToMyBundle}>
      Quick Switch
    </button>
  ),
}));

vi.mock("@/components/EmailReminderBanner", () => ({
  EmailReminderBanner: ({
    onSubscribe,
    onDismiss,
  }: {
    onSubscribe: () => void;
    onDismiss: () => void;
  }) => (
    <div data-testid="email-banner">
      <button onClick={onSubscribe}>Subscribe</button>
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  ),
}));

vi.mock("@/components/WalletManager", () => ({
  WalletManager: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="wallet-manager" /> : null,
}));

vi.mock("@/components/WalletManager/WalletManagerSkeleton", () => ({
  WalletManagerSkeleton: () => <div data-testid="wallet-manager-skeleton" />,
}));

vi.mock("@/components/ui", async () => {
  const actual =
    await vi.importActual<Record<string, unknown>>("@/components/ui");
  return {
    ...actual,
    BaseCard: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="base-card">{children}</div>
    ),
    BundleNotFound: ({ message }: { message: string }) => (
      <div data-testid="bundle-not-found">{message}</div>
    ),
  };
});

const replaceMock = vi.fn();
vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<any>("next/navigation");
  return {
    ...actual,
    useRouter: () => ({ replace: replaceMock }),
  };
});

const createBundleVm = (
  overrides: Partial<BundleVmMock> = {}
): BundleVmMock => ({
  isOwnBundle: false,
  bundleUrl: "/bundle?userId=OWNER123",
  bundleUser: { userId: "OWNER123", displayName: "Owner" },
  bundleNotFound: false,
  showConnectCTA: false,
  switchPrompt: {
    show: true,
    onStay: vi.fn(),
    onSwitch: vi.fn(),
  },
  emailBanner: {
    show: false,
    onSubscribe: vi.fn(),
    onDismiss: vi.fn(),
  },
  overlays: {
    showQuickSwitch: false,
    isWalletManagerOpen: false,
    openWalletManager: vi.fn(),
    closeWalletManager: vi.fn(),
    onEmailSubscribed: vi.fn(),
  },
  bundleUrlParams: {},
  bundleUserName: "Owner",
  bundleUrlWithParams: "/bundle?userId=OWNER123",
  ...overrides,
});

const renderSwapPage = async () => {
  await act(async () => {
    render(<SwapPage strategy={mockStrategy} onBack={vi.fn()} />);
  });
};

describe("Critical user flows", () => {
  beforeEach(() => {
    swapMocks = setupSwapPageMocks(
      SwapPageTestScenarios.connectedWithStrategies()
    );
    executeUnifiedZapMock.mockClear();
    replaceMock.mockReset();
    dynamicOverrideController.setRenderer(props => {
      if (!props?.isOpen) return null;
      return (
        <div data-testid="zap-progress">
          <span data-testid="zap-progress-intent">{props.intentId}</span>
          <span data-testid="zap-progress-chain">{props.chainId}</span>
        </div>
      );
    });
  });

  it("handles wallet connection → portfolio view → zap in execution", async () => {
    swapMocks = setupSwapPageMocks({
      ...SwapPageTestScenarios.connectedWithStrategies(),
      chainId: 8453,
    });
    await renderSwapPage();

    await userEvent.click(screen.getByTestId("trigger-zap"));

    await waitFor(() => {
      expect(executeUnifiedZapMock).toHaveBeenCalledTimes(1);
    });

    const zapProgress = await screen.findByTestId("zap-progress");
    expect(zapProgress).toHaveTextContent("intent-unified-123");
    expect(screen.getByTestId("zap-progress-chain")).toHaveTextContent("8453");
  });

  it("shows bundle switch prompt for visitors and triggers switch action", async () => {
    mockBundleVm = createBundleVm();

    await act(async () => {
      render(<BundlePageClient userId="OWNER123" />);
    });

    const switchButton = await screen.findByTestId("switch-to-my-bundle");
    expect(switchButton).toBeInTheDocument();

    await userEvent.click(switchButton);
    expect(mockBundleVm.switchPrompt.onSwitch).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByText(/stay/i));
    expect(mockBundleVm.switchPrompt.onStay).toHaveBeenCalledTimes(1);
  });

  it("supports retrying strategy fetch after an error", async () => {
    swapMocks = setupSwapPageMocks(SwapPageTestScenarios.error());

    await renderSwapPage();

    const retryButton = await screen.findByRole("button", {
      name: /try again/i,
    });
    await userEvent.click(retryButton);

    expect(swapMocks.refetch).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Failed to Load Strategies/i)).toBeInTheDocument();
  });
});
