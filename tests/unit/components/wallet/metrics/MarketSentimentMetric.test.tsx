import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketSentimentMetric } from "@/components/wallet/metrics/MarketSentimentMetric";
import type { MarketSentimentData } from "@/services/sentimentService";

const mockSentimentExtremeFear: MarketSentimentData = {
  value: 15,
  status: "Extreme Fear",
  quote: {
    quote: "Be fearful when others are greedy",
    author: "Warren Buffett",
  },
};

const mockSentimentFear: MarketSentimentData = {
  value: 35,
  status: "Fear",
  quote: {
    quote: "Market is showing signs of fear",
    author: "Analyst",
  },
};

const mockSentimentNeutral: MarketSentimentData = {
  value: 50,
  status: "Neutral",
  quote: {
    quote: "Market is balanced",
    author: "Expert",
  },
};

const mockSentimentGreed: MarketSentimentData = {
  value: 70,
  status: "Greed",
  quote: {
    quote: "Market showing signs of optimism",
    author: "Analyst",
  },
};

const mockSentimentExtremeGreed: MarketSentimentData = {
  value: 90,
  status: "Extreme Greed",
  quote: {
    quote: "Be greedy when others are fearful",
    author: "Warren Buffett",
  },
};

const mockSentimentNoQuote: MarketSentimentData = {
  value: 50,
  status: "Neutral",
};

