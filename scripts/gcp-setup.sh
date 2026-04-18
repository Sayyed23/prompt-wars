#!/bin/bash

# CrowdFlow GCP Setup Script
# This script automates the initial setup of Google Cloud Platform infrastructure
# Usage: ./scripts/gcp-setup.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="prompt-wars-493611"
REGION="asia-south1"
SERVICE_ACCOUNT_NAME="crowdflow-sa"
ARTIFACT_REPO="crowdflow"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  CrowdFlow GCP Infrastructure Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to print status messages
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it first:"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

print_status "gcloud CLI found"

# Authenticate
print_info "Authenticating with Google Cloud..."
gcloud auth login

# Set project
print_info "Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID
gcloud config set compute/region $REGION

print_status "Project configured: $PROJECT_ID"
print_status "Region configured: $REGION"

# Enable APIs
print_info "Enabling required Google Cloud APIs (this may take 2-3 minutes)..."

APIS=(
    "run.googleapis.com"
    "artifactregistry.googleapis.com"
    "cloudbuild.googleapis.com"
    "compute.googleapis.com"
    "vpcaccess.googleapis.com"
    "redis.googleapis.com"
    "sqladmin.googleapis.com"
    "secretmanager.googleapis.com"
    "cloudresourcemanager.googleapis.com"
)

for API in "${APIS[@]}"; do
    echo -n "  Enabling $API... "
    gcloud services enable $API --quiet
    echo "✓"
done

print_status "All APIs enabled"

# Wait for APIs to propagate
print_info "Waiting 30 seconds for APIs to fully activate..."
sleep 30

# Create Service Account
print_info "Creating service account: $SERVICE_ACCOUNT_NAME..."

if gcloud iam service-accounts describe ${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com &> /dev/null; then
    print_warning "Service account already exists, skipping creation"
else
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --display-name="CrowdFlow Service Account" \
        --description="Service account for CrowdFlow Cloud Run application"
    print_status "Service account created"
fi

# Grant IAM roles
print_info "Granting IAM roles to service account..."

ROLES=(
    "roles/secretmanager.secretAccessor"
    "roles/cloudsql.client"
    "roles/redis.viewer"
    "roles/run.developer"
    "roles/artifactregistry.writer"
)

for ROLE in "${ROLES[@]}"; do
    echo -n "  Granting $ROLE... "
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
        --role="$ROLE" \
        --quiet > /dev/null
    echo "✓"
done

# Provision roles/iam.serviceAccountUser at the resource level (Least Privilege)
echo -n "  Granting roles/iam.serviceAccountUser on SA... "
gcloud iam service-accounts add-iam-policy-binding \
    ${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com \
    --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser" \
    --quiet > /dev/null
echo "✓"

print_status "IAM roles granted"

# Create service account key (Optional, recommend WIF)
print_info "Checking for service account key..."
print_warning "Consider using Workload Identity Federation instead of JSON keys for production."

if [ -f ".secrets/gcp-sa-key.json" ]; then
    print_warning "Service account key already exists: .secrets/gcp-sa-key.json"
else
    # Create key with restricted permissions
    gcloud iam service-accounts keys create .secrets/gcp-sa-key.json \
        --iam-account=${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com
    chmod 600 .secrets/gcp-sa-key.json
    print_status "Service account key created: .secrets/gcp-sa-key.json"
    
    # Check if .gitignore exists and contains the secrets folder
    if [ -f ".gitignore" ] && ! grep -q ".secrets/" ".gitignore"; then
        echo ".secrets/" >> .gitignore
        print_status "Added .secrets/ to .gitignore"
    fi
fi

# Create Artifact Registry
print_info "Creating Artifact Registry repository..."

if gcloud artifacts repositories describe $ARTIFACT_REPO --location=$REGION &> /dev/null; then
    print_warning "Artifact Registry repository already exists, skipping creation"
else
    gcloud artifacts repositories create $ARTIFACT_REPO \
        --repository-format=docker \
        --location=$REGION \
        --description="Docker repository for CrowdFlow platform"
    print_status "Artifact Registry repository created"
fi

# Configure Docker authentication
print_info "Configuring Docker authentication..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet
print_status "Docker authentication configured"

# Summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}\n"

print_info "Next steps:"
echo "  1. Review and update infra/terraform/terraform.tfvars with your configuration"
echo "  2. Run: cd infra/terraform && terraform init && terraform apply"
echo "  3. Create secrets (REDIS_URL, DATABASE_URL, GEMINI_API_KEY)"
echo "  4. Add .secrets/gcp-sa-key.json contents to GitHub Secrets as GCP_SA_KEY"
echo ""
print_info "For detailed instructions, see: docs/setup/gcp-setup.md"
echo ""

# Display important information
echo -e "${BLUE}Important Information:${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Service Account: ${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
echo "  Artifact Registry: ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}"
echo "  Service Account Key: .secrets/gcp-sa-key.json (keep secure!)"
echo ""

print_warning "Remember to:"
echo "  - Keep .secrets/gcp-sa-key.json secure and never commit it to git"
echo "  - Ensure .secrets/ is in .gitignore"
echo "  - Set up GitHub Secrets before pushing to main branch"
echo ""
