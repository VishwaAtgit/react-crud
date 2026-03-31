# filepath: /Users/vishwac/personal/react-crud/scripts/validate-flag.sh
#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# Validate useObservability feature flag ON/OFF
# ─────────────────────────────────────────────

BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
RESET='\033[0m'

PASS=0
FAIL=0

run_tests() {
  local state="$1"
  local label
  [ "$state" = "true" ] && label="🟢 ON" || label="🔴 OFF"

  echo -e "\n${BOLD}═══ Flag ${label} (REACT_APP_ENABLE_OBSERVABILITY=${state}) ═══${RESET}\n"

  REACT_APP_ENABLE_OBSERVABILITY="$state" \
    npx react-scripts test --watchAll=false \
      --testPathPattern='useObservability' \
      --verbose 2>&1 | tee "/tmp/flag-test-${state}.txt"

  if [ "${PIPESTATUS[0]}" -eq 0 ]; then
    echo -e "\n${GREEN}✅ Flag ${label}: ALL TESTS PASSED${RESET}"
    PASS=$((PASS + 1))
  else
    echo -e "\n${RED}❌ Flag ${label}: SOME TESTS FAILED${RESET}"
    FAIL=$((FAIL + 1))
  fi
}

echo -e "${BOLD}Feature Flag Lifecycle Validation${RESET}"
echo "Flag: REACT_APP_ENABLE_OBSERVABILITY"
echo "─────────────────────────────────────"

run_tests "true"
run_tests "false"

echo ""
echo "─────────────────────────────────────"
echo -e "${BOLD}Summary${RESET}"
echo "  Configurations tested: 2"
echo -e "  Passed: ${GREEN}${PASS}${RESET}"
echo -e "  Failed: ${RED}${FAIL}${RESET}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}⚠ Some flag configurations failed. Review output above.${RESET}"
  exit 1
fi

echo -e "${GREEN}✅ All flag configurations validated successfully.${RESET}"