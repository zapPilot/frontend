"use client";

import { motion } from "framer-motion";
import {
  ExternalLink,
  Github,
  LucideIcon,
  MessageCircle,
  MessageSquare,
  Send,
  Twitter,
} from "lucide-react";

import { fadeInUp, scaleIn, SMOOTH_TRANSITION } from "@/lib/animationVariants";

interface SocialLink {
  icon: LucideIcon;
  label: string;
  url: string;
}

interface SocialLinksProps {
  title?: string;
  links?: SocialLink[];
  className?: string;
}

const defaultLinks: SocialLink[] = [
  { icon: Twitter, label: "Twitter", url: "https://x.com/zapPilot" },
  { icon: Github, label: "GitHub", url: "https://github.com/zapPilot" },
  {
    icon: MessageCircle,
    label: "Discord",
    url: "https://discord.gg/d3vXUtcFCJ",
  },
  {
    icon: MessageSquare,
    label: "Farcaster",
    url: "https://warpcast.com/zappilot",
  },
  {
    icon: Send,
    label: "Telegram",
    url: "https://t.me/zappilot",
  },
];

export function SocialLinks({
  title = "🌐 Connect With Us",
  links = defaultLinks,
  className = "",
}: SocialLinksProps) {
  return (
    <motion.div
      {...fadeInUp}
      transition={{ ...SMOOTH_TRANSITION, delay: 0.2 }}
      className={`glass-morphism rounded-2xl p-6 border border-gray-800 ${className}`}
    >
      <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {links.map((link, index) => (
          <motion.a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            {...scaleIn}
            transition={{ ...SMOOTH_TRANSITION, delay: 0.2 + index * 0.1 }}
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
  );
}
