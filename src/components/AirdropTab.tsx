"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Calendar,
  Gift,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";

import { GRADIENTS } from "@/constants/design-system";

import { FadeInSection } from "./shared/FadeInSection";
import { PageIntro } from "./shared/PageIntro";
import { BaseCard, GradientButton } from "./ui";

export function AirdropTab() {
  return (
    <div className="space-y-6">
      <PageIntro
        title="Zap Pilot Airdrops"
        subtitle="Exclusive token rewards for early adopters and active users"
      />

      {/* Coming Soon Hero Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <BaseCard
          variant="glass"
          className="p-8 text-center relative overflow-hidden"
        >
          {/* Background decorations */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-4 left-4">
              <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
            </div>
            <div className="absolute top-8 right-8">
              <Star
                className="w-4 h-4 text-blue-400 animate-pulse"
                style={{ animationDelay: "0.5s" }}
              />
            </div>
            <div className="absolute bottom-6 left-12">
              <Gift
                className="w-8 h-8 text-pink-400 animate-pulse"
                style={{ animationDelay: "1s" }}
              />
            </div>
            <div className="absolute bottom-12 right-6">
              <Zap
                className="w-5 h-5 text-yellow-400 animate-pulse"
                style={{ animationDelay: "1.5s" }}
              />
            </div>
          </div>

          {/* Main content */}
          <div className="space-y-6">
            <div
              className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r ${GRADIENTS.PRIMARY} flex items-center justify-center relative`}
            >
              <Gift className="w-10 h-10 text-white" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-white">Coming Soon!</h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Get ready for exclusive ZAP token airdrops, governance tokens,
                and special rewards for early supporters of the Zap Pilot
                ecosystem.
              </p>
            </div>

            <FadeInSection delay={0.25}>
              <GradientButton
                gradient="from-purple-600 to-pink-600"
                shadowColor="purple-500"
                icon={Bell}
                className="px-8 py-3"
              >
                Notify Me When Available
              </GradientButton>
            </FadeInSection>
          </div>
        </BaseCard>
      </motion.div>

      {/* What to Expect */}
      <FadeInSection delay={0.2}>
        <BaseCard variant="glass" className="p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-400" />
            What to Expect
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Zap,
                title: "ZAP Tokens",
                description:
                  "Native protocol tokens for governance and rewards",
                color: "text-purple-400",
                bgColor: "bg-purple-900/20",
              },
              {
                icon: Users,
                title: "Early Adopter Rewards",
                description:
                  "Special bonuses for beta users and feedback providers",
                color: "text-blue-400",
                bgColor: "bg-blue-900/20",
              },
              {
                icon: Calendar,
                title: "Seasonal Drops",
                description:
                  "Regular airdrops based on platform usage and milestones",
                color: "text-green-400",
                bgColor: "bg-green-900/20",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className={`p-4 rounded-xl ${item.bgColor} border border-gray-800 hover:border-gray-700 transition-all duration-200`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg ${item.bgColor} flex items-center justify-center mb-3`}
                  >
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <h4 className="font-semibold text-white mb-2">
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </BaseCard>
      </FadeInSection>

      {/* How to Qualify */}
      <FadeInSection delay={0.3}>
        <BaseCard variant="glass" className="p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <ArrowRight className="w-5 h-5 mr-2 text-green-400" />
            How to Qualify for Airdrops
          </h3>

          <div className="space-y-4">
            {[
              {
                step: "1",
                title: "Connect Your Wallet",
                description:
                  "Link your wallet to track your activity and eligibility",
                status: "active",
              },
              {
                step: "2",
                title: "Use the Platform",
                description:
                  "Execute swaps, provide liquidity, and use intent-based features",
                status: "active",
              },
              {
                step: "3",
                title: "Join the Community",
                description:
                  "Follow our social channels and participate in governance",
                status: "upcoming",
              },
              {
                step: "4",
                title: "Refer Friends",
                description:
                  "Invite others to join Zap Pilot and earn bonus rewards",
                status: "upcoming",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center space-x-4 p-4 glass-morphism rounded-lg"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    item.status === "active"
                      ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                      : "bg-gray-700/30 text-gray-400 border border-gray-600/30"
                  }`}
                >
                  {item.step}
                </div>
                <div className="flex-1">
                  <h4
                    className={`font-medium ${
                      item.status === "active" ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-xs ${
                    item.status === "active"
                      ? "bg-green-900/30 text-green-400"
                      : "bg-gray-700/30 text-gray-400"
                  }`}
                >
                  {item.status === "active" ? "Available" : "Coming Soon"}
                </div>
              </motion.div>
            ))}
          </div>
        </BaseCard>
      </FadeInSection>

      {/* Newsletter Signup */}
      <FadeInSection delay={0.4}>
        <BaseCard variant="glass" className="p-6 text-center">
          <h3 className="text-lg font-bold text-white mb-2">
            Stay Updated on Airdrop News
          </h3>
          <p className="text-gray-400 mb-4">
            Be the first to know about upcoming airdrops and exclusive rewards
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 bg-gray-800/50 text-white rounded-lg border border-gray-600 focus:border-purple-500 outline-none"
            />
            <GradientButton gradient={GRADIENTS.PRIMARY} className="px-6 py-2">
              Subscribe
            </GradientButton>
          </div>
        </BaseCard>
      </FadeInSection>
    </div>
  );
}
