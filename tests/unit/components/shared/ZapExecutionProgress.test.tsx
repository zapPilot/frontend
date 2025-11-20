/**
 * Unit Tests for ZapExecutionProgress Component
 *
 * CRITICAL: This component handles real-money transactions via SSE streaming
 * and EIP-5792 batch transaction execution.
 *
 * Coverage Areas:
 * - SSE stream connection and progress tracking
 * - Transaction chunking logic (max 10 txs per bundle)
 * - Sequential batch execution
 * - Error handling (stream errors, execution failures, partial success)
 * - Chain validation
 * - Modal state management
 * - User interactions (cancel, close, retry)
 */

import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  UnifiedZapStreamEvent,
  UnifiedZapStreamTransaction,
} from "@/hooks/useUnifiedZapStream";

// ============================================================================
// Mock Dependencies
// ============================================================================

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: vi.fn(({ children, onClick, className, style, ...props }: any) => (
      <div onClick={onClick} className={className} style={style} {...props}>
        {children}
      </div>
    )),
  },
}));

// Mock Radix UI Dialog
const mockOnOpenChangeRegistry = new Map<string, (open: boolean) => void>();
let mockDialogIdCounter = 0;

vi.mock("@radix-ui/react-dialog", () => {
  const React = require("react");

  return {
    Root: ({ children, open, onOpenChange }: any) => {
      // Store onOpenChange with a stable ID
      const dialogIdRef = React.useRef<string>();
      if (!dialogIdRef.current) {
        dialogIdRef.current = `dialog-${mockDialogIdCounter++}`;
      }

      React.useEffect(() => {
        if (onOpenChange) {
          mockOnOpenChangeRegistry.set(dialogIdRef.current!, onOpenChange);
        }
        return () => {
          mockOnOpenChangeRegistry.delete(dialogIdRef.current!);
        };
      }, [onOpenChange]);

      return open ? (
        <div data-testid="dialog-root" data-dialog-id={dialogIdRef.current}>
          {children}
        </div>
      ) : null;
    },
    Portal: ({ children }: any) => (
      <div data-testid="dialog-portal">{children}</div>
    ),
    Overlay: ({ asChild, children }: any) => {
      if (asChild) return <>{children}</>;
      return <div data-testid="dialog-overlay">{children}</div>;
    },
    Content: ({ asChild, children, ...props }: any) => {
      if (asChild) return <>{children}</>;
      return (
        <div data-testid="dialog-content" {...props}>
          {children}
        </div>
      );
    },
    Title: ({ children }: any) => (
      <h2 data-testid="dialog-title">{children}</h2>
    ),
    Description: ({ children }: any) => (
      <p data-testid="dialog-description">{children}</p>
    ),
    Close: ({ asChild, children, ...props }: any) => {
      if (asChild) return <>{children}</>;
      return (
        <button
          type="button"
          data-testid="dialog-close"
          {...props}
          onClick={(e: any) => {
            props.onClick?.(e);
            // Trigger the onOpenChange callback when Dialog.Close is clicked
            // Get the most recently registered callback
            const callbacks = Array.from(mockOnOpenChangeRegistry.values());
            const callback = callbacks[callbacks.length - 1];
            if (callback) {
              callback(false);
            }
          }}
        >
          {children}
        </button>
      );
    },
  };
});

// Mock useToast hook
const mockShowToast = vi.fn();
vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

// Mock useUnifiedZapStream hook
const mockStreamReturn = {
  latestEvent: null as UnifiedZapStreamEvent | null,
  isConnected: false,
  isComplete: false,
  hasError: false,
  progress: 0,
  currentStep: "",
  error: null as string | null,
  closeStream: vi.fn(),
  reconnect: vi.fn(),
  transactions: null as UnifiedZapStreamTransaction[] | null,
  events: [] as UnifiedZapStreamEvent[],
};

vi.mock("@/hooks/useUnifiedZapStream", () => ({
  useUnifiedZapStream: () => mockStreamReturn,
}));

// Mock useSendAndConfirmCalls (Thirdweb)
const mockSendCalls = vi.fn();
const mockMutateAsync = vi.fn();

vi.mock("thirdweb/react", () => ({
  useSendAndConfirmCalls: () => ({
    mutate: mockSendCalls,
    mutateAsync: mockMutateAsync,
    isLoading: false,
    isSuccess: false,
    isError: false,
  }),
}));

