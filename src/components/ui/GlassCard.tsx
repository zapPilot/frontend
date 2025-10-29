"use client";

import { ReactNode } from "react";
import { BaseComponentProps } from "../../types/ui.types";
import { BaseCard } from "./BaseCard";

type AriaLive = "off" | "polite" | "assertive";

interface GlassCardProps extends BaseComponentProps {
  children: ReactNode;
  animate?: boolean;
  role?: string;
  ariaLive?: AriaLive;
}

/**
 * GlassCard - Legacy wrapper for BaseCard with glass morphism styling
 *
 * Maintained for backward compatibility. New code should use BaseCard directly.
 * Provides default glass morphism styling with rounded-3xl and p-6.
 *
 * @deprecated Use BaseCard with variant="glass" instead
 */
export function GlassCard({
  children,
  className = "",
  animate = true,
  testId,
  role,
  ariaLive,
}: GlassCardProps) {
  return (
    <BaseCard
      variant="glass"
      padding="xl"
      borderRadius="2xl"
      border={true}
      animate={animate}
      className={className}
      {...(testId && { testId })}
      {...(role && { role })}
      {...(ariaLive && { ariaLive })}
    >
      {children}
    </BaseCard>
  );
}
