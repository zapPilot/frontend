"use client";

import { motion } from "framer-motion";
import { Gift, Vote, LucideIcon } from "lucide-react";

interface Event {
  icon: LucideIcon;
  label: string;
  description: string;
  status: string;
  color: string;
  url?: string;
}

interface UpcomingEventsProps {
  title?: string;
  description?: string;
  events?: Event[];
  className?: string;
}

const defaultEvents: Event[] = [
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
];

export function UpcomingEvents({
  title = "🪂 Upcoming Events",
  description = "Don't miss out on exclusive opportunities",
  events = defaultEvents,
  className = "",
}: UpcomingEventsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`glass-morphism rounded-2xl border border-gray-800 overflow-hidden ${className}`}
    >
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-gray-400 mt-1">{description}</p>
      </div>

      <div className="p-4 space-y-3">
        {events.map((event, index) => (
          <motion.div
            key={event.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.1 }}
            className="group"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${event.color} opacity-75 cursor-default`}
            >
              <div className="flex items-center space-x-3">
                <event.icon className="w-6 h-6 text-white" />
                <div className="text-left">
                  <div className="font-semibold text-white">{event.label}</div>
                  <div className="text-sm text-white/80">
                    {event.description}
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-medium text-white">
                {event.status}
              </span>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
