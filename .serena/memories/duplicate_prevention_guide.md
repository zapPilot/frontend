# Duplicate Prevention Guide - Common Patterns to Avoid

## 🚨 High-Risk Duplication Patterns

### **Button Components**

**Existing Components:**

- `GradientButton` - Primary action button with gradient styling
  (`src/components/ui/GradientButton.tsx`)
- `ActionButton` - Portfolio-specific actions (zap, rebalance)
  (`src/components/PortfolioAllocation/components/Actions/ActionButton.tsx`)

**⚠️ Before Creating New Button:**

```bash
# Check existing button patterns
mcp__serena__search_for_pattern: "Button.*export|export.*Button"
mcp__serena__find_referencing_symbols: name_path="GradientButton" relative_path="src/components/ui/GradientButton.tsx"
```

**Decision Matrix:**

- **Extend GradientButton**: If you need gradient styling with icon support
- **Create Specialized Button**: Only if significantly different interaction pattern needed
- **Use ActionButton Pattern**: For portfolio-specific actions

### **Settings/Configuration Components**

**Existing Components:**

- `SlippageSettings` - Trading slippage configuration
  (`src/components/PortfolioAllocation/components/SlippageSettings.tsx`)
- `SlippageSelector` - Alternative slippage interface
  (`src/components/SwapPage/SlippageSelector.tsx`)

**⚠️ DUPLICATION DETECTED**: Two similar slippage components exist!

**Prevention Strategy:**

```bash
# Always search for Settings/Selector patterns
mcp__serena__search_for_pattern: "Settings|Selector.*export"
mcp__serena__find_symbol: name_path="Settings" substring_matching=true
```

### **Modal/Progress Components**

**Existing Components:**

- `IntentProgressModal` - Multi-step transaction progress
  (`src/components/SwapPage/IntentProgressModal.tsx`)
- `StreamingProgress` - Real-time operation progress
  (`src/components/SwapPage/StreamingProgress.tsx`)
- `OptimizationProgress` - Portfolio optimization tracking
  (`src/components/SwapPage/OptimizationProgress.tsx`)
- `WalletTransactionProgress` - Batch transaction progress
  (`src/components/SwapPage/WalletTransactionProgress.tsx`)

**⚠️ COMPLEXITY WARNING**: Multiple progress components with overlapping functionality

**Decision Framework:**

- **IntentProgressModal**: For step-by-step modal workflows
- **StreamingProgress**: For live data streaming updates
- **OptimizationProgress**: For portfolio optimization specifically
- **WalletTransactionProgress**: For batch transaction tracking

### **Selector/Dropdown Components**

**Existing Components:**

- `TokenSelector` - Token selection dropdown
  (`src/components/PortfolioAllocation/components/Controls/TokenSelection/TokenSelector.tsx`)
- `ChainSelector` - Network switching with status (`src/components/Web3/ChainSelector.tsx`)
- `SlippageSelector` - Slippage configuration dropdown
  (`src/components/SwapPage/SlippageSelector.tsx`)

**Decision Rules:**

- **Extend existing selector**: If same data type (tokens, chains, settings)
- **Create new specialized**: Only if completely different UX pattern

## 🎯 Component Category Analysis

### **Chart/Visualization Components**

**Existing:**

- `PieChart` + `PieChartLegend` - Pie charts with interactions
- `PortfolioChart` - Multi-tab charting interface
- `PortfolioCharts` - Feature-specific chart container

**Risk Level**: 🟡 Medium - Chart components tend to be feature-specific

### **Summary/Overview Components**

**Existing:**

- `PortfolioOverview` - Main portfolio summary
- `EnhancedOverview` - Advanced portfolio overview
- `RebalanceSummary` - Rebalancing action summary
- `TradingSummary` - Trading action summary
- `OptimizationPreview` - Optimization preview

**Risk Level**: 🔴 High - Multiple "summary" components with potential overlap

**Prevention Strategy:**

```bash
# Check summary patterns before creating
mcp__serena__search_for_pattern: "Summary|Overview.*export"
```

