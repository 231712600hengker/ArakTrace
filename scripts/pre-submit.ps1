# Pre-submission checklist script for Windows
# Exit with code 1 if any check fails

$ErrorActionPreference = "Continue"

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "ArakTrace.bali Pre-Submit Checklist" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

$Failed = 0

# Check 1: No PLACEHOLDER in data files
Write-Host "[ ] Checking for PLACEHOLDER markers in data/..." -ForegroundColor Yellow
$placeholders = Select-String -Path "data\*.json" -Pattern "PLACEHOLDER" -ErrorAction SilentlyContinue
if ($placeholders) {
    Write-Host "✗ FAIL: Found PLACEHOLDER in data files. Replace with real content." -ForegroundColor Red
    $placeholders | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    $Failed = 1
} else {
    Write-Host "✓ PASS: No PLACEHOLDER markers found in data/" -ForegroundColor Green
}
Write-Host ""

# Check 2: No [ISI] markers in documentation
Write-Host "[ ] Checking for [ISI] markers in documentation..." -ForegroundColor Yellow
$isiMarkers = Select-String -Path "README.md","DISCLOSURE.md" -Pattern "\[ISI\]" -ErrorAction SilentlyContinue
if ($isiMarkers) {
    Write-Host "✗ FAIL: Found [ISI] markers in documentation. Fill in the required information." -ForegroundColor Red
    $isiMarkers | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    $Failed = 1
} else {
    Write-Host "✓ PASS: No [ISI] markers found in documentation" -ForegroundColor Green
}
Write-Host ""

# Check 3: No secrets in tracked files
Write-Host "[ ] Checking for potential secrets in git-tracked files..." -ForegroundColor Yellow
$secretPatterns = @(
    "AIza[0-9A-Za-z-_]{35}",
    "sk-[a-zA-Z0-9]{48}",
    "eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+",
    "AKIA[0-9A-Z]{16}"
)

$secretFound = $false
foreach ($pattern in $secretPatterns) {
    $matches = git grep -E $pattern -- ':!.env.example' ':!scripts/pre-submit.ps1' ':!scripts/pre-submit.sh' 2>$null
    if ($matches) {
        Write-Host "✗ FAIL: Found potential secret matching pattern: $pattern" -ForegroundColor Red
        $secretFound = $true
    }
}

if ($secretFound) {
    $Failed = 1
} else {
    Write-Host "✓ PASS: No secrets found in tracked files" -ForegroundColor Green
}
Write-Host ""

# Check 4: .env files are not tracked
Write-Host "[ ] Checking that .env files are not tracked..." -ForegroundColor Yellow
$envFiles = git ls-files | Select-String -Pattern "^\.env$|^\.env\.local$"
if ($envFiles) {
    Write-Host "✗ FAIL: .env or .env.local is tracked in git. Remove them and add to .gitignore." -ForegroundColor Red
    $Failed = 1
} else {
    Write-Host "✓ PASS: No .env files tracked in git" -ForegroundColor Green
}
Write-Host ""

# Check 5: Build passes
Write-Host "[ ] Running production build..." -ForegroundColor Yellow
$buildOutput = npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ PASS: Production build successful" -ForegroundColor Green
} else {
    Write-Host "✗ FAIL: Production build failed." -ForegroundColor Red
    Write-Host $buildOutput -ForegroundColor Red
    $Failed = 1
}
Write-Host ""

# Check 6: Tests pass
Write-Host "[ ] Running tests..." -ForegroundColor Yellow
$testOutput = npm test 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ PASS: All tests passed" -ForegroundColor Green
} else {
    Write-Host "✗ FAIL: Tests failed." -ForegroundColor Red
    Write-Host $testOutput -ForegroundColor Red
    $Failed = 1
}
Write-Host ""

# Check 7: Required files exist
Write-Host "[ ] Checking required files exist..." -ForegroundColor Yellow
$requiredFiles = @(
    "README.md",
    "DISCLOSURE.md",
    "docs\architecture.md",
    "docs\RELEASE.md",
    ".env.example",
    "package.json",
    "data\chunks.json",
    "data\model.json",
    "data\seed.json"
)

$missingFiles = $false
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "✗ Missing required file: $file" -ForegroundColor Red
        $missingFiles = $true
    }
}

if ($missingFiles) {
    Write-Host "✗ FAIL: Some required files are missing" -ForegroundColor Red
    $Failed = 1
} else {
    Write-Host "✓ PASS: All required files exist" -ForegroundColor Green
}
Write-Host ""

# Summary
Write-Host "===================================" -ForegroundColor Cyan
if ($Failed -eq 1) {
    Write-Host "❌ PRE-SUBMIT CHECK FAILED" -ForegroundColor Red
    Write-Host "Fix the issues above before submission." -ForegroundColor Red
    Write-Host "===================================" -ForegroundColor Cyan
    exit 1
} else {
    Write-Host "✅ ALL CHECKS PASSED" -ForegroundColor Green
    Write-Host "Project is ready for submission!" -ForegroundColor Green
    Write-Host "===================================" -ForegroundColor Cyan
    exit 0
}
