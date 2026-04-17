# CrowdFlow GCP Setup Checklist

Quick reference checklist for setting up Google Cloud Platform infrastructure.

## Prerequisites ✓

- [ ] Google Cloud account with billing enabled
- [ ] `gcloud` CLI installed
- [ ] Terraform installed
- [ ] GitHub repository created
- [ ] Project ID ready: `prompt-wars-493611`

---

## Phase 1: Initial Setup (15 minutes)

### Option A: Automated Setup (Recommended)

**For Linux/Mac:**
```bash
chmod +x scripts/gcp-setup.sh
./scripts/gcp-setup.sh
```

**For Windows:**
```powershell
.\scripts\gcp-setup.ps1
```

### Option B: Manual Setup

- [ ] Authenticate: `gcloud auth login`
- [ ] Set project: `gcloud config set project prompt-wars-493611`
- [ ] Set region: `gcloud config set compute/region asia-south1`
- [ ] Enable APIs (see GCP_SETUP_GUIDE.md section 2)
- [ ] Create service account
- [ ] Grant IAM roles
- [ ] Create service account key → `gcp-sa-key.json`
- [ ] Create Artifact Registry repository
- [ ] Configure Docker auth

**Verification:**
```bash
gcloud config list
gcloud services list --enabled | grep -E "(run|artifact|redis|sql)"
gcloud iam service-accounts list
gcloud artifacts repositories list --location=asia-south1
```

---

## Phase 2: Terraform Infrastructure (15-20 minutes)

- [ ] Navigate to terraform directory: `cd terraform`
- [ ] Create `terraform.tfvars`:
  ```hcl
  project_id  = "prompt-wars-493611"
  region      = "asia-south1"
  db_password = "YOUR_SECURE_PASSWORD_HERE"
  ```
- [ ] Initialize: `terraform init`
- [ ] Format: `terraform fmt`
- [ ] Validate: `terraform validate`
- [ ] Plan: `terraform plan`
- [ ] Apply: `terraform apply` (type `yes`)
- [ ] Save outputs:
  ```bash
  terraform output redis_host
  terraform output db_connection_name
  ```

**Verification:**
```bash
gcloud redis instances list --region=asia-south1
gcloud sql instances list
gcloud compute networks vpc-access connectors list --region=asia-south1
```

---

## Phase 3: Secrets Configuration (5 minutes)

### Option A: Automated Setup (Recommended)

```bash
chmod +x scripts/create-secrets.sh
./scripts/create-secrets.sh
```

### Option B: Manual Setup

- [ ] Get Gemini API key from: https://makersuite.google.com/app/apikey
- [ ] Create REDIS_URL secret:
  ```bash
  REDIS_HOST=$(cd terraform && terraform output -raw redis_host)
  echo "redis://$REDIS_HOST:6379" | gcloud secrets create REDIS_URL --data-file=- --replication-policy="automatic"
  ```
- [ ] Create DATABASE_URL secret:
  ```bash
  # WARNING: Replace YOUR_DB_PASSWORD with the actual password set in your terraform.tfvars
  DB_CONNECTION_NAME=$(cd terraform && terraform output -raw db_connection_name)
  DB_PASSWORD="YOUR_DB_PASSWORD" # MUST match terraform.tfvars
  echo "postgresql://crowdflow_user:$DB_PASSWORD@localhost/crowdflow?host=/cloudsql/$DB_CONNECTION_NAME" | gcloud secrets create DATABASE_URL --data-file=- --replication-policy="automatic"
  ```
- [ ] Create GEMINI_API_KEY secret:
  ```bash
  echo "YOUR_GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=- --replication-policy="automatic"
  ```
- [ ] Grant service account access to secrets (see GCP_SETUP_GUIDE.md section 6.4)

**Verification:**
```bash
gcloud secrets list
gcloud secrets versions access latest --secret=REDIS_URL
```

---

## Phase 4: GitHub Actions Setup (5 minutes)

- [ ] Go to GitHub repository → Settings → Secrets and variables → Actions
- [ ] Click "New repository secret"
- [ ] Name: `GCP_SA_KEY`
- [ ] Value: Copy entire contents of `gcp-sa-key.json`
  ```bash
  cat gcp-sa-key.json  # Linux/Mac
  Get-Content gcp-sa-key.json  # Windows PowerShell
  ```
- [ ] Click "Add secret"
- [ ] Verify workflow file exists: `.github/workflows/deploy.yml`

**Verification:**
- [ ] Check secret is added in GitHub UI
- [ ] Review workflow file syntax

---

