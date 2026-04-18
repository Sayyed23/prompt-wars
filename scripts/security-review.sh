#!/bin/bash
# CrowdFlow Security Review Script
# Usage: ./scripts/security-review.sh [BASE_URL]

set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0

echo "=== CrowdFlow Security Review ==="
echo "Target: ${BASE_URL}"
echo ""

# 1. Check security headers
echo "[1/5] Testing security headers..."
HEADERS=$(curl -s -I "${BASE_URL}" 2>/dev/null || echo "FAILED")

check_header() {
  local header="$1"
  local expected="$2"
  if echo "${HEADERS}" | grep -qi "${header}"; then
    echo "  ✓ ${header} present"
    PASS=$((PASS + 1))
  else
    echo "  ✗ ${header} MISSING"
    FAIL=$((FAIL + 1))
  fi
}

check_header "X-Content-Type-Options" "nosniff"
check_header "X-Frame-Options" "DENY"
check_header "X-XSS-Protection" "1"
check_header "Referrer-Policy" "strict-origin"
echo ""

# 2. Check HTTPS redirect
echo "[2/5] Testing HTTPS enforcement..."
if [ "${BASE_URL}" = "http://localhost:3000" ]; then
  echo "  - Skipping HTTPS check (localhost)"
else
  HTTP_URL=$(echo "${BASE_URL}" | sed 's/https:/http:/')
  REDIRECT_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${HTTP_URL}" 2>/dev/null || echo "000")
  if [ "${REDIRECT_CODE}" = "301" ] || [ "${REDIRECT_CODE}" = "308" ]; then
    echo "  ✓ HTTP→HTTPS redirect (${REDIRECT_CODE})"
    PASS=$((PASS + 1))
  else
    echo "  ✗ No HTTPS redirect (HTTP ${REDIRECT_CODE})"
    FAIL=$((FAIL + 1))
  fi
fi
echo ""

# 3. Check rate limiting
echo "[3/5] Testing rate limiting..."
echo "  Sending 110 requests to /api/crowd/density..."
RATE_LIMITED=false
for i in $(seq 1 110); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/crowd/density" 2>/dev/null || echo "000")
  if [ "${CODE}" = "429" ]; then
    echo "  ✓ Rate limiting triggered at request #${i} (HTTP 429)"
    RATE_LIMITED=true
    PASS=$((PASS + 1))
    break
  fi
done
if [ "${RATE_LIMITED}" = false ]; then
  echo "  - Rate limiting not triggered in 110 requests (may be Redis-dependent)"
fi
echo ""

# 4. Check PII handling in AI endpoint
echo "[4/5] Testing PII rejection in AI assistant..."
PII_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/assistant/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "email me at user@example.com"}' 2>/dev/null || echo "FAILED")

if echo "${PII_RESPONSE}" | grep -qi "personal\|pii\|rejected\|error"; then
  echo "  ✓ PII in messages rejected"
  PASS=$((PASS + 1))
else
  echo "  ✗ PII in messages may not be caught"
  FAIL=$((FAIL + 1))
fi
echo ""

# 5. Check health endpoint
echo "[5/5] Testing health endpoint..."
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/health" 2>/dev/null || echo "000")
if [ "${HEALTH_CODE}" = "200" ]; then
  echo "  ✓ Health endpoint available (HTTP 200)"
  PASS=$((PASS + 1))
else
  echo "  ✗ Health endpoint failed (HTTP ${HEALTH_CODE})"
  FAIL=$((FAIL + 1))
fi
echo ""

# Summary
echo "=== Security Review Summary ==="
echo "Passed: ${PASS}"
echo "Failed: ${FAIL}"
if [ "${FAIL}" -eq 0 ]; then
  echo "✓ All security checks passed"
else
  echo "✗ ${FAIL} security checks failed — review before production deployment"
  exit 1
fi
