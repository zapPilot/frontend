/**
 * Modal Component Types
 *
 * Comprehensive type definitions for modal/dialog components across the application.
 * Designed for safety-critical financial transaction modals with full type safety,
 * accessibility support, and Radix UI Dialog compatibility.
 *
 * @module types/modal
 */

import type { ReactNode } from "react";

/**
 * Standard modal sizes following the design system
 * Maps to max-width Tailwind utilities for consistent sizing
 *
 * @example
 * ```tsx
 * <BaseModal size="md" {...props}>Content</BaseModal>
 * ```
 */
export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

/**
 * Modal size mappings to Tailwind max-width utilities
 * Used for consistent modal sizing across the application
 */
export const MODAL_SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  full: "max-w-full",
} as const;

/**
 * Backdrop opacity variants for modal backgrounds
 * Higher opacity values create stronger focus on modal content
 */
export type BackdropOpacity = "light" | "medium" | "heavy" | "full";

/**
 * Backdrop opacity mappings to Tailwind classes
 * Combined with backdrop-blur for glass morphism effect
 */
export const BACKDROP_OPACITY_CLASSES: Record<BackdropOpacity, string> = {
  light: "bg-gray-950/60",
  medium: "bg-gray-950/80",
  heavy: "bg-gray-950/90",
  full: "bg-gray-950",
} as const;

/**
 * Backdrop blur intensity for glass morphism effect
 * Used in combination with opacity for layered modal backgrounds
 */
export type BackdropBlur = "none" | "sm" | "md" | "lg";

/**
 * Backdrop blur mappings to Tailwind utilities
 */
export const BACKDROP_BLUR_CLASSES: Record<BackdropBlur, string> = {
  none: "",
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
  lg: "backdrop-blur-lg",
} as const;

/**
 * Backdrop configuration for modal overlay
 * Controls visual appearance and interaction behavior
 *
 * @property {BackdropOpacity} opacity - Background opacity level
 * @property {BackdropBlur} blur - Blur intensity for glass effect
 * @property {boolean} clickToClose - Whether clicking backdrop closes modal
 *
 * @example
 * ```tsx
 * const config: BackdropConfig = {
 *   opacity: 'heavy',
 *   blur: 'lg',
 *   clickToClose: false // Prevent accidental closes during transactions
 * };
 * ```
 */
export interface BackdropConfig {
  /** Background opacity level */
  opacity: BackdropOpacity;
  /** Blur intensity for glass morphism effect */
  blur: BackdropBlur;
  /** Whether clicking backdrop closes the modal */
  clickToClose: boolean;
}

/**
 * Default backdrop configuration
 * Optimized for safety-critical transaction modals
 */
export const DEFAULT_BACKDROP_CONFIG: BackdropConfig = {
  opacity: "heavy",
  blur: "lg",
  clickToClose: false,
} as const;

/**
 * Keyboard shortcut configuration for modal interactions
 * Controls keyboard accessibility and user experience
 *
 * @property {boolean} closeOnEscape - Whether ESC key closes modal
 * @property {boolean} trapFocus - Whether to trap focus within modal
 * @property {string[]} customShortcuts - Additional keyboard shortcuts
 *
 * @example
 * ```tsx
 * const keyboardConfig: KeyboardConfig = {
 *   closeOnEscape: true,
 *   trapFocus: true,
 *   customShortcuts: ['Enter'] // Enter to submit
 * };
 * ```
 */
export interface KeyboardConfig {
  /** Whether ESC key closes the modal */
  closeOnEscape: boolean;
  /** Whether to trap focus within modal for accessibility */
  trapFocus: boolean;
  /** Additional keyboard shortcuts (e.g., ['Enter', 'Ctrl+S']) */
  customShortcuts?: string[];
}

/**
 * Default keyboard configuration
 * Follows WCAG accessibility guidelines
 */
export const DEFAULT_KEYBOARD_CONFIG: KeyboardConfig = {
  closeOnEscape: true,
  trapFocus: true,
  customShortcuts: [],
} as const;

/**
 * ARIA accessibility properties for screen readers
 * Ensures modals are properly announced and navigable
 *
 * @property {string} label - Modal title for screen readers
 * @property {string} description - Modal purpose description
 * @property {string} role - ARIA role (default: 'dialog')
 * @property {boolean} modal - Whether modal is modal (blocks interaction)
 *
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/}
 */
