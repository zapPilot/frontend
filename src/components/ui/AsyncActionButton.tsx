import React from "react";

interface AsyncActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onAction: () => Promise<void>;
  isLoading?: boolean;
}

/**
 * Button that handles async actions with proper void casting
 * Prevents floating promises and provides consistent loading state
 *
 * @example
 * ```tsx
 * <AsyncActionButton
 *   onAction={async () => await handleSubmit()}
 *   isLoading={isPending}
 * >
 *   Submit
 * </AsyncActionButton>
 * ```
 */
export function AsyncActionButton({
  onAction,
  isLoading = false,
  children,
  className,
  disabled,
  ...props
}: AsyncActionButtonProps) {
  return (
    <button
      onClick={() => void onAction()}
      disabled={isLoading || disabled}
      className={className}
      {...props}
    >
      {isLoading ? "Loading..." : children}
    </button>
  );
}
