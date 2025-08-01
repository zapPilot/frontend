# Standardized Architecture Loading Workflow

## Phase 1: Memory-Based Understanding (First Priority)

### Step 1: Load Core Architecture Knowledge

```
1. Read architectural-overview memory
2. Read component-inventory memory
3. Read integration-patterns memory
4. Read duplicate-prevention-guide memory
```

### Step 2: Review Relevant Domain Memories

- Read any domain-specific memories (frontend, backend, etc.)
- Check for technology-specific patterns
- Review any existing implementation guides

## Phase 2: Targeted Exploration (When Needed)

### Step 3: Focused Directory Analysis

```
# Only explore specific areas relevant to the task
get_symbols_overview("src/components") # For UI tasks
get_symbols_overview("src/utils")      # For utility functions
get_symbols_overview("src/services")   # For API integrations
```

### Step 4: Pattern-Based Search

```
# Search for existing similar functionality
search_for_pattern("component_keyword")
find_symbol("similar_function_name")
```

## Phase 3: Implementation Planning

### Step 5: Anti-Duplication Check

- Use duplicate-prevention-guide checklist
- Search for similar existing functionality
- Identify reusable components/patterns

### Step 6: Integration Point Analysis

- How does new code fit existing architecture?
- What existing patterns should be followed?
- What existing utilities can be reused?

## Quick Start Commands for Common Tasks

### Frontend Component Tasks

```
1. read_memory("component-inventory")
2. read_memory("architectural-overview")
3. get_symbols_overview("src/components")
4. search_for_pattern("Button|Input|Modal") # Adjust keywords
```

### Backend API Tasks

```
1. read_memory("integration-patterns")
2. read_memory("architectural-overview")
3. get_symbols_overview("src/services")
4. search_for_pattern("api|service|client")
```

### Utility Function Tasks

```
1. read_memory("component-inventory")
2. get_symbols_overview("src/utils")
3. search_for_pattern("format|validate|convert|helper")
```

## Memory Maintenance

### After Implementation:

- Update component-inventory with new components
- Add new patterns to integration-patterns if applicable
- Note any architectural insights for future reference

### Periodic Maintenance:

- Review and update memories as codebase evolves
- Consolidate duplicate patterns discovered
- Refine anti-duplication strategies

## Benefits of This Workflow

1. **Speed**: Memories provide instant comprehensive understanding
2. **Accuracy**: Reduces duplicate implementations significantly
3. **Consistency**: Ensures new code follows existing patterns
4. **Efficiency**: Minimal token usage through targeted exploration
5. **Quality**: Better integration with existing systems

## Emergency Fallback

If memories are outdated or missing:

1. Quick directory structure scan with `list_dir`
2. High-level overview with `get_symbols_overview` on key directories
3. Pattern search for critical functionality
4. Update memories with discovered information
