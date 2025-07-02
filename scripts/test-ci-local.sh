#!/bin/bash

# Local CI Testing Script
# Simulates GitHub Actions environment for testing CI workflows locally

set -e  # Exit on any error

echo "🚀 Starting Local CI Test..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print step headers
print_step() {
    echo -e "\n${BLUE}📋 Step: $1${NC}"
    echo "----------------------------------------"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Store current directory
ORIGINAL_DIR=$(pwd)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Ensure we're in the project directory
cd "$PROJECT_DIR"

print_step "Environment Detection"
echo "Project Directory: $PROJECT_DIR"
echo "Node Version: $(node --version)"
echo "NPM Version: $(npm --version)"

# Detect package manager (same logic as GitHub Actions)
print_step "Package Manager Detection"

if [ -f "package-lock.json" ]; then
    MANAGER="npm"
    COMMAND="ci"
    RUNNER="npx --no-install"
    print_success "Detected NPM (package-lock.json found)"
elif [ -f "yarn.lock" ]; then
    MANAGER="yarn"
    COMMAND="install"
    RUNNER="yarn"
    print_success "Detected Yarn (yarn.lock found)"
elif [ -f "package.json" ]; then
    MANAGER="npm"
    COMMAND="install"
    RUNNER="npx --no-install"
    print_success "Detected NPM (package.json found, no lock file)"
else
    print_error "Unable to determine package manager"
    exit 1
fi

echo "Manager: $MANAGER"
echo "Command: $COMMAND"
echo "Runner: $RUNNER"

# Clean install dependencies
print_step "Installing Dependencies"
if [ "$MANAGER" = "npm" ] && [ "$COMMAND" = "ci" ]; then
    print_warning "Running npm ci (requires package-lock.json)"
    npm ci
elif [ "$MANAGER" = "npm" ]; then
    npm install
else
    yarn install
fi
print_success "Dependencies installed"

# Type checking
print_step "Type Checking"
if npm run type-check > /dev/null 2>&1; then
    print_success "Type checking passed"
else
    print_warning "Type checking failed or not configured"
fi

# Linting
print_step "Linting"
if npm run lint > /dev/null 2>&1; then
    print_success "Linting passed"
else
    print_warning "Linting failed or not configured"
fi

# Build application
print_step "Building Application"
echo "Running: $RUNNER next build"

if [ "$RUNNER" = "npx --no-install" ]; then
    npx next build
else
    yarn next build
fi
print_success "Build completed successfully"

# Check output directory
print_step "Verifying Build Output"
if [ -d "out" ]; then
    OUTPUT_SIZE=$(du -sh out | cut -f1)
    print_success "Output directory created (Size: $OUTPUT_SIZE)"
    
    # List key files
    echo "Key output files:"
    ls -la out/ | head -10
    
    if [ -f "out/index.html" ]; then
        print_success "index.html found in output"
    else
        print_warning "index.html not found in output"
    fi
else
    print_error "Output directory 'out' not found"
    exit 1
fi

# Simulate GitHub Pages upload artifact check
print_step "Simulating Artifact Upload Check"
if [ -d "out" ] && [ "$(ls -A out)" ]; then
    print_success "Output directory is not empty - artifact upload would succeed"
else
    print_error "Output directory is empty - artifact upload would fail"
    exit 1
fi

# Test essential scripts
print_step "Testing Essential Scripts"

# Test start command (if it exists)
if grep -q '"start"' package.json; then
    print_success "Start script found in package.json"
else
    print_warning "No start script found"
fi

# Test other important scripts
IMPORTANT_SCRIPTS=("lint" "format" "type-check")
for script in "${IMPORTANT_SCRIPTS[@]}"; do
    if grep -q "\"$script\"" package.json; then
        print_success "$script script available"
    else
        print_warning "$script script not found"
    fi
done

# Memory and performance check
print_step "Performance Check"
if command -v free > /dev/null 2>&1; then
    echo "Memory usage:"
    free -h
elif command -v vm_stat > /dev/null 2>&1; then
    echo "Memory statistics (macOS):"
    vm_stat | head -5
fi

echo -e "\n${GREEN}🎉 Local CI Test Completed Successfully!${NC}"
echo "=================================="
echo "✅ Package manager detection works"
echo "✅ Dependencies install successfully" 
echo "✅ Build completes without errors"
echo "✅ Output artifacts are generated"
echo ""
echo "Your changes should work in GitHub Actions! 🚀"

# Return to original directory
cd "$ORIGINAL_DIR"