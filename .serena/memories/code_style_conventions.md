# Code Style & Conventions

## TypeScript Configuration

- **Strict mode enabled** with comprehensive type checking
- `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters` enforced
- Path aliases: `@/*` maps to `./src/*`
- No implicit returns, strict property access

## Naming Conventions

- **Components**: PascalCase (e.g., `WalletPortfolio`, `PortfolioCharts`)
- **Files**: PascalCase for components, camelCase for utilities
- **Hooks**: Start with `use` prefix (e.g., `useWallet`, `usePortfolio`)
- **Types**: PascalCase with descriptive suffixes (`Props`, `State`, `Return`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `NAVIGATION_ITEMS`, `SLIPPAGE_PRESETS`)

## Component Patterns

- **Props interfaces**: Named with component name + `Props` suffix
- **Default exports**: Components use default export, utilities use named exports
- **Index files**: Used for clean re-exports (`src/components/ui/index.ts`)
- **Component co-location**: Related hooks and utilities in same feature directory

## Code Organization

- **Feature-based structure**: Group related components, hooks, types together
- **Separation of concerns**: UI components vs business logic components
- **Utility functions**: Separate files for formatters, helpers, calculations
- **Type definitions**: Comprehensive interfaces for all data structures

## ESLint Rules

- No unused variables/parameters (error)
- No explicit `any` (warning)
- React hooks rules enforced
- No console.log in production (warning)
- Prefer const, no var, object shorthand enforced
