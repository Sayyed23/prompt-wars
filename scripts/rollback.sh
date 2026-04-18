#!/bin/bash
# CrowdFlow Rollback Script
# Usage: ./scripts/rollback.sh [REVISION_NAME]

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-prompt-wars-493611}"
REGION="${GCP_REGION:-asia-south1}"
SERVICE_NAME="${1:-crowdflow-platform}"

echo "=== CrowdFlow Rollback ==="
echo "Service: ${SERVICE_NAME}"
echo "Region:  ${REGION}"
echo ""

# 1. List recent revisions
echo "[1/4] Listing recent revisions..."
gcloud run revisions list \
  --service="${SERVICE_NAME}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --format="table(REVISION,ACTIVE,DEPLOYED,STATUS)" \
  --limit=5

echo ""

# 2. Get previous revision
CURRENT_REV=$(gcloud run revisions list \
  --service="${SERVICE_NAME}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --format="value(REVISION)" \
  --limit=1)

PREVIOUS_REV=$(gcloud run revisions list \
  --service="${SERVICE_NAME}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --format="value(REVISION)" \
  --limit=2 | tail -1)

if [ -z "${PREVIOUS_REV}" ]; then
  echo "✗ No previous revision found. Cannot rollback."
  exit 1
fi

echo "[2/4] Rolling back..."
echo "  Current:  ${CURRENT_REV}"
echo "  Target:   ${PREVIOUS_REV}"

# 3. Shift all traffic to previous revision
gcloud run services update-traffic "${SERVICE_NAME}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --to-revisions="${PREVIOUS_REV}=100"

echo "  ✓ Traffic shifted to ${PREVIOUS_REV}"

# 4. Verify rollback
echo "[3/4] Verifying rollback..."
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --format="value(status.url)")

sleep 5

HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${SERVICE_URL}/api/health" 2>/dev/null || echo "000")

if [ "${HEALTH_CODE}" = "200" ]; then
  echo "  ✓ Health check passed (HTTP ${HEALTH_CODE})"
else
  echo "  ✗ Health check failed (HTTP ${HEALTH_CODE})"
  echo "  Manual investigation required."
fi

echo ""
echo "[4/4] Rollback complete"
echo "  Service URL: ${SERVICE_URL}"
echo "  Active Revision: ${PREVIOUS_REV}"
echo ""
echo "Post-rollback actions:"
echo "  1. Monitor error rates for 15 minutes"
echo "  2. Check Cloud Logging for issues"
echo "  3. Investigate root cause of the failed deployment"
echo "  4. Fix and redeploy when ready"
