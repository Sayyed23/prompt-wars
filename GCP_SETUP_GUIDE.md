# GCP Infrastructure Setup Guide for CrowdFlow Platform

This guide walks you through setting up all Google Cloud Platform infrastructure for the CrowdFlow platform (Task 3 from the implementation plan).

## Prerequisites

- Google Cloud account with billing enabled
- `gcloud` CLI installed ([Install Guide](https://cloud.google.com/sdk/docs/install))
- Docker installed locally
- Terraform installed ([Install Guide](https://developer.hashicorp.com/terraform/install))
- GitHub repository for the project

## Table of Contents

1. [Initial GCP Project Setup](#1-initial-gcp-project-setup)
2. [Enable Required APIs](#2-enable-required-apis)
3. [Set Up Service Account](#3-set-up-service-account)
4. [Configure Terraform Backend](#4-configure-terraform-backend)
5. [Deploy Infrastructure with Terraform](#5-deploy-infrastructure-with-terraform)
6. [Set Up Secrets in Secret Manager](#6-set-up-secrets-in-secret-manager)
7. [Configure GitHub Actions](#7-configure-github-actions)
8. [Test Docker Build Locally](#8-test-docker-build-locally)
9. [Deploy to Cloud Run](#9-deploy-to-cloud-run)
10. [Verify Deployment](#10-verify-deployment)

---

## 1. Initial GCP Project Setup

### 1.1 Login to GCP
```bash
gcloud auth login
```

### 1.2 Set Your Project ID
```bash
# Replace with your actual project ID
export PROJECT_ID="prompt-wars-493611"
gcloud config set project $PROJECT_ID
```

### 1.3 Set Default Region
```bash
export REGION="us-east1"
gcloud config set compute/region $REGION
```

### 1.4 Verify Configuration
```bash
gcloud config list
```

---

## 2. Enable Required APIs

Enable all necessary Google Cloud APIs:

```bash
# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Container Registry / Artifact Registry
gcloud services enable artifactregistry.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Enable Compute Engine (for VPC)
gcloud services enable compute.googleapis.com

# Enable VPC Access
gcloud services enable vpcaccess.googleapis.com

# Enable Redis (Memorystore)
gcloud services enable redis.googleapis.com

# Enable Cloud SQL
gcloud services enable sqladmin.googleapis.com

# Enable Secret Manager
gcloud services enable secretmanager.googleapis.com

# Enable Cloud Build (for CI/CD)
gcloud services enable cloudbuild.googleapis.com

# Enable Cloud Logging and Monitoring
gcloud services enable logging.googleapis.com
gcloud services enable monitoring.googleapis.com
```

**Verify APIs are enabled:**
```bash
gcloud services list --enabled
```

---

## 3. Set Up Service Account

### 3.1 Create Service Account for Cloud Run
```bash
gcloud iam service-accounts create crowdflow-sa \
  --display-name="CrowdFlow Platform Service Account" \
  --description="Service account for CrowdFlow Cloud Run application"
```

### 3.2 Grant Required Permissions
```bash
# Secret Manager access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:crowdflow-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Cloud SQL Client
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:crowdflow-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Redis access (via VPC)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:crowdflow-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/redis.editor"
```

### 3.3 Create Service Account for GitHub Actions
```bash
gcloud iam service-accounts create github-actions-sa \
  --display-name="GitHub Actions Deployment" \
  --description="Service account for GitHub Actions CI/CD"
```

### 3.4 Grant Deployment Permissions
```bash
# Cloud Run Admin
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# Artifact Registry Writer
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Service Account User (to deploy as crowdflow-sa)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Storage Admin (for container images)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin"
```

### 3.5 Create and Download Key for GitHub Actions
```bash
gcloud iam service-accounts keys create GCP_SA_KEY.json \
  --iam-account=github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com
```

**⚠️ IMPORTANT:** Keep this file secure! You'll add it to GitHub Secrets later.

---

## 4. Configure Terraform Backend

### 4.1 Create GCS Bucket for Terraform State
```bash
gsutil mb -p $PROJECT_ID -l $REGION gs://${PROJECT_ID}-terraform-state
```

### 4.2 Enable Versioning
```bash
gsutil versioning set on gs://${PROJECT_ID}-terraform-state
```

### 4.3 Update Terraform Configuration
Add this to `terraform/main.tf` at the top (after provider block):

```hcl
terraform {
  backend "gcs" {
    bucket = "prompt-wars-493611-terraform-state"
    prefix = "crowdflow/state"
  }
}
```

---

## 5. Deploy Infrastructure with Terraform

### 5.1 Navigate to Terraform Directory
```bash
cd terraform
```

### 5.2 Create terraform.tfvars File
```bash
cat > terraform.tfvars <<EOF
project_id = "$PROJECT_ID"
region     = "$REGION"
db_password = "$(openssl rand -base64 32)"
EOF
```

### 5.3 Initialize Terraform
```bash
terraform init
```

### 5.4 Format Terraform Files
```bash
terraform fmt
```

### 5.5 Validate Configuration
```bash
terraform validate
```

### 5.6 Plan Infrastructure
```bash
terraform plan -out=tfplan
```

**Review the plan carefully!** This will create:
- VPC Network
- VPC Access Connector
- Memorystore Redis (5GB, Standard HA) - **⚠️ This costs ~$150/month**
- Cloud SQL PostgreSQL
- Artifact Registry
- Cloud Run service

### 5.7 Apply Infrastructure
```bash
terraform apply tfplan
```

**⏱️ This takes 10-15 minutes.** Redis and Cloud SQL take the longest.

### 5.8 Save Outputs
```bash
terraform output redis_host > ../redis_host.txt
terraform output db_connection_name > ../db_connection.txt
```

---

## 6. Set Up Secrets in Secret Manager

### 6.1 Create Redis URL Secret
```bash
REDIS_HOST=$(terraform output -raw redis_host)
echo "redis://${REDIS_HOST}:6379" | gcloud secrets create REDIS_URL \
  --data-file=- \
  --replication-policy="automatic"
```

### 6.2 Create Database URL Secret
```bash
DB_CONNECTION=$(terraform output -raw db_connection_name)
DB_PASSWORD=$(grep db_password terraform.tfvars | cut -d'"' -f2)
echo "postgresql://crowdflow_user:${DB_PASSWORD}@/crowdflow?host=/cloudsql/${DB_CONNECTION}" | \
  gcloud secrets create DATABASE_URL \
  --data-file=- \
  --replication-policy="automatic"
```

### 6.3 Create Gemini API Key Secret
```bash
# Get your Gemini API key from: https://aistudio.google.com/app/apikey
read -s GEMINI_KEY
echo $GEMINI_KEY | gcloud secrets create GEMINI_API_KEY \
  --data-file=- \
  --replication-policy="automatic"
```

### 6.4 Grant Service Account Access to Secrets
```bash
for SECRET in REDIS_URL DATABASE_URL GEMINI_API_KEY; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:crowdflow-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

### 6.5 Verify Secrets
```bash
gcloud secrets list
```

---

## 7. Configure GitHub Actions

### 7.1 Add GitHub Secrets

Go to your GitHub repository:
1. Navigate to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following secret:

**Name:** `GCP_SA_KEY`  
**Value:** Paste the entire contents of `GCP_SA_KEY.json`

```bash
# Display the key to copy (on Windows)
cat GCP_SA_KEY.json
```

### 7.2 Verify Workflow File

Ensure `.github/workflows/deploy.yml` has the correct project ID and region:

```yaml
env:
  PROJECT_ID: prompt-wars-493611
  REGION: us-east1
  SERVICE_NAME: crowdflow-platform
  DOCKER_IMAGE: us-east1-docker.pkg.dev/prompt-wars-493611/crowdflow/platform
```

### 7.3 Update cloudrun.yaml

Ensure `cloudrun.yaml` references the correct VPC connector:

```yaml
annotations:
  run.googleapis.com/vpc-access-connector: crowdflow-connector
```

---

## 8. Test Docker Build Locally

### 8.1 Build Docker Image
```bash
cd ..  # Back to project root
docker build -t crowdflow-platform:test .
```

### 8.2 Test Container Locally
```bash
docker run -p 8080:8080 -e NODE_ENV=production crowdflow-platform:test
```

### 8.3 Verify in Browser
Open: http://localhost:8080

Press `Ctrl+C` to stop the container.

---

## 9. Deploy to Cloud Run

### 9.1 Option A: Deploy via GitHub Actions (Recommended)

```bash
git add .
git commit -m "feat: add GCP infrastructure and deployment config"
git push origin main
```

Monitor the deployment:
1. Go to your GitHub repository
2. Click **Actions** tab
3. Watch the workflow run

### 9.2 Option B: Manual Deployment

```bash
# Build and push image
gcloud builds submit --tag us-east1-docker.pkg.dev/$PROJECT_ID/crowdflow/platform:latest

# Deploy to Cloud Run
gcloud run services replace cloudrun.yaml --region=$REGION
```

---

## 10. Verify Deployment

### 10.1 Get Service URL
```bash
gcloud run services describe crowdflow-platform \
  --region=$REGION \
  --format='value(status.url)'
```

### 10.2 Test the Endpoint
```bash
SERVICE_URL=$(gcloud run services describe crowdflow-platform --region=$REGION --format='value(status.url)')
curl $SERVICE_URL
```

### 10.3 Check Logs
```bash
gcloud run services logs read crowdflow-platform --region=$REGION --limit=50
```

### 10.4 Verify VPC Connectivity

Test Redis connection from Cloud Run:
```bash
gcloud run services update crowdflow-platform \
  --region=$REGION \
  --set-env-vars="TEST_REDIS=true"
```

Check logs for Redis connection success.

---

## Troubleshooting

### Issue: Terraform Apply Fails

**Error:** "API not enabled"
```bash
# Re-run API enablement
gcloud services enable redis.googleapis.com sqladmin.googleapis.com
```

**Error:** "Quota exceeded"
- Check your GCP quotas: https://console.cloud.google.com/iam-admin/quotas
- Request quota increase if needed

### Issue: Cloud Run Can't Connect to Redis

**Check VPC Connector:**
```bash
gcloud compute networks vpc-access connectors describe crowdflow-connector \
  --region=$REGION
```

**Verify Redis is accessible:**
```bash
gcloud redis instances describe crowdflow-cache --region=$REGION
```

### Issue: GitHub Actions Deployment Fails

**Check service account permissions:**
```bash
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com"
```

### Issue: Secrets Not Accessible

**Grant access again:**
```bash
gcloud secrets add-iam-policy-binding REDIS_URL \
  --member="serviceAccount:crowdflow-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## Cost Estimation

**Monthly costs (approximate):**
- Cloud Run: $0-50 (depends on traffic)
- Memorystore Redis (5GB Standard HA): ~$150
- Cloud SQL (db-f1-micro): ~$10
- VPC Access Connector: ~$10
- Artifact Registry: ~$0.10
- **Total: ~$170-220/month**

**Cost Optimization Tips:**
- Use Redis Basic tier for development ($30/month instead of $150)
- Scale down Cloud SQL to shared-core for testing
- Set Cloud Run min instances to 0 outside event hours

---

## Next Steps

After infrastructure is deployed:

1. ✅ **Task 3.1-3.4 Complete** - Infrastructure is live
2. ✅ **Task 4 Complete** - Verification done
3. ➡️ **Task 5** - Implement data storage and caching layer
4. ➡️ **Task 6** - Build IoT data ingestion

---

## Quick Reference Commands

```bash
# View all resources
gcloud run services list
gcloud redis instances list
gcloud sql instances list

# View logs
gcloud run services logs read crowdflow-platform --region=$REGION

# Update environment variables
gcloud run services update crowdflow-platform \
  --region=$REGION \
  --set-env-vars="KEY=value"

# Rollback deployment
gcloud run services update-traffic crowdflow-platform \
  --region=$REGION \
  --to-revisions=PREVIOUS_REVISION=100

# Delete everything (careful!)
terraform destroy
```

---

## Support Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Memorystore Redis Documentation](https://cloud.google.com/memorystore/docs/redis)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Terraform GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)

---

**🎉 Congratulations!** Your CrowdFlow infrastructure is now deployed on GCP.
