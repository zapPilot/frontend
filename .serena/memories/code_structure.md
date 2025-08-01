# Codebase Structure

## Directory Organization

### `/src` - Main source directory

- **`/app`** - Next.js 13+ App Router pages (layout.tsx, page.tsx, globals.css)
- **`/components`** - React components organized by feature
  - **`/PortfolioAllocation`** - Main feature with utils, components, hooks subdirectories
  - **`/SwapPage`** - Swap functionality with dedicated hooks
  - **`/Web3`** - Wallet and chain management components
  - **`/ui`** - Reusable UI components (buttons, cards, notifications)
  - **`/shared`** - Shared utility components
  - **Feature-specific tabs**: MoreTab, SettingsTab, Onboarding
- **`/hooks`** - Custom React hooks (wallet, portfolio, toast, etc.)
- **`/providers`** - React context providers for state management
- **`/types`** - TypeScript type definitions
- **`/constants`** - Application constants and configuration
- **`/config`** - Configuration files (wallet, chains)
- **`/utils`** - Utility functions
- **`/lib`** - Library functions (chart utils, portfolio utils)
- **`/data`** - Mock data for development/testing
- **`/styles`** - Design tokens and styling utilities

## Component Organization Patterns

- Feature-based grouping with index.ts re-exports
- Hooks co-located with related components
- Separate utils directories for complex features
- Clear separation between UI components and business logic components
