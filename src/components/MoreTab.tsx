"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Grid3x3, Star } from "lucide-react";
import { MORE_TAB_ITEMS } from "../constants/navigation";
import { PricingPage } from "./PricingPage";
import { CommunityTab } from "./CommunityTab";
import { AirdropTab } from "./AirdropTab";
import { SettingsTab } from "./SettingsTab";
import { GlassCard } from "./ui";

interface MoreTabProps {
  initialSubTab?: string;
}

export function MoreTab({ initialSubTab = "pricing" }: MoreTabProps) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);

  const handleSubTabChange = useCallback((tabId: string) => {
    setActiveSubTab(tabId);
  }, []);

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case "pricing":
        return <PricingPage />;
      case "community":
        return <CommunityTab />;
      case "airdrop":
        return <AirdropTab />;
      case "settings":
        return <SettingsTab />;
      default:
        return <PricingPage />;
    }
  };

  const activeItem = MORE_TAB_ITEMS.find(item => item.id === activeSubTab);

  return (
    <div className="space-y-6">
      {/* Header with enhanced design */}
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30">
              <Grid3x3 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">More</h1>
              <p className="text-gray-400 text-lg">
                Settings, pricing, and additional features
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {MORE_TAB_ITEMS.length}
              </div>
              <div className="text-sm text-gray-400">Features</div>
            </div>
          </div>
        </div>

        {/* Decorative line */}
        <div className="mt-6 h-px bg-gradient-to-r from-purple-500/50 via-blue-500/50 to-transparent"></div>
      </div>

      {/* Enhanced Sub-navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {MORE_TAB_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeSubTab === item.id;
          const isPremium = item.id === "pricing";

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <GlassCard
                className={`group p-6 cursor-pointer transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? "bg-gradient-to-br from-purple-600/30 to-blue-600/30 border-purple-400/50 shadow-lg shadow-purple-500/20"
                    : "hover:bg-white/5 border-gray-700/50 hover:border-gray-600/50"
                }`}
                onClick={() => handleSubTabChange(item.id)}
              >
                {/* Premium badge */}
                {isPremium && (
                  <div className="absolute top-3 right-3">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  </div>
                )}

                <div className="flex flex-col items-center text-center space-y-4">
                  <div
                    className={`p-4 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg"
                        : "bg-gray-800/80 group-hover:bg-gray-700/80"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 transition-colors ${
                        isActive
                          ? "text-white"
                          : "text-gray-300 group-hover:text-white"
                      }`}
                    />
                  </div>

                  <div>
                    <h3
                      className={`font-semibold text-lg mb-2 transition-colors ${
                        isActive
                          ? "text-white"
                          : "text-gray-200 group-hover:text-white"
                      }`}
                    >
                      {item.label}
                    </h3>
                    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                      {item.description}
                    </p>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-blue-400"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Enhanced Breadcrumb */}
      <div className="flex items-center mb-8">
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-500">More</span>
          <ChevronRight className="w-4 h-4 text-gray-500" />
          <span className="text-white font-semibold text-base">
            {activeItem?.label}
          </span>
        </div>
      </div>

      {/* Content with enhanced animations */}
      <motion.div
        key={activeSubTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="min-h-[600px]"
      >
        {renderSubTabContent()}
      </motion.div>
    </div>
  );
}