## 🔍 Search Patterns for Prevention

### **Universal Search Commands**

```bash
# Before creating any component, run these:

# 1. Search for similar functionality
mcp__serena__search_for_pattern: "[COMPONENT_NAME]|[FUNCTIONALITY].*export"

# 2. Search for similar names
mcp__serena__find_symbol: name_path="[COMPONENT_NAME]" substring_matching=true

# 3. Check component category
mcp__serena__search_for_pattern: "[CATEGORY].*export" # e.g., "Button", "Modal", "Selector"
```

### **Category-Specific Searches**

```bash
# UI Components
mcp__serena__search_for_pattern: "Button|Card|Modal|Input|Select.*export"

# Data Display
mcp__serena__search_for_pattern: "Chart|Table|List|Overview|Summary.*export"

# Form Controls
mcp__serena__search_for_pattern: "Selector|Settings|Control|Input.*export"

# Progress/Status
mcp__serena__search_for_pattern: "Progress|Status|Loading|Streaming.*export"
```

## 📋 Pre-Creation Checklist

### **Before Creating Any Component:**

1. **✅ Context Loading**

   ```bash
   mcp__serena__list_memories
   mcp__serena__read_memory: "component_inventory.md"
   ```

2. **✅ Similarity Analysis**

   ```bash
   mcp__serena__search_for_pattern: "[FUNCTIONALITY].*export"
   mcp__serena__find_symbol: name_path="[SIMILAR_NAME]" substring_matching=true
   ```

3. **✅ Usage Analysis**

   ```bash
   mcp__serena__find_referencing_symbols: name_path="[EXISTING_COMPONENT]"
   ```

4. **✅ Decision Documentation**
   ```typescript
   /**
    * DUPLICATION ANALYSIS:
    * - Searched: [SEARCH_TERMS]
    * - Found similar: [EXISTING_COMPONENTS]
    * - Decision: [CREATE_NEW/EXTEND_EXISTING/REFACTOR]
    * - Justification: [REASONING]
    */
   ```

## 🚫 Common Anti-Patterns

### **Naming Conflicts**

❌ **Bad**: Creating `ButtonComponent` when `GradientButton` exists ✅ **Good**: Extending
`GradientButton` or creating `SpecializedActionButton`

### **Functional Duplication**

❌ **Bad**: Creating `SlippageControl` when `SlippageSettings` exists ✅ **Good**: Refactoring
existing component for broader use

### **Similar but Slightly Different**

❌ **Bad**: Creating `TokenDropdown` when `TokenSelector` exists ✅ **Good**: Adding props to
`TokenSelector` for different use cases

## 🔧 Refactoring Strategies

### **When to Refactor Instead of Creating**

- **>70% functionality overlap**: Refactor existing component
- **Same data structures**: Extend existing component's props
- **Similar UI patterns**: Create shared base component

### **Refactoring Approach**

1. **Analyze existing usage** with `find_referencing_symbols`
2. **Create backward-compatible interface**
3. **Migrate usage incrementally**
4. **Remove old component once migration complete**

## 🎨 Allowed Duplication Scenarios

### **When Duplication is Acceptable:**

1. **Different domains**: Portfolio vs Swap vs Web3 specific components
2. **Different complexity levels**: Simple vs Advanced versions
3. **Different interaction patterns**: Modal vs Inline vs Dropdown
4. **Performance requirements**: Heavy vs Lightweight versions

### **Documentation Required:**

- Clear naming differentiation
- Usage guidelines in component comments
- Integration patterns documented

## 🔄 Maintenance Strategy

### **Regular Audits:**

```bash
# Monthly duplication check
mcp__serena__search_for_pattern: "Button|Modal|Settings|Summary|Progress.*export"

# Check for orphaned components
mcp__serena__find_referencing_symbols: name_path="[COMPONENT_NAME]"
```

### **Refactoring Opportunities:**

- Components with <2 references (potential orphans)
- Similar component names in different directories
- Multiple components handling same data types

This guide should be updated as new patterns emerge and when significant refactoring occurs.
