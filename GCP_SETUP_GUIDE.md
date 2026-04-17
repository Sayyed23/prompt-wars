# Google Cloud Platform Setup Guide for CrowdFlow

This guide walks you through setting up all infrastructure components for the CrowdFlow platform on Google Cloud Platform (Task 3 from the implementation plan).

## Prerequisites

- Google Cloud account with billing enabled
- `gcloud` CLI installed ([Install Guide](https://cloud.google.com/sdk/docs/install))
- Terraform installed ([Install Guide](https://developer.hashicorp.com/terraform/install))
- GitHub repository for the project
- Project ID: `prompt-wars-493611` (or replace with your project ID)

## Table of Contents

1. [Initial GCP Project Setup](#1-initial-gcp-project-setup)
2. [Enable Required APIs](#2-enable-required-apis)
3. [Create Service Account](#3-create-service-account)
4. [Set Up Artifact Registry](#4-set-up-artifact-registry)
5. [Deploy Infrastructure with Terraform](#5-deploy-infrastructure-with-terraform)
6. [Configure Secrets](#6-configure-secrets)
7. [Set Up GitHub Actions](#7-set-up-github-actions)
8. [Verify Deployment](#8-verify-deployment)

---

## 1. Initial GCP Project Setup

### 1.1 Authenticate with Google Cloud

```bash
gcloud auth login
```

This opens your browser for authentication.

### 1.2 Set Your Project

```bash
gcloud config set project prompt-wars-493611
```

Replace `prompt-wars-493611` with your actual project ID.

### 1.3 Verify Project Configuration

```bash
gcloud config list
```

You should see your project ID and default region.

### 1.4 Set Default Region

```bash
gcloud config set compute/region asia-south1
```

---

## 2. Enable Required APIs

Enable all necessary Google Cloud APIs for the project:

```bash
# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Artifact Registry API
gcloud services enable artifactregistry.googleapis.com

# Enable Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Enable Compute Engine API (for VPC)
gcloud services enable compute.googleapis.com

# Enable VPC Access API
gcloud services enable vpcaccess.googleapis.com

# Enable Redis (Memorystore) API
gcloud services enable redis.googleapis.com

# Enable Cloud SQL Admin API
gcloud services enable sqladmin.googleapis.com

# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Enable Cloud Resource Manager API
gcloud services enable cloudresourcemanager.googleapis.com
```

**Wait 2-3 minutes** for APIs to be fully enabled before proceeding.

### Verify APIs are Enabled

```bash
gcloud services list --enabled | grep -E "(run|artifact|redis|sql|secret)"
```

---

## 3. Create Service Account

### 3.1 Create Service Account for Cloud Run

### 3. Service Account (Least Privilege)

We recommend using **Workload Identity Federation** (WIF) for CI/CD. If you must use a JSON key, follow these steps:

1. Create a service account (SA) for the application:
   ```bash
   gcloud iam service-accounts create crowdflow-sa \
       --display-name="CrowdFlow Service Account"
   ```

2. Assign narrowed roles (Least Privilege):
   ```bash
   PROJECT_ID=$(gcloud config get-value project)
   
   # Required for Cloud Run to access secrets and DB
   gcloud projects add-iam-policy-binding $PROJECT_ID \
       --member="serviceAccount:crowdflow-sa@$PROJECT_ID.iam.gserviceaccount.com" \
       --role="roles/secretmanager.secretAccessor"
   
   gcloud projects add-iam-policy-binding $PROJECT_ID \
       --member="serviceAccount:crowdflow-sa@$PROJECT_ID.iam.gserviceaccount.com" \
       --role="roles/cloudsql.client"
       
   # Use viewer instead of editor for Redis if only monitoring/connecting
   gcloud projects add-iam-policy-binding $PROJECT_ID \
       --member="serviceAccount:crowdflow-sa@$PROJECT_ID.iam.gserviceaccount.com" \
       --role="roles/redis.viewer"
   ```

### 5.1 Workload Identity Federation (Recommended)

Avoid long-lived JSON keys by setting up WIF for GitHub Actions:

```bash
# Set up a Workload Identity Pool
gcloud iam workload-identity-pools create "github-pool" \
    --location="global" --display-name="GitHub Pool"

# Set up a Provider for GitHub
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
    --location="global" --workload-identity-pool="github-pool" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository"

# Allow GitHub to impersonate the Service Account
gcloud iam service-accounts add-iam-policy-binding "crowdflow-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --project=$PROJECT_ID \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/$(gcloud projects list --filter=$PROJECT_ID --format='value(projectNumber)')/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_REPO"
```

Replace `YOUR_GITHUB_REPO` with your repository (e.g., `username/repo`).

**⚠️ IMPORTANT:** Keep this file secure! You'll upload it to GitHub Secrets later.

### 3.4 Grant Additional Permissions for Deployment

```bash
# Grant Cloud Run Admin (for deployments)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:crowdflow-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# Grant Service Account User (to deploy as service account)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:crowdflow-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Grant Artifact Registry Writer (to push images)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:crowdflow-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

---

## 4. Set Up Artifact Registry

### 4.1 Create Docker Repository

```bash
gcloud artifacts repositories create crowdflow \
  --repository-format=docker \
  --location=asia-south1 \
  --description="Docker repository for CrowdFlow platform"
```

### 4.2 Configure Docker Authentication

```bash
gcloud auth configure-docker asia-south1-docker.pkg.dev
```

### 4.3 Verify Repository Creation

```bash
gcloud artifacts repositories list --location=asia-south1
```

You should see the `crowdflow` repository listed.

---

## 5. Deploy Infrastructure with Terraform

### 5.1 Navigate to Terraform Directory

```bash
cd terraform
```

### 8. Configure Terraform Variables

1. Create a `terraform.tfvars` file in the `terraform/` directory.
2. **IMPORTANT: Add `terraform/terraform.tfvars` to your `.gitignore` file now!**
3. Populate it with your project details and a **secure generated password**.

```bash
# Generate a secure password
openssl rand -base64 32
```

```hcl
# terraform/terraform.tfvars
project_id  = "your-project-id"
region      = "asia-south1"
db_password = "PASTE_THE_GENERATED_SECURE_PASSWORD_HERE"
```

### 5.3 Initialize Terraform

```bash
terraform init
```

This downloads the Google Cloud provider and initializes the backend.

### 5.4 Format Terraform Files

```bash
terraform fmt
```

### 5.5 Validate Configuration

```bash
terraform validate
```

You should see: `Success! The configuration is valid.`

### 5.6 Preview Infrastructure Changes

```bash
terraform plan
```

Review the resources that will be created:
- VPC Network
- VPC Access Connector
- Memorystore Redis (5GB, Standard HA)
- Cloud SQL PostgreSQL
- Artifact Registry
- Cloud Run Service

### 5.7 Apply Terraform Configuration

```bash
terraform apply
```

Type `yes` when prompted.

**⏱️ This will take 10-15 minutes** as it provisions:
- Redis instance (takes ~5-8 minutes)
- Cloud SQL instance (takes ~5-8 minutes)
- VPC and networking components

### 5.8 Save Terraform Outputs

```bash
terraform output
```

Save these values - you'll need them for secrets:
- `redis_host`: Redis instance IP address
- `db_connection_name`: Cloud SQL connection string

---

## 6. Configure Secrets

### 6.1 Create Secret for Redis URL

```bash
# Get Redis host from Terraform output
REDIS_HOST=$(terraform output -raw redis_host)

# Create Redis URL secret
echo "redis://$REDIS_HOST:6379" | gcloud secrets create REDIS_URL \
  --data-file=- \
  --replication-policy="automatic"
```

### 6.2 Create Secret for Database URL

```bash
# Get database connection details
DB_CONNECTION_NAME=$(terraform output -raw db_connection_name)
DB_PASSWORD="YOUR_DB_PASSWORD_FROM_TFVARS"

# Create Database URL secret
echo "postgresql://crowdflow_user:$DB_PASSWORD@localhost/crowdflow?host=/cloudsql/$DB_CONNECTION_NAME" | \
  gcloud secrets create DATABASE_URL \
  --data-file=- \
  --replication-policy="automatic"
```

### 6.3 Create Secret for Gemini API Key

```bash
# Replace with your actual Gemini API key
echo "YOUR_GEMINI_API_KEY_HERE" | gcloud secrets create GEMINI_API_KEY \
  --data-file=- \
  --replication-policy="automatic"
```

**📝 Note:** Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 6.4 Grant Service Account Access to Secrets

```bash
PROJECT_ID=$(gcloud config get-value project)

# Grant access to all secrets
for SECRET in REDIS_URL DATABASE_URL GEMINI_API_KEY; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:crowdflow-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

### 6.5 Verify Secrets

```bash
gcloud secrets list
```

You should see: `REDIS_URL`, `DATABASE_URL`, `GEMINI_API_KEY`

---

## 7. Set Up GitHub Actions

### 7.1 Navigate to GitHub Repository Settings

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**

### 7.2 Add GCP Service Account Key Secret

1. Click **New repository secret**
2. Name: `GCP_SA_KEY`
3. Value: Copy the entire contents of `gcp-sa-key.json` file
   ```bash
   cat gcp-sa-key.json
   ```
4. Click **Add secret**

### 7.3 Verify GitHub Actions Workflow

The workflow file `.github/workflows/deploy.yml` is already configured. It will:
1. Run on push to `main` branch
2. Lint and test the code
3. Build Docker image
4. Push to Artifact Registry
5. Deploy to Cloud Run

### 7.4 Test the Workflow

```bash
# Commit and push to trigger deployment
git add .
git commit -m "Initial infrastructure setup"
git push origin main
```

### 7.5 Monitor Deployment

1. Go to GitHub repository → **Actions** tab
2. Watch the workflow run
3. Deployment takes ~5-10 minutes

---

## 8. Verify Deployment

### 8.1 Check Cloud Run Service

```bash
gcloud run services list --region=asia-south1
```

You should see `crowdflow-platform` service.

### 8.2 Get Service URL

```bash
gcloud run services describe crowdflow-platform \
  --region=asia-south1 \
  --format="value(status.url)"
```

### 8.3 Test the Application

```bash
# Get the URL
SERVICE_URL=$(gcloud run services describe crowdflow-platform \
  --region=asia-south1 \
  --format="value(status.url)")

# Test the endpoint
curl $SERVICE_URL
```

### 8.4 View Logs

```bash
gcloud run services logs read crowdflow-platform \
  --region=asia-south1 \
  --limit=50
```

### 8.5 Check Resource Status

```bash
# Check Redis instance
gcloud redis instances list --region=asia-south1

# Check Cloud SQL instance
gcloud sql instances list

# Check VPC connector
gcloud compute networks vpc-access connectors list --region=asia-south1
```

---

## Quick Reference Commands

### View All Resources

```bash
# Cloud Run services
gcloud run services list --region=asia-south1

# Redis instances
gcloud redis instances list --region=asia-south1

# Cloud SQL instances
gcloud sql instances list

# Secrets
gcloud secrets list

# Artifact Registry repositories
gcloud artifacts repositories list --location=asia-south1
```

### Update Cloud Run Service

```bash
gcloud run services update crowdflow-platform \
  --region=asia-south1 \
  --min-instances=2 \
  --max-instances=100
```

### View Service Details

```bash
gcloud run services describe crowdflow-platform \
  --region=asia-south1
```

### Rollback Deployment

```bash
# List revisions
gcloud run revisions list --service=crowdflow-platform --region=asia-south1

# Rollback to previous revision
gcloud run services update-traffic crowdflow-platform \
  --region=asia-south1 \
  --to-revisions=REVISION_NAME=100
```

---

## Troubleshooting

### Issue: API Not Enabled

**Error:** `API [service] is not enabled for project [project-id]`

**Solution:**
```bash
gcloud services enable [service-name].googleapis.com
```

### Issue: Permission Denied

**Error:** `Permission denied` or `403 Forbidden`

**Solution:** Grant required IAM roles:
```bash
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:crowdflow-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/[required-role]"
```

### Issue: Terraform Apply Fails

**Solution:**
1. Check `terraform.tfvars` is properly configured
2. Ensure all APIs are enabled
3. Run `terraform plan` to see detailed errors
4. Check quota limits in GCP Console

### Issue: Cloud Run Deployment Fails

**Solution:**
1. Check GitHub Actions logs for errors
2. Verify `GCP_SA_KEY` secret is correctly set
3. Ensure Docker image was pushed successfully:
   ```bash
   gcloud artifacts docker images list asia-south1-docker.pkg.dev/$PROJECT_ID/crowdflow/platform
   ```

### Issue: Cannot Connect to Redis/SQL

**Solution:**
1. Verify VPC connector is created:
   ```bash
   gcloud compute networks vpc-access connectors list --region=asia-south1
   ```
2. Check Cloud Run service has VPC connector annotation in `cloudrun.yaml`
3. Verify secrets are accessible:
   ```bash
   gcloud secrets versions access latest --secret=REDIS_URL
   ```

---

## Cost Estimation

Approximate monthly costs (asia-south1 region):

| Resource | Configuration | Estimated Cost |
|----------|--------------|----------------|
| Cloud Run | 2-100 instances, 2 vCPU, 2GB RAM | $50-500/month |
| Memorystore Redis | 5GB Standard HA | ~$200/month |
| Cloud SQL PostgreSQL | db-f1-micro | ~$25/month |
| VPC Access Connector | 2-3 instances | ~$20/month |
| Artifact Registry | Storage + egress | ~$5/month |
| **Total** | | **~$300-750/month** |

**💡 Tip:** Use `gcloud billing` commands to monitor actual costs.

---

## Next Steps

After completing this setup:

1. ✅ **Task 3.1-3.4 Complete** - Infrastructure is deployed
2. ✅ **Task 4 Complete** - Verification done
3. ➡️ **Proceed to Task 5** - Implement data storage and caching layer
4. ➡️ **Proceed to Task 6** - Build IoT data ingestion

---

## Cleanup (When Needed)

To destroy all infrastructure:

```bash
cd terraform
terraform destroy
```

Type `yes` when prompted.

**⚠️ WARNING:** This will delete all data and resources!

---

## Support Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Memorystore for Redis Documentation](https://cloud.google.com/memorystore/docs/redis)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Terraform Google Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [GitHub Actions for GCP](https://github.com/google-github-actions)

---

**Last Updated:** April 2026
**Version:** 1.0
