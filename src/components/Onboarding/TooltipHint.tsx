"use client";

import { GRADIENTS } from "@/constants/design-system";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface TooltipHintProps {
  hintId: string;
  title: string;
  description: string;
  targetSelector: string;
  placement?: "top" | "bottom" | "left" | "right";
  showDismiss?: boolean;
  priority?: "high" | "medium" | "low";
  trigger?: "immediate" | "hover" | "delay";
  delayMs?: number;
}

export function TooltipHint({
  hintId,
  title,
  description,
  targetSelector,
  placement = "bottom",
  showDismiss = true,
  priority = "medium",
  trigger = "immediate",
  delayMs = 2000,
}: TooltipHintProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const { shouldShowHint, markStepCompleted } = useOnboarding();

  // Check if hint should be shown
  const shouldShow = shouldShowHint(hintId);

  // Update tooltip position
  const updatePosition = useCallback(
    (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const hintRect = hintRef.current?.getBoundingClientRect();

      let x = 0;
      let y = 0;

      switch (placement) {
        case "top":
          x = rect.left + rect.width / 2 - (hintRect?.width || 0) / 2;
          y = rect.top - (hintRect?.height || 0) - 8;
          break;
        case "bottom":
          x = rect.left + rect.width / 2 - (hintRect?.width || 0) / 2;
          y = rect.bottom + 8;
          break;
        case "left":
          x = rect.left - (hintRect?.width || 0) - 8;
          y = rect.top + rect.height / 2 - (hintRect?.height || 0) / 2;
          break;
        case "right":
          x = rect.right + 8;
          y = rect.top + rect.height / 2 - (hintRect?.height || 0) / 2;
          break;
      }

      // Keep tooltip within viewport
      const padding = 16;
      x = Math.max(
        padding,
        Math.min(x, window.innerWidth - (hintRect?.width || 0) - padding)
      );
      y = Math.max(
        padding,
        Math.min(y, window.innerHeight - (hintRect?.height || 0) - padding)
      );

      setPosition({ x, y });
    },
    [placement]
  );

  // Find target element and calculate position
  useEffect(() => {
    if (!shouldShow) return;

    const findAndPositionHint = () => {
      const element = document.querySelector(targetSelector) as HTMLElement;
      if (element) {
        setTargetElement(element);
        updatePosition(element);
      }
    };

    // Initial positioning
    setTimeout(findAndPositionHint, 100);

    // Re-position on window resize
    const handleResize = () => {
      if (targetElement) {
        updatePosition(targetElement);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [targetSelector, shouldShow, targetElement, updatePosition]);

  // Handle show/hide logic based on trigger
  useEffect(() => {
    if (!shouldShow || !targetElement) return;

    const showHint = () => setIsVisible(true);
    const hideHint = () => setIsVisible(false);

    switch (trigger) {
      case "immediate":
        showHint();
        return; // No cleanup needed

      case "delay":
        const delayTimer = setTimeout(showHint, delayMs);
        return () => clearTimeout(delayTimer);

      case "hover":
        targetElement.addEventListener("mouseenter", showHint);
        targetElement.addEventListener("mouseleave", hideHint);
        return () => {
          targetElement.removeEventListener("mouseenter", showHint);
          targetElement.removeEventListener("mouseleave", hideHint);
        };
    }
  }, [shouldShow, targetElement, trigger, delayMs]);

  // Handle dismiss
  const handleDismiss = () => {
    setIsVisible(false);
    markStepCompleted(hintId);
  };

  // Handle action button
  const handleAction = () => {
    setIsVisible(false);
    markStepCompleted(hintId);

    // Focus on target element for better UX
    if (targetElement) {
      targetElement.focus();
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (!shouldShow) return null;

  const priorityColors = {
    high: "from-purple-600/90 to-blue-600/90 border-purple-500/50",
    medium: "from-blue-600/90 to-indigo-600/90 border-blue-500/50",
    low: "from-gray-600/90 to-gray-700/90 border-gray-500/50",
  };

  const priorityIcons = {
    high: "⚡",
    medium: "💡",
    low: "ℹ️",
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={hintRef}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ duration: 0.3, type: "spring", damping: 25 }}
          className={`fixed z-[9999] max-w-xs sm:max-w-sm pointer-events-auto`}
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          <div
            className={`glass-morphism border ${priorityColors[priority]} rounded-xl p-4 shadow-lg backdrop-blur-md`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span
                  className="text-lg"
                  role="img"
                  aria-label={`${priority} priority`}
                >
                  {priorityIcons[priority]}
                </span>
                <h3 className="font-semibold text-white text-sm">{title}</h3>
              </div>

              {showDismiss && (
                <button
                  onClick={handleDismiss}
                  className="text-gray-400 hover:text-white transition-colors p-1 -mt-1 -mr-1"
                  aria-label="Dismiss hint"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-300 text-xs mb-3 leading-relaxed">
              {description}
            </p>

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleAction}
                className={`px-3 py-1.5 text-xs bg-gradient-to-r ${GRADIENTS.PRIMARY} text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium`}
              >
                Got it!
              </button>
            </div>

            {/* Arrow indicator */}
            <div
              className={`absolute w-2 h-2 bg-gradient-to-br from-purple-600/90 to-blue-600/90 transform rotate-45 ${
                placement === "top"
                  ? "bottom-[-4px] left-1/2 -translate-x-1/2"
                  : placement === "bottom"
                    ? "top-[-4px] left-1/2 -translate-x-1/2"
                    : placement === "left"
                      ? "right-[-4px] top-1/2 -translate-y-1/2"
                      : "left-[-4px] top-1/2 -translate-y-1/2"
              }`}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Pre-configured hints for common scenarios
export function WalletConnectHint() {
  return (
    <TooltipHint
      hintId="wallet-connect-hint"
      title="Connect Your Wallet"
      description="Start by connecting your Web3 wallet to access DeFi strategies and manage your portfolio securely."
      targetSelector="[data-testid='wallet-connect-button']"
      placement="bottom"
      priority="high"
      trigger="delay"
      delayMs={3000}
    />
  );
}

export function ChainSwitchHint() {
  return (
    <TooltipHint
      hintId="chain-switch-hint"
      title="Switch Networks"
      description="Choose the blockchain network to access different DeFi protocols and opportunities."
      targetSelector="[data-testid='chain-switcher']"
      placement="bottom"
      priority="medium"
      trigger="hover"
    />
  );
}

export function NavigationHint() {
  return (
    <TooltipHint
      hintId="navigation-hint"
      title="Explore Strategies"
      description="Navigate between different sections to explore vault strategies and manage your portfolio."
      targetSelector="[data-testid='tab-strategies']"
      placement="top"
      priority="medium"
      trigger="delay"
      delayMs={5000}
    />
  );
}

export function MobileNavigationHint() {
  return (
    <TooltipHint
      hintId="mobile-navigation-hint"
      title="Mobile Navigation"
      description="Use the tabs at the bottom to navigate between different sections on mobile."
      targetSelector="[data-testid='tab-strategies']"
      placement="top"
      priority="high"
      trigger="immediate"
    />
  );
}
