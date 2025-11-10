import { motion } from "framer-motion";
import type { PropsWithChildren } from "react";

interface AnimatedDropdownProps {
  className?: string;
}

const BASE_ANIMATION = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
} as const;

export function AnimatedDropdown({
  className = "",
  children,
}: PropsWithChildren<AnimatedDropdownProps>) {
  return (
    <motion.div
      initial={BASE_ANIMATION.initial}
      animate={BASE_ANIMATION.animate}
      exit={BASE_ANIMATION.exit}
      className={className}
    >
      {children}
    </motion.div>
  );
}
