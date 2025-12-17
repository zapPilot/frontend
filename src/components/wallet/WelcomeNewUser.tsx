import { BaseCard } from "@/components/ui";

interface WelcomeNewUserProps {
  onGetStarted?: () => void;
}

export function WelcomeNewUser({ onGetStarted }: WelcomeNewUserProps) {
  return (
    <BaseCard
      variant="glass"
      padding="xl"
      borderRadius="md"
      className="flex flex-col space-y-4 bg-purple-900/20 border-purple-600/30"
    >
      <div className="flex items-center space-x-3 text-purple-400">
        <div className="p-2 bg-purple-600/20 rounded-lg">
          <div className="w-6 h-6 text-purple-400">✨</div>
        </div>
        <div>
          <h3 className="font-semibold text-lg text-white">
            Welcome to Zap Pilot!
          </h3>
          <p className="text-sm text-purple-300">
            Ready to start your DeFi journey?
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-300 leading-relaxed">
        Connect your wallet to create your personalized portfolio and explore
        automated yield strategies across multiple DeFi protocols. Start
        optimizing your crypto investments today!
      </p>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={onGetStarted}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          Get Started
        </button>
        <button className="px-4 py-2 border border-purple-500/50 hover:border-purple-400 text-purple-300 hover:text-purple-200 font-medium rounded-lg transition-colors">
          Learn More
        </button>
      </div>
    </BaseCard>
  );
}