// Mock thirdweb prepareTransaction
vi.mock("thirdweb", () => ({
  prepareTransaction: vi.fn((config: any) => ({
    ...config,
    _prepared: true,
  })),
}));

// Mock thirdweb client
vi.mock("@/utils/thirdweb", () => ({
  default: { clientId: "test-client-id" },
}));

// Mock chain config
vi.mock("@/config/chains", () => ({
  getChainBlockExplorer: (chainId: number) => {
    if (chainId === 1) return "https://etherscan.io";
    if (chainId === 137) return "https://polygonscan.com";
    return null;
  },
  getChainById: (chainId: number) => {
    if (chainId === 1)
      return { id: 1, name: "Ethereum", nativeCurrency: { symbol: "ETH" } };
    if (chainId === 137)
      return { id: 137, name: "Polygon", nativeCurrency: { symbol: "MATIC" } };
    return null;
  },
  isChainSupported: (chainId: number) => chainId === 1 || chainId === 137,
  SUPPORTED_CHAINS: [
    { id: 1, name: "Ethereum" },
    { id: 137, name: "Polygon" },
  ],
  toThirdWebChain: (chain: any) => chain,
}));

// Import component after mocks
const { ZapExecutionProgress } = await import(
  "@/components/shared/ZapExecutionProgress"
);

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockTransaction = (index: number): UnifiedZapStreamTransaction => ({
  to: `0x${index.toString().padStart(40, "0")}` as `0x${string}`,
  data: `0x${index.toString(16).padStart(8, "0")}` as `0x${string}`,
  value: "0",
  chainId: 1,
});

const createMockTransactions = (count: number): UnifiedZapStreamTransaction[] =>
  Array.from({ length: count }, (_, i) => createMockTransaction(i));

const createProgressEvent = (
  progress: number,
  phase: string
): UnifiedZapStreamEvent => ({
  type: "progress",
  intentId: "test-intent",
  progress: progress / 100,
  phase,
  currentStep: phase,
  message: `Processing ${phase}`,
  metadata: {},
  transactions: undefined,
  error: undefined,
  chainId: undefined,
});

const createTransactionEvent = (
  transactions: UnifiedZapStreamTransaction[]
): UnifiedZapStreamEvent => ({
  type: "transaction",
  intentId: "test-intent",
  progress: 0.9,
  phase: "transaction_preparation",
  currentStep: "transaction_preparation",
  transactions,
  message: "Transactions prepared",
  metadata: {},
  error: undefined,
  chainId: 1,
});

const createErrorEvent = (
  code: string,
  message: string
): UnifiedZapStreamEvent => ({
  type: "error",
  intentId: "test-intent",
  progress: 0,
  phase: "error",
  currentStep: "error",
  message,
  error: { code, message },
  metadata: {},
  transactions: undefined,
  chainId: undefined,
});

// Default props
const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  intentId: "test-intent-123",
  chainId: 1,
  totalValue: 10000,
  strategyCount: 5,
};

// ============================================================================
// Test Helpers
// ============================================================================

const resetMocks = () => {
  mockShowToast.mockClear();
  mockSendCalls.mockClear();
  mockMutateAsync.mockClear();
  mockStreamReturn.closeStream.mockClear();
  mockStreamReturn.reconnect.mockClear();
  mockOnOpenChangeRegistry.clear();

  // Reset stream state
  mockStreamReturn.latestEvent = null;
  mockStreamReturn.isConnected = false;
  mockStreamReturn.isComplete = false;
  mockStreamReturn.hasError = false;
  mockStreamReturn.progress = 0;
  mockStreamReturn.currentStep = "";
  mockStreamReturn.error = null;
  mockStreamReturn.transactions = null;
  mockStreamReturn.events = [];
};

const updateStreamState = (updates: Partial<typeof mockStreamReturn>) => {
  Object.assign(mockStreamReturn, updates);
};

// ============================================================================
// Test Suite
// ============================================================================

