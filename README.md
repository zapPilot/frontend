# Zap Pilot - Portfolio Management UI

A modern, mobile-first Progressive Web App (PWA) for managing DeFi portfolios using intent-based
execution.

## Features

- 📱 **PWA Support** - Install as mobile app with offline capabilities
- 🎨 **Modern Design** - Glass morphism effects with purple/blue gradient theme
- 📊 **Portfolio Dashboard** - Real-time metrics including balance, APR, and drawdown
- 🔄 **Intent-Based Actions** - ZapIn, ZapOut, and Rebalance operations
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

## Quick Actions

Three main intent-based actions available:

1. **ZapIn** - Add funds to portfolio with optimal routing
2. **ZapOut** - Withdraw funds with minimal slippage
3. **Rebalance** - Automatically rebalance to target allocation

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

Following the All Weather Protocol design language:

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
