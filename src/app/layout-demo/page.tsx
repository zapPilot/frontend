/**
 * Layout Variations Index & Comparison Page
 *
 * Landing page for all 15 layout variations with:
 * - Navigation cards to each variation
 * - Side-by-side comparison table
 * - Key differences highlighted
 */

"use client";

import { ArrowRight, Circle } from "lucide-react";
import Link from "next/link";

export default function LayoutDemoIndexPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Portfolio Layout Variations
          </h1>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Compare 15 different approaches.
            <br />
            <span className="text-orange-400 text-sm font-bold uppercase tracking-wider mt-2 inline-block">New: Crypto Breakdown Experiments (V13-V15)</span>
          </p>
        </div>

        {/* Variation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {/* V4 */}
          <VariationCard
            number={4}
            title="Neural Split"
            href="/layout-demo/v4"
            description="Asymmetric split-screen dashboard. Hard metrics on left, soft narrative and strategy on right."
            implementation="⭐⭐⭐ Medium"
            mobile="⭐⭐⭐⭐ Stacked Flow"
            familiarity="⭐⭐ Editorial Style"
            conversion="⭐⭐⭐⭐ High"
            highlights={[
              "Sticky metrics sidebar",
              "Narrative-driven right column",
              "Bloomberg meets Medium",
              "Clear separation of data types"
            ]}
          />

          {/* V6 */}
          <VariationCard
            number={6}
            title="Zen Focus"
            href="/layout-demo/v6"
            description="Minimalist interface with progressive disclosure. Starts with single 'Sentiment Orb' and expands."
            implementation="⭐⭐⭐ Framer Heavy"
            mobile="⭐⭐⭐⭐⭐ Focus Mode"
            familiarity="⭐ Radical"
            conversion="⭐⭐⭐ Intrigue-based"
            highlights={[
              "Minimal initial load",
              "Progressive disclosure",
              "High-end visual feel",
              "Focus on single metric"
            ]}
          />

          {/* V7 */}
          <VariationCard
            number={7}
            title="Kinetic Scroll"
            href="/layout-demo/v7"
            description="Vertical storytelling experience. Scroll down to reveal metrics, strategy, and actions in sequence."
            implementation="⭐⭐⭐ Scroll Logic"
            mobile="⭐⭐⭐⭐⭐ Native Feel"
            familiarity="⭐⭐ Website-like"
            conversion="⭐⭐⭐⭐ Narrative"
            highlights={[
              "Scroll-driven animation",
              "Fixed vertical timeline",
              "Storytelling format",
              "Section-by-section focus"
            ]}
          />

          {/* V10 */}
          <VariationCard
            number={10}
            title="Quantum Bar"
            href="/layout-demo/v10"
            description="High-density dashboard featuring a segmented 'Quantum Bar' for instant constituent visibility."
            implementation="⭐⭐⭐ Complex CSS"
            mobile="⭐⭐⭐⭐ Stacked"
            familiarity="⭐⭐⭐ Data Heavy"
            conversion="⭐⭐⭐⭐ Focused"
            highlights={[
              "Direct segment visualization",
              "Smart labeling logic",
              "Interactive hovering",
              "Compact data visualization"
            ]}
          />

          {/* V13 */}
          <VariationCard
            number={13}
            title="Floating Pills"
            href="/layout-demo/v13"
            description="Crypto allocation visualized as distinct, floating rounded pills separated by white space."
            implementation="⭐⭐ Flexbox"
            mobile="⭐⭐⭐⭐ Responsive"
            familiarity="⭐⭐⭐⭐ Modern UI"
            conversion="⭐⭐⭐ Clarity"
            highlights={[
              "Distinct visual separation",
              "Pill-shaped segments",
              "Modern aesthetic",
              "Clear hierarchy"
            ]}
            isNew
          />

          {/* V14 */}
          <VariationCard
            number={14}
            title="Hierarchy Tree"
            href="/layout-demo/v14"
            description="Structured view using visual brackets to show the Parent (Crypto) > Child (BTC/ETH) relationship."
            implementation="⭐⭐ CSS Shapes"
            mobile="⭐⭐⭐ Vertical"
            familiarity="⭐⭐⭐ Logical"
            conversion="⭐⭐⭐ Educational"
            highlights={[
              "Visual bracket connection",
              "Explicit hierarchy",
              "Structured breakdown",
              "Logical flow"
            ]}
            isNew
          />

          {/* V15 */}
          <VariationCard
            number={15}
            title="Inline Badges"
            href="/layout-demo/v15"
            description="Crypto constituents treated as UI badges/chips residing inside the main allocation track."
            implementation="⭐⭐ Component"
            mobile="⭐⭐⭐⭐ Compact"
            familiarity="⭐⭐⭐⭐ App-like"
            conversion="⭐⭐⭐⭐ Interactive"
            highlights={[
              "Badge/Chip metaphor",
              "Component-based feel",
              "High contrast labels",
              "Embedded data"
            ]}
            isNew
          />

          {/* V16 */}
          <VariationCard
            number={16}
            title="Zen / Minimalist"
            href="/layout-demo/v16"
            description="Clean, distraction-free interface with transparent top navigation and minimal footer."
            implementation="⭐⭐⭐ Layout"
            mobile="⭐⭐⭐⭐⭐ Clean"
            familiarity="⭐⭐⭐⭐⭐ Simple"
            conversion="⭐⭐⭐ Trust"
            highlights={[
              "Minimalist top nav",
              "Centered layout",
              "Negative space",
              "Focus on balance"
            ]}
            isNew
          />

          {/* V17 */}
          <VariationCard
            number={17}
            title="Modern Dashboard"
            href="/layout-demo/v17"
            description="Classic SaaS dashboard layout with collapsible left sidebar and integrated footer."
            implementation="⭐⭐⭐⭐ Layout"
            mobile="⭐⭐⭐⭐ Responsive"
            familiarity="⭐⭐⭐⭐⭐ Standard"
            conversion="⭐⭐⭐⭐ Utility"
            highlights={[
              "Sidebar navigation",
              "Search integrated",
              "User profile menu",
              "Familiar SaaS feel"
            ]}
            isNew
          />

          {/* V18 */}
          <VariationCard
            number={18}
            title="Command Center"
            href="/layout-demo/v18"
            description="Information-dense trading terminal with ticker, quick stats, and detailed footer."
            implementation="⭐⭐⭐⭐⭐ Complex"
            mobile="⭐⭐⭐ Dense"
            familiarity="⭐⭐⭐ Pro Tool"
            conversion="⭐⭐⭐⭐ Power User"
            highlights={[
              "Market ticker",
              "Dense data header",
              "Fat footer",
              "System status"
            ]}
            isNew
          />

          {/* V19 */}
          <VariationCard
            number={19}
            title="Comparative Alignment"
            href="/layout-demo/v19"
            description="Direct visual comparison of 'Target vs Actual' allocation. Removes redundant top-nav balance."
            implementation="⭐⭐⭐ Layout"
            mobile="⭐⭐⭐⭐ Stacked"
            familiarity="⭐⭐⭐⭐ Logical"
            conversion="⭐⭐⭐⭐ Clarity"
            highlights={[
              "Target vs Actual bars",
              "Drift visualization",
              "Simplified top nav",
              "Comparative focus"
            ]}
            isNew
          />

          {/* V20 */}
          <VariationCard
            number={20}
            title="Regime Map"
            href="/layout-demo/v20"
            description="Visualizes the 5 market regimes (Fear/Greed) to show cycle position."
            implementation="⭐⭐⭐ Component"
            mobile="⭐⭐⭐⭐ Compact"
            familiarity="⭐⭐⭐ Educational"
            conversion="⭐⭐⭐⭐ Context"
            highlights={[
              "5-Regime Spectrum",
              "Cycle position",
              "Educational context",
              "Strategy alignment"
            ]}
            isNew
          />

          {/* V21 */}
          <VariationCard
            number={21}
            title="Unified Flow"
            href="/layout-demo/v21"
            description="Single-column flow with 'Ghost Bar' target visualization overlay."
            implementation="⭐⭐⭐⭐ Overlay"
            mobile="⭐⭐⭐⭐⭐ Native"
            familiarity="⭐⭐⭐⭐ Modern"
            conversion="⭐⭐⭐⭐ Actionable"
            highlights={[
              "Ghost Bar targets",
              "Single column flow",
              "Combined hero metrics",
              "Mobile-first feel"
            ]}
            isNew
          />

          {/* V22 */}
          <VariationCard
            number={22}
            title="Expandable Card"
            href="/layout-demo/v22"
            description="Progressive Disclosure: Click the strategy card to expand and reveal the Regime Spectrum inline."
            implementation="⭐⭐⭐ Animation"
            mobile="⭐⭐⭐⭐⭐ Native"
            familiarity="⭐⭐⭐⭐ Accordion"
            conversion="⭐⭐⭐⭐ Context"
            highlights={[
              "Expandable Strategy",
              "Inline Context",
              "Clean Default State",
              "Regime Spectrum"
            ]}
            isNew
          />

          {/* V23 */}
          <VariationCard
            number={23}
            title="Flip Card"
            href="/layout-demo/v23"
            description="Progressive Disclosure: 3D Flip animation to reveal the 'Why' behind the strategy on the back."
            implementation="⭐⭐⭐⭐ 3D Transform"
            mobile="⭐⭐⭐⭐ Interactive"
            familiarity="⭐⭐⭐ Gamified"
            conversion="⭐⭐⭐⭐ Engagement"
            highlights={[
              "3D Flip Interaction",
              "Back-of-card Context",
              "Regime Arc",
              "Playful Discovery"
            ]}
            isNew
          />

          {/* V24 */}
          <VariationCard
            number={24}
            title="Slide-Over Panel"
            href="/layout-demo/v24"
            description="Progressive Disclosure: Clicking details opens a rich side panel with full educational content."
            implementation="⭐⭐⭐⭐ Overlay"
            mobile="⭐⭐⭐⭐⭐ Sheet"
            familiarity="⭐⭐⭐⭐⭐ Standard"
            conversion="⭐⭐⭐⭐⭐ Education"
            highlights={[
              "Rich Side Panel",
              "Full Context",
              "Educational Content",
              "Deep Dive"
            ]}
            isNew
          />

        </div>

        {/* Footer Note */}
        <div className="text-center text-gray-500 text-sm">
          <p>Showing filtered selection of most relevant variations.</p>
        </div>

      </div>
    </div>
  );
}

