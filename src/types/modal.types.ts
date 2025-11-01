/**
 * Modal Component Types
 *
 * Type definitions for modal/dialog components.
 * Minimal set retained for ZapExecutionProgress component.
 *
 * @module types/modal
 */

import type { ReactNode } from "react";

/**
 * Standard modal sizes following the design system
 */
export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

/**
 * Backdrop opacity variants for modal backgrounds
 */
export type BackdropOpacity = "light" | "medium" | "heavy" | "full";

/**
 * Backdrop blur intensity for glass morphism effect
 */
export type BackdropBlur = "none" | "sm" | "md" | "lg";

/**
 * Backdrop configuration for modal overlay
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
 * Keyboard shortcut configuration for modal interactions
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
 * ARIA accessibility properties for screen readers
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
 * Base modal props with generic result type
 * Foundation for all modal components in the application
 *
 * @template TResult - Type of result returned when modal closes
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
 */
export type TransactionStatus =
  | "idle"
  | "pending"
  | "confirming"
  | "success"
  | "failed"
  | "cancelled";

/**
 * Transaction metadata for block explorers
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
