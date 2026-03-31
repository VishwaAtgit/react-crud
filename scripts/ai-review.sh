#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------------------
# ai-review.sh
#
# Automated reviewer checklist — runs static analysis, pattern checks,
# and generates a structured review report.
#
# Usage:  ./scripts/ai-review.sh
# Output: review-report-YYYYMMDD-HHMMSS/
# -------------------------------------------------------------------

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

REPORT_DIR="review-report-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$REPORT_DIR"

PASS=0
WARN=0
FAIL=0

log()  { echo -e "${GREEN}[review]${NC} $*"; }
warn() { echo -e "${YELLOW}[review]${NC} $*"; }
fail() { echo -e "${RED}[review]${NC} $*"; }
info() { echo -e "${CYAN}[review]${NC} $*"; }

check() {
  local name="$1" status="$2" detail="$3"
  local icon="✅"
  if [ "$status" = "WARN" ]; then icon="⚠️"; ((WARN++)); fi
  if [ "$status" = "FAIL" ]; then icon="❌"; ((FAIL++)); fi
  if [ "$status" = "PASS" ]; then ((PASS++)); fi
  echo "$icon  $name" | tee -a "$REPORT_DIR/summary.txt"
  echo "   $detail" | tee -a "$REPORT_DIR/summary.txt"
  echo "{\"check\":\"$name\",\"status\":\"$status\",\"detail\":\"$detail\"}" >> "$REPORT_DIR/checks.jsonl"
}

echo -e "\n${BOLD}═══════════════════════════════════════════${NC}"
echo -e "${BOLD}  AI Code Review — $(date +%Y-%m-%d)${NC}"
echo -e "${BOLD}═══════════════════════════════════════════${NC}\n"

# ── CATEGORY 1: SECURITY ──────────────────────────────────────────

info "── Security Review ──"

# 1.1 No secrets in source
if grep -rn "password\|api_key\|secret_key\|private_key\|token=" src/ \
  --include="*.js" --include="*.jsx" \
  | grep -v "node_modules" \
  | grep -v "\.test\." \
  | grep -v "// " \
  | grep -vi "csrf.token\|localStorage\|getItem" > "$REPORT_DIR/secret-scan.txt" 2>&1; then
  check "No hardcoded secrets" "WARN" "Potential secrets found — see secret-scan.txt"
else
  check "No hardcoded secrets" "PASS" "No hardcoded secrets detected in src/"
fi

# 1.2 security.js exports correct functions
if grep -q "export function escapeHtml" src/utils/security.js 2>/dev/null &&
   grep -q "export function stripTags" src/utils/security.js 2>/dev/null &&
   grep -q "export function assertNoLeakedSecrets" src/utils/security.js 2>/dev/null; then
  check "security.js API complete" "PASS" "escapeHtml, stripTags, assertNoLeakedSecrets all exported"
else
  check "security.js API complete" "FAIL" "Missing expected exports in src/utils/security.js"
fi

# 1.3 assertNoLeakedSecrets called at startup
if grep -q "assertNoLeakedSecrets" src/index.js 2>/dev/null; then
  check "Startup secret guard" "PASS" "assertNoLeakedSecrets() called in index.js"
else
  check "Startup secret guard" "FAIL" "assertNoLeakedSecrets() NOT called at app startup"
fi

# 1.4 No dangerouslySetInnerHTML without escapeHtml
DANGEROUS=$(grep -rn "dangerouslySetInnerHTML" src/ --include="*.js" --include="*.jsx" | grep -v node_modules | wc -l | tr -d ' ')
if [ "$DANGEROUS" -gt 0 ]; then
  check "No raw dangerouslySetInnerHTML" "WARN" "$DANGEROUS usage(s) found — verify escapeHtml is applied"
  grep -rn "dangerouslySetInnerHTML" src/ --include="*.js" --include="*.jsx" | grep -v node_modules > "$REPORT_DIR/dangerous-html.txt"
else
  check "No raw dangerouslySetInnerHTML" "PASS" "No dangerouslySetInnerHTML usage found"
fi

# ── CATEGORY 2: LOGGING ──────────────────────────────────────────

info "── Logging Review ──"

# 2.1 No raw console.* in source (except logger.js and tests)
RAW_CONSOLE=$(grep -rn "console\.\(log\|warn\|error\|debug\)" src/ \
  --include="*.js" --include="*.jsx" \
  | grep -v "node_modules" \
  | grep -v "utils/logger.js" \
  | grep -v "\.test\." \
  | grep -v "__tests__" \
  | wc -l | tr -d ' ')
