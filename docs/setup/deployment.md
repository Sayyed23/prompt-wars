# CrowdFlow Platform — Deployment Guide

## Environment Variables & Secrets

### Required Environment Variables

| Variable | Description | Example | Secret? |
|----------|-------------|---------|---------|
| `NODE_ENV` | Runtime environment | `production` | No |
| `PORT` | Server port | `8080` | No |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/crowdflow` | Yes |
| `REDIS_URL` | Redis connection string | `redis://10.x.x.x:6379` | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` | Yes |
| `IOT_API_KEY` | IoT simulator API key | `cf-iot-...` | Yes |
| `SESSION_SECRET` | HMAC key for session tokens | (auto-generated if absent) | Yes |
| `GCP_PROJECT_ID` | GCP project for logging | `prompt-wars-493611` | No |

### Secret Manager Setup

```bash
# Create secrets
gcloud secrets create DATABASE_URL --replication-policy="automatic"
gcloud secrets create REDIS_URL --replication-policy="automatic"
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
gcloud secrets create IOT_API_KEY --replication-policy="automatic"

# Add secret versions
echo -n "postgresql://..." | gcloud secrets versions add DATABASE_URL --data-file=-
echo -n "redis://10.x.x.x:6379" | gcloud secrets versions add REDIS_URL --data-file=-
echo -n "AIza..." | gcloud secrets versions add GEMINI_API_KEY --data-file=-
echo -n "cf-iot-..." | gcloud secrets versions add IOT_API_KEY --data-file=-

# Grant Cloud Run service account access
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:crowdflow-runner@prompt-wars-493611.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Local Development (.env.local)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/crowdflow
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your-gemini-api-key
IOT_API_KEY=dev-iot-key-123
SESSION_SECRET=dev-session-secret-do-not-use-in-production
```

### Startup Validation

The application validates required environment variables at startup. If any are missing, it will log a warning and fall back to defaults where safe, or fail fast for critical values.

---

## Deployment Procedures

### Manual Deployment

```bash
# 1. Build Docker image
docker build -t asia-south1-docker.pkg.dev/prompt-wars-493611/crowdflow/platform:$(git rev-parse --short HEAD) .

# 2. Push to Artifact Registry
docker push asia-south1-docker.pkg.dev/prompt-wars-493611/crowdflow/platform:$(git rev-parse --short HEAD)

# 3. Deploy to Cloud Run
gcloud run services replace cloudrun.yaml --region=asia-south1

# 4. Verify deployment
curl -s https://crowdflow-platform-xxx.run.app/api/health | jq .
```

### Automated Deployment (GitHub Actions)

Deployment is triggered automatically on push to `main`:

1. **Build**: Docker multi-stage build
2. **Push**: Image pushed to Google Artifact Registry
3. **Deploy**: Cloud Run service updated with new revision
4. **Verify**: Health check endpoint tested
5. **Traffic**: Gradual shift 10% → 50% → 100%

Pipeline file: `.github/workflows/deploy.yml`

### Rollback Procedures

```bash
# List available revisions
gcloud run revisions list --service=crowdflow-platform --region=asia-south1

# Rollback to previous revision (immediate)
gcloud run services update-traffic crowdflow-platform \
  --region=asia-south1 \
  --to-revisions=crowdflow-platform-PREVIOUS_REV=100

# Verify rollback
curl -s https://crowdflow-platform-xxx.run.app/api/health | jq .
```

**Rollback timeline**: Complete within 5 minutes including verification.

---

## Multi-Region Deployment

| Region | Role | Service Name |
|--------|------|-------------|
| `asia-south1` | Primary | `crowdflow-platform` |
| `us-central1` | Secondary | `crowdflow-platform-us` |
| `europe-west1` | Secondary | `crowdflow-platform-eu` |

All regions share the same Docker image and configuration. Traffic is distributed via Global Cloud Load Balancer with automatic failover.

---

## Health Check

| Endpoint | Method | Expected Response |
|----------|--------|-------------------|
| `/api/health` | GET | `200 OK` with JSON status |

Response body:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "0.1.0",
  "uptime": 3600,
  "redis": { "status": "connected", "latencyMs": 2 },
  "database": { "status": "connected", "latencyMs": 5 },
  "responseTimeMs": 8
}
```

---

## VPC Connector Configuration

- **Name**: `crowdflow-connector`
- **CIDR**: `10.8.0.0/28`
- **Instances**: 2-3 (auto-scaled)
- **Egress**: All traffic routed through VPC
- **Access**: Private IPs for Redis and Cloud SQL

---

## IAM Service Account

- **Name**: `crowdflow-runner@prompt-wars-493611.iam.gserviceaccount.com`
- **Roles**:
  - `roles/run.invoker` — Cloud Run invocation
  - `roles/cloudsql.client` — Cloud SQL access
  - `roles/secretmanager.secretAccessor` — Secret Manager read
  - `roles/logging.logWriter` — Cloud Logging write
  - `roles/monitoring.metricWriter` — Custom metrics write
