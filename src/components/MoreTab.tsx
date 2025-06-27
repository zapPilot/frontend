"use client";

import { motion } from "framer-motion";
import {
  Bell,
  ChevronRight,
  ExternalLink,
  FileText,
  Github,
  HelpCircle,
  MessageCircle,
  Settings,
  Shield,
  Twitter,
} from "lucide-react";

export function MoreTab() {
  const menuSections = [
    {
      title: "Account",
      items: [
        {
          icon: Settings,
          label: "Settings",
          description: "App preferences and configuration",
        },
        {
          icon: Bell,
          label: "Notifications",
          description: "Manage alerts and notifications",
        },
        {
          icon: Shield,
          label: "Security",
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

  const socialLinks = [
    { icon: Twitter, label: "Twitter", url: "https://x.com/zapPilot" },
    { icon: Github, label: "GitHub", url: "https://github.com/zapPilot" },
    {
      icon: MessageCircle,
      label: "Discord",
      url: "https://discord.gg/d3vXUtcFCJ",
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
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Settings & More
        </h1>
        <p className="text-gray-400">
          Manage your account and access helpful resources
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

      {/* Social Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-morphism rounded-2xl p-6 border border-gray-800"
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          Connect With Us
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {socialLinks.map((link, index) => (
            <motion.a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-all duration-200 flex flex-col items-center space-y-2"
            >
              <link.icon className="w-6 h-6 text-gray-300" />
              <span className="text-sm font-medium text-gray-300">
                {link.label}
              </span>
              <ExternalLink className="w-3 h-3 text-gray-500" />
            </motion.a>
          ))}
        </div>
      </motion.div>

      {/* App Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center glass-morphism rounded-2xl p-6 border border-gray-800"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-white">ZP</span>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Zap Pilot</h3>
        <p className="text-sm text-gray-400 mb-4">
          Intent-based execution engine for DeFi portfolio management
        </p>
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <span>Version 1.0.0</span>
          <span>•</span>
          <span>Built with ❤️ for DeFi</span>
        </div>
      </motion.div>
    </div>
  );
}
