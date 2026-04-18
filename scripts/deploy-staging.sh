#!/bin/bash
# CrowdFlow Staging Deployment Script
# Usage: ./scripts/deploy-staging.sh

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-prompt-wars-493611}"
REGION="${GCP_REGION:-asia-south1}"
SERVICE_NAME="crowdflow-platform-staging"
IMAGE_TAG="staging-$(git rev-parse --short HEAD)"
IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/crowdflow/platform:${IMAGE_TAG}"

echo "=== CrowdFlow Staging Deployment ==="
echo "Project:  ${PROJECT_ID}"
echo "Region:   ${REGION}"
echo "Service:  ${SERVICE_NAME}"
echo "Image:    ${IMAGE_URL}"
echo ""

# 1. Build Docker image
echo "[1/5] Building Docker image..."
docker build -t "${IMAGE_URL}" .
echo "  ✓ Build successful"

# 2. Push to Artifact Registry
echo "[2/5] Pushing to Artifact Registry..."
docker push "${IMAGE_URL}"
echo "  ✓ Push successful"

# 3. Deploy to Cloud Run staging
echo "[3/5] Deploying to Cloud Run staging..."
gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE_URL}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --cpu=2 \
  --memory=2Gi \
  --min-instances=1 \
  --max-instances=10 \
  --concurrency=80 \
  --timeout=60s \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,REDIS_URL=REDIS_URL:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --vpc-connector=crowdflow-connector \
  --vpc-egress=all-traffic \
  --service-account="crowdflow-runner@${PROJECT_ID}.iam.gserviceaccount.com"
echo "  ✓ Deployment successful"

# 4. Get staging URL
echo "[4/5] Verifying deployment..."
STAGING_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --format="value(status.url)")

echo "  Staging URL: ${STAGING_URL}"

# 5. Run health check
echo "[5/5] Running health check..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${STAGING_URL}/api/health" 2>/dev/null || echo "FAILED")
HTTP_CODE=$(echo "${HEALTH_RESPONSE}" | tail -1)
BODY=$(echo "${HEALTH_RESPONSE}" | head -1)

if [ "${HTTP_CODE}" = "200" ]; then
  echo "  ✓ Health check passed"
  echo "  Response: ${BODY}" | head -c 200
else
  echo "  ✗ Health check failed (HTTP ${HTTP_CODE})"
  echo "  Response: ${BODY}"
  exit 1
fi

echo ""
echo "=== Staging deployment complete ==="
echo "URL: ${STAGING_URL}"
echo ""
echo "Next steps:"
echo "  1. Run E2E tests: npm run test"
echo "  2. Run load tests: node scripts/load-test.js ${STAGING_URL}"
echo "  3. Run accessibility audit: ./scripts/accessibility-audit.sh ${STAGING_URL}"
