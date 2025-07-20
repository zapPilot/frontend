"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { memo, useCallback, useMemo } from "react";
import { NAVIGATION_ITEMS } from "../constants/navigation";
import { HeaderWalletControls } from "./Web3/HeaderWalletControls";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useFeatureFlag } from "@/providers/FeatureFlagProvider";
import {
  WalletConnectHint,
  ChainSwitchHint,
  NavigationHint,
  MobileNavigationHint,
} from "./Onboarding";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NavigationComponent = ({ activeTab, onTabChange }: NavigationProps) => {
  const { markStepCompleted } = useOnboarding();

  // Feature flag demonstrations
  const showAdvancedFeatures = useFeatureFlag("ADVANCED_STRATEGIES");

  // Filter navigation items based on feature flags
  const visibleNavItems = useMemo(() => {
    return NAVIGATION_ITEMS.filter(item => {
      // Hide advanced features if flag is disabled
      if (
        (item.id === "analytics" || item.id === "community") &&
        !showAdvancedFeatures
      ) {
        return false;
      }
      return true;
    });
  }, [showAdvancedFeatures]);

  const handleTabChange = useCallback(
    (tab: string) => {
      // Mark navigation milestone for onboarding
      markStepCompleted("navigation-used");

      // Call the original handler
      onTabChange(tab);
    },
    [onTabChange, markStepCompleted]
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-72">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto glass-morphism border-r border-gray-800 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3"
            >
              <Image
                src="/logo.svg"
                alt="Logo"
                width={32}
                height={32}
                className="w-6 h-6"
              />
              <span className="text-xl font-bold gradient-text">Zap Pilot</span>
            </motion.div>
          </div>

          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {visibleNavItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <li key={item.id}>
                        <motion.button
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleTabChange(item.id)}
                          data-testid={`desktop-tab-${item.id}`}
                          className={`group flex w-full gap-x-3 rounded-xl p-3 text-sm font-semibold leading-6 transition-all duration-200 ${
                            isActive
                              ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white border border-purple-500/30"
                              : "text-gray-300 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 shrink-0 transition-colors ${
                              isActive
                                ? "text-purple-400"
                                : "text-gray-400 group-hover:text-white"
                            }`}
                          />
                          <div className="text-left">
                            <div>{item.label}</div>
                            <div className="text-xs text-gray-400">
                              {item.description}
                            </div>
                          </div>
                          {isActive && (
                            <motion.div
                              layoutId="activeTab"
                              className="ml-auto w-1 h-6 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full"
                            />
                          )}
                        </motion.button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>

          {/* Wallet Controls moved to header */}
        </div>
      </div>

      {/* Desktop Header with Wallet Controls */}
      <div className="hidden lg:block fixed top-0 left-72 right-0 z-40 glass-morphism border-b border-gray-800">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex-1"></div>
          <HeaderWalletControls isMobile={false} className="flex" />
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="fixed top-0 left-0 right-0 z-50 glass-morphism border-b border-gray-800">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={32}
                height={32}
                className="w-6 h-6"
              />
              <span className="text-xl font-bold gradient-text">Zap Pilot</span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Mobile Wallet Indicator - Visible on XS screens */}
              <div className="sm:hidden">
                <HeaderWalletControls size="compact" isMobile={true} />
              </div>

              {/* Compact Wallet Controls - Visible on SM+ screens */}
              <HeaderWalletControls
                size="compact"
                isMobile={true}
                className="hidden sm:flex md:hidden"
              />

              {/* Full Wallet Controls - Visible on MD+ screens */}
              <HeaderWalletControls size="normal" className="hidden md:flex" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-morphism border-t border-gray-800">
        <div className="flex items-center justify-around px-4 py-2">
          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTabChange(item.id)}
                data-testid={`tab-${item.id}`}
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-purple-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveTab"
                    className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Onboarding Hints */}
      <WalletConnectHint />
      <ChainSwitchHint />
      <NavigationHint />
      <MobileNavigationHint />
    </>
  );
};

// Export memoized component
export const Navigation = memo(NavigationComponent);
