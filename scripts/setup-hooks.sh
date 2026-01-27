#!/bin/bash

# Setup Git Hooks for Agentscan
# Run this after cloning the repository

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔧 Setting up Git hooks for Agentscan..."

# Create pre-commit hook
cat > "$PROJECT_ROOT/.git/hooks/pre-commit" << 'EOF'
#!/bin/bash

# ERC-8004 Agentscan Pre-commit Hook
# Runs TypeScript type checking before allowing commits

set -e

echo "🔍 Running pre-commit checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if frontend files are staged
FRONTEND_CHANGED=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '^frontend/' || true)

if [ -n "$FRONTEND_CHANGED" ]; then
    echo -e "${YELLOW}📦 Frontend files changed, running TypeScript check...${NC}"

    cd frontend

    # Run TypeScript compiler in noEmit mode (type check only)
    if npm run type-check 2>/dev/null; then
        echo -e "${GREEN}✅ TypeScript check passed${NC}"
    else
        # If type-check script doesn't exist, run tsc directly
        if npx tsc --noEmit; then
            echo -e "${GREEN}✅ TypeScript check passed${NC}"
        else
            echo -e "${RED}❌ TypeScript check failed${NC}"
            echo -e "${RED}Please fix the type errors before committing.${NC}"
            exit 1
        fi
    fi

    cd ..
fi

# Check if backend files are staged
BACKEND_CHANGED=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '^backend/' || true)

if [ -n "$BACKEND_CHANGED" ]; then
    echo -e "${YELLOW}🐍 Backend files changed, running Python type check...${NC}"

    cd backend

    # Run mypy if available (optional - won't fail if not installed)
    if command -v mypy &> /dev/null; then
        if uv run mypy src --ignore-missing-imports 2>/dev/null; then
            echo -e "${GREEN}✅ Python type check passed${NC}"
        else
            echo -e "${YELLOW}⚠️  Python type check had issues (non-blocking)${NC}"
        fi
    else
        echo -e "${YELLOW}ℹ️  mypy not installed, skipping Python type check${NC}"
    fi

    cd ..
fi

echo -e "${GREEN}✅ Pre-commit checks completed${NC}"
exit 0
EOF

# Make hook executable
chmod +x "$PROJECT_ROOT/.git/hooks/pre-commit"

echo "✅ Git hooks installed successfully!"
echo ""
echo "The pre-commit hook will now:"
echo "  • Run TypeScript type check when frontend files change"
echo "  • Run Python type check (if mypy installed) when backend files change"
echo ""
echo "To skip the hook temporarily, use: git commit --no-verify"
