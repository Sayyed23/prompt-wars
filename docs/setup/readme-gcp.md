# CrowdFlow GCP Infrastructure Setup

Complete documentation for deploying CrowdFlow platform on Google Cloud Platform.

## 📚 Documentation Overview

This repository contains comprehensive guides for setting up all Task 3 infrastructure components on GCP:

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[GCP_SETUP_GUIDE.md](GCP_SETUP_GUIDE.md)** | Detailed step-by-step guide | First-time setup, troubleshooting |
| **[GCP_SETUP_CHECKLIST.md](GCP_SETUP_CHECKLIST.md)** | Quick reference checklist | Track progress, verify completion |
| **[GCP_SETUP_FLOW.md](GCP_SETUP_FLOW.md)** | Visual diagrams & flows | Understand architecture |
| **[scripts/README.md](scripts/README.md)** | Automation scripts guide | Automated setup |

## 🚀 Quick Start (30 minutes)

### Prerequisites
- Google Cloud account with billing enabled
- `gcloud` CLI installed
- `terraform` CLI installed
- GitHub repository

### Automated Setup (Recommended)

**Linux/Mac:**
```bash
# 1. Initial setup
chmod +x scripts/gcp-setup.sh
./scripts/gcp-setup.sh

# 2. Deploy infrastructure
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform init
terraform apply

# 3. Configure secrets
cd ..
chmod +x scripts/create-secrets.sh
./scripts/create-secrets.sh

# 4. Add  # Copy JSON content to clipboard safely (Bash)
  cat gcp-sa-key.json | pbcopy # macOS
  # or use a text editor to copy content without printing to terminal history
# Copy and add to GitHub → Settings → Secrets → GCP_SA_KEY

# 5. Deploy
git push origin main
```

**Windows PowerShell:**
```powershell
# 1. Initial setup
.\scripts\gcp-setup.ps1

# 2. Deploy infrastructure
cd terraform
Copy-Item terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform init
terraform apply

# 3. Configure secrets
cd ..
.\scripts\create-secrets.ps1

# 4. Add  # Copy the JSON content to clipboard safely (PowerShell)
  Get-Content gcp-sa-key.json | Set-Clipboard
# Copy and add to GitHub → Settings → Secrets → GCP_SA_KEY

# 5. Deploy
git push origin main
```

## 📋 What Gets Created

### Google Cloud Resources

| Resource | Configuration | Purpose |
|----------|--------------|---------|
| **Cloud Run Service** | 2-100 instances, 2 vCPU, 2GB RAM | Application hosting |
| **Memorystore Redis** | 5GB Standard HA | Real-time data cache |
| **Cloud SQL PostgreSQL** | db-f1-micro | Time-series data buffer |
| **VPC Network** | Auto-subnet | Private networking |
| **VPC Access Connector** | 2-3 instances | Cloud Run to VPC |
| **Artifact Registry** | Docker format | Container images |
| **Service Account** | crowdflow-sa | Application identity |
| **Secret Manager** | 3 secrets | Credentials storage |

### Secrets Created

- `REDIS_URL` - Redis connection string
- `DATABASE_URL` - PostgreSQL connection string
- `GEMINI_API_KEY` - AI assistant API key

### IAM Roles Granted

- `roles/secretmanager.secretAccessor` - Access secrets
- `roles/cloudsql.client` - Connect to Cloud SQL
- `roles/redis.editor` - Manage Redis
- `roles/run.admin` - Deploy Cloud Run
- `roles/iam.serviceAccountUser` - Use service account
- `roles/artifactregistry.writer` - Push images

## 🎯 Setup Phases

### Phase 1: Initial Configuration (10 min)
- Authenticate with Google Cloud
- Enable required APIs
- Create service account
- Set up Artifact Registry

**Script:** `scripts/gcp-setup.sh` or `scripts/gcp-setup.ps1`

### Phase 2: Infrastructure Deployment (15 min)
- Deploy VPC and networking
- Create Redis instance
- Create Cloud SQL instance
- Configure Cloud Run service

**Tool:** Terraform (`terraform apply`)

### Phase 3: Secrets Configuration (5 min)
- Create Secret Manager secrets
- Configure database credentials
- Add Gemini API key
- Grant service account access

**Script:** `scripts/create-secrets.sh`

### Phase 4: CI/CD Setup (5 min)
- Add service account key to GitHub
- Verify workflow configuration
- Test deployment pipeline

**Manual:** GitHub UI

### Phase 5: Deployment & Verification (10 min)
- Push code to trigger deployment
- Monitor GitHub Actions
- Verify all resources
- Test application

