"use client";

import { motion } from "framer-motion";
import {
  Bell,
  ChevronRight,
  FileText,
  HelpCircle,
  Settings,
  Shield,
} from "lucide-react";

export function SettingsTab() {
  const menuSections = [
    {
      title: "Account & Preferences",
      items: [
        {
          icon: Settings,
          label: "App Settings",
          description: "General preferences and configuration",
        },
        {
          icon: Bell,
          label: "Notifications",
          description: "Manage alerts and notifications",
        },
        {
          icon: Shield,
          label: "Security & Privacy",
          description: "Privacy and security settings",
        },
      ],
    },
    {
      title: "Help & Support",
      items: [
        {
          icon: HelpCircle,
          label: "Help Center",
          description: "FAQs and documentation",
        },
        {
          icon: FileText,
          label: "User Guide",
          description: "Learn how to use Zap Pilot",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold gradient-text mb-2">Settings</h1>
        <p className="text-gray-400">
          Manage your account preferences and get help
        </p>
      </motion.div>

      {/* Menu Sections */}
      {menuSections.map((section, sectionIndex) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sectionIndex * 0.1 }}
          className="glass-morphism rounded-2xl border border-gray-800 overflow-hidden"
        >
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">
              {section.title}
            </h2>
          </div>

          <div className="divide-y divide-gray-800">
            {section.items.map((item, itemIndex) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: sectionIndex * 0.1 + itemIndex * 0.05 }}
                whileHover={{ backgroundColor: "rgba(55, 65, 81, 0.3)" }}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-700/20 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-gray-800">
                    <item.icon className="w-5 h-5 text-gray-300" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-white">{item.label}</div>
                    <div className="text-sm text-gray-400">
                      {item.description}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Version Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center glass-morphism rounded-2xl p-6 border border-gray-800"
      >
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <span>Zap Pilot v1.0.0</span>
          <span>•</span>
          <span>Built with ❤️ for DeFi</span>
        </div>
      </motion.div>
    </div>
  );
}
