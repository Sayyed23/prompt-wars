# CrowdFlow Setup Scripts

Automated scripts to simplify Google Cloud Platform infrastructure setup.

## Available Scripts

### 1. `gcp-setup.sh` / `gcp-setup.ps1`

Automates initial GCP project configuration including:
- API enablement
- Service account creation
- IAM role assignment
- Artifact Registry setup
- Docker authentication

**Usage (Linux/Mac):**
```bash
chmod +x scripts/gcp-setup.sh
./scripts/gcp-setup.sh
```

**Usage (Windows PowerShell):**
```powershell
.\scripts\gcp-setup.ps1
```

**What it does:**
- ✓ Authenticates with Google Cloud
- ✓ Enables 9 required APIs
- ✓ Creates `crowdflow-sa` service account
- ✓ Grants 6 IAM roles
- ✓ Creates service account key (`gcp-sa-key.json`)
- ✓ Creates Artifact Registry repository
- ✓ Configures Docker authentication

**Time:** ~5 minutes

---

### 2. `create-secrets.sh`

Automates Secret Manager configuration using Terraform outputs.

**Usage:**
```bash
chmod +x scripts/create-secrets.sh
./scripts/create-secrets.sh
```

**Prerequisites:**
- Terraform infrastructure must be deployed (`terraform apply` completed)
- Database password from `terraform.tfvars`
- Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

**What it does:**
- ✓ Reads Terraform outputs (Redis host, DB connection)
- ✓ Creates `REDIS_URL` secret
- ✓ Creates `DATABASE_URL` secret
- ✓ Creates `GEMINI_API_KEY` secret
- ✓ Grants service account access to all secrets

**Time:** ~2 minutes

---

## Complete Setup Workflow

### Quick Start (Recommended)

```bash
# 1. Run initial setup
./scripts/gcp-setup.sh

# 2. Initialize Terraform
cd terraform
# Create terraform.tfvars with YOUR_PROJECT_ID and a SECURE_PASSWORD
cp terraform.tfvars.example terraform.tfvars 
# Edit terraform.tfvars
terraform init
terraform apply
cd ..

# 3. Configure secrets
./scripts/create-secrets.sh

# 4. Add service account key to GitHub Secrets
cat gcp-sa-key.json
# Copy output and add to GitHub → Settings → Secrets → GCP_SA_KEY

# 5. Deploy application
git push origin main
```

**Total Time:** ~30 minutes

---

### Manual Setup (Alternative)

If you prefer manual setup or need to troubleshoot, follow the detailed guide:
- See: `../GCP_SETUP_GUIDE.md`
- Checklist: `../GCP_SETUP_CHECKLIST.md`

---

## Script Requirements

### System Requirements

**Linux/Mac:**
- Bash shell
- `gcloud` CLI installed
- `terraform` CLI installed (for create-secrets.sh)

**Windows:**
- PowerShell 5.1 or higher
- `gcloud` CLI installed
- `terraform` CLI installed (for secrets script)

### Permissions Required

Your Google Cloud account needs:
- Project Owner or Editor role
- Ability to enable APIs
- Ability to create service accounts
- Ability to manage IAM policies

---

## Configuration

### Project Settings

Edit these variables in the scripts if needed:

**gcp-setup.sh / gcp-setup.ps1:**
```bash
# gcp-setup.sh defaults
PROJECT_ID="YOUR_PROJECT_ID"
REGION="asia-south1"
SERVICE_ACCOUNT_NAME="crowdflow-sa"
ARTIFACT_REPO="crowdflow"            # Artifact Registry repo name
```

### Terraform Variables

Create `terraform/terraform.tfvars`:
```hcl
project_id  = "prompt-wars-493611"
region      = "asia-south1"
db_password = "YOUR_SECURE_PASSWORD"
```

---

## Output Files

### gcp-setup.sh produces:

- `gcp-sa-key.json` - Service account key for GitHub Actions
  - **⚠️ Keep secure!** Never commit to git
  - Add to GitHub Secrets as `GCP_SA_KEY`
  - Already in `.gitignore`

### create-secrets.sh produces:

- No files (creates secrets in Google Secret Manager)
- Secrets created:
  - `REDIS_URL`
  - `DATABASE_URL`
  - `GEMINI_API_KEY`

---

## Verification Commands

After running scripts, verify setup:

```bash
# Check project configuration
gcloud config list

# Check enabled APIs
gcloud services list --enabled | grep -E "(run|artifact|redis|sql|secret)"

# Check service account
gcloud iam service-accounts list | grep crowdflow

# Check Artifact Registry
gcloud artifacts repositories list --location=asia-south1

# Check secrets
gcloud secrets list

# Check infrastructure (after terraform apply)
gcloud run services list --region=asia-south1
gcloud redis instances list --region=asia-south1
gcloud sql instances list
```

---

## Troubleshooting

### Script Fails: "gcloud: command not found"

**Solution:** Install gcloud CLI
- Linux/Mac: https://cloud.google.com/sdk/docs/install
- Windows: https://cloud.google.com/sdk/docs/install#windows

### Script Fails: "API not enabled"

**Solution:** Wait 2-3 minutes after enabling APIs
```bash
# Manually enable if needed
gcloud services enable [service-name].googleapis.com
```

### Script Fails: "Permission denied"

**Solution:** Ensure your account has sufficient permissions
```bash
# Check current account
gcloud auth list

# Check project permissions
gcloud projects get-iam-policy PROJECT_ID
```

### create-secrets.sh: "Terraform state not found"

**Solution:** Run terraform apply first
```bash
cd terraform
terraform init
terraform apply
cd ..
./scripts/create-secrets.sh
```

### Service Account Key Already Exists

**Solution:** Delete old key if you want to create new one
```bash
rm gcp-sa-key.json
./scripts/gcp-setup.sh
```

---

## Security Best Practices

### Service Account Key

- ✓ Never commit `gcp-sa-key.json` to git (already in `.gitignore`)
- ✓ Store securely in GitHub Secrets only
- ✓ Rotate keys regularly (every 90 days)
- ✓ Delete local copy after adding to GitHub

### Secrets Management

- ✓ Use Secret Manager for all sensitive data
- ✓ Never hardcode secrets in code
- ✓ Use least-privilege access (secretAccessor role only)
- ✓ Rotate secrets regularly

### Terraform State

- ✓ Never commit `terraform.tfvars` (already in `.gitignore`)
- ✓ Consider remote state backend for production
- ✓ Encrypt state files

---

## Script Maintenance

### Updating Scripts

When updating scripts, test in a separate project first:

```bash
# Create test project
gcloud projects create test-crowdflow-setup

# Test script
PROJECT_ID="test-crowdflow-setup" ./scripts/gcp-setup.sh

# Cleanup
gcloud projects delete test-crowdflow-setup
```

### Adding New APIs

Edit the `APIS` array in `gcp-setup.sh`:

```bash
APIS=(
    "run.googleapis.com"
    "your-new-api.googleapis.com"  # Add here
)
```

---

## Support

- **Detailed Guide:** `../GCP_SETUP_GUIDE.md`
- **Quick Checklist:** `../GCP_SETUP_CHECKLIST.md`
- **GCP Documentation:** https://cloud.google.com/docs
- **Terraform Docs:** https://registry.terraform.io/providers/hashicorp/google/latest/docs

---

**Last Updated:** April 2026