describe("MarketSentimentMetric", () => {
  describe("Loading State", () => {
    it("should render loading skeleton", () => {
      const { container } = render(<MarketSentimentMetric isLoading={true} />);

      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should not render gradient accent during loading", () => {
      const { container } = render(<MarketSentimentMetric isLoading={true} />);

      const gradientBorder = container.querySelector(
        '[class*="bg-gradient-to-b"]'
      );
      expect(gradientBorder).not.toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should render error message", () => {
      render(<MarketSentimentMetric error={new Error("API error")} />);

      expect(screen.getByText("Unavailable")).toBeInTheDocument();
      expect(screen.getByText("Sentiment")).toBeInTheDocument();
    });

    it("should use red styling for error state", () => {
      const { container } = render(
        <MarketSentimentMetric error={new Error("Network error")} />
      );

      const card = container.querySelector('[class*="border-red-900/30"]');
      expect(card).toBeInTheDocument();
    });

    it("should not render gradient accent in error state", () => {
      const { container } = render(
        <MarketSentimentMetric error={new Error("Error")} />
      );

      const gradientBorder = container.querySelector(
        '[class*="bg-gradient-to-b"]'
      );
      expect(gradientBorder).not.toBeInTheDocument();
    });
  });

  describe("Sentiment Values", () => {
    it("should display Extreme Fear sentiment correctly", () => {
      render(<MarketSentimentMetric sentiment={mockSentimentExtremeFear} />);

      expect(screen.getByText("15")).toBeInTheDocument();
      expect(screen.getByText("/100")).toBeInTheDocument();
      expect(screen.getByText(/Extreme Fear/i)).toBeInTheDocument();
      expect(screen.getByText("buy")).toBeInTheDocument();
    });

    it("should display Fear sentiment correctly", () => {
      render(<MarketSentimentMetric sentiment={mockSentimentFear} />);

      expect(screen.getByText("35")).toBeInTheDocument();
      // Query by class to get the sentiment status element specifically
      const allFears = screen.getAllByText(/Fear/i);
      const statusElement = allFears.find(
        el =>
          el.className.includes("text-xs") && el.className.includes("uppercase")
      );
      expect(statusElement).toBeInTheDocument();
      expect(screen.getByText("watch")).toBeInTheDocument();
    });

    it("should display Neutral sentiment correctly", () => {
      render(<MarketSentimentMetric sentiment={mockSentimentNeutral} />);

      expect(screen.getByText("50")).toBeInTheDocument();
      expect(screen.getByText(/Neutral/i)).toBeInTheDocument();
      expect(screen.getByText("hold")).toBeInTheDocument();
    });

    it("should display Greed sentiment correctly", () => {
      render(<MarketSentimentMetric sentiment={mockSentimentGreed} />);

      expect(screen.getByText("70")).toBeInTheDocument();
      expect(screen.getByText(/Greed/i)).toBeInTheDocument();
      expect(screen.getByText("trim")).toBeInTheDocument();
    });

    it("should display Extreme Greed sentiment correctly", () => {
      render(<MarketSentimentMetric sentiment={mockSentimentExtremeGreed} />);

      expect(screen.getByText("90")).toBeInTheDocument();
      expect(screen.getByText(/Extreme Greed/i)).toBeInTheDocument();
      expect(screen.getByText("sell")).toBeInTheDocument();
    });

    it("should display -- when no sentiment value", () => {
      render(<MarketSentimentMetric sentiment={null} />);

      expect(screen.getByText("--")).toBeInTheDocument();
      expect(screen.getByText("No data")).toBeInTheDocument();
    });
  });

  describe("Color Mapping", () => {
    it("should use emerald color for Extreme Fear", () => {
      const { container } = render(
        <MarketSentimentMetric sentiment={mockSentimentExtremeFear} />
      );

      const badge = screen.getByText("Market Sentiment").parentElement;
      expect(badge).toHaveClass("bg-emerald-400/10", "border-emerald-400/20");
    });

    it("should use lime color for Fear", () => {
      const { container } = render(
        <MarketSentimentMetric sentiment={mockSentimentFear} />
      );

      const badge = screen.getByText("Market Sentiment").parentElement;
      expect(badge).toHaveClass("bg-lime-400/10", "border-lime-400/20");
    });

    it("should use amber color for Neutral", () => {
      const { container } = render(
        <MarketSentimentMetric sentiment={mockSentimentNeutral} />
      );

      const badge = screen.getByText("Market Sentiment").parentElement;
      expect(badge).toHaveClass("bg-amber-300/10", "border-amber-300/20");
    });

    it("should use orange color for Greed", () => {
      const { container } = render(
        <MarketSentimentMetric sentiment={mockSentimentGreed} />
      );

      const badge = screen.getByText("Market Sentiment").parentElement;
      expect(badge).toHaveClass("bg-orange-400/10", "border-orange-400/20");
    });

    it("should use rose color for Extreme Greed", () => {
      const { container } = render(
        <MarketSentimentMetric sentiment={mockSentimentExtremeGreed} />
      );

      const badge = screen.getByText("Market Sentiment").parentElement;
      expect(badge).toHaveClass("bg-rose-400/10", "border-rose-400/20");
    });
  });

  describe("Gradient Accent Border", () => {
    it("should use emerald-to-lime gradient for low sentiment (< 50)", () => {
      const { container } = render(
        <MarketSentimentMetric sentiment={mockSentimentExtremeFear} />
      );

      const gradientBorder = container.querySelector(
        '[class*="from-emerald-500"][class*="to-lime-500"]'
      );
      expect(gradientBorder).toBeInTheDocument();
    });

    it("should use orange-to-rose gradient for high sentiment (>= 50)", () => {
      const { container } = render(
        <MarketSentimentMetric sentiment={mockSentimentGreed} />
      );

      const gradientBorder = container.querySelector(
        '[class*="from-orange-500"][class*="to-rose-500"]'
      );
      expect(gradientBorder).toBeInTheDocument();
    });

    it("should use orange-to-rose gradient for sentiment value of 50", () => {
      const { container } = render(
        <MarketSentimentMetric sentiment={mockSentimentNeutral} />
      );

      const gradientBorder = container.querySelector(
        '[class*="from-orange-500"][class*="to-rose-500"]'
      );
      expect(gradientBorder).toBeInTheDocument();
    });
  });

  describe("Quote Display", () => {
    it("should display quote when available", () => {
      render(<MarketSentimentMetric sentiment={mockSentimentExtremeFear} />);

      expect(
        screen.getByText(/Be fearful when others are greedy/i)
      ).toBeInTheDocument();
    });

    it("should not display quote container when quote is missing", () => {
      const { container } = render(
        <MarketSentimentMetric sentiment={mockSentimentNoQuote} />
      );

      const quoteContainer = container.querySelector(
        '[class*="bg-gray-800/20"]'
      );
      expect(quoteContainer).not.toBeInTheDocument();
    });

    it("should render quote with proper styling", () => {
      const { container } = render(
        <MarketSentimentMetric sentiment={mockSentimentExtremeFear} />
      );

      const quoteContainer = container.querySelector(
        '[class*="bg-gray-800/20"]'
      );
      expect(quoteContainer).toHaveClass(
        "border",
        "border-gray-800/40",
        "rounded-lg"
      );
    });
  });

  describe("Visual Elements", () => {
    it("should have consistent height of h-[140px]", () => {
      const { container } = render(
        <MarketSentimentMetric sentiment={mockSentimentNeutral} />
      );

      const card = container.querySelector('[class*="h-\\[140px\\]"]');
      expect(card).toBeInTheDocument();
    });

    it("should render badge label at top", () => {
      render(<MarketSentimentMetric sentiment={mockSentimentNeutral} />);

      const badge = screen.getByText("Market Sentiment");
      expect(badge).toHaveClass(
        "text-[10px]",
        "uppercase",
        "tracking-wider",
        "font-medium"
      );
    });

    it("should display sentiment hint with proper color", () => {
      render(<MarketSentimentMetric sentiment={mockSentimentExtremeFear} />);

      const hint = screen.getByText("buy");
      expect(hint).toHaveClass("text-emerald-500/80");
    });
  });

  describe("Edge Cases", () => {
    it("should handle unknown sentiment status", () => {
      const unknownSentiment: MarketSentimentData = {
        value: 42,
        status: "Unknown Status",
      };

      render(<MarketSentimentMetric sentiment={unknownSentiment} />);

      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText("Unknown Status")).toBeInTheDocument();
    });

    it("should handle sentiment with value 0", () => {
      const zeroSentiment: MarketSentimentData = {
        value: 0,
        status: "Extreme Fear",
      };

      render(<MarketSentimentMetric sentiment={zeroSentiment} />);

      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("should handle sentiment with value 100", () => {
      const maxSentiment: MarketSentimentData = {
        value: 100,
        status: "Extreme Greed",
      };

      render(<MarketSentimentMetric sentiment={maxSentiment} />);

      expect(screen.getByText("100")).toBeInTheDocument();
    });
  });
});
