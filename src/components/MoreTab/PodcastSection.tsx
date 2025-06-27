"use client";

import { motion } from "framer-motion";
import { ExternalLink, Headphones, Music } from "lucide-react";

interface PodcastSectionProps {
  title?: string;
  description?: string;
  spotifyUrl?: string;
  appleUrl?: string;
  className?: string;
}

export function PodcastSection({
  title = "🎧 Podcast",
  description = "Listen to our latest insights on DeFi",
  spotifyUrl = "#", // Add your Spotify podcast URL here
  appleUrl = "#", // Add your Apple Podcast URL here
  className = "",
}: PodcastSectionProps) {
  const podcastLinks = [
    {
      platform: "spotify" as const,
      icon: Headphones,
      label: "Spotify",
      description: "Stream on Spotify",
      url: spotifyUrl,
      color: "from-green-500 to-green-600",
    },
    {
      platform: "apple" as const,
      icon: Music,
      label: "Apple Podcasts",
      description: "Listen on Apple Podcasts",
      url: appleUrl,
      color: "from-purple-500 to-pink-600",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-morphism rounded-2xl border border-gray-800 overflow-hidden ${className}`}
    >
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-gray-400 mt-1">{description}</p>
      </div>

      <div className="p-4 space-y-3">
        {podcastLinks.map((link, index) => (
          <motion.a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${link.color} hover:shadow-lg transition-all duration-200`}
          >
            <div className="flex items-center space-x-3">
              <link.icon className="w-6 h-6 text-white" />
              <div className="text-left">
                <div className="font-semibold text-white">{link.label}</div>
                <div className="text-sm text-white/80">{link.description}</div>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-white/80" />
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
}
