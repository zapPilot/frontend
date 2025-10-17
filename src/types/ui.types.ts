/**
 * UI Type Definitions
 *
 * Standardized type definitions for UI components to ensure consistency
 * across the application and reduce duplication.
 *
 * @module types/ui
 */

// =============================================================================
// SIZE TYPES
// =============================================================================

/**
 * Standard size variants for UI components.
 * Used across buttons, inputs, loaders, and other interactive elements.
 *
 * @example
 * ```tsx
 * <Button size="md">Click me</Button>
 * <Spinner size="lg" />
 * ```
 */
export type ComponentSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Subset of ComponentSize for components that don't need all size variants.
 * Most components use this simplified set.
 *
 * @example
 * ```tsx
 * <Button size="md">Submit</Button>
 * <Input size="lg" />
 * ```
 */
export type StandardSize = "sm" | "md" | "lg";

// =============================================================================
// VARIANT TYPES
// =============================================================================

/**
 * Standard button style variants.
 * Defines the visual style and hierarchy of buttons.
 *
 * - `primary`: Main action button (gradient background)
 * - `secondary`: Secondary action (solid background)
 * - `outline`: Outlined button (transparent with border)
 * - `ghost`: Minimal button (transparent, no border)
 *
 * @example
 * ```tsx
 * <Button variant="primary">Submit</Button>
 * <Button variant="outline">Cancel</Button>
 * ```
 */
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

/**
 * Loading display variants for different UI contexts.
 *
 * - `spinner`: Rotating spinner animation
 * - `card`: Card skeleton placeholder
 * - `skeleton`: Generic skeleton placeholder
 * - `inline`: Inline spinner for text content
 *
 * @example
 * ```tsx
 * <LoadingState variant="spinner" />
 * <LoadingState variant="skeleton" skeletonType="card" />
 * ```
 */
export type LoadingVariant = "spinner" | "card" | "skeleton" | "inline";

/**
 * Spinner animation variants.
 *
 * - `default`: Standard rotating circle
 * - `dots`: Bouncing dots animation
 * - `pulse`: Pulsing circle animation
 *
 * @example
 * ```tsx
 * <Spinner variant="dots" />
 * ```
 */
export type SpinnerVariant = "default" | "dots" | "pulse";

/**
 * Skeleton shape variants for placeholder content.
 *
 * - `text`: Text line placeholder
 * - `circular`: Circular placeholder (avatars, icons)
 * - `rectangular`: Rectangular placeholder (images, cards)
 * - `rounded`: Rounded rectangle placeholder (buttons, badges)
 *
 * @example
 * ```tsx
 * <Skeleton variant="circular" width="40px" height="40px" />
 * <Skeleton variant="text" lines={3} />
 * ```
 */
export type SkeletonVariant = "text" | "circular" | "rectangular" | "rounded";

// =============================================================================
// BASE COMPONENT PROPS
// =============================================================================

/**
 * Standard props included in all UI components.
 * Provides baseline functionality for styling and testing.
 *
 * @example
 * ```tsx
 * interface MyComponentProps extends BaseComponentProps {
 *   title: string;
 * }
 *
 * function MyComponent({ className, testId, title }: MyComponentProps) {
 *   return <div className={className} data-testid={testId}>{title}</div>;
 * }
 * ```
 */
export interface BaseComponentProps {
  /**
   * Additional CSS classes to apply to the component.
   * Merged with component's default classes.
   */
  className?: string;

  /**
   * Test identifier for automated testing.
   * Used with `data-testid` attribute.
   */
  testId?: string;
}

/**
 * Props for interactive components (buttons, links, inputs).
 * Extends BaseComponentProps with interaction states.
 *
 * @example
 * ```tsx
 * interface ButtonProps extends InteractiveComponentProps {
 *   onClick: () => void;
 * }
 *
 * function Button({ disabled, loading, onClick }: ButtonProps) {
 *   return (
 *     <button disabled={disabled || loading} onClick={onClick}>
 *       {loading ? 'Loading...' : 'Click me'}
 *     </button>
 *   );
 * }
 * ```
 */
export interface InteractiveComponentProps extends BaseComponentProps {
  /**
   * Disabled state for the component.
   * When true, the component cannot be interacted with.
   */
  disabled?: boolean;

  /**
   * Loading state for the component.
   * When true, the component shows loading indicator.
   */
  loading?: boolean;
}

/**
 * Props for components with size variants.
 * Extends BaseComponentProps with standardized sizing.
 *
 * @example
 * ```tsx
 * interface InputProps extends SizedComponentProps {
 *   value: string;
 *   onChange: (value: string) => void;
 * }
 *
 * function Input({ size = 'md', value, onChange }: InputProps) {
 *   const sizeClasses = {
 *     sm: 'h-8 text-sm',
 *     md: 'h-10 text-base',
 *     lg: 'h-12 text-lg',
 *   };
 *   return <input className={sizeClasses[size]} value={value} />;
 * }
 * ```
 */
export interface SizedComponentProps extends BaseComponentProps {
  /**
   * Component size variant.
   * Defaults to 'md' if not specified.
   */
  size?: StandardSize;
}

/**
 * Props for components with accessibility requirements.
 * Should be used in addition to other base props.
 *
 * @example
 * ```tsx
 * interface IconButtonProps extends BaseComponentProps, AccessibilityProps {
 *   icon: ReactNode;
 *   onClick: () => void;
 * }
 *
 * function IconButton({ icon, ariaLabel, onClick }: IconButtonProps) {
 *   return (
 *     <button aria-label={ariaLabel} onClick={onClick}>
 *       {icon}
 *     </button>
 *   );
 * }
 * ```
 */
export interface AccessibilityProps {
  /**
   * Accessible label for screen readers.
   * Required for icon-only buttons and interactive elements without visible text.
   */
  ariaLabel?: string;

  /**
   * Describes the element for screen readers.
   */
  ariaDescription?: string;

  /**
   * Indicates if the element is expanded (for collapsible content).
   */
  ariaExpanded?: boolean;

  /**
   * References another element by ID.
   */
  ariaControls?: string;
}

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Re-export all types for convenience.
 * Allows importing multiple types in a single statement.
 *
 * @example
 * ```tsx
 * import type {
 *   ComponentSize,
 *   ButtonVariant,
 *   BaseComponentProps
 * } from '@/types/ui.types';
 * ```
 */
export type {
  ComponentSize as Size,
  StandardSize as StandardComponentSize,
  ButtonVariant as ButtonStyle,
  LoadingVariant as LoadingStyle,
  SpinnerVariant as SpinnerStyle,
  SkeletonVariant as SkeletonStyle,
};