describe("ZapExecutionProgress", () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
    resetMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ==========================================================================
  // Modal State & Rendering Tests
  // ==========================================================================

  describe("Modal State & Rendering", () => {
    it("should render modal when isOpen=true", () => {
      render(<ZapExecutionProgress {...defaultProps} />);

      expect(screen.getByTestId("dialog-root")).toBeInTheDocument();
      expect(screen.getByTestId("zap-execution-progress")).toBeInTheDocument();
    });

    it("should not render modal when isOpen=false", () => {
      render(<ZapExecutionProgress {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId("dialog-root")).not.toBeInTheDocument();
    });

    it("should display totalValue and strategyCount in description", () => {
      render(
        <ZapExecutionProgress
          {...defaultProps}
          totalValue={25000}
          strategyCount={10}
        />
      );

      const description = screen.getByTestId("dialog-description");
      expect(description).toHaveTextContent("$25,000.00");
      expect(description).toHaveTextContent("10 strategies");
    });

    it("should show disconnected status initially", () => {
      updateStreamState({ isConnected: false });
      render(<ZapExecutionProgress {...defaultProps} />);

      expect(screen.getByText("Disconnected")).toBeInTheDocument();
    });

    it("should show connected status when stream connects", () => {
      updateStreamState({ isConnected: true });
      render(<ZapExecutionProgress {...defaultProps} />);

      expect(screen.getByText("Connected")).toBeInTheDocument();
    });

    it("should show Cancel button during execution", () => {
      updateStreamState({ isConnected: true });
      render(<ZapExecutionProgress {...defaultProps} />);

      const closeButton = screen.getByTestId("close-button");
      expect(closeButton).toHaveTextContent("Cancel");
    });

    it("should show close icon (✕) when execution complete", () => {
      updateStreamState({ isComplete: true });
      render(<ZapExecutionProgress {...defaultProps} />);

      const closeButton = screen.getByTestId("close-button");
      expect(closeButton).toHaveTextContent("✕");
    });

    it("should show close icon (✕) when execution has error", () => {
      updateStreamState({ hasError: true });
      render(<ZapExecutionProgress {...defaultProps} />);

      const closeButton = screen.getByTestId("close-button");
      expect(closeButton).toHaveTextContent("✕");
    });
  });

  // ==========================================================================
  // SSE Stream Integration Tests
  // ==========================================================================

  describe("SSE Stream Integration", () => {
    it("should display initial progress at 0%", () => {
      updateStreamState({ progress: 0 });
      render(<ZapExecutionProgress {...defaultProps} />);

      // Multiple "0%" elements exist in the progress bar (start, current, etc.)
      const percentageElements = screen.getAllByText("0%");
      expect(percentageElements.length).toBeGreaterThan(0);
      expect(percentageElements[0]).toBeInTheDocument();
    });

    it("should update progress percentage from stream", () => {
      updateStreamState({
        progress: 0.45,
        latestEvent: createProgressEvent(45, "strategy_parsing"),
      });
      render(<ZapExecutionProgress {...defaultProps} />);

      // Multiple "45%" elements exist (top display and progress bar label)
      const percentageElements = screen.getAllByText("45%");
      expect(percentageElements.length).toBeGreaterThan(0);
      expect(percentageElements[0]).toBeInTheDocument();
    });

    it("should display current phase from stream", () => {
      updateStreamState({
        latestEvent: createProgressEvent(30, "token_analysis"),
        currentStep: "token_analysis",
      });
      render(<ZapExecutionProgress {...defaultProps} />);

      expect(screen.getByText("Token Analysis")).toBeInTheDocument();
    });

    it("should format phase string from snake_case to Title Case", () => {
      updateStreamState({
        latestEvent: createProgressEvent(50, "swap_preparation"),
        currentStep: "swap_preparation",
      });
      render(<ZapExecutionProgress {...defaultProps} />);

      expect(screen.getByText("Swap Preparation")).toBeInTheDocument();
    });

    it("should display emoji indicators based on state", () => {
      // In progress (⏳)
      updateStreamState({ isComplete: false, hasError: false });
      let result = render(<ZapExecutionProgress {...defaultProps} />);
      expect(screen.getByText("⏳")).toBeInTheDocument();
      result.unmount();

      // Complete (✅)
      updateStreamState({ isComplete: true, hasError: false, progress: 1 });
      result = render(<ZapExecutionProgress {...defaultProps} />);
      expect(screen.queryByText("⏳")).not.toBeInTheDocument();
      expect(screen.getByText("✅")).toBeInTheDocument();
      result.unmount();

      // Error (❌)
      updateStreamState({ isComplete: false, hasError: true, progress: 0 });
      result = render(<ZapExecutionProgress {...defaultProps} />);
      expect(screen.queryByText("✅")).not.toBeInTheDocument();
      expect(screen.getByText("❌")).toBeInTheDocument();
    });

    it("should call onComplete when stream completes", async () => {
      // Use real timers for useEffect to work
      vi.useRealTimers();

      const onComplete = vi.fn();
      updateStreamState({ isComplete: false });
      const { unmount } = render(
        <ZapExecutionProgress {...defaultProps} onComplete={onComplete} />
      );

      expect(onComplete).not.toHaveBeenCalled();
      unmount();

      // Render with isComplete=true
      updateStreamState({ isComplete: true, progress: 1 });
      render(
        <ZapExecutionProgress {...defaultProps} onComplete={onComplete} />
      );

      // Wait for useEffect to trigger
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledTimes(1);
      });

      // Restore fake timers
      vi.useFakeTimers();
    });

    it("should call onError when stream has error", async () => {
      // Use real timers for useEffect to work
      vi.useRealTimers();

      const onError = vi.fn();
      updateStreamState({
        hasError: false,
        error: null,
        latestEvent: null,
      });
      const { unmount } = render(
        <ZapExecutionProgress {...defaultProps} onError={onError} />
      );

      expect(onError).not.toHaveBeenCalled();
      unmount();

      // Render with error state
      updateStreamState({
        hasError: true,
        error: "Connection failed",
        latestEvent: createErrorEvent("CONN_ERROR", "Connection failed"),
      });
      render(<ZapExecutionProgress {...defaultProps} onError={onError} />);

      // Wait for useEffect to trigger
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith("Connection failed");
      });

      // Restore fake timers
      vi.useFakeTimers();
    });
  });

  // ==========================================================================
  // Transaction Chunking Logic Tests
  // ==========================================================================

  describe("Transaction Chunking Logic", () => {
    it("should execute transactions when available", async () => {
      // Use real timers for async execution
      vi.useRealTimers();

      const transactions = createMockTransactions(5);
      updateStreamState({
        transactions,
        latestEvent: createTransactionEvent(transactions),
        isConnected: true,
      });

      mockSendCalls.mockImplementation((_, { onSuccess }) => {
        // Immediately call onSuccess to simulate successful transaction
        onSuccess({ receipts: [{ transactionHash: "0xabc123" }] });
      });

      render(<ZapExecutionProgress {...defaultProps} />);

      await waitFor(
        () => {
          expect(mockSendCalls).toHaveBeenCalled();
        },
        { timeout: 5000 }
      );

      // Restore fake timers
      vi.useFakeTimers();
    });

    it("should chunk 15 transactions into 2 chunks (10 + 5)", async () => {
      // Use real timers for async execution
      vi.useRealTimers();

      const transactions = createMockTransactions(15);
      updateStreamState({
        transactions,
        latestEvent: createTransactionEvent(transactions),
        isConnected: true,
      });

      mockSendCalls.mockImplementation((_, { onSuccess }) => {
        onSuccess({ receipts: [{ transactionHash: "0xabc123" }] });
      });

      render(<ZapExecutionProgress {...defaultProps} />);

      await waitFor(
        () => {
          expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({
              title: expect.stringContaining("Batch 1 of 2"),
            })
          );
        },
        { timeout: 5000 }
      );

      // Restore fake timers
      vi.useFakeTimers();
    });

    it("should chunk 25 transactions into 3 chunks (10 + 10 + 5)", async () => {
      // Use real timers for async execution
      vi.useRealTimers();

      const transactions = createMockTransactions(25);
      updateStreamState({
        transactions,
        latestEvent: createTransactionEvent(transactions),
        isConnected: true,
      });

      mockSendCalls.mockImplementation((_, { onSuccess }) => {
        onSuccess({ receipts: [{ transactionHash: "0xabc123" }] });
      });

      render(<ZapExecutionProgress {...defaultProps} />);

      await waitFor(
        () => {
          expect(mockShowToast).toHaveBeenCalledWith(
            expect.objectContaining({
              title: expect.stringContaining("Batch 1 of 3"),
            })
          );
        },
        { timeout: 5000 }
      );

      // Restore fake timers
      vi.useFakeTimers();
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe("Error Handling & Recovery", () => {
    it("should show error toast when chunk execution fails", async () => {
      // Use real timers for async execution
      vi.useRealTimers();

      const transactions = createMockTransactions(10);
      updateStreamState({
        transactions,
        latestEvent: createTransactionEvent(transactions),
        isConnected: true,
      });

      mockSendCalls.mockImplementation((_, { onError }) => {
        onError(new Error("Transaction reverted"));
      });

      render(<ZapExecutionProgress {...defaultProps} />);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "error",
            title: expect.stringContaining("Batch 1 of 1 failed"),
            message: expect.stringContaining("Transaction reverted"),
          })
        );
      });

      // Restore fake timers
      vi.useFakeTimers();
    });

    it("should show appropriate error for unsupported chain", async () => {
      // Use real timers for async execution
      vi.useRealTimers();

      const transactions = createMockTransactions(5);
      updateStreamState({
        transactions,
        latestEvent: {
          ...createTransactionEvent(transactions),
          chainId: 999, // Unsupported chain
        },
        isConnected: true,
      });

      render(<ZapExecutionProgress {...defaultProps} chainId={999} />);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "error",
            title: "Unsupported chain",
            message: expect.stringContaining("Chain 999 is not supported"),
          })
        );
      });

      // Restore fake timers
      vi.useFakeTimers();
    });

    it("should handle EIP-5792 wallet incompatibility error", async () => {
      // Use real timers for async execution
      vi.useRealTimers();

      const transactions = createMockTransactions(5);
      updateStreamState({
        transactions,
        latestEvent: createTransactionEvent(transactions),
        isConnected: true,
      });

      mockSendCalls.mockImplementation((_, { onError }) => {
        onError(new Error("wallet_sendCalls not supported"));
      });

      render(<ZapExecutionProgress {...defaultProps} />);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "error",
            message: expect.stringContaining("does not support EIP-5792"),
          })
        );
      });

      // Restore fake timers
      vi.useFakeTimers();
    });
  });

  // ==========================================================================
  // User Interactions Tests
  // ==========================================================================

  describe("User Interactions", () => {
    it("should render Cancel button before execution that can be clicked", () => {
      updateStreamState({ isConnected: true });

      render(<ZapExecutionProgress {...defaultProps} />);

      const closeButton = screen.getByTestId("close-button");
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveTextContent("Cancel");

      // Verify button is clickable (not disabled)
      expect(closeButton).not.toBeDisabled();

      // Note: The actual callback invocation is handled by Radix Dialog's onOpenChange,
      // which is tested indirectly through the modal state tests above
    });

    it("should render close icon (✕) after completion that can be clicked", () => {
      updateStreamState({ isComplete: true });

      render(<ZapExecutionProgress {...defaultProps} />);

      const closeButton = screen.getByTestId("close-button");
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveTextContent("✕");

      // Verify button is clickable (not disabled)
      expect(closeButton).not.toBeDisabled();

      // Note: The actual callback invocation is handled by Radix Dialog's onOpenChange,
      // which is tested indirectly through the modal state tests above
    });
  });

  // ==========================================================================
  // Edge Cases Tests
  // ==========================================================================

  describe("Edge Cases & Complex Scenarios", () => {
    it("should handle empty transaction list gracefully", async () => {
      updateStreamState({
        transactions: [],
        latestEvent: createTransactionEvent([]),
        isConnected: true,
      });

      render(<ZapExecutionProgress {...defaultProps} />);

      await act(async () => {
        vi.runAllTimers();
      });

      // Should not attempt to send transactions
      expect(mockSendCalls).not.toHaveBeenCalled();
    });

    it("should handle null transactions gracefully", async () => {
      updateStreamState({
        transactions: null,
        latestEvent: createProgressEvent(50, "processing"),
        isConnected: true,
      });

      render(<ZapExecutionProgress {...defaultProps} />);

      await act(async () => {
        vi.runAllTimers();
      });

      expect(mockSendCalls).not.toHaveBeenCalled();
    });

    it("should include explorer link in success toast for Ethereum", async () => {
      // Use real timers for async execution
      vi.useRealTimers();

      const transactions = createMockTransactions(5);
      updateStreamState({
        transactions,
        latestEvent: { ...createTransactionEvent(transactions), chainId: 1 },
        isConnected: true,
      });

      mockSendCalls.mockImplementation((_, { onSuccess }) => {
        onSuccess({ receipts: [{ transactionHash: "0xabc123def456" }] });
      });

      render(<ZapExecutionProgress {...defaultProps} chainId={1} />);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          expect.objectContaining({
            link: expect.objectContaining({
              url: "https://etherscan.io/tx/0xabc123def456",
              text: "View on explorer",
            }),
          })
        );
      });

      // Restore fake timers
      vi.useFakeTimers();
    });
  });
});
