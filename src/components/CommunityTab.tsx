"use client";

import { motion } from "framer-motion";

import { CommunityStats, PodcastSection, SocialLinks } from "./MoreTab/index";
import { PageSectionHeader } from "./shared/PageSectionHeader";

export function CommunityTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <PageSectionHeader
          title="Zap Pilot Community"
          subtitle="Connect with fellow DeFi enthusiasts and stay updated"
          level="h1"
        />
      </motion.div>

      {/* Community Stats */}
      <CommunityStats />

      {/* Podcast Section */}
      <PodcastSection
        spotifyUrl="#" // Replace with your actual Spotify URL
        appleUrl="#" // Replace with your actual Apple Podcast URL
      />

      {/* Social Links */}
      <SocialLinks />
    </div>
  );
}
