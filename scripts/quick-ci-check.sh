#!/bin/bash

# Quick CI Check Script
# Fast verification that basic CI steps will work

set -e

echo "🔍 Quick CI Check..."

# Detect package manager
if [ -f "package-lock.json" ]; then
    echo "✅ NPM detected (package-lock.json)"
    MANAGER="npm"
elif [ -f "yarn.lock" ]; then
    echo "✅ Yarn detected (yarn.lock)"
    MANAGER="yarn"
else
    echo "⚠️  No lock file found, using npm"
    MANAGER="npm"
fi

# Quick dependency check
echo "📦 Checking dependencies..."
if [ "$MANAGER" = "npm" ]; then
    npm ls > /dev/null 2>&1 && echo "✅ Dependencies OK" || echo "⚠️  Dependency issues detected"
else
    yarn check > /dev/null 2>&1 && echo "✅ Dependencies OK" || echo "⚠️  Dependency issues detected"
fi

# Quick build test
echo "🔨 Testing build..."
if [ "$MANAGER" = "npm" ]; then
    npm run build > /dev/null 2>&1 && echo "✅ Build successful" || echo "❌ Build failed"
else
    yarn build > /dev/null 2>&1 && echo "✅ Build successful" || echo "❌ Build failed"
fi

# Check output
if [ -d "out" ] && [ "$(ls -A out)" ]; then
    echo "✅ Output generated"
else
    echo "❌ No output generated"
fi

echo "🎯 Quick check complete!"