# Zap Pilot - Portfolio Management UI

A modern, mobile-first Progressive Web App (PWA) for managing DeFi portfolios using intent-based
execution.

## Features

- 📱 **PWA Support** - Install as mobile app with offline capabilities
- 🎨 **Modern Design** - Glass morphism effects with purple/blue gradient theme
- 💼 **Wallet Interface** - Professional wallet-style portfolio management
- 📊 **Smart Navigation** - Responsive navigation (sidebar for web, bottom for mobile)
- 🥧 **Asset Categories** - Visual pie chart for BTC, ETH, STABLECOIN, ALTCOIN categories
- 🔍 **Detailed Analytics** - Expandable asset details with pool information and APR
- 🔄 **Intent-Based Actions** - ZapIn, ZapOut, and Optimize operations
- 🚀 **Investment Hub** - Curated DeFi strategies and opportunities
- ⚙️ **Settings & More** - Comprehensive settings and help section
- 📱 **Mobile Responsive** - Optimized for all screen sizes
- ⚡ **Performance** - Built with Next.js 15 and Turbopack
- 🎭 **Animations** - Smooth Framer Motion transitions

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **PWA**: next-pwa
- **TypeScript**: Full type safety

## Portfolio Metrics

The dashboard displays key portfolio metrics:

- **Total Balance**: Current USD value with daily change
- **Portfolio APR**: Annual percentage return
- **Max Drawdown**: Peak-to-trough decline percentage
- **Risk Score**: Portfolio risk assessment (1-10 scale)
- **Composition**: Asset allocation breakdown

## Application Structure

### 📱 Navigation

- **Desktop**: Left sidebar with detailed navigation
- **Mobile**: Bottom tab bar with swipe gestures
- **Three main sections**: Portfolio, Invest, More

### 💼 Portfolio Tab (Wallet Interface)

- **Balance Overview**: Total value, 24h change, portfolio metrics
- **Asset Categories**: Interactive pie chart showing:
  - **BTC**: All Bitcoin-related assets (WBTC, BTC, etc.)
  - **ETH**: Ethereum assets (stETH, ETH, LSTs)
  - **STABLECOIN**: USDC, USDT, DAI pools
  - **ALTCOIN**: LINK, AAVE, and other tokens
- **Detailed View**: Expandable categories showing:
  - Individual assets and pools
  - Protocol information (Lido, Aave, Uniswap)
  - APR rates and asset types
  - Pool performance metrics

### 🚀 Invest Tab

- **Strategy Discovery**: Curated DeFi investment opportunities
- **Risk Assessment**: Low, Medium, High risk categorization
- **Performance Metrics**: APR, TVL, and strategy details

### ⚙️ More Tab

- **Account Settings**: Preferences and configuration
- **Help & Support**: Documentation and community links
- **About**: App information and social connections

## Quick Actions

Three main intent-based actions available:

1. **ZapIn** - Add liquidity optimally across protocols
2. **ZapOut** - Exit positions with minimal slippage
3. **Optimize** - Rebalance portfolio for maximum yield

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Design System

Following the Zap Pilot design language:

- **Colors**: Purple-blue gradients (#8b5cf6 to #3b82f6)
- **Background**: Dark theme (#0a0a0f)
- **Glass Morphism**: Backdrop blur with transparency
- **Animations**: Subtle hover effects and micro-interactions
- **Typography**: Geist Sans font family

## Mobile Features

- Touch-friendly button sizes
- Responsive grid layouts
- Swipe gestures ready
- Optimized for iOS and Android
- Apple Web App metadata

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile Safari 14+
- Chrome Mobile 88+