export interface AccessibilityProps {
  /** Modal title announced by screen readers */
  label: string;
  /** Detailed description of modal purpose */
  description?: string;
  /** ARIA role attribute */
  role?: "dialog" | "alertdialog";
  /** Whether modal is modal (blocks background interaction) */
  modal?: boolean;
}

/**
 * Modal lifecycle event callbacks
 * Provides hooks into modal state transitions
 *
 * @template TData - Type of data passed to callbacks
 *
 * @property {function} onOpen - Called when modal opens
 * @property {function} onClose - Called when modal closes
 * @property {function} onOpenChange - Called when open state changes
 * @property {function} onEscapeKeyDown - Called when ESC pressed
 * @property {function} onBackdropClick - Called when backdrop clicked
 *
 * @example
 * ```tsx
 * const callbacks: ModalCallbacks<TransactionData> = {
 *   onOpen: () => console.log('Modal opened'),
 *   onClose: (data) => saveTransactionState(data),
 *   onEscapeKeyDown: (e) => confirmClose(e)
 * };
 * ```
 */
export interface ModalCallbacks<TData = unknown> {
  /** Called after modal has opened */
  onOpen?: () => void;
  /** Called after modal has closed, with optional data */
  onClose?: (data?: TData) => void;
  /** Called when open state changes */
  onOpenChange?: (isOpen: boolean) => void;
  /** Called when ESC key pressed, can prevent default */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  /** Called when backdrop clicked, can prevent default */
  onBackdropClick?: (event: MouseEvent) => void;
  /** Called before modal closes, return false to prevent */
  onBeforeClose?: () => boolean | Promise<boolean>;
}

/**
 * Base modal behavior configuration
 * Controls core interaction patterns and visual elements
 *
 * @property {boolean} closeOnBackdropClick - Close when clicking outside
 * @property {boolean} closeOnEscape - Close when pressing ESC key
 * @property {boolean} showCloseButton - Show X button in corner
 * @property {boolean} preventScroll - Prevent body scroll when open
 * @property {boolean} restoreFocus - Restore focus on close
 * @property {string} closeButtonLabel - Accessible label for close button
 *
 * @example
 * ```tsx
 * // Transaction modal - prevent accidental closes
 * const behavior: BaseModalBehavior = {
 *   closeOnBackdropClick: false,
 *   closeOnEscape: false,
 *   showCloseButton: false,
 *   preventScroll: true
 * };
 *
 * // Info modal - easy to dismiss
 * const behavior: BaseModalBehavior = {
 *   closeOnBackdropClick: true,
 *   closeOnEscape: true,
 *   showCloseButton: true
 * };
 * ```
 */
export interface BaseModalBehavior {
  /** Whether clicking backdrop closes modal */
  closeOnBackdropClick: boolean;
  /** Whether ESC key closes modal */
  closeOnEscape: boolean;
  /** Whether to show close button (X icon) */
  showCloseButton: boolean;
  /** Whether to prevent body scroll when modal is open */
  preventScroll: boolean;
  /** Whether to restore focus to trigger element on close */
  restoreFocus: boolean;
  /** Accessible label for close button */
  closeButtonLabel?: string;
  /** Auto-close after duration (milliseconds), disabled if undefined */
  autoCloseDelay?: number;
}

/**
 * Default modal behavior
 * Balanced for general use cases
 */
export const DEFAULT_MODAL_BEHAVIOR: BaseModalBehavior = {
  closeOnBackdropClick: false,
  closeOnEscape: true,
  showCloseButton: true,
  preventScroll: true,
  restoreFocus: true,
  closeButtonLabel: "Close modal",
} as const;

/**
 * Base modal props with generic result type
 * Foundation for all modal components in the application
 *
 * @template TResult - Type of result returned when modal closes
 *
 * @property {boolean} isOpen - Whether modal is currently open
 * @property {function} onClose - Handler called when modal closes
 * @property {ModalSize} size - Modal size variant
 * @property {ReactNode} children - Modal content
 * @property {string} className - Additional CSS classes
 * @property {BackdropConfig} backdropConfig - Backdrop appearance config
 * @property {KeyboardConfig} keyboardConfig - Keyboard interaction config
 * @property {AccessibilityProps} a11y - Accessibility properties
 * @property {BaseModalBehavior} behavior - Modal behavior config
 * @property {ModalCallbacks} callbacks - Lifecycle event callbacks
 *
 * @example
 * ```tsx
 * interface MyModalProps extends BaseModalProps<TransactionResult> {
 *   transactionId: string;
 * }
 *
 * function MyModal({ isOpen, onClose, transactionId }: MyModalProps) {
 *   const handleComplete = (result: TransactionResult) => {
 *     onClose(result);
 *   };
 *   return <BaseModal {...props}>{content}</BaseModal>;
 * }
 * ```
 */
