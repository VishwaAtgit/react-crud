#!/usr/bin/env bash
set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
RESET='\033[0m'

MAX_SUPPRESSIONS=6
HOOK_FILE="src/hooks/useObservability.ts"
STRICT_CONFIG="src/hooks/tsconfig.strict.json"
SUPPRESSION_DOC="docs/strictness/SUPPRESSIONS.md"

echo -e "${BOLD}🔒 Strict Type Check — Observability Path${RESET}"
echo -e "Using: $(npx tsc --version)\n"

# ── Step 1: tsc --strict (filter node_modules errors — TS 3.9 can't skip them) ──
echo -e "${BOLD}Step 1: tsc --strict --noEmit${RESET}"
TSC_OUTPUT=$(npx tsc --project "$STRICT_CONFIG" 2>&1 || true)

OUR_ERRORS=$(echo "$TSC_OUTPUT" | grep "error TS" | grep -v "node_modules" || true)
NM_COUNT=$(echo "$TSC_OUTPUT" | grep -c "node_modules" || echo 0)

if [ -n "$OUR_ERRORS" ]; then
  echo "$OUR_ERRORS"
  echo -e "\n${RED}❌ Type check failed — errors in our code${RESET}\n"
  exit 1
else
  echo -e "${GREEN}✅ Type check passed (0 errors in our code; ${NM_COUNT} node_modules errors ignored — TS 3.9 limitation)${RESET}\n"
fi

# ── Step 2: Count suppressions ──
echo -e "${BOLD}Step 2: Suppression budget${RESET}"
ESLINT_COUNT=$(grep -c 'eslint-disable' "$HOOK_FILE" 2>/dev/null || echo 0)
TS_COUNT=$(grep -c '@ts-ignore\|@ts-expect-error' "$HOOK_FILE" 2>/dev/null || echo 0)
TOTAL=$((ESLINT_COUNT + TS_COUNT))

echo "  eslint-disable comments : $ESLINT_COUNT"
echo "  ts-ignore/ts-expect     : $TS_COUNT"
echo "  total                   : $TOTAL / $MAX_SUPPRESSIONS"

if [ "$TOTAL" -gt "$MAX_SUPPRESSIONS" ]; then
  echo -e "${RED}❌ Budget exceeded (${TOTAL} > ${MAX_SUPPRESSIONS})${RESET}"
  exit 1
fi
echo -e "${GREEN}✅ Within budget${RESET}\n"

# ── Step 3: Verify all suppressions are documented ──
echo -e "${BOLD}Step 3: Suppression documentation check${RESET}"

if [ ! -f "$SUPPRESSION_DOC" ]; then
  echo -e "${RED}❌ Missing: ${SUPPRESSION_DOC}${RESET}"
  exit 1
fi

# macOS-compatible grep (-oE instead of -oP)
SOURCE_IDS=$(grep -oE 'S-[0-9]{3}' "$HOOK_FILE" | sort -u || true)
DOC_IDS=$(grep -oE 'S-[0-9]{3}' "$SUPPRESSION_DOC" | sort -u || true)

MISSING=""
for id in $SOURCE_IDS; do
  if ! echo "$DOC_IDS" | grep -q "$id"; then
    MISSING="$MISSING $id"
  fi
done

if [ -n "$MISSING" ]; then
  echo -e "${RED}❌ Undocumented suppressions:${MISSING}${RESET}"
  exit 1
fi

echo -e "${GREEN}✅ All suppressions documented${RESET}\n"

# ── Step 4: Run tests ──
echo -e "${BOLD}Step 4: Tests${RESET}"
npx react-scripts test --watchAll=false --testPathPattern=useObservability --verbose

echo ""
echo -e "${GREEN}${BOLD}✅ All strict checks passed${RESET}"