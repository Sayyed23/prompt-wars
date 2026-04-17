# CrowdFlow GCP Setup Script (PowerShell)
# This script automates the initial setup of Google Cloud Platform infrastructure
# Usage: .\scripts\gcp-setup.ps1

$ErrorActionPreference = "Stop"

# Configuration
$PROJECT_ID = "prompt-wars-493611"
$REGION = "asia-south1"$SERVICE_ACCOUNT_NAME = "crowdflow-sa"
$ARTIFACT_REPO = "crowdflow"

Write-Host "========================================" -ForegroundColor Blue
Write-Host "  CrowdFlow GCP Infrastructure Setup" -ForegroundColor Blue
Write-Host "========================================`n" -ForegroundColor Blue

function Write-Status {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Blue
}

# Check if gcloud is installed
try {
    $null = Get-Command gcloud -ErrorAction Stop
    Write-Status "gcloud CLI found"
} catch {
    Write-Error "gcloud CLI is not installed. Please install it first:"
    Write-Host "https://cloud.google.com/sdk/docs/install"
    exit 1
}

# Authenticate
# Authenticate
Write-Info "Authenticating with Google Cloud..."
gcloud auth login
if ($LASTEXITCODE -ne 0) {
    Write-Error "Authentication failed"
    exit 1
}

# Set project
Write-Info "Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to set project"
    exit 1
}
gcloud config set compute/region $REGION

Write-Status "Project configured: $PROJECT_ID"
Write-Status "Region configured: $REGION"

# Enable APIs
Write-Info "Enabling required Google Cloud APIs (this may take 2-3 minutes)..."

$APIS = @(
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "compute.googleapis.com",
    "vpcaccess.googleapis.com",
    "redis.googleapis.com",
    "sqladmin.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudresourcemanager.googleapis.com"
)

foreach ($API in $APIS) {
    Write-Host "  Enabling $API... " -NoNewline
    gcloud services enable $API --quiet
    Write-Host "✓" -ForegroundColor Green
}Write-Status "All APIs enabled"

# Wait for APIs to propagate
Write-Info "Waiting 30 seconds for APIs to fully activate..."
Start-Sleep -Seconds 30

# Create Service Account
Write-Info "Creating service account: $SERVICE_ACCOUNT_NAME..."

$saEmail = "${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
$saExists = gcloud iam service-accounts describe $saEmail 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Warning "Service account already exists, skipping creation"
} else {
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME `
        --display-name="CrowdFlow Service Account" `
        --description="Service account for CrowdFlow Cloud Run application"
    Write-Status "Service account created"
}

# Grant IAM roles
Write-Info "Granting IAM roles to service account..."

$ROLES = @(
    "roles/secretmanager.secretAccessor",
    "roles/cloudsql.client",
    "roles/redis.editor",
    "roles/run.admin",
    "roles/iam.serviceAccountUser",
    "roles/artifactregistry.writer"
)

foreach ($ROLE in $ROLES) {
    Write-Host "  Granting $ROLE... " -NoNewline
    gcloud projects add-iam-policy-binding $PROJECT_ID `
        --member="serviceAccount:$saEmail" `
        --role="$ROLE" `
        --quiet | Out-Null
    Write-Host "✓" -ForegroundColor Green
}

Write-Status "IAM roles granted"

# Create service account key
Write-Info "Creating service account key for GitHub Actions..."

if (Test-Path "gcp-sa-key.json") {
    Write-Warning "Service account key already exists, skipping creation"
    Write-Warning "Delete gcp-sa-key.json if you want to create a new one"
} else {
    gcloud iam service-accounts keys create gcp-sa-key.json `
        --iam-account=$saEmail
    Write-Status "Service account key created: gcp-sa-key.json"
    Write-Warning "Keep this file secure! Add it to GitHub Secrets as GCP_SA_KEY"
}

# Create Artifact Registry
Write-Info "Creating Artifact Registry repository..."

$repoExists = gcloud artifacts repositories describe $ARTIFACT_REPO --location=$REGION 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Warning "Artifact Registry repository already exists, skipping creation"
} else {
    gcloud artifacts repositories create $ARTIFACT_REPO `
        --repository-format=docker `
        --location=$REGION `
        --description="Docker repository for CrowdFlow platform"
    Write-Status "Artifact Registry repository created"
}

# Configure Docker authentication
Write-Info "Configuring Docker authentication..."
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
Write-Status "Docker authentication configured"

# Summary
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Info "Next steps:"
Write-Host "  1. Review and update terraform\terraform.tfvars with your configuration"
Write-Host "  2. Run: cd terraform; terraform init; terraform apply"
Write-Host "  3. Create secrets (REDIS_URL, DATABASE_URL, GEMINI_API_KEY)"
Write-Host "  4. Add gcp-sa-key.json contents to GitHub Secrets as GCP_SA_KEY"
Write-Host ""
Write-Info "For detailed instructions, see: GCP_SETUP_GUIDE.md"
Write-Host ""

# Display important information
Write-Host "Important Information:" -ForegroundColor Blue
Write-Host "  Project ID: $PROJECT_ID"
Write-Host "  Region: $REGION"
Write-Host "  Service Account: $saEmail"
Write-Host "  Artifact Registry: ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}"
Write-Host "  Service Account Key: gcp-sa-key.json (keep secure!)"
Write-Host ""

Write-Warning "Remember to:"
Write-Host "  - Keep gcp-sa-key.json secure and never commit it to git"
Write-Host "  - Add gcp-sa-key.json to .gitignore"
Write-Host "  - Set up GitHub Secrets before pushing to main branch"
Write-Host ""
