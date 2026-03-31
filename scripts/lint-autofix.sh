#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------------------
# lint-autofix.sh
#
# Runs ESLint autofix across the project, then reports what was fixed
# and what still needs manual attention.
#
# Usage:  ./scripts/lint-autofix.sh [--dry-run]
# -------------------------------------------------------------------

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

DRY_RUN=false
if [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN=true
fi

REPORT_DIR="lint-report-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$REPORT_DIR"

echo -e "\n${BOLD}═══════════════════════════════════════════${NC}"
echo -e "${BOLD}  ESLint Autofix $([ "$DRY_RUN" = true ] && echo '(DRY RUN)' || echo '')${NC}"
echo -e "${BOLD}═══════════════════════════════════════════${NC}\n"

# ── Step 1: Snapshot BEFORE ──────────────────────────────────────

echo -e "${YELLOW}[1/4]${NC} Capturing pre-fix lint state..."
npx eslint src/ --ext .js,.jsx --format json > "$REPORT_DIR/before.json" 2>/dev/null || true
BEFORE_ERRORS=$(node -e "
  const r = require('./$REPORT_DIR/before.json');
  const total = r.reduce((s, f) => s + f.errorCount, 0);
  console.log(total);
")
BEFORE_WARNINGS=$(node -e "
  const r = require('./$REPORT_DIR/before.json');
  const total = r.reduce((s, f) => s + f.warningCount, 0);
  console.log(total);
")
echo -e "   Before: ${RED}${BEFORE_ERRORS} errors${NC}, ${YELLOW}${BEFORE_WARNINGS} warnings${NC}"

# ── Step 2: Run autofix ─────────────────────────────────────────

if [ "$DRY_RUN" = true ]; then
  echo -e "\n${YELLOW}[2/4]${NC} Dry run — showing what WOULD be fixed..."
  npx eslint src/ --ext .js,.jsx --fix-dry-run --format json > "$REPORT_DIR/fix-preview.json" 2>/dev/null || true
  echo "   (no files modified)"
else
  echo -e "\n${YELLOW}[2/4]${NC} Running autofix..."
  npx eslint src/ --ext .js,.jsx --fix 2>/dev/null || true
fi

# ── Step 3: Snapshot AFTER ───────────────────────────────────────

echo -e "\n${YELLOW}[3/4]${NC} Capturing post-fix lint state..."
npx eslint src/ --ext .js,.jsx --format json > "$REPORT_DIR/after.json" 2>/dev/null || true
AFTER_ERRORS=$(node -e "
  const r = require('./$REPORT_DIR/after.json');
  const total = r.reduce((s, f) => s + f.errorCount, 0);
  console.log(total);
")
AFTER_WARNINGS=$(node -e "
  const r = require('./$REPORT_DIR/after.json');
  const total = r.reduce((s, f) => s + f.warningCount, 0);
  console.log(total);
")
echo -e "   After:  ${RED}${AFTER_ERRORS} errors${NC}, ${YELLOW}${AFTER_WARNINGS} warnings${NC}"

FIXED_ERRORS=$((BEFORE_ERRORS - AFTER_ERRORS))
FIXED_WARNINGS=$((BEFORE_WARNINGS - AFTER_WARNINGS))

# ── Step 4: Generate diff + remaining issues ─────────────────────

echo -e "\n${YELLOW}[4/4]${NC} Generating reports..."

# Remaining issues in readable form
npx eslint src/ --ext .js,.jsx > "$REPORT_DIR/remaining.txt" 2>/dev/null || true

# Files that were modified
if [ "$DRY_RUN" = false ]; then
  git diff --name-only > "$REPORT_DIR/modified-files.txt" 2>/dev/null || true
fi

# Remaining issues grouped by rule
node -e "
  const r = require('./$REPORT_DIR/after.json');
  const rules = {};
  for (const f of r) {
    for (const m of f.messages) {
      const rule = m.ruleId || 'parse-error';
      if (!rules[rule]) { rules[rule] = { count: 0, files: new Set() }; }
      rules[rule].count++;
      rules[rule].files.add(f.filePath.replace(process.cwd() + '/', ''));
    }
  }
  const sorted = Object.entries(rules).sort((a, b) => b[1].count - a[1].count);
  for (const [rule, data] of sorted) {
    console.log(data.count + '\t' + rule + '\t' + [...data.files].join(', '));
  }
" > "$REPORT_DIR/by-rule.txt" 2>/dev/null || true

# ── Summary ──────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}═══════════════════════════════════════════${NC}"
echo -e "${BOLD}  Autofix Summary${NC}"
echo -e "${BOLD}═══════════════════════════════════════════${NC}"
echo -e "  ${GREEN}Fixed:     ${FIXED_ERRORS} errors, ${FIXED_WARNINGS} warnings${NC}"
echo -e "  ${RED}Remaining: ${AFTER_ERRORS} errors, ${AFTER_WARNINGS} warnings${NC}"
echo -e "  📁 Reports: ${REPORT_DIR}/"
echo -e "     ├── before.json      (pre-fix snapshot)"
echo -e "     ├── after.json       (post-fix snapshot)"
echo -e "     ├── remaining.txt    (human-readable remaining)"
echo -e "     ├── by-rule.txt      (count per rule)"
echo -e "     └── modified-files.txt"
echo -e "${BOLD}═══════════════════════════════════════════${NC}"

if [ "$AFTER_ERRORS" -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}Top remaining rules:${NC}"
  head -10 "$REPORT_DIR/by-rule.txt" 2>/dev/null | while IFS=$'\t' read -r count rule files; do
    echo -e "  ${RED}${count}${NC}\t${rule}\t${files}"
  done
  echo ""
  echo -e "${YELLOW}Run 'npm run lint' to see full details${NC}"
  exit 1
fi

echo -e "\n${GREEN}All clean! ✅${NC}"
exit 0