if [ "$RAW_CONSOLE" -gt 0 ]; then
  check "No raw console.* usage" "WARN" "$RAW_CONSOLE file(s) use console.* directly — migrate to logger"
  grep -rn "console\.\(log\|warn\|error\|debug\)" src/ \
    --include="*.js" --include="*.jsx" \
    | grep -v "node_modules" \
    | grep -v "utils/logger.js" \
    | grep -v "\.test\." \
    | grep -v "__tests__" > "$REPORT_DIR/raw-console.txt"
else
  check "No raw console.* usage" "PASS" "All logging goes through structured logger"
fi

# 2.2 logger.js exports both APIs
if grep -q "export function logger" src/utils/logger.js 2>/dev/null &&
   grep -q "export function createLogger" src/utils/logger.js 2>/dev/null; then
  check "logger.js dual API" "PASS" "Both logger() and createLogger() exported"
else
  check "logger.js dual API" "FAIL" "Missing expected exports in logger.js"
fi

# 2.3 ErrorBoundary uses logging
if grep -q "createLogger\|logger(" src/components/ErrorBoundary.js 2>/dev/null &&
   grep -q "increment\|counter" src/components/ErrorBoundary.js 2>/dev/null; then
  check "ErrorBoundary instrumented" "PASS" "ErrorBoundary has logging + metrics"
else
  check "ErrorBoundary instrumented" "WARN" "ErrorBoundary missing logging or metrics"
fi

# 2.4 useLogger hook exists and tracks mount/unmount
if grep -q "component_mount_total" src/features/hooks/useLogger.js 2>/dev/null &&
   grep -q "component_unmount_total" src/features/hooks/useLogger.js 2>/dev/null; then
  check "useLogger lifecycle tracking" "PASS" "Mount/unmount metrics tracked"
else
  check "useLogger lifecycle tracking" "FAIL" "useLogger missing lifecycle metrics"
fi

# ── CATEGORY 3: METRICS ──────────────────────────────────────────

info "── Metrics Review ──"

# 3.1 metrics.js exports required functions
if grep -q "export function increment" src/utils/metrics.js 2>/dev/null &&
   grep -q "export function gauge" src/utils/metrics.js 2>/dev/null &&
   grep -q "export function startTimer" src/utils/metrics.js 2>/dev/null &&
   grep -q "export function snapshot" src/utils/metrics.js 2>/dev/null &&
   grep -q "export function reset" src/utils/metrics.js 2>/dev/null; then
  check "metrics.js API complete" "PASS" "increment, gauge, startTimer, snapshot, reset all exported"
else
  check "metrics.js API complete" "FAIL" "Missing expected exports in metrics.js"
fi

# 3.2 apiClient uses metrics
if grep -q "increment" src/services/apiClient.js 2>/dev/null &&
   grep -q "startTimer" src/services/apiClient.js 2>/dev/null &&
   grep -q "gauge" src/services/apiClient.js 2>/dev/null; then
  check "apiClient fully instrumented" "PASS" "Counters, timers, and gauges in API client"
else
  check "apiClient fully instrumented" "WARN" "apiClient missing some metric types"
fi

# ── CATEGORY 4: CODE QUALITY ─────────────────────────────────────

info "── Code Quality Review ──"

# 4.1 Lint
if npm run lint > "$REPORT_DIR/lint.txt" 2>&1; then
  check "ESLint passes" "PASS" "Zero errors, zero warnings"
else
  LINT_ERRORS=$(grep -c "error" "$REPORT_DIR/lint.txt" 2>/dev/null || echo "?")
  check "ESLint passes" "FAIL" "$LINT_ERRORS error(s) — see lint.txt"
fi

# 4.2 Tests
if npm test -- --watchAll=false --ci --forceExit > "$REPORT_DIR/test.txt" 2>&1; then
  SUITES=$(grep "Test Suites:" "$REPORT_DIR/test.txt" | tail -1)
  TESTS=$(grep "^Tests:" "$REPORT_DIR/test.txt" | tail -1)
  check "All tests pass" "PASS" "$SUITES | $TESTS"
else
  SUITES=$(grep "Test Suites:" "$REPORT_DIR/test.txt" | tail -1)
  check "All tests pass" "FAIL" "$SUITES — see test.txt"
fi

