# ActionCenter Component Consolidation - 2025-01-03

## Summary

Successfully implemented ActionCenter component that consolidates SwapControls and
OptimizationSelector functionality using progressive disclosure pattern. This solves UI complexity
in OptimizeTab while maintaining clean architecture.

## Problem Solved

**Before:**

- OptimizeTab.tsx was messy with multiple separate components
- OptimizationSelector was isolated in its own GlassCard wrapper
- Conceptual mismatch between SwapControls (single operations) and OptimizationSelector
  (multi-strategy selection)
- User requested merging OptimizationSelector into swapControls area but direct merge would create
  technical debt

## Solution Implemented: ActionCenter Pattern

### **ActionCenter Component** ✅ CREATED

- Location: `src/components/PortfolioAllocation/components/ActionCenter.tsx`
- **Progressive Disclosure**: Simple actions (zapIn, zapOut, rebalance) vs Advanced actions
  (convertDust, optimize)
- **Mode-based Configuration**: Different action sets based on operationMode
- **Unified Interface**: Single component handling both swap and optimization logic

### **Key Features**

```typescript
export type ActionType = "zapIn" | "zapOut" | "rebalance" | "convertDust" | "optimize";

interface ActionDefinition {
  id: ActionType;
  title: string;
  description: string;
  icon: React.ReactNode;
  complexity: "simple" | "advanced";
  color: string;
  bgColor: string;
}
```

### **Progressive Disclosure Logic**

- **Simple Actions**: zapIn, zapOut, rebalance - immediate configuration
- **Advanced Actions**: convertDust, optimize - reveal additional options
- **Advanced Toggle**: In rebalance mode, users can toggle between simple/advanced views

### **Context-Aware Behavior**

- **zapIn/zapOut modes**: Shows simple swap actions (zapIn, zapOut)
- **rebalance mode**: Shows optimization actions (rebalance, convertDust, optimize)
- **Dynamic UI**: Configuration area changes based on selected action

## Integration Points

### **PortfolioAllocationContainer.tsx** ✅ UPDATED

- Replaced SwapControls with ActionCenter
- Added OptimizationOptions state management
- Maintains backward compatibility with existing interfaces

### **EnhancedOverview.tsx** ✅ INTEGRATED

- ActionCenter now renders in the swapControls area
- Preserves green gradient wrapper styling
- No changes to external interface

### **OptimizeTab.tsx** ✅ CLEANED UP

- Removed OptimizationSelector usage and import
- Removed OptimizationSelector.tsx file completely
- Reduced component complexity

## Benefits Achieved

### ✅ **User Experience**

- **Clear Progressive Disclosure**: Simple → Advanced action progression
- **Consistent Interface**: Unified action selection and configuration
- **Contextual Actions**: Relevant actions based on current mode

### ✅ **Technical Benefits**

- **No Technical Debt**: Avoided forced integration of incompatible systems
- **Maintainable Architecture**: Clear separation of concerns
- **Extensible Design**: Easy to add new action types
- **Clean State Management**: Proper isolation of swap vs optimization state

### ✅ **Code Quality**

- **Reduced Complexity**: OptimizeTab is now cleaner
- **Single Source of Truth**: All action logic centralized in ActionCenter
- **Better Testability**: Isolated action logic with clear interfaces

## Implementation Pattern

### **State Management Strategy**

```typescript
// Swap settings for simple actions
const [swapSettings, setSwapSettings] = useState<SwapSettings>({
  amount: "",
  slippageTolerance: 0.5,
});

// Optimization options for advanced actions
const [optimizationOptions, setOptimizationOptions] = useState<OptimizationOptions>({
  convertDust: true,
  rebalancePortfolio: true,
  slippage: 30,
});
```

### **Component Props Strategy**

- **Conditional Props**: Optimization props only passed when in rebalance mode
- **Graceful Degradation**: Component works without optimization props
- **Type Safety**: Clear TypeScript interfaces for all action types

## Files Modified

### ✅ **Created**

- `src/components/PortfolioAllocation/components/ActionCenter.tsx`

### ✅ **Updated**

- `src/components/PortfolioAllocation/PortfolioAllocationContainer.tsx`
- `src/components/SwapPage/OptimizeTab.tsx`

### ✅ **Removed**

- `src/components/SwapPage/OptimizationSelector.tsx`

## Future Extensibility

### **Adding New Actions**

1. Add new ActionType to the enum
2. Define ActionDefinition in ACTION_DEFINITIONS array
3. Add configuration UI in ActionCenter component
4. Update validation logic if needed

### **New Operation Modes**

- ActionCenter automatically adapts to different operationModes
- Filter logic in availableActions handles mode-specific action sets

## Quality Assurance

- ✅ Backward compatibility maintained
- ✅ Existing interfaces preserved
- ✅ No breaking changes to parent components
- ✅ Clean component deletion (OptimizationSelector)

This consolidation successfully achieved the user's goal of merging optimization selection into the
swap controls area while avoiding the technical debt that would have resulted from a direct merge
approach.