export interface BaseModalProps<TResult = void> {
  /** Whether modal is currently open */
  isOpen: boolean;
  /** Handler called when modal closes, receives optional result */
  onClose: (result?: TResult) => void;
  /** Modal size variant */
  size?: ModalSize;
  /** Modal content */
  children: ReactNode;
  /** Additional CSS classes for customization */
  className?: string;
  /** Backdrop visual and interaction configuration */
  backdropConfig?: Partial<BackdropConfig>;
  /** Keyboard interaction configuration */
  keyboardConfig?: Partial<KeyboardConfig>;
  /** Accessibility properties for screen readers */
  a11y: AccessibilityProps;
  /** Modal behavior configuration */
  behavior?: Partial<BaseModalBehavior>;
  /** Lifecycle event callbacks */
  callbacks?: ModalCallbacks<TResult>;
  /** Z-index override for stacking context */
  zIndex?: string;
}

/**
 * Transaction execution status
 * Tracks the state of blockchain transactions
 */
export type TransactionStatus =
  | "idle"
  | "pending"
  | "confirming"
  | "success"
  | "failed"
  | "cancelled";

/**
 * Zap execution step phases
 * Matches backend UnifiedZap execution pipeline
 */
export type ZapExecutionPhase =
  | "connected"
  | "strategy_parsing"
  | "token_analysis"
  | "swap_preparation"
  | "transaction_building"
  | "gas_estimation"
  | "final_assembly"
  | "dispatching"
  | "confirming"
  | "complete"
  | "error";

/**
 * Transaction metadata for block explorers
 *
 * @property {string} hash - Transaction hash
 * @property {number} chainId - Chain ID where transaction occurred
 * @property {string} explorerUrl - Block explorer URL
 * @property {number} blockNumber - Block number (if confirmed)
 * @property {string} gasUsed - Gas consumed by transaction
 * @property {string} effectiveGasPrice - Effective gas price paid
 */
export interface TransactionMetadata {
  /** Transaction hash */
  hash: string;
  /** Chain ID where transaction occurred */
  chainId: number;
  /** Block explorer URL for this transaction */
  explorerUrl?: string;
  /** Block number (available after confirmation) */
  blockNumber?: number;
  /** Gas consumed by transaction (in wei) */
  gasUsed?: string;
  /** Effective gas price paid (in wei) */
  effectiveGasPrice?: string;
  /** Transaction timestamp */
  timestamp?: number;
}

/**
 * Successful Zap execution result
 * Returned when transaction completes successfully
 *
 * @property {TransactionStatus} status - Final transaction status
 * @property {TransactionMetadata[]} transactions - Transaction details
 * @property {number} totalValue - Total value transacted (USD)
 * @property {number} strategyCount - Number of strategies executed
 * @property {string} intentId - Intent identifier for tracking
 * @property {number} executionTime - Total execution time (ms)
 * @property {string} message - Success message for user
 *
 * @example
 * ```tsx
 * const result: ZapExecutionResult = {
 *   status: 'success',
 *   transactions: [{ hash: '0x...', chainId: 1 }],
 *   totalValue: 1000,
 *   strategyCount: 3,
 *   intentId: 'intent-123',
 *   executionTime: 5400,
 *   message: 'Successfully deployed to 3 strategies'
 * };
 * ```
 */
export interface ZapExecutionResult {
  /** Final transaction status */
  status: TransactionStatus;
  /** Array of transaction metadata */
  transactions: TransactionMetadata[];
  /** Total value transacted in USD */
  totalValue: number;
  /** Number of strategies executed */
  strategyCount: number;
  /** Intent identifier for tracking */
  intentId: string;
  /** Total execution time in milliseconds */
  executionTime: number;
  /** User-facing success message */
  message: string;
  /** Optional additional data */
  metadata?: Record<string, unknown>;
}