/**
 * Variation Card Component
 */
interface VariationCardProps {
  number: number;
  title: string;
  href: string;
  description: string;
  implementation: string;
  mobile: string;
  familiarity: string;
  conversion: string;
  highlights: string[];
  isNew?: boolean;
}

function VariationCard({
  number,
  title,
  href,
  description,
  implementation,
  mobile,
  familiarity,
  conversion,
  highlights,
  isNew
}: VariationCardProps) {
  return (
    <Link href={href} className="group h-full">
      <div className={`h-full bg-gray-900/50 border ${isNew ? 'border-orange-500/30 bg-orange-900/5' : 'border-gray-800'} hover:border-purple-500/50 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 flex flex-col relative overflow-hidden`}>
        {isNew && (
          <div className="absolute top-3 right-3">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
          </div>
        )}
        
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${isNew ? 'bg-orange-500/20 border-orange-500/40 text-orange-300' : 'bg-gray-800 border-gray-700 text-gray-400'} border flex items-center justify-center font-bold`}>
              {number}
            </div>
            <div>
              <h3 className="text-lg font-bold group-hover:text-purple-400 transition-colors">
                {title}
              </h3>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
        </div>

        <p className="text-sm text-gray-400 mb-6 flex-grow">
          {description}
        </p>

        <div className="space-y-2 mb-6 text-xs border-t border-gray-800/50 pt-4">
          <div className="flex justify-between">
            <span className="text-gray-500">Dev Effort:</span>
            <span className="text-gray-300">{implementation}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Mobile:</span>
            <span className="text-gray-300">{mobile}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">UX Feel:</span>
            <span className="text-gray-300">{familiarity}</span>
          </div>
        </div>

        <div className="mt-auto">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Key Features:</p>
          <ul className="space-y-1">
            {highlights.map((highlight, index) => (
              <li key={index} className="text-xs text-gray-400 flex items-start gap-2">
                <Circle className="w-1.5 h-1.5 mt-1 flex-shrink-0 fill-purple-500 text-purple-500" />
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Link>
  );
}
