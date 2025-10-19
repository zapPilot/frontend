/**
 * UI Type Definitions
 *
 * Centralized, reusable type definitions for UI components to ensure consistency
 * across the application and eliminate type duplication. This module provides
 * standardized types for sizes, variants, colors, and common component props.
 *
 * Used across 50+ components in the codebase for consistent typing and behavior.
 *
 * @module types/ui
 * @version 2.0.0
 */

// =============================================================================
// SIZE TYPES
// =============================================================================

/**
 * Standard size variants for UI components.
 * Used across buttons, inputs, loaders, cards, icons, and other interactive elements.
 *
 * Size mapping guidelines:
 * - `xs`: Extra small (12-16px height, minimal padding)
 * - `sm`: Small (24-32px height, compact padding)
 * - `md`: Medium (40-48px height, standard padding) - DEFAULT
 * - `lg`: Large (48-56px height, generous padding)
 * - `xl`: Extra large (56-64px height, maximum padding)
 *
 * @example
 * ```tsx
 * <Button size="md">Click me</Button>
 * <Spinner size="lg" />
 * <Input size="sm" />
 * ```
 */
export type ComponentSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Subset of ComponentSize for components that don't need all size variants.
 * Most interactive components (buttons, inputs, cards) use this simplified set.
 * Excludes extreme sizes (xs, xl) for better UX consistency.
 *
 * @example
 * ```tsx
 * <Button size="md">Submit</Button>
 * <Input size="lg" />
 * <Card size="sm" />
 * ```
 */
export type StandardSize = "sm" | "md" | "lg";

// =============================================================================
// VARIANT TYPES
// =============================================================================

/**
 * Standard button style variants.
 * Defines the visual style and hierarchy of buttons across the application.
 *
 * Visual Hierarchy:
 * - `primary`: Main call-to-action (gradient background, highest emphasis)
 * - `secondary`: Secondary actions (solid background, medium emphasis)
 * - `outline`: Outlined button (transparent with border, lower emphasis)
 * - `ghost`: Minimal button (transparent, no border, lowest emphasis)
 *
 * Used in: LoadingButton, GradientButton, ActionButtons, and 20+ components
 *
 * @example
 * ```tsx
 * <Button variant="primary">Submit Form</Button>
 * <Button variant="secondary">Save Draft</Button>
 * <Button variant="outline">Cancel</Button>
 * <Button variant="ghost">Learn More</Button>
 * ```
 */
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

/**
 * Loading display variants for different UI contexts.
 * Controls how loading states are presented to users.
 *
 * Variant Selection Guide:
 * - `spinner`: Use for active operations (API calls, transactions)
 * - `card`: Use for loading entire card/section content
 * - `skeleton`: Use for progressive content loading
 * - `inline`: Use for in-text or inline element loading
 *
 * @example
 * ```tsx
 * <LoadingState variant="spinner" message="Processing transaction..." />
 * <LoadingState variant="card" />
 * <LoadingState variant="skeleton" skeletonType="chart" />
 * <LoadingState variant="inline" size="sm" />
 * ```
 */
export type LoadingVariant = "spinner" | "card" | "skeleton" | "inline";

/**
 * Spinner animation variants for visual loading indicators.
 *
 * Performance Note: All variants are GPU-accelerated for smooth 60fps animation.
 *
 * - `default`: Standard rotating circle (universal, accessible)
 * - `dots`: Bouncing dots animation (playful, less formal)
 * - `pulse`: Pulsing circle animation (subtle, minimal)
 *
 * @example
 * ```tsx
 * <Spinner variant="default" size="md" />
 * <Spinner variant="dots" color="primary" />
 * <Spinner variant="pulse" size="lg" />
 * ```
 */
export type SpinnerVariant = "default" | "dots" | "pulse";

/**
 * Skeleton shape variants for placeholder content during loading.
 *
 * Accessibility: All skeletons include proper ARIA labels and role="status".
 *
 * Shape Guidelines:
 * - `text`: Text line placeholders (supports multiple lines)
 * - `circular`: Circular placeholders (avatars, profile pictures, icons)
 * - `rectangular`: Rectangular placeholders (images, cards, media)
 * - `rounded`: Rounded rectangle placeholders (buttons, badges, chips)
 *
 * @example
 * ```tsx
 * <Skeleton variant="circular" width="40px" height="40px" />
 * <Skeleton variant="text" lines={3} spacing="mb-2" />
 * <Skeleton variant="rectangular" width="100%" height="200px" />
 * <Skeleton variant="rounded" width="120px" height="40px" />
 * ```
 */
