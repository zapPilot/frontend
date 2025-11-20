#!/bin/bash

# TypeScript Check Hook for Single Next.js App
# Runs TypeScript compiler after Edit/Write operations

set -e

CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$HOME/project}"
HOOK_INPUT=$(cat)
SESSION_ID="${session_id:-default}"
CACHE_DIR="$CLAUDE_PROJECT_DIR/.claude/tsc-cache/$SESSION_ID"

# Create cache directory
mkdir -p "$CACHE_DIR"

# Extract tool information
TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name // ""')
TOOL_INPUT=$(echo "$HOOK_INPUT" | jq -r '.tool_input // {}')

# Only process file modification tools
case "$TOOL_NAME" in
    Write|Edit|MultiEdit)
        # Extract file paths
        if [ "$TOOL_NAME" = "MultiEdit" ]; then
            FILE_PATHS=$(echo "$TOOL_INPUT" | jq -r '.edits[].file_path // empty')
        else
            FILE_PATHS=$(echo "$TOOL_INPUT" | jq -r '.file_path // empty')
        fi

        # Check if any TypeScript/JavaScript files were modified
        TS_FILES=$(echo "$FILE_PATHS" | grep -E '\.(ts|tsx|js|jsx)$' || true)

        if [ -n "$TS_FILES" ]; then
            echo "⚡ Running TypeScript check..." >&2

            # Navigate to project directory
            cd "$CLAUDE_PROJECT_DIR"

            # Run TypeScript compiler
            if CHECK_OUTPUT=$(npx tsc --noEmit 2>&1); then
                echo "✅ TypeScript check passed" >&2
                exit 0
            else
                # TypeScript errors found
                echo "" >&2
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
                echo "🚨 TypeScript errors found" >&2
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
                echo "" >&2
                echo "👉 IMPORTANT: Fix TypeScript errors before proceeding" >&2
                echo "" >&2
                echo "Error Preview:" >&2
                echo "$CHECK_OUTPUT" | grep "error TS" | head -15 >&2
                echo "" >&2

                ERROR_COUNT=$(echo "$CHECK_OUTPUT" | grep -c "error TS" 2>/dev/null || echo "0")
                if [ "$ERROR_COUNT" -gt 15 ] 2>/dev/null; then
                    echo "... and $((ERROR_COUNT - 15)) more errors" >&2
                    echo "" >&2
                fi

                # Save full error output for reference
                echo "$CHECK_OUTPUT" > "$CACHE_DIR/last-errors.txt"

                # Exit with code 1 to make stderr visible in Claude Code
                exit 1
            fi
        fi
        ;;
esac

# Cleanup old cache directories (older than 7 days)
find "$CLAUDE_PROJECT_DIR/.claude/tsc-cache" -maxdepth 1 -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true

exit 0
