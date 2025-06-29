"use client";

import { motion } from "framer-motion";
import { ReactNode, memo, useMemo } from "react";
import { LucideIcon } from "lucide-react";

interface GradientButtonProps {
  children: ReactNode;
  onClick?: () => void;
  gradient: string;
  shadowColor?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  className?: string;
  testId?: string;
}

export const GradientButton = memo<GradientButtonProps>(
  function GradientButton({
    children,
    onClick,
    gradient,
    shadowColor,
    icon: Icon,
    disabled = false,
    className = "",
    testId,
  }) {
    const fullClassName = useMemo(() => {
      const baseClasses =
        "p-4 rounded-2xl text-white font-semibold flex items-center justify-center space-x-2 transition-all duration-300";
      const gradientClasses = `bg-gradient-to-r ${gradient}`;
      const shadowClasses = shadowColor
        ? `hover:shadow-lg hover:shadow-${shadowColor}/25`
        : "";
      const disabledClasses = disabled
        ? "opacity-50 cursor-not-allowed"
        : "cursor-pointer";

      return `${baseClasses} ${gradientClasses} ${shadowClasses} ${disabledClasses} ${className}`;
    }, [gradient, shadowColor, disabled, className]);

    const motionProps = useMemo(
      () => ({
        whileHover: disabled ? {} : { scale: 1.02, y: -1 },
        whileTap: disabled ? {} : { scale: 0.98 },
        transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
      }),
      [disabled]
    );

    return (
      <motion.button
        {...motionProps}
        onClick={onClick}
        disabled={disabled}
        className={fullClassName}
        data-testid={testId}
      >
        {Icon && <Icon className="w-5 h-5" />}
        {children}
      </motion.button>
    );
  }
);