export type SkeletonVariant = "text" | "circular" | "rectangular" | "rounded";

// =============================================================================
// COLOR TYPES
// =============================================================================

/**
 * Standard color variants for loading indicators and UI accents.
 *
 * Color Usage Guidelines:
 * - `primary`: Brand blue, primary actions
 * - `secondary`: Gray, secondary content
 * - `white`: White spinners on dark backgrounds
 * - `success`/`green`: Success states, positive actions
 * - `warning`: Warning states, caution indicators
 * - `blue`: Explicit blue accent
 * - `gray`: Neutral, inactive states
 * - `red`: Error states, destructive actions
 *
 * @example
 * ```tsx
 * <Spinner color="primary" />
 * <Spinner color="white" /> // On dark backgrounds
 * <Spinner color="success" /> // Success feedback
 * ```
 */
export type LoadingColor =
  | "primary"
  | "secondary"
  | "white"
  | "success"
  | "warning"
  | "blue"
  | "gray"
  | "green"
  | "red";

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
// UTILITY TYPES
// =============================================================================

/**
 * Utility type for size class mappings.
 * Provides type-safe mapping from size variants to CSS class strings.
 *
 * @example
 * ```tsx
 * const sizeClasses: SizeClassMap<ComponentSize> = {
 *   xs: 'h-8 px-2 text-xs',
 *   sm: 'h-10 px-3 text-sm',
 *   md: 'h-12 px-4 text-base',
 *   lg: 'h-14 px-6 text-lg',
 *   xl: 'h-16 px-8 text-xl',
 * };
 * ```
 */
export type SizeClassMap<T extends ComponentSize | StandardSize> = Record<
  T,
  string
>;

/**
 * Utility type for variant class mappings.
 * Provides type-safe mapping from variant types to CSS class strings.
 *
 * @example
 * ```tsx
 * const variantClasses: VariantClassMap<ButtonVariant> = {
 *   primary: 'bg-gradient-to-r from-purple-600 to-blue-600',
 *   secondary: 'bg-gray-600',
 *   outline: 'border border-purple-500',
 *   ghost: 'bg-transparent',
 * };
 * ```
 */
export type VariantClassMap<T extends string> = Record<T, string>;

/**
 * Props for components that support both size and variant customization.
 * Combines sizing and styling flexibility.
 *
 * @example
 * ```tsx
 * interface ButtonProps extends SizedVariantProps<StandardSize, ButtonVariant> {
 *   onClick: () => void;
 *   children: React.ReactNode;
 * }
 *
 * function Button({ size = 'md', variant = 'primary', ...props }: ButtonProps) {
 *   return <button className={classes[variant][size]} {...props} />;
 * }
 * ```
 */
export interface SizedVariantProps<
  S extends ComponentSize | StandardSize,
  V extends string,
> extends BaseComponentProps {
  /**
   * Component size variant.
   * @default 'md'
   */
  size?: S;

  /**
   * Component style variant.
   * @default varies by component
   */
  variant?: V;
}

/**
 * Utility type for extracting specific size subsets.
 * Useful for components that need custom size ranges.
 *
 * @example
 * ```tsx
 * // Only allow small to medium sizes
 * type CompactSize = ExtractSizes<ComponentSize, 'xs' | 'sm' | 'md'>;
 *
 * interface CompactCardProps {
 *   size?: CompactSize; // Only 'xs' | 'sm' | 'md'
 * }
 * ```
 */
export type ExtractSizes<T extends ComponentSize, K extends T> = Extract<T, K>;

/**
 * Props for components that can be in a loading state.
 * Provides standardized loading behavior across components.
 *
 * @example
 * ```tsx
 * interface DataCardProps extends LoadableProps {
 *   data: any;
 *   title: string;
 * }
 *
 * function DataCard({ isLoading, loadingMessage, data, title }: DataCardProps) {
 *   if (isLoading) return <Skeleton />;
 *   return <div>{title}: {data}</div>;
 * }
 * ```
 */