**Command:** `git push origin main`

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Google Cloud Platform                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌─────────────────┐              │
│  │ Load Balancer│────────▶│   Cloud Run     │              │
│  │   (HTTPS)    │         │  (2-100 inst)   │              │
│  └──────────────┘         └────────┬────────┘              │
│                                     │                        │
│                          ┌──────────┴──────────┐            │
│                          │                     │            │
│                   ┌──────▼──────┐      ┌──────▼──────┐     │
│                   │   Redis     │      │  Cloud SQL  │     │
│                   │   (5GB HA)  │      │ (PostgreSQL)│     │
│                   └─────────────┘      └─────────────┘     │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Secret Manager                          │   │
│  │  • REDIS_URL  • DATABASE_URL  • GEMINI_API_KEY     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🔍 Verification Commands

After setup, verify everything is working:

```bash
# Check all resources
gcloud run services list --region=asia-south1
gcloud redis instances list --region=asia-south1
gcloud sql instances list
gcloud secrets list

# Get service URL
gcloud run services describe crowdflow-platform \
  --region=asia-south1 \
  --format="value(status.url)"

# Test application
curl $(gcloud run services describe crowdflow-platform \
  --region=asia-south1 \
  --format="value(status.url)")

# View logs
gcloud run services logs read crowdflow-platform \
  --region=asia-south1 \
  --limit=50
```

## 💰 Cost Estimation

| Resource | Monthly Cost |
|----------|-------------|
| Cloud Run (2-100 instances) | $50-500 |
| Memorystore Redis (5GB HA) | ~$200 |
| Cloud SQL PostgreSQL | ~$25 |
| VPC Access Connector | ~$20 |
| Artifact Registry | ~$5 |
| **Total** | **$300-750** |

**Cost Optimization Tips:**
- Set min instances to 0 during off-hours
- Use smaller Cloud SQL tier for development
- Enable autoscaling to match demand
- Monitor with billing alerts

## 🛠️ Troubleshooting

### Common Issues

**"API not enabled"**
```bash
gcloud services enable [service-name].googleapis.com
```

**"Permission denied"**
```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:crowdflow-sa@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/[required-role]"
```

**"Terraform apply fails"**
- Check `terraform.tfvars` is configured
- Ensure all APIs are enabled (wait 2-3 minutes)
- Run `terraform plan` for detailed errors

**"Cloud Run deployment fails"**
- Verify `GCP_SA_KEY` secret in GitHub
- Check GitHub Actions logs
- Ensure Docker image was pushed to Artifact Registry

**"Cannot connect to Redis/SQL"**
- Verify VPC connector exists and is active
- Check Cloud Run has VPC annotation in `cloudrun.yaml`
- Verify secrets are accessible

See **[GCP_SETUP_GUIDE.md](GCP_SETUP_GUIDE.md)** for detailed troubleshooting.

## 📖 Detailed Documentation

### For First-Time Setup
Start with **[GCP_SETUP_GUIDE.md](GCP_SETUP_GUIDE.md)** - comprehensive step-by-step instructions with explanations.

### For Quick Reference
Use **[GCP_SETUP_CHECKLIST.md](GCP_SETUP_CHECKLIST.md)** - checkbox-based progress tracking.

### For Visual Learners
See **[GCP_SETUP_FLOW.md](GCP_SETUP_FLOW.md)** - diagrams showing architecture and flows.

### For Automation
Check **[scripts/README.md](scripts/README.md)** - automated setup scripts documentation.

## 🔐 Security Best Practices

- ✅ Never commit `gcp-sa-key.json` to git (already in `.gitignore`)
- ✅ Store credentials in Secret Manager only
- ✅ Use least-privilege IAM roles
- ✅ Rotate service account keys every 90 days
- ✅ Enable VPC for private networking
- ✅ Use HTTPS for all connections
- ✅ Monitor access logs regularly

## 🎓 Learning Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Memorystore for Redis](https://cloud.google.com/memorystore/docs/redis)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Terraform Google Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [GitHub Actions for GCP](https://github.com/google-github-actions)

## 🧹 Cleanup

To remove all infrastructure (⚠️ **deletes all data**):

```bash
cd terraform
terraform destroy
```

Type `yes` when prompted.

## ✅ Success Criteria

Your setup is complete when:

- ✅ All scripts run without errors
- ✅ Terraform apply completes successfully
- ✅ All secrets are created in Secret Manager
- ✅ GitHub Actions workflow completes
- ✅ Cloud Run service is accessible via HTTPS
- ✅ Application loads without errors
- ✅ No errors in Cloud Run logs

## 📞 Support

- **Issues:** Check troubleshooting sections in guides
- **Questions:** Review detailed documentation
- **Updates:** See individual guide files

## 🚦 Next Steps

After completing infrastructure setup:

1. ✅ **Task 3.1-3.4 Complete** - Infrastructure deployed
2. ✅ **Task 4 Complete** - Verification done
3. ➡️ **Proceed to Task 5** - Implement data storage and caching layer
4. ➡️ **Proceed to Task 6** - Build IoT data ingestion

---

**Project:** CrowdFlow Platform  
**Last Updated:** April 2026  
**Version:** 1.0