/**
 * Error severity levels for user feedback
 * Determines error presentation and recovery options
 */
export type ErrorSeverity = "info" | "warning" | "error" | "critical";

/**
 * Error category for classification and handling
 * Helps route errors to appropriate recovery flows
 */
export type ErrorCategory =
  | "network"
  | "wallet"
  | "validation"
  | "transaction"
  | "timeout"
  | "user_rejection"
  | "insufficient_funds"
  | "smart_contract"
  | "unknown";

/**
 * Structured error for Zap execution failures
 * Provides comprehensive error information for debugging and user feedback
 *
 * @extends Error
 *
 * @property {string} code - Machine-readable error code
 * @property {ErrorSeverity} severity - Error severity level
 * @property {ErrorCategory} category - Error classification
 * @property {ZapExecutionPhase} phase - Execution phase where error occurred
 * @property {string} userMessage - User-friendly error message
 * @property {string} technicalMessage - Technical error details
 * @property {boolean} recoverable - Whether error is recoverable
 * @property {string} suggestedAction - Suggested recovery action
 * @property {Record} metadata - Additional error context
 *
 * @example
 * ```tsx
 * throw new ZapExecutionError({
 *   code: 'INSUFFICIENT_GAS',
 *   severity: 'error',
 *   category: 'transaction',
 *   phase: 'gas_estimation',
 *   userMessage: 'Not enough ETH for gas fees',
 *   technicalMessage: 'Gas estimation: 0.05 ETH, balance: 0.03 ETH',
 *   recoverable: true,
 *   suggestedAction: 'Add more ETH to your wallet and try again'
 * });
 * ```
 */
export class ZapExecutionError extends Error {
  /** Machine-readable error code */
  public readonly code: string;
  /** Error severity level */
  public readonly severity: ErrorSeverity;
  /** Error classification */
  public readonly category: ErrorCategory;
  /** Execution phase where error occurred */
  public readonly phase: ZapExecutionPhase | undefined;
  /** User-friendly error message */
  public readonly userMessage: string;
  /** Technical error details for debugging */
  public readonly technicalMessage: string;
  /** Whether error is recoverable */
  public readonly recoverable: boolean;
  /** Suggested action for recovery */
  public readonly suggestedAction: string | undefined;
  /** Additional error context */
  public readonly metadata: Record<string, unknown> | undefined;
  /** Timestamp when error occurred */
  public readonly timestamp: number;

  constructor(options: {
    code: string;
    severity: ErrorSeverity;
    category: ErrorCategory;
    phase?: ZapExecutionPhase | undefined;
    userMessage: string;
    technicalMessage: string;
    recoverable: boolean;
    suggestedAction?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
  }) {
    super(options.userMessage);
    this.name = "ZapExecutionError";
    this.code = options.code;
    this.severity = options.severity;
    this.category = options.category;
    this.phase = options.phase;
    this.userMessage = options.userMessage;
    this.technicalMessage = options.technicalMessage;
    this.recoverable = options.recoverable;
    this.suggestedAction = options.suggestedAction;
    this.metadata = options.metadata;
    this.timestamp = Date.now();

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ZapExecutionError);
    }
  }

  /**
   * Serializes error for logging and analytics
   */
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      severity: this.severity,
      category: this.category,
      phase: this.phase,
      userMessage: this.userMessage,
      technicalMessage: this.technicalMessage,
      recoverable: this.recoverable,
      suggestedAction: this.suggestedAction,
      metadata: this.metadata,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  /**
   * Creates error from unknown error type
   * Safely handles any error thrown in try/catch blocks
   */
  public static fromUnknown(
    error: unknown,
    phase?: ZapExecutionPhase | undefined
  ): ZapExecutionError {
    if (error instanceof ZapExecutionError) {
      return error;
    }

    const message =
      error instanceof Error ? error.message : String(error || "Unknown error");

    return new ZapExecutionError({
      code: "UNKNOWN_ERROR",
      severity: "error",
      category: "unknown",
      phase: phase !== undefined ? phase : undefined,
      userMessage: "An unexpected error occurred",
      technicalMessage: message,
      recoverable: false,
      metadata: {
        originalError: error instanceof Error ? error.stack : error,
      },
    });
  }

  /**
   * Checks if error is a user rejection
   * Helps distinguish user cancellations from actual errors
   */
  public isUserRejection(): boolean {
    return (
      this.category === "user_rejection" ||
      this.code === "USER_REJECTED" ||
      this.message.toLowerCase().includes("user rejected") ||
      this.message.toLowerCase().includes("user denied")
    );
  }
}

