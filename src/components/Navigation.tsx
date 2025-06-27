"use client";

import { motion } from "framer-motion";
import {
  Menu,
  BarChart3,
  Settings,
  TrendingUp,
  Wallet,
  X,
  Users,
  Gift,
} from "lucide-react";
import Image from "next/image";
import { useState, useCallback, memo } from "react";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  {
    id: "wallet",
    label: "Portfolio",
    icon: Wallet,
    description: "Your wallet overview",
  },
  {
    id: "invest",
    label: "Invest",
    icon: TrendingUp,
    description: "Investment opportunities",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    description: "Performance metrics & charts",
  },
  {
    id: "community",
    label: "Community",
    icon: Users,
    description: "Social & ecosystem",
  },
  {
    id: "airdrop",
    label: "Airdrop",
    icon: Gift,
    description: "Token rewards & airdrops",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    description: "App preferences & help",
  },
];

const NavigationComponent = ({ activeTab, onTabChange }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

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
                  {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <li key={item.id}>
                        <motion.button
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onTabChange(item.id)}
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

          {/* Desktop Status */}
          <div className="mt-auto">
            <div className="glass-morphism rounded-2xl p-4 border border-gray-800">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-400">
                  Intent Engine Online
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Ready for execution across 20+ networks
              </p>
            </div>
          </div>
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

            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-xl glass-morphism hover:bg-white/10 transition-all duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-300" />
              ) : (
                <Menu className="w-5 h-5 text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-gray-950/80 backdrop-blur-lg lg:hidden"
            onClick={toggleMobileMenu}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed inset-y-0 left-0 z-50 w-64 glass-morphism border-r border-gray-800 p-6"
              onClick={e => e.stopPropagation()}
            >
              <nav className="mt-16">
                <ul className="space-y-2">
                  {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => {
                            onTabChange(item.id);
                            toggleMobileMenu();
                          }}
                          data-testid={`mobile-menu-tab-${item.id}`}
                          className={`group flex w-full gap-x-3 rounded-xl p-3 text-sm font-semibold leading-6 transition-all duration-200 ${
                            isActive
                              ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white border border-purple-500/30"
                              : "text-gray-300 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 shrink-0 ${
                              isActive ? "text-purple-400" : "text-gray-400"
                            }`}
                          />
                          <div className="text-left">
                            <div>{item.label}</div>
                            <div className="text-xs text-gray-400">
                              {item.description}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-morphism border-t border-gray-800">
        <div className="flex items-center justify-around px-4 py-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTabChange(item.id)}
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
    </>
  );
};

// Export memoized component
export const Navigation = memo(NavigationComponent);