## Phase 5: Initial Deployment (10 minutes)

- [ ] Commit changes:
  ```bash
  git add .
  git commit -m "Initial GCP infrastructure setup"
  ```
- [ ] Push to trigger deployment:
  ```bash
  git push origin main
  ```
- [ ] Monitor deployment:
  - Go to GitHub → Actions tab
  - Watch workflow progress
  - Wait for all jobs to complete (green checkmarks)

**Verification:**
```bash
# Check Cloud Run service
gcloud run services list --region=asia-south1

# Get service URL
gcloud run services describe crowdflow-platform --region=asia-south1 --format="value(status.url)"

# Test endpoint
curl $(gcloud run services describe crowdflow-platform --region=asia-south1 --format="value(status.url)")

# View logs
gcloud run services logs read crowdflow-platform --region=asia-south1 --limit=50
```

---

## Phase 6: Final Verification (5 minutes)

### Check All Resources

- [ ] Cloud Run service is running
  ```bash
  gcloud run services describe crowdflow-platform --region=asia-south1
  ```
- [ ] Redis instance is ready
  ```bash
  gcloud redis instances describe crowdflow-cache --region=asia-south1
  ```
- [ ] Cloud SQL instance is running
  ```bash
  gcloud sql instances describe crowdflow-db-instance
  ```
- [ ] VPC connector is active
  ```bash
  gcloud compute networks vpc-access connectors describe crowdflow-connector --region=asia-south1
  ```
- [ ] Secrets are accessible
  ```bash
  gcloud secrets list
  ```
- [ ] Docker images are pushed
  ```bash
  gcloud artifacts docker images list asia-south1-docker.pkg.dev/prompt-wars-493611/crowdflow/platform
  ```

### Test Application

- [ ] Access service URL in browser
- [ ] Check application loads without errors
- [ ] Verify no 500 errors in logs

---

## Troubleshooting Quick Reference

### Common Issues

**API Not Enabled:**
```bash
gcloud services enable [service-name].googleapis.com
```

**Permission Denied:**
```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:crowdflow-sa@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/[required-role]"
```

**Terraform Apply Fails:**
- Check `terraform.tfvars` is configured
- Ensure all APIs are enabled
- Run `terraform plan` for detailed errors

**Cloud Run Deployment Fails:**
- Check GitHub Actions logs
- Verify `GCP_SA_KEY` secret is set
- Ensure Docker image was pushed

**Cannot Connect to Redis/SQL:**
- Verify VPC connector exists
- Check Cloud Run has VPC annotation
- Verify secrets are accessible

---

## Cost Monitoring

Set up billing alerts:
```bash
# View current costs
gcloud billing accounts list

# Set up budget alert (via Console)
# Navigation: Billing → Budgets & alerts → Create budget
```

**Estimated Monthly Cost:** $300-750/month

---

## Cleanup (When Needed)

**⚠️ WARNING: This will delete all data!**

```bash
cd terraform
terraform destroy
```

Type `yes` when prompted.

---

## Quick Commands Reference

```bash
# View all resources
gcloud run services list --region=asia-south1
gcloud redis instances list --region=asia-south1
gcloud sql instances list
gcloud secrets list

# View logs
gcloud run services logs read crowdflow-platform --region=asia-south1 --limit=50

# Update Cloud Run
gcloud run services update crowdflow-platform --region=asia-south1 --min-instances=2

# Rollback deployment
gcloud run revisions list --service=crowdflow-platform --region=asia-south1
gcloud run services update-traffic crowdflow-platform --region=asia-south1 --to-revisions=REVISION_NAME=100

# View service URL
gcloud run services describe crowdflow-platform --region=asia-south1 --format="value(status.url)"
```

---

## Success Criteria

✅ All checkboxes above are completed
✅ Cloud Run service is accessible via HTTPS
✅ No errors in Cloud Run logs
✅ GitHub Actions workflow completes successfully
✅ All infrastructure resources are running
✅ Secrets are configured and accessible

---

## Next Steps After Setup

1. ✅ Task 3.1-3.4 Complete - Infrastructure deployed
2. ✅ Task 4 Complete - Verification done
3. ➡️ **Proceed to Task 5** - Implement data storage and caching layer
4. ➡️ **Proceed to Task 6** - Build IoT data ingestion

---

**Need Help?**
- See detailed guide: `GCP_SETUP_GUIDE.md`
- Run automated scripts: `scripts/gcp-setup.sh` or `scripts/gcp-setup.ps1`
- Check troubleshooting section in guide

**Last Updated:** April 2026
