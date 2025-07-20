"use client";

import { motion } from "framer-motion";
import { Bell, FileText, HelpCircle, Settings, Shield } from "lucide-react";
import { MenuSection, VersionInfo } from "./SettingsTab/index";
import { FeatureFlagDemo } from "./FeatureFlag/FeatureFlagDemo";

export function SettingsTab() {
  const menuSections = [
    {
      title: "Account & Preferences",
      items: [
        {
          icon: Settings,
          label: "App Settings",
          description: "General preferences and configuration",
          onClick: () => {
            /* TODO: Implement app settings */
          },
        },
        {
          icon: Bell,
          label: "Notifications",
          description: "Manage alerts and notifications",
          onClick: () => {
            /* TODO: Implement notifications */
          },
        },
        {
          icon: Shield,
          label: "Security & Privacy",
          description: "Privacy and security settings",
          onClick: () => {
            /* TODO: Implement security settings */
          },
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
          onClick: () => {
            /* TODO: Implement help center */
          },
        },
        {
          icon: FileText,
          label: "User Guide",
          description: "Learn how to use Zap Pilot",
          onClick: () => {
            /* TODO: Implement user guide */
          },
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
        <MenuSection
          key={section.title}
          title={section.title}
          items={section.items}
          sectionIndex={sectionIndex}
        />
      ))}

      {/* Feature Flag Demo (Development Only) */}
      <FeatureFlagDemo />

      {/* Version Info */}
      <VersionInfo />
    </div>
  );
}
