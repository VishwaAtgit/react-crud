#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------------------
# ci-health-check.sh
#
# Runs the same checks CI does, locally. Produces evidence files.
# Usage:  ./scripts/ci-health-check.sh
# -------------------------------------------------------------------

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
BOLD='\033[1m'

EVIDENCE_DIR="ci-evidence-$(date +%Y%m%d-%H%M%S)"
PASS=0
FAIL=0
FLAKY=0

mkdir -p "$EVIDENCE_DIR"

log()  { echo -e "${GREEN}[ci-check]${NC} $*"; }
warn() { echo -e "${YELLOW}[ci-check]${NC} $*"; }
fail() { echo -e "${RED}[ci-check]${NC} $*"; }

record_result() {
  local name="$1" status="$2" file="$3" duration="$4"
  echo "{\"check\": \"$name\", \"status\": \"$status\", \"duration_s\": $duration, \"file\": \"$file\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >> "$EVIDENCE_DIR/summary.json"
  if [ "$status" = "pass" ]; then ((PASS++)); fi
  if [ "$status" = "fail" ]; then ((FAIL++)); fi
  if [ "$status" = "flaky" ]; then ((FLAKY++)); fi
}

# --- 1. Lint ---------------------------------------------------------------
log "Running lint..."
START=$(date +%s)
if npm run lint > "$EVIDENCE_DIR/lint.txt" 2>&1; then
  DURATION=$(( $(date +%s) - START ))
  log "Lint ✅  (${DURATION}s)"
  record_result "lint" "pass" "lint.txt" "$DURATION"
else
  DURATION=$(( $(date +%s) - START ))
  fail "Lint ❌  (${DURATION}s)"
  record_result "lint" "fail" "lint.txt" "$DURATION"
fi

# --- 2. Tests (with retry) ------------------------------------------------
log "Running tests (attempt 1/3)..."
START=$(date +%s)
TEST_STATUS="fail"

for ATTEMPT in 1 2 3; do
  if npm test -- --watchAll=false --ci --forceExit > "$EVIDENCE_DIR/test-attempt-${ATTEMPT}.txt" 2>&1; then
    DURATION=$(( $(date +%s) - START ))
    if [ "$ATTEMPT" -gt 1 ]; then
      warn "Tests ⚡ FLAKY — passed on attempt $ATTEMPT (${DURATION}s)"
      TEST_STATUS="flaky"
    else
      log "Tests ✅  (${DURATION}s)"
      TEST_STATUS="pass"
    fi
    break
  else
    DURATION=$(( $(date +%s) - START ))
    if [ "$ATTEMPT" -lt 3 ]; then
      warn "Tests failed attempt $ATTEMPT — retrying in 5s..."
      sleep 5
    else
      fail "Tests ❌  — all 3 attempts failed (${DURATION}s)"
      TEST_STATUS="fail"
    fi
  fi
done

record_result "test" "$TEST_STATUS" "test-attempt-*.txt" "$DURATION"

# --- 3. Build --------------------------------------------------------------
log "Running build..."
START=$(date +%s)
if npm run build > "$EVIDENCE_DIR/build.txt" 2>&1; then
  DURATION=$(( $(date +%s) - START ))
  log "Build ✅  (${DURATION}s)"
  record_result "build" "pass" "build.txt" "$DURATION"
else
  DURATION=$(( $(date +%s) - START ))
  fail "Build ❌  (${DURATION}s)"
  record_result "build" "fail" "build.txt" "$DURATION"
fi

# --- 4. Audit (non-blocking) ----------------------------------------------
log "Running npm audit..."
START=$(date +%s)
npm audit > "$EVIDENCE_DIR/audit.txt" 2>&1 || true
npm audit --json > "$EVIDENCE_DIR/audit.json" 2>&1 || true
DURATION=$(( $(date +%s) - START ))
VULN_COUNT=$(node -e "try{const r=require('./$EVIDENCE_DIR/audit.json');console.log(r.metadata?.vulnerabilities?.total??0)}catch{console.log(0)}")
if [ "$VULN_COUNT" = "0" ]; then
  log "Audit ✅  — no vulnerabilities (${DURATION}s)"
  record_result "audit" "pass" "audit.txt" "$DURATION"
else
  warn "Audit ⚠️  — $VULN_COUNT vulnerabilities (${DURATION}s)"
  record_result "audit" "warn" "audit.txt" "$DURATION"
fi

# --- Summary ---------------------------------------------------------------
echo ""
echo -e "${BOLD}┌──────────────────────────────────────┐${NC}"
echo -e "${BOLD}│  CI Health Check Summary             │${NC}"
echo -e "${BOLD}├──────────────────────────────────────┤${NC}"
echo -e "${BOLD}│${NC}  ✅ Passed: ${GREEN}${PASS}${NC}"
echo -e "${BOLD}│${NC}  ⚡ Flaky:  ${YELLOW}${FLAKY}${NC}"
echo -e "${BOLD}│${NC}  ❌ Failed: ${RED}${FAIL}${NC}"
echo -e "${BOLD}│${NC}  Evidence:  ${EVIDENCE_DIR}/"
echo -e "${BOLD}└──────────────────────────────────────┘${NC}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi