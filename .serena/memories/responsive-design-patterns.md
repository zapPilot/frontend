# Responsive Design Patterns - Frontend Codebase

## Established Patterns

### Grid Systems

- **Responsive Columns**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
  - Used in: OptimizeTab.tsx:91, AirdropTab.tsx:127
  - Pattern: Start with 1 column, expand to 2 on small screens, 3 on large screens

### Width Constraints

- **Modal Containers**: `w-full max-w-2xl max-h-[90vh] overflow-y-auto`
  - Used in: UnifiedProgressModal.tsx:374, WalletManager.tsx:111
  - Pattern: Full width with reasonable max-width and scroll handling

- **Small Components**: `max-w-xs sm:max-w-sm`
  - Used in: TooltipHint.tsx:178, SlippageComponent.tsx (fixed)
  - Pattern: Extra small max-width, small on larger screens

### Layout Direction

- **Responsive Flex**: `flex flex-col sm:flex-row gap-3`
  - Used in: AirdropTab.tsx:276
  - Pattern: Vertical stack on mobile, horizontal on larger screens

### Positioning

- **Responsive Positioning**: `left-0 right-0 sm:left-0 sm:right-auto`
  - Used in: SlippageComponent.tsx (fixed)
  - Pattern: Full-width positioning on mobile, specific positioning on larger screens

## Common Issues & Solutions

### Issue: Fixed Width Overflow

- **Problem**: Components with `min-w-[Npx]` cause horizontal scroll on mobile
- **Solution**: Use `w-full max-w-*` pattern with responsive variants
- **Example Fix**: `min-w-[280px]` → `w-full max-w-xs sm:max-w-sm`

### Issue: Non-Responsive Grids

- **Problem**: Fixed column counts like `grid-cols-4` don't adapt to screen size
- **Solution**: Use responsive grid columns starting from fewer columns
- **Example Fix**: `grid-cols-4` → `grid-cols-2 sm:grid-cols-4`

### Issue: Absolute Positioning Overflow

- **Problem**: Dropdowns and modals render off-screen on narrow viewports
- **Solution**: Use responsive positioning with full-width fallback on mobile
- **Example Fix**: `left-0` → `left-0 right-0 sm:left-0 sm:right-auto`

## Implementation Guidelines

1. **Mobile-First Approach**: Start with mobile layout, progressively enhance
2. **Consistent Breakpoints**: Use `sm:`, `md:`, `lg:` breakpoints consistently
3. **Width Constraints**: Always provide max-width to prevent infinite expansion
4. **Test Across Devices**: Verify responsive behavior on mobile, tablet, desktop
5. **Follow Existing Patterns**: Use established patterns from existing components

## Quality Assurance Checklist

- [ ] Component displays correctly on mobile (375px width)
- [ ] No horizontal scrolling on any screen size
- [ ] Interactive elements remain accessible on all devices
- [ ] Layout adapts smoothly between breakpoints
- [ ] Typography remains readable across screen sizes
- [ ] Touch targets meet minimum size requirements (44px)
