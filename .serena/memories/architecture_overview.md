# Zap Pilot - Architectural Overview

## High-Level System Architecture

Zap Pilot is a sophisticated DeFi frontend application with a layered, feature-based architecture:

### 🏗️ Core Architecture Layers

#### 1. **Presentation Layer** (`src/app/`, `src/components/`)

- **Main App**: Single-page application with tab-based navigation
- **Component Hierarchy**: Feature-based organization with clear boundaries
- **UI Design System**: Consistent styling with Tailwind CSS + design tokens

#### 2. **Business Logic Layer** (`src/hooks/`, `src/lib/`, `src/utils/`)

- **Custom Hooks**: Encapsulate complex business logic and state management
- **Utility Libraries**: Portfolio calculations, chart generation, formatting
- **Web3 Integration**: Wallet connectivity, chain management, transaction handling

#### 3. **Data Layer** (`src/types/`, `src/constants/`, `src/data/`)

- **Type System**: Comprehensive TypeScript definitions for all data structures
- **Configuration**: Chain definitions, portfolio constants, trading parameters
- **Mock Data**: Development and testing data fixtures

#### 4. **Infrastructure Layer** (`src/providers/`, `src/config/`)

- **Context Providers**: Global state management for wallet, onboarding
- **Configuration**: Multi-chain support, wallet adapters, environment settings

## 🎯 Feature Architecture

### **Portfolio Management System**

```
PortfolioAllocation/
├── components/           # UI components for allocation features
│   ├── Charts/          # Data visualization components
│   ├── Controls/        # User input and validation
│   ├── Actions/         # Action buttons and triggers
│   ├── Categories/      # Asset category management
│   └── Summary/         # Results and overview displays
├── hooks/               # Portfolio-specific business logic
├── utils/               # Data processing utilities
└── types.ts             # Portfolio domain types
```

### **Web3 Integration System**

```
Web3/
├── WalletButton         # Primary wallet interaction component
├── ChainSelector        # Multi-chain network switching
├── SimpleConnectButton  # Lightweight connection interface
└── HeaderWalletControls # Navigation-integrated controls
```

### **Swap & Trading System**

```
SwapPage/
├── SwapTab              # Basic swap interface
├── OptimizeTab          # Portfolio optimization features
├── hooks/               # Trading-specific logic (optimization, UI state, tokens)
└── components/          # Specialized trading UI elements
```

## 🔄 Data Flow Architecture

### **State Management Pattern**

1. **React Context** for global application state (wallet, onboarding)
2. **Custom Hooks** for feature-specific state management
3. **Component State** for UI-only concerns
4. **Constants** for configuration and static data

### **Component Communication**

- **Props Down**: Data flows from parent to child components
- **Callbacks Up**: Events bubble up through callback props
- **Context**: Global state accessible throughout component tree
- **Custom Hooks**: Shared logic between components

## 🎨 Design System Architecture

### **Styling Strategy**

- **Tailwind CSS**: Utility-first styling framework
- **Design Tokens**: Centralized styling constants (`src/constants/design-system.ts`)
- **Glass Morphism**: Consistent visual theme with backdrop blur effects
- **Gradient System**: Predefined color gradients for branding

### **Animation Framework**

- **Framer Motion**: Declarative animations and transitions
- **Animation Containers**: Reusable animation wrappers
- **Staggered Animations**: Coordinated element entrance effects

## 🔌 Integration Points

### **External Services**

- **ThirdWeb SDK**: Web3 wallet connectivity and transactions
- **Chain Networks**: Multi-chain blockchain integration
- **Mock APIs**: Development-time data simulation

### **Internal Services**

- **Portfolio Calculations**: Mathematical models for rebalancing
- **Chart Generation**: Data visualization processing
- **Wallet Management**: Address formatting, transaction batching

## 🛡️ Type Safety Architecture

### **TypeScript Strategy**

- **Strict Mode**: Maximum type safety with comprehensive checking
- **Domain Types**: Specific type definitions for each feature area
- **Interface Consistency**: Props interfaces for all components
- **Type Guards**: Runtime type validation where needed

## 📊 Performance Architecture

### **Optimization Patterns**

- **React.memo**: Component memoization for expensive renders
- **useMemo/useCallback**: Hook-level memoization for computations
- **Lazy Loading**: Code splitting for route-based loading
- **Animation Performance**: CSS transforms and GPU acceleration

## 🔍 Key Architectural Decisions

1. **Feature-Based Organization**: Groups related functionality together
2. **Composition Over Inheritance**: React component composition patterns
3. **Hook-First Design**: Business logic encapsulated in custom hooks
4. **Type-Driven Development**: TypeScript-first approach with strict typing
5. **Configuration-Based Flexibility**: Environment and chain configuration externalized

## 🤖 AI Development Aids

- `.serena/` stores project memories and configuration for the Serena agent.
- `Claude.md` and `.claude/commands/` document workflows for the Claude agent.
