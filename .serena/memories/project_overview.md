# Project Overview

## Purpose

Zap Pilot is a DeFi-focused frontend application built with Next.js. It's an intent-based execution
engine for DeFi operations supporting various vault strategies including:

- Stablecoin Vault
- Index500 (S&P500-like index fund)
- BTC vault
- ETH vault
- Custom user-defined vaults

## Tech Stack

- **Framework**: Next.js 15.3.4 with React 19.0.0
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS v4
- **Web3**: ThirdWeb SDK for wallet interactions
- **Animation**: Framer Motion
- **PWA**: next-pwa for progressive web app features
- **Testing**: Playwright for E2E testing
- **Linting**: ESLint with Next.js config + TypeScript
- **Formatting**: Prettier
- **Git Hooks**: Husky with lint-staged

## Architecture

- Frontend-only application focused on DeFi portfolio management
- Component-based architecture with clear separation of concerns
- Intent-based execution model where users specify desired outcomes
- Web3 wallet integration with multi-chain support
- Portfolio allocation and rebalancing functionality
