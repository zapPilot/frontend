#!/bin/bash

# ESLint Toggle Script
# Usage: ./scripts/toggle-eslint.sh [on|off|status]

NEXT_CONFIG="./next.config.ts"

show_status() {
    if grep -q "ignoreDuringBuilds: true" "$NEXT_CONFIG"; then
        echo "🔴 ESLint is currently DISABLED in builds"
    else
        echo "🟢 ESLint is currently ENABLED in builds"
    fi
}

enable_eslint() {
    if grep -q "ignoreDuringBuilds: true" "$NEXT_CONFIG"; then
        sed -i.bak 's/ignoreDuringBuilds: true/ignoreDuringBuilds: false/' "$NEXT_CONFIG"
        echo "🟢 ESLint ENABLED in builds"
        echo "⚠️  Run 'npm run lint' to see current issues"
    else
        echo "✅ ESLint is already enabled"
    fi
}

disable_eslint() {
    if grep -q "ignoreDuringBuilds: false" "$NEXT_CONFIG"; then
        sed -i.bak 's/ignoreDuringBuilds: false/ignoreDuringBuilds: true/' "$NEXT_CONFIG"
        echo "🔴 ESLint DISABLED in builds"
    elif ! grep -q "ignoreDuringBuilds: true" "$NEXT_CONFIG"; then
        # Add the config if it doesn't exist
        sed -i.bak '/typescript: {/a\
  eslint: {\
    ignoreDuringBuilds: true,\
  },' "$NEXT_CONFIG"
        echo "🔴 ESLint DISABLED in builds"
    else
        echo "✅ ESLint is already disabled"
    fi
}

case "$1" in
    "on"|"enable")
        enable_eslint
        ;;
    "off"|"disable") 
        disable_eslint
        ;;
    "status"|"")
        show_status
        ;;
    *)
        echo "Usage: $0 [on|off|status]"
        echo ""
        echo "Commands:"
        echo "  on/enable  - Enable ESLint during builds"
        echo "  off/disable - Disable ESLint during builds" 
        echo "  status     - Show current ESLint status (default)"
        exit 1
        ;;
esac