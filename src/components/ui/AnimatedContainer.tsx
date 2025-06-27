"use client";

import { motion } from "framer-motion";
import { ReactNode, memo } from "react";

interface AnimatedContainerProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  variant?:
    | "fadeInUp"
    | "fadeInDown"
    | "fadeInLeft"
    | "fadeInRight"
    | "fadeIn"
    | "scale";
  duration?: number;
}

const animationVariants = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
  },
  fadeInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
  },
  fadeInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
  },
} as const;

const AnimatedContainerComponent = ({
  children,
  delay = 0,
  className = "",
  variant = "fadeInUp",
  duration = 0.5,
}: AnimatedContainerProps) => {
  const variants = animationVariants[variant];

  if (!variants) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={variants.initial}
      animate={variants.animate}
      transition={{ delay, duration }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedContainer = memo(AnimatedContainerComponent);

// Convenience components for common patterns
const FadeInUpComponent = ({
  children,
  ...props
}: Omit<AnimatedContainerProps, "variant">) => (
  <AnimatedContainer variant="fadeInUp" {...props}>
    {children}
  </AnimatedContainer>
);
FadeInUpComponent.displayName = "FadeInUp";
export const FadeInUp = memo(FadeInUpComponent);

const FadeInScaleComponent = ({
  children,
  ...props
}: Omit<AnimatedContainerProps, "variant">) => (
  <AnimatedContainer variant="scale" {...props}>
    {children}
  </AnimatedContainer>
);
FadeInScaleComponent.displayName = "FadeInScale";
export const FadeInScale = memo(FadeInScaleComponent);

const StaggerContainerComponent = ({
  children,
  staggerDelay = 0.1,
  className = "",
}: {
  children: ReactNode[];
  staggerDelay?: number;
  className?: string;
}) => (
  <div className={className}>
    {children.map((child, index) => (
      <FadeInUp key={index} delay={index * staggerDelay}>
        {child}
      </FadeInUp>
    ))}
  </div>
);
StaggerContainerComponent.displayName = "StaggerContainer";
export const StaggerContainer = memo(StaggerContainerComponent);
