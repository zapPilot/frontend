"use client";

import { type HTMLMotionProps, motion } from "framer-motion";
import type { PropsWithChildren } from "react";

interface FadeInSectionProps
  extends Omit<HTMLMotionProps<"div">, "initial" | "animate" | "transition"> {
  delay?: number;
  yOffset?: number;
  transition?: HTMLMotionProps<"div">["transition"];
}

export function FadeInSection({
  children,
  delay = 0,
  yOffset = 20,
  className,
  transition,
  ...rest
}: PropsWithChildren<FadeInSectionProps>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition ?? { delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