/**
 * Progress modal props for transaction execution
 * Extends base modal with progress tracking capabilities
 *
 * @extends BaseModalProps<ZapExecutionResult>
 *
 * @example
 * ```tsx
 * <ZapProgressModal
 *   isOpen={true}
 *   intentId="intent-123"
 *   chainId={1}
 *   totalValue={1000}
 *   strategyCount={3}
 *   onComplete={(result) => console.log('Success', result)}
 *   onError={(error) => console.error('Failed', error)}
 * />
 * ```
 */
export interface ZapProgressModalProps
  extends Omit<BaseModalProps<ZapExecutionResult>, "children" | "a11y"> {
  /** Intent ID for tracking execution */
  intentId: string;
  /** Chain ID where transaction executes */
  chainId: number;
  /** Total transaction value in USD */
  totalValue: number;
  /** Number of strategies being executed */
  strategyCount: number;
  /** Called when execution completes successfully */
  onComplete?: (result: ZapExecutionResult) => void;
  /** Called when execution fails */
  onError?: (error: ZapExecutionError) => void;
  /** Called when user cancels execution */
  onCancel?: () => void;
  /** Whether to show detailed step progress */
  showDetailedProgress?: boolean;
}

/**
 * Confirmation modal props for critical actions
 * Used for destructive actions requiring explicit confirmation
 *
 * @extends BaseModalProps<boolean>
 *
 * @example
 * ```tsx
 * <ConfirmationModal
 *   isOpen={true}
 *   title="Confirm Transaction"
 *   message="This will execute 3 transactions totaling $1,000 USD"
 *   confirmText="Execute"
 *   cancelText="Cancel"
 *   variant="warning"
 *   onConfirm={() => executeTransaction()}
 *   onCancel={() => setOpen(false)}
 * />
 * ```
 */
export interface ConfirmationModalProps
  extends Omit<BaseModalProps<boolean>, "children"> {
  /** Modal title */
  title: string;
  /** Confirmation message */
  message: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Visual variant for severity */
  variant?: "info" | "warning" | "danger";
  /** Called when user confirms */
  onConfirm: () => void | Promise<void>;
  /** Called when user cancels */
  onCancel: () => void;
  /** Whether confirm action is loading */
  isLoading?: boolean;
}

/**
 * Type guard to check if error is ZapExecutionError
 */
export function isZapExecutionError(
  error: unknown
): error is ZapExecutionError {
  return error instanceof ZapExecutionError;
}

/**
 * Type guard to check if modal result is successful
 */
export function isSuccessResult(
  result: ZapExecutionResult | undefined
): result is ZapExecutionResult {
  return result !== undefined && result.status === "success";
}

/**
 * Helper to merge partial configs with defaults
 * Ensures all required config properties are present
 */
export function mergeBackdropConfig(
  partial?: Partial<BackdropConfig>
): BackdropConfig {
  return {
    ...DEFAULT_BACKDROP_CONFIG,
    ...partial,
  };
}

/**
 * Helper to merge partial keyboard configs with defaults
 */
export function mergeKeyboardConfig(
  partial?: Partial<KeyboardConfig>
): KeyboardConfig {
  return {
    ...DEFAULT_KEYBOARD_CONFIG,
    ...partial,
  };
}

/**
 * Helper to merge partial behavior configs with defaults
 */
export function mergeModalBehavior(
  partial?: Partial<BaseModalBehavior>
): BaseModalBehavior {
  return {
    ...DEFAULT_MODAL_BEHAVIOR,
    ...partial,
  };
}

/**
 * Helper to get Tailwind classes for modal size
 */
export function getModalSizeClass(size: ModalSize = "md"): string {
  return MODAL_SIZE_CLASSES[size];
}

/**
 * Helper to get combined backdrop classes
 */
export function getBackdropClasses(config: BackdropConfig): string {
  return `${BACKDROP_OPACITY_CLASSES[config.opacity]} ${BACKDROP_BLUR_CLASSES[config.blur]}`.trim();
}