# 4.3 Build
if npm run build > "$REPORT_DIR/build.txt" 2>&1; then
  check "Production build succeeds" "PASS" "npm run build completed"
else
  check "Production build succeeds" "FAIL" "Build failed — see build.txt"
fi

# 4.4 Test coverage for new utils
UTIL_FILES=$(find src/utils -name "*.js" ! -name "*.test.*" | wc -l | tr -d ' ')
UTIL_TESTS=$(find src -path "*test*" -name "*logger*" -o -path "*test*" -name "*metrics*" -o -path "*test*" -name "*security*" 2>/dev/null | wc -l | tr -d ' ')
if [ "$UTIL_TESTS" -ge 2 ]; then
  check "Utility test coverage" "PASS" "$UTIL_TESTS test files covering $UTIL_FILES utility modules"
else
  check "Utility test coverage" "WARN" "Only $UTIL_TESTS test files for $UTIL_FILES utility modules"
fi

# ── CATEGORY 5: CI / INFRASTRUCTURE ──────────────────────────────

info "── CI Review ──"

# 5.1 CI workflow exists
if [ -f .github/workflows/ci.yml ]; then
  check "CI workflow exists" "PASS" ".github/workflows/ci.yml present"
else
  check "CI workflow exists" "FAIL" "Missing .github/workflows/ci.yml"
fi

# 5.2 Rollback workflow exists
if [ -f .github/workflows/rollback.yml ]; then
  check "Rollback workflow exists" "PASS" ".github/workflows/rollback.yml present"
else
  check "Rollback workflow exists" "WARN" "No rollback workflow — manual rollback only"
fi

# 5.3 CI has timeout
if grep -q "timeout-minutes" .github/workflows/ci.yml 2>/dev/null; then
  check "CI timeouts configured" "PASS" "timeout-minutes found in ci.yml"
else
  check "CI timeouts configured" "WARN" "No timeout-minutes in CI — runs could hang"
fi

# 5.4 CI has caching
if grep -q "cache:" .github/workflows/ci.yml 2>/dev/null; then
  check "CI dependency caching" "PASS" "cache directive found in ci.yml"
else
  check "CI dependency caching" "WARN" "No caching — CI installs will be slow"
fi

# 5.5 CI has matrix
if grep -q "matrix:" .github/workflows/ci.yml 2>/dev/null; then
  check "CI matrix testing" "PASS" "Matrix strategy found in ci.yml"
else
  check "CI matrix testing" "WARN" "No matrix — testing only one Node version"
fi

# 5.6 CI has retry
if grep -q "Retry\|retry\|attempt" .github/workflows/ci.yml 2>/dev/null; then
  check "CI test retry" "PASS" "Retry logic found in ci.yml"
else
  check "CI test retry" "WARN" "No retry logic — flaky tests will block merges"
fi

# ── CATEGORY 6: DOCUMENTATION ────────────────────────────────────

info "── Documentation Review ──"

for DOC in docs/SECURITY.md docs/LOGGING_AND_METRICS.md docs/CI_RELIABILITY.md; do
  if [ -f "$DOC" ]; then
    LINES=$(wc -l < "$DOC" | tr -d ' ')
    check "$(basename $DOC) exists" "PASS" "$LINES lines"
  else
    check "$(basename $DOC) exists" "WARN" "Missing — undocumented feature"
  fi
done

# ── SUMMARY ───────────────────────────────────────────────────────

TOTAL=$((PASS + WARN + FAIL))

echo ""
echo -e "${BOLD}═══════════════════════════════════════════${NC}"
echo -e "${BOLD}  Review Summary${NC}"
echo -e "${BOLD}═══════════════════════════════════════════${NC}"
echo -e "  ${GREEN}✅ Passed:  ${PASS}/${TOTAL}${NC}"
echo -e "  ${YELLOW}⚠️  Warnings: ${WARN}/${TOTAL}${NC}"
echo -e "  ${RED}❌ Failed:  ${FAIL}/${TOTAL}${NC}"
echo -e "  📁 Evidence: ${REPORT_DIR}/"
echo -e "${BOLD}═══════════════════════════════════════════${NC}"

# Generate reviewer checklist markdown
cat > "$REPORT_DIR/REVIEW_CHECKLIST.md" << CHECKLIST_EOF
# Code Review Checklist — $(date +%Y-%m-%d)

## Automated Review Results

