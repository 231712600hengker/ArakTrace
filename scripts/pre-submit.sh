#!/bin/bash

# Pre-submission checklist script
# Exit with code 1 if any check fails

set -e  # Exit on first error

echo "==================================="
echo "ArakTrace.bali Pre-Submit Checklist"
echo "==================================="
echo ""

FAILED=0

# Check 1: No PLACEHOLDER in data files
echo "[ ] Checking for PLACEHOLDER markers in data/..."
if grep -r "PLACEHOLDER" data/*.json 2>/dev/null; then
    echo "✗ FAIL: Found PLACEHOLDER in data files. Replace with real content."
    FAILED=1
else
    echo "✓ PASS: No PLACEHOLDER markers found in data/"
fi
echo ""

# Check 2: No [ISI] markers in documentation
echo "[ ] Checking for [ISI] markers in documentation..."
if grep -r "\[ISI\]" README.md DISCLOSURE.md 2>/dev/null; then
    echo "✗ FAIL: Found [ISI] markers in documentation. Fill in the required information."
    FAILED=1
else
    echo "✓ PASS: No [ISI] markers found in documentation"
fi
echo ""

# Check 3: No secrets in tracked files
echo "[ ] Checking for potential secrets in git-tracked files..."
SECRET_PATTERNS=(
    "AIza[0-9A-Za-z-_]{35}"
    "sk-[a-zA-Z0-9]{48}"
    "eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+"
    "AKIA[0-9A-Z]{16}"
)

SECRET_FOUND=0
for pattern in "${SECRET_PATTERNS[@]}"; do
    if git grep -E "$pattern" -- ':!.env.example' ':!scripts/pre-submit.sh' 2>/dev/null; then
        echo "✗ FAIL: Found potential secret matching pattern: $pattern"
        SECRET_FOUND=1
    fi
done

if [ $SECRET_FOUND -eq 1 ]; then
    FAILED=1
else
    echo "✓ PASS: No secrets found in tracked files"
fi
echo ""

# Check 4: .env files are not tracked
echo "[ ] Checking that .env files are not tracked..."
if git ls-files | grep -E "^\.env$|^\.env\.local$" 2>/dev/null; then
    echo "✗ FAIL: .env or .env.local is tracked in git. Remove them and add to .gitignore."
    FAILED=1
else
    echo "✓ PASS: No .env files tracked in git"
fi
echo ""

# Check 5: Build passes
echo "[ ] Running production build..."
if npm run build > build.log 2>&1; then
    echo "✓ PASS: Production build successful"
    rm build.log
else
    echo "✗ FAIL: Production build failed. Check build.log for details."
    cat build.log
    FAILED=1
fi
echo ""

# Check 6: Tests pass
echo "[ ] Running tests..."
if npm test > test.log 2>&1; then
    echo "✓ PASS: All tests passed"
    rm test.log
else
    echo "✗ FAIL: Tests failed. Check test.log for details."
    cat test.log
    FAILED=1
fi
echo ""

# Check 7: Required files exist
echo "[ ] Checking required files exist..."
REQUIRED_FILES=(
    "README.md"
    "DISCLOSURE.md"
    "docs/architecture.md"
    "docs/RELEASE.md"
    ".env.example"
    "package.json"
    "data/chunks.json"
    "data/model.json"
    "data/seed.json"
)

MISSING_FILES=0
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "✗ Missing required file: $file"
        MISSING_FILES=1
    fi
done

if [ $MISSING_FILES -eq 1 ]; then
    echo "✗ FAIL: Some required files are missing"
    FAILED=1
else
    echo "✓ PASS: All required files exist"
fi
echo ""

# Summary
echo "==================================="
if [ $FAILED -eq 1 ]; then
    echo "❌ PRE-SUBMIT CHECK FAILED"
    echo "Fix the issues above before submission."
    echo "==================================="
    exit 1
else
    echo "✅ ALL CHECKS PASSED"
    echo "Project is ready for submission!"
    echo "==================================="
    exit 0
fi
