"use client";

import { motion } from "framer-motion";
import { Bell, FileText, HelpCircle, Settings, Shield } from "lucide-react";

import { MenuSection, VersionInfo } from "./SettingsTab/index";
import { PageSectionHeader } from "./shared/PageSectionHeader";

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
            /* ZAP-201: App settings implementation pending */
          },
        },
        {
          icon: Bell,
          label: "Notifications",
          description: "Manage alerts and notifications",
          onClick: () => {
            /* ZAP-202: Notifications implementation pending */
          },
        },
        {
          icon: Shield,
          label: "Security & Privacy",
          description: "Privacy and security settings",
          onClick: () => {
            /* ZAP-203: Security settings implementation pending */
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
            /* ZAP-204: Help center implementation pending */
          },
        },
        {
          icon: FileText,
          label: "User Guide",
          description: "Learn how to use Zap Pilot",
          onClick: () => {
            /* ZAP-205: User guide implementation pending */
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
      >
        <PageSectionHeader
          title="Settings"
          subtitle="Manage your account preferences and get help"
          level="h1"
        />
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

      {/* Version Info */}
      <VersionInfo />
    </div>
  );
}
