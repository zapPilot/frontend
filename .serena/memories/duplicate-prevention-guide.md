# Duplicate Prevention Guide

## Why Duplicates Occur

- AI lacks comprehensive memory of existing components
- Similar functionality implemented in different locations
- Missing awareness of existing utilities and patterns
- Insufficient exploration before implementation

## Serena's Anti-Duplication Features

### 1. Memory System

- Persistent memories across sessions store architectural knowledge
- Component inventories prevent recreating existing functionality
- Pattern libraries document reusable solutions

### 2. Semantic Search Tools

- `find_symbol` - locate existing functions/classes by name patterns
- `search_for_pattern` - find similar implementations via regex
- `find_referencing_symbols` - understand component relationships
- `get_symbols_overview` - comprehensive file/directory analysis

### 3. Intelligent Exploration

- Always explore before implementing
- Use `list_dir` and `find_file` to understand structure
- Read memories to understand existing patterns
- Search for similar functionality before creating new

## Pre-Implementation Checklist

### Before Creating Any Component:

1. **Read Relevant Memories**
   - Check component-inventory memory
   - Review architectural-overview memory
   - Scan integration-patterns memory

2. **Search for Similar Functionality**
   - Use `search_for_pattern` with keywords
   - Use `find_symbol` for similar names
   - Check related directories with `get_symbols_overview`

3. **Analyze Existing Patterns**
   - How do existing components solve similar problems?
   - What utilities/helpers already exist?
   - What patterns should be followed?

### During Implementation:

- Reuse existing utilities and patterns
- Follow established architectural patterns
- Integrate with existing systems rather than recreating
- Update memories with new components created

## Common Duplication Scenarios

### UI Components

- **Risk**: Creating new input fields, modals, buttons
- **Prevention**: Check `src/components/ui/` first
- **Search**: `search_for_pattern` for "Input", "Modal", "Button"

### Utility Functions

- **Risk**: Recreating formatting, validation, conversion functions
- **Prevention**: Check `src/utils/`, `src/lib/` directories
- **Search**: Function name patterns like "format", "validate", "convert"

### API Integrations

- **Risk**: Duplicate service clients, API wrappers
- **Prevention**: Check existing service layers
- **Search**: API domain names, service patterns

### Business Logic

- **Risk**: Duplicate calculation logic, validation rules
- **Prevention**: Check existing business logic layers
- **Search**: Domain-specific terms and calculations

## Recovery from Duplicates

If duplicates are discovered:

1. Identify the canonical implementation
2. Consolidate functionality into single location
3. Update all references using `find_referencing_symbols`
4. Remove duplicate implementations
5. Update memories with consolidated structure
