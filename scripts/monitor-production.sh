#!/bin/bash
# CrowdFlow Post-Deployment Monitoring Script
# Usage: ./scripts/monitor-production.sh [DURATION_MINUTES]

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-prompt-wars-493611}"
REGION="${GCP_REGION:-asia-south1}"
SERVICE_NAME="crowdflow-platform"
DURATION_MINUTES="${1:-30}"

SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --format="value(status.url)" 2>/dev/null || echo "")

if [ -z "${SERVICE_URL}" ]; then
  echo "✗ Could not find service ${SERVICE_NAME} in ${REGION}"
  exit 1
fi

echo "=== CrowdFlow Production Monitoring ==="
echo "Service: ${SERVICE_URL}"
echo "Duration: ${DURATION_MINUTES} minutes"
echo "Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

CHECK_INTERVAL=30
TOTAL_CHECKS=$(( DURATION_MINUTES * 60 / CHECK_INTERVAL ))
PASS_COUNT=0
FAIL_COUNT=0

for i in $(seq 1 "${TOTAL_CHECKS}"); do
  TIMESTAMP=$(date -u +%H:%M:%S)

  # Health check
  START_MS=$(date +%s%3N)
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${SERVICE_URL}/api/health" 2>/dev/null || echo "000")
  END_MS=$(date +%s%3N)
  LATENCY=$((END_MS - START_MS))

  if [ "${HTTP_CODE}" = "200" ]; then
    STATUS="✓"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    STATUS="✗"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi

  echo "[${TIMESTAMP}] ${STATUS} HTTP ${HTTP_CODE} | ${LATENCY}ms | Check ${i}/${TOTAL_CHECKS}"

  # Check for error rate spikes
  if [ "${FAIL_COUNT}" -ge 3 ]; then
    echo ""
    echo "⚠ WARNING: 3+ consecutive failures detected!"
    echo "  Consider running: ./scripts/rollback.sh"
    echo ""
  fi

  # Wait for next check
  if [ "${i}" -lt "${TOTAL_CHECKS}" ]; then
    sleep "${CHECK_INTERVAL}"
  fi
done

echo ""
echo "=== Monitoring Summary ==="
echo "Total checks:  ${TOTAL_CHECKS}"
echo "Passed:        ${PASS_COUNT}"
echo "Failed:        ${FAIL_COUNT}"
echo "Uptime:        $(( PASS_COUNT * 100 / TOTAL_CHECKS ))%"
echo "Ended:         $(date -u +%Y-%m-%dT%H:%M:%SZ)"

if [ "${FAIL_COUNT}" -eq 0 ]; then
  echo ""
  echo "✓ All checks passed. Production deployment is stable."
else
  echo ""
  echo "✗ ${FAIL_COUNT} health checks failed. Review Cloud Logging for details."
  echo "  gcloud logging read 'resource.type=cloud_run_revision AND severity>=ERROR' --project=${PROJECT_ID} --limit=20"
fi
