"use client";

import { motion } from "framer-motion";
import { CommunityStats, PodcastSection, SocialLinks } from "./MoreTab/index";

export function CommunityTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Zap Pilot Community
        </h1>
        <p className="text-gray-400">
          Connect with fellow DeFi enthusiasts and stay updated
        </p>
      </motion.div>

      {/* Community Stats */}
      <CommunityStats />

      {/* Podcast Section */}
      <PodcastSection
        spotifyUrl="https://open.spotify.com/show/1EdeTnCNGEqi2KCNcRvZlZ" // Replace with your actual Spotify URL
        appleUrl="https://podcasts.apple.com/nl/podcast/from-fed-to-chain-eng/id1822140143"
      />

      {/* Social Links */}
      <SocialLinks />
    </div>
  );
}
