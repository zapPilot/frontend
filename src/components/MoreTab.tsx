"use client";

import { motion } from "framer-motion";
import {
  CommunityStats,
  PodcastSection,
  UpcomingEvents,
  SocialLinks,
} from "./MoreTab/index";

export function MoreTab() {
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

      {/* Community Stats - Moved to top for credibility */}
      <CommunityStats />

      {/* Podcast Section */}
      <PodcastSection
        spotifyUrl="#" // Replace with your actual Spotify URL
        appleUrl="#" // Replace with your actual Apple Podcast URL
      />

      {/* Upcoming Events */}
      <UpcomingEvents />

      {/* Social Links */}
      <SocialLinks />
    </div>
  );
}
