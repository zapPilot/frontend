/**
 * Modal Types Usage Examples
 *
 * Demonstrates comprehensive usage patterns for modal.types.ts
 * These examples show how to use the modal types in various scenarios
 * across the Zap Pilot application.
 *
 * @module types/modal.examples
 */

/* eslint-disable no-console, @typescript-eslint/no-unused-vars, no-duplicate-imports */

import type {
  BaseModalProps,
  ZapProgressModalProps,
  ConfirmationModalProps,
  ZapExecutionResult,
  ModalCallbacks,
} from "./modal.types";
import { ZapExecutionError } from "./modal.types";

/**
 * EXAMPLE 1: Transaction Execution Modal
 * Safety-critical modal for financial transactions
 * Prevents accidental closes during execution
 */
interface TransactionModalProps
  extends Omit<BaseModalProps<ZapExecutionResult>, "children" | "a11y"> {
  transactionId: string;
  amount: number;
  onSuccess: (result: ZapExecutionResult) => void;
}

// Usage with strict safety settings
const transactionModalExample: TransactionModalProps = {
  isOpen: true,
  transactionId: "tx-123",
  amount: 1000,
  onClose: result => {
    if (result) {
      console.log("Transaction completed:", result);
    }
  },
  onSuccess: result => {
    console.log("Transaction successful:", result);
  },
  // Prevent all accidental closes during transaction
  behavior: {
    closeOnBackdropClick: false,
    closeOnEscape: false,
    showCloseButton: false,
    preventScroll: true,
    restoreFocus: true,
  },
  // Heavy backdrop to focus attention
  backdropConfig: {
    opacity: "heavy",
    blur: "lg",
    clickToClose: false,
  },
  // Disable keyboard shortcuts during transaction
  keyboardConfig: {
    closeOnEscape: false,
    trapFocus: true,
  },
};

/**
 * EXAMPLE 2: Information Modal
 * Easy-to-dismiss modal for non-critical information
 */
interface InfoModalProps extends Omit<BaseModalProps<void>, "children"> {
  title: string;
  content: string;
}

const infoModalExample: InfoModalProps = {
  isOpen: true,
  title: "Portfolio Updated",
  content: "Your portfolio has been refreshed with latest data",
  onClose: () => {
    console.log("Info modal closed");
  },
  size: "md",
  a11y: {
    label: "Portfolio Update Information",
    description: "Information about portfolio refresh",
    role: "dialog",
    modal: true,
  },
  // Easy to dismiss
  behavior: {
    closeOnBackdropClick: true,
    closeOnEscape: true,
    showCloseButton: true,
    preventScroll: true,
    restoreFocus: true,
    autoCloseDelay: 5000, // Auto-close after 5 seconds
  },
  // Lighter backdrop for info
  backdropConfig: {
    opacity: "medium",
    blur: "sm",
    clickToClose: true,
  },
};

/**
 * EXAMPLE 3: Zap Progress Modal
 * Real-time progress tracking for intent execution
 */
const zapProgressExample: ZapProgressModalProps = {
  isOpen: true,
  intentId: "intent-abc123",
  chainId: 1,
  totalValue: 5000,
  strategyCount: 3,
  onClose: result => {
    if (result) {
      console.log("Zap completed:", result);
    }
  },
  onComplete: result => {
    console.log("Execution successful!");
    console.log("Transactions:", result.transactions);
    console.log("Time taken:", result.executionTime, "ms");
  },
  onError: error => {
    console.error("Execution failed:", error.userMessage);
    console.error("Technical details:", error.technicalMessage);

    if (error.isUserRejection()) {
      console.log("User cancelled transaction");
    } else if (error.recoverable) {
      console.log("Suggested action:", error.suggestedAction);
    }
  },
  onCancel: () => {
    console.log("User cancelled execution");
  },
  showDetailedProgress: true,
  // Transaction modal behavior
  behavior: {
    closeOnBackdropClick: false,
    closeOnEscape: false,
    showCloseButton: false,
    preventScroll: true,
    restoreFocus: true,
  },
};

/**
 * EXAMPLE 4: Confirmation Modal
 * Critical action confirmation with visual severity
 */
const confirmationExample: ConfirmationModalProps = {
  isOpen: true,
  title: "Confirm Portfolio Optimization",
  message:
    "This will execute 5 transactions across 3 chains. Total gas estimate: 0.05 ETH ($150)",
  confirmText: "Execute Optimization",
  cancelText: "Cancel",
  variant: "warning",
  onClose: () => {
    console.log("Confirmation modal closed");
  },
  onConfirm: async () => {
    console.log("User confirmed action");
    // Execute critical action
  },
  onCancel: () => {
    console.log("User cancelled action");
  },
  isLoading: false,
  size: "md",
  a11y: {
    label: "Confirm portfolio optimization",
    description:
      "Confirmation dialog for executing portfolio optimization transactions",
    role: "alertdialog",
    modal: true,
  },
  behavior: {
    closeOnBackdropClick: false,
    closeOnEscape: true,
    showCloseButton: false,
    preventScroll: true,
    restoreFocus: true,
  },
};