export interface LoadableProps {
  /**
   * Loading state indicator.
   * When true, component should display loading UI.
   */
  isLoading?: boolean;

  /**
   * Optional loading message to display.
   * Used for better UX during async operations.
   */
  loadingMessage?: string;

  /**
   * Loading variant to use when in loading state.
   * @default 'spinner'
   */
  loadingVariant?: LoadingVariant;
}

/**
 * Complete button props combining all common button patterns.
 * Provides comprehensive type coverage for button-like components.
 *
 * @example
 * ```tsx
 * function ActionButton(props: CompleteButtonProps) {
 *   const { size, variant, disabled, loading, icon, children, ...rest } = props;
 *   return <button {...rest}>{icon}{children}</button>;
 * }
 * ```
 */
export interface CompleteButtonProps
  extends InteractiveComponentProps,
    SizedVariantProps<StandardSize, ButtonVariant> {
  /**
   * Full width button (w-full).
   */
  fullWidth?: boolean;

  /**
   * Icon to display before button text.
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon to display after button text.
   */
  rightIcon?: React.ReactNode;

  /**
   * Click handler.
   */
  onClick?: () => void;

  /**
   * Button type attribute.
   * @default 'button'
   */
  type?: "button" | "submit" | "reset";
}

// =============================================================================
// TYPE GUARDS & VALIDATORS
// =============================================================================

/**
 * Type guard to check if a value is a valid ComponentSize.
 *
 * @example
 * ```tsx
 * const userInput = 'lg';
 * if (isComponentSize(userInput)) {
 *   // userInput is now typed as ComponentSize
 *   setSize(userInput);
 * }
 * ```
 */
export function isComponentSize(value: unknown): value is ComponentSize {
  return (
    typeof value === "string" && ["xs", "sm", "md", "lg", "xl"].includes(value)
  );
}

/**
 * Type guard to check if a value is a valid ButtonVariant.
 *
 * @example
 * ```tsx
 * const variant = props.variant;
 * if (isButtonVariant(variant)) {
 *   // variant is now typed as ButtonVariant
 *   applyVariantStyles(variant);
 * }
 * ```
 */
export function isButtonVariant(value: unknown): value is ButtonVariant {
  return (
    typeof value === "string" &&
    ["primary", "secondary", "outline", "ghost"].includes(value)
  );
}

/**
 * Type guard to check if a value is a valid LoadingVariant.
 *
 * @example
 * ```tsx
 * const loadingType = getLoadingType();
 * if (isLoadingVariant(loadingType)) {
 *   renderLoading(loadingType);
 * }
 * ```
 */
export function isLoadingVariant(value: unknown): value is LoadingVariant {
  return (
    typeof value === "string" &&
    ["spinner", "card", "skeleton", "inline"].includes(value)
  );
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default size values for different component types.
 * Provides consistent defaults across the application.
 */
export const DEFAULT_SIZES = {
  button: "md" as const,
  input: "md" as const,
  spinner: "md" as const,
  icon: "md" as const,
  card: "md" as const,
} as const;

/**
 * Default variant values for different component types.
 * Provides consistent defaults across the application.
 */
export const DEFAULT_VARIANTS = {
  button: "primary" as const,
  loading: "spinner" as const,
  spinner: "default" as const,
  skeleton: "rectangular" as const,
} as const;

/**
 * Size order for programmatic size comparisons.
 * Useful for size-based logic (e.g., "is this size larger than that?").
 *
 * @example
 * ```tsx
 * const isLarger = SIZE_ORDER.indexOf('lg') > SIZE_ORDER.indexOf('sm'); // true
 * ```
 */
export const SIZE_ORDER: readonly ComponentSize[] = [
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
] as const;

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Re-export all types for convenience and backwards compatibility.
 * Allows importing multiple types in a single statement.
 *
 * @example
 * ```tsx
 * import type {
 *   ComponentSize,
 *   ButtonVariant,
 *   BaseComponentProps,
 *   Size,              // Alias for ComponentSize
 *   ButtonStyle,       // Alias for ButtonVariant
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
  LoadingColor as Color,
};