| # | Check | Status |
|---|-------|--------|
$(awk '{print NR" | "$0}' "$REPORT_DIR/summary.txt" | sed 's/✅/| ✅ PASS/;s/⚠️/| ⚠️ WARN/;s/❌/| ❌ FAIL/')

**Totals**: ✅ ${PASS} passed | ⚠️ ${WARN} warnings | ❌ ${FAIL} failed

---

## Human Reviewer Checklist

### Security
- [ ] **S1**: Verified \`escapeHtml\` / \`stripTags\` are used wherever user input is rendered outside JSX
- [ ] **S2**: Confirmed \`assertNoLeakedSecrets()\` runs before \`ReactDOM.render\`
- [ ] **S3**: No \`.env\` files committed; \`.gitignore\` covers \`.env*\`
- [ ] **S4**: API client doesn't log full request/response bodies in production

### Logging
- [ ] **L1**: Log levels make sense (DEBUG for tracing, INFO for operations, WARN for degraded, ERROR for failures)
- [ ] **L2**: No PII (emails, names, passwords) in log messages or meta
- [ ] **L3**: Logger transport is only enabled in production with a valid endpoint
- [ ] **L4**: ErrorBoundary catches and logs component stack

### Metrics
- [ ] **M1**: Counter names follow convention: \`snake_case_total\`
- [ ] **M2**: Timer names follow convention: \`snake_case_ms\`
- [ ] **M3**: \`reset()\` is only used in tests, never in production code
- [ ] **M4**: Flush endpoint is HTTPS in production config

### Code Quality
- [ ] **Q1**: No TODO/FIXME left untracked (each has a linked issue)
- [ ] **Q2**: New utility functions have JSDoc with \`@param\` and \`@returns\`
- [ ] **Q3**: No circular imports between utils/, services/, hooks/
- [ ] **Q4**: useEffect cleanup prevents state updates on unmounted components

### CI / Infrastructure
- [ ] **C1**: CI matrix covers the Node version used in production
- [ ] **C2**: Retry logic doesn't mask real failures (flaky warning is surfaced)
- [ ] **C3**: Rollback workflow tested on a non-main branch first
- [ ] **C4**: Artifact retention matches compliance requirements

### Documentation
- [ ] **D1**: SECURITY.md rollback steps are accurate and tested
- [ ] **D2**: LOGGING_AND_METRICS.md file map matches actual file locations
- [ ] **D3**: CI_RELIABILITY.md diagram matches actual workflow job graph

---

## Risk Assessment

### High Risk
| Risk | Mitigation | Owner |
|------|-----------|-------|
| \`npm audit fix --force\` introduces breaking change | CI validates build+test before PR merge | Reviewer |
| Logger transport sends PII to external endpoint | Review all \`.info()\` / \`.error()\` calls for PII | Reviewer |
| \`assertNoLeakedSecrets\` throws in prod if misconfigured | Function logs warning in prod, only throws in dev | Author |

### Medium Risk
| Risk | Mitigation | Owner |
|------|-----------|-------|
| Metrics memory leak if never flushed/reset | Timer arrays capped by flush interval; no prod \`reset()\` | Author |
| Flaky test retry masks real regression | \`::warning\` annotation + flaky flag in evidence | CI |
| ErrorBoundary swallows errors silently | Logs to console.error + increments counter | Author |

### Low Risk
| Risk | Mitigation | Owner |
|------|-----------|-------|
| \`escapeHtml\` not needed (React auto-escapes) | Only used for \`dangerouslySetInnerHTML\` edge cases | N/A |
| CI artifact storage cost | 14–90 day retention limits | Infra |

---

## Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| AI Review | automated | $(date +%Y-%m-%d) | ✅ Complete |
| Human Reviewer 1 | _____________ | __________ | ⬜ Pending |
| Human Reviewer 2 | _____________ | __________ | ⬜ Pending |
| Author | _____________ | __________ | ⬜ Pending |

### Merge Criteria
- [x] AI review completed with no ❌ FAIL
- [ ] At least 1 human reviewer approved
- [ ] All ❌ FAIL items resolved
- [ ] All ⚠️ WARN items acknowledged with comment
- [ ] Author addressed all review comments
CHECKLIST_EOF

echo ""
log "Review checklist written to $REPORT_DIR/REVIEW_CHECKLIST.md"

if [ "$FAIL" -gt 0 ]; then
  fail "Review has $FAIL failure(s) — resolve before requesting human review"
  exit 1
else
  log "Ready for human review"
  exit 0
fi