/**
 * EXAMPLE 5: Lifecycle Callbacks
 * Comprehensive modal lifecycle management
 */
const lifecycleExample: BaseModalProps<ZapExecutionResult> = {
  isOpen: true,
  onClose: result => {
    console.log("Modal closing with result:", result);
  },
  size: "lg",
  children: null,
  a11y: {
    label: "Transaction Execution",
    description: "Real-time transaction execution progress",
  },
  callbacks: {
    onOpen: () => {
      console.log("Modal opened - start analytics tracking");
      // Track modal open event
      // Initialize transaction monitoring
    },
    onClose: data => {
      console.log("Modal closed - save state");
      // Save transaction state
      // Stop analytics tracking
      if (data) {
        console.log("Transaction data:", data);
      }
    },
    onOpenChange: isOpen => {
      console.log("Modal visibility changed:", isOpen);
      // Update UI state
    },
    onEscapeKeyDown: event => {
      console.log("ESC pressed");
      // Show confirmation before closing
      if (
        !confirm("Transaction in progress. Are you sure you want to close?")
      ) {
        event.preventDefault();
      }
    },
    onBackdropClick: event => {
      console.log("Backdrop clicked");
      // Prevent close during critical operations
      event.preventDefault();
    },
    onBeforeClose: async () => {
      console.log("Before close - validate state");
      // Validate safe to close
      // Return false to prevent close
      const hasUnsavedChanges = false;
      if (hasUnsavedChanges) {
        return confirm("You have unsaved changes. Close anyway?");
      }
      return true;
    },
  } as ModalCallbacks<ZapExecutionResult>,
};

/**
 * EXAMPLE 6: Error Handling
 * Comprehensive ZapExecutionError usage
 */
function errorHandlingExamples() {
  // Creating a structured error
  const insufficientFundsError = new ZapExecutionError({
    code: "INSUFFICIENT_FUNDS",
    severity: "error",
    category: "insufficient_funds",
    phase: "gas_estimation",
    userMessage: "Not enough ETH to cover gas fees",
    technicalMessage: "Required: 0.05 ETH, Available: 0.03 ETH",
    recoverable: true,
    suggestedAction: "Add more ETH to your wallet and try again",
    metadata: {
      required: "0.05",
      available: "0.03",
      chainId: 1,
    },
  });

  // Using error properties
  console.log("Error code:", insufficientFundsError.code);
  console.log("User message:", insufficientFundsError.userMessage);
  console.log("Is recoverable:", insufficientFundsError.recoverable);
  console.log("Suggested action:", insufficientFundsError.suggestedAction);

  // Serializing for logging
  const errorJSON = insufficientFundsError.toJSON();
  console.log("Error for logging:", errorJSON);

  // Creating from unknown error
  try {
    throw new Error("Something went wrong");
  } catch (error) {
    const zapError = ZapExecutionError.fromUnknown(error, "swap_preparation");
    console.log("Converted error:", zapError);
  }

  // User rejection handling
  const userRejectionError = new ZapExecutionError({
    code: "USER_REJECTED",
    severity: "info",
    category: "user_rejection",
    phase: "dispatching",
    userMessage: "Transaction was cancelled",
    technicalMessage: "User rejected transaction in wallet",
    recoverable: true,
  });

  if (userRejectionError.isUserRejection()) {
    console.log("User cancelled - don't show error toast");
  }

  // Network error
  const networkError = new ZapExecutionError({
    code: "NETWORK_ERROR",
    severity: "error",
    category: "network",
    phase: "transaction_building",
    userMessage: "Network connection lost",
    technicalMessage: "Failed to fetch transaction data from RPC",
    recoverable: true,
    suggestedAction: "Check your internet connection and try again",
  });

  // Smart contract error
  const contractError = new ZapExecutionError({
    code: "CONTRACT_REVERT",
    severity: "critical",
    category: "smart_contract",
    phase: "confirming",
    userMessage: "Transaction failed on-chain",
    technicalMessage: "Contract reverted with: 'Insufficient liquidity'",
    recoverable: false,
    suggestedAction: "Wait for better liquidity conditions",
    metadata: {
      revertReason: "Insufficient liquidity",
      contractAddress: "0x...",
    },
  });

  return {
    insufficientFundsError,
    userRejectionError,
    networkError,
    contractError,
  };
}

/**
 * EXAMPLE 7: Type Guards and Helpers
 * Using utility functions from modal.types
 */
import {
  isZapExecutionError,
  isSuccessResult,
  mergeBackdropConfig,
  mergeKeyboardConfig,
  mergeModalBehavior,
  getModalSizeClass,
  getBackdropClasses,
} from "./modal.types";

function typeGuardExamples() {
  // Type guard for errors - demonstrating usage pattern
  const errorExample = new Error("Test error");
  if (isZapExecutionError(errorExample)) {
    console.log("User message:", errorExample.userMessage);
    console.log("Severity:", errorExample.severity);
  } else {
    console.error("Unknown error:", errorExample);
  }

  // Type guard for results - demonstrating usage pattern
  const mockResult: ZapExecutionResult | undefined = {
    status: "success",
    transactions: [],
    totalValue: 1000,
    strategyCount: 3,
    intentId: "test-123",
    executionTime: 5000,
    message: "Test completed",
  };

  if (isSuccessResult(mockResult)) {
    console.log("Success! Transactions:", mockResult.transactions);
  } else {
    console.log("No result");
  }

  // Merging configs
  const customBackdrop = mergeBackdropConfig({
    opacity: "heavy",
    // blur and clickToClose will use defaults
  });

  const customKeyboard = mergeKeyboardConfig({
    closeOnEscape: false,
    // trapFocus will use default
  });

  const customBehavior = mergeModalBehavior({
    closeOnBackdropClick: false,
    showCloseButton: false,
    // Other properties use defaults
  });

  // Getting Tailwind classes
  const sizeClass = getModalSizeClass("lg");
  console.log("Size class:", sizeClass); // "max-w-lg"

  const backdropClass = getBackdropClasses({
    opacity: "heavy",
    blur: "lg",
    clickToClose: false,
  });
  console.log("Backdrop class:", backdropClass); // "bg-gray-950/90 backdrop-blur-lg"

  return {
    customBackdrop,
    customKeyboard,
    customBehavior,
    sizeClass,
    backdropClass,
  };
}

/**
 * EXAMPLE 8: Custom Modal Component
 * Building a custom modal with full type safety
 */
interface WalletConnectModalProps
  extends Omit<BaseModalProps<string>, "children" | "a11y"> {
  wallets: string[];
  onWalletSelect: (walletId: string) => void;
}

function WalletConnectModalExample({
  isOpen,
  onClose,
  wallets,
  onWalletSelect,
  size = "md",
  ...props
}: WalletConnectModalProps) {
  const handleSelect = (walletId: string) => {
    onWalletSelect(walletId);
    onClose(walletId);
  };

  const modalConfig: Partial<BaseModalProps<string>> = {
    isOpen,
    onClose,
    size,
    a11y: {
      label: "Connect Wallet",
      description: "Select a wallet to connect to your portfolio",
      role: "dialog",
      modal: true,
    },
    behavior: {
      closeOnBackdropClick: true,
      closeOnEscape: true,
      showCloseButton: true,
      preventScroll: true,
      restoreFocus: true,
    },
    backdropConfig: {
      opacity: "medium",
      blur: "md",
      clickToClose: true,
    },
    ...props,
  };

  return { modalConfig, handleSelect };
}

/**
 * EXAMPLE 9: Progress Modal with Custom Steps
 * Extending ZapProgressModalProps for custom progress tracking
 */
interface CustomProgressModalProps extends ZapProgressModalProps {
  customSteps?: Array<{
    id: string;
    title: string;
    description: string;
    estimatedTime: number;
  }>;
  onStepComplete?: (stepId: string) => void;
}

const customProgressExample: CustomProgressModalProps = {
  isOpen: true,
  intentId: "custom-intent-123",
  chainId: 137, // Polygon
  totalValue: 2500,
  strategyCount: 2,
  onClose: () => {
    console.log("Custom progress modal closed");
  },
  customSteps: [
    {
      id: "approve-tokens",
      title: "Approving Tokens",
      description: "Setting token approvals for DEX contracts",
      estimatedTime: 3000,
    },
    {
      id: "execute-swaps",
      title: "Executing Swaps",
      description: "Swapping tokens across DEX protocols",
      estimatedTime: 5000,
    },
    {
      id: "deposit-liquidity",
      title: "Depositing Liquidity",
      description: "Adding liquidity to target pools",
      estimatedTime: 4000,
    },
  ],
  onStepComplete: stepId => {
    console.log("Step completed:", stepId);
  },
  showDetailedProgress: true,
};

// Export examples for testing and documentation
export {
  transactionModalExample,
  infoModalExample,
  zapProgressExample,
  confirmationExample,
  lifecycleExample,
  errorHandlingExamples,
  typeGuardExamples,
  WalletConnectModalExample,
  customProgressExample,
};
