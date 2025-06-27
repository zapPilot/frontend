"use client";

import { motion } from "framer-motion";
import {
  ExternalLink,
  Gift,
  Github,
  Headphones,
  MessageCircle,
  Music,
  Twitter,
  Vote,
} from "lucide-react";
import Image from "next/image";

interface CommunityItem {
  icon: any;
  label: string;
  description: string;
  color: string;
  url?: string;
  status?: string;
}

interface CommunitySection {
  title: string;
  description: string;
  items: CommunityItem[];
}

export function MoreTab() {
  const communityFeatures: CommunitySection[] = [
    {
      title: "🎧 Podcast",
      description: "Listen to our latest insights on DeFi",
      items: [
        {
          icon: Headphones,
          label: "Spotify",
          description: "Stream on Spotify",
          url: "#", // Add your Spotify podcast URL here
          color: "from-green-500 to-green-600",
        },
        {
          icon: Music,
          label: "Apple Podcasts",
          description: "Listen on Apple Podcasts",
          url: "#", // Add your Apple Podcast URL here
          color: "from-purple-500 to-pink-600",
        },
      ],
    },
    {
      title: "🪂 Upcoming Events",
      description: "Don't miss out on exclusive opportunities",
      items: [
        {
          icon: Gift,
          label: "Airdrop Campaign",
          description: "Exclusive rewards for early adopters",
          status: "Coming Soon",
          color: "from-yellow-500 to-orange-600",
        },
        {
          icon: Vote,
          label: "Pool Voting",
          description: "Vote on new investment pools",
          status: "Coming Soon",
          color: "from-blue-500 to-indigo-600",
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
          Community & More
        </h1>
        <p className="text-gray-400">
          Stay connected and explore the Zap Pilot ecosystem
        </p>
      </motion.div>

      {/* Community Features */}
      {communityFeatures.map((section, sectionIndex) => (
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
            <p className="text-sm text-gray-400 mt-1">{section.description}</p>
          </div>

          <div className="p-4 space-y-3">
            {section.items.map((item, itemIndex) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: sectionIndex * 0.1 + itemIndex * 0.05 }}
                className="group"
              >
                {item.url ? (
                  <motion.a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${item.color} hover:shadow-lg transition-all duration-200`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-6 h-6 text-white" />
                      <div className="text-left">
                        <div className="font-semibold text-white">
                          {item.label}
                        </div>
                        <div className="text-sm text-white/80">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-5 h-5 text-white/80" />
                  </motion.a>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${item.color} opacity-75 cursor-default`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-6 h-6 text-white" />
                      <div className="text-left">
                        <div className="font-semibold text-white">
                          {item.label}
                        </div>
                        <div className="text-sm text-white/80">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-medium text-white">
                      {item.status}
                    </span>
                  </motion.div>
                )}
              </motion.div>
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
          🌐 Connect With Us
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
              className="p-4 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-200 flex flex-col items-center space-y-2 border border-gray-700/50"
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

      {/* Community Stats & Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-morphism rounded-2xl p-6 border border-gray-800"
      >
        <div className="flex items-center justify-center mb-4">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={64}
            height={64}
            className="w-16 h-16"
          />
        </div>

        <h3 className="text-lg font-semibold text-white mb-2 text-center">
          Zap Pilot Community
        </h3>
        <p className="text-sm text-gray-400 mb-6 text-center">
          Join our growing ecosystem of DeFi innovators
        </p>

        {/* Community Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">2.5K+</div>
            <div className="text-xs text-gray-400">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">$50M+</div>
            <div className="text-xs text-gray-400">TVL Managed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">20+</div>
            <div className="text-xs text-gray-400">Networks</div>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 border-t border-gray-800 pt-4">
          <span>v1.0.0</span>
          <span>•</span>
          <span>Intent-Based DeFi Engine</span>
        </div>
      </motion.div>
    </div>
  );
}
