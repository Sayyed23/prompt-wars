#!/bin/bash

# CrowdFlow GCP Secrets Setup Script
# This script creates and configures all required secrets in Google Secret Manager
# Usage: ./scripts/create-secrets.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  CrowdFlow Secrets Configuration${NC}"
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

# Get project configuration
PROJECT_ID=$(gcloud config get-value project)
SERVICE_ACCOUNT_NAME="crowdflow-sa"

if [ -z "$PROJECT_ID" ]; then
    print_error "No project configured. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

print_info "Project: $PROJECT_ID"
echo ""

# Check if terraform outputs are available
if [ ! -d "infra/terraform" ]; then
    print_error "Terraform directory not found. Please run from project root."
    exit 1
fi

# Check if Terraform was run (via output availability)
print_info "Verifying Terraform deployment state..."
if ! (cd infra/terraform && terraform output -json >/dev/null 2>&1); then
    print_error "Terraform state not found or output not available."
    echo "Please run 'cd infra/terraform && terraform apply' first."
    exit 1
fi
print_status "Terraform output verified"

# Get Terraform outputs
print_info "Reading Terraform outputs..."
cd infra/terraform
REDIS_HOST=$(terraform output -raw redis_host 2>/dev/null || echo "")
DB_CONNECTION_NAME=$(terraform output -raw db_connection_name 2>/dev/null || echo "")
cd ../..

if [ -z "$REDIS_HOST" ] || [ -z "$DB_CONNECTION_NAME" ]; then
    print_error "Could not read Terraform outputs. Ensure infrastructure is deployed."
    exit 1
fi

print_status "Redis Host: $REDIS_HOST"
print_status "DB Connection: $DB_CONNECTION_NAME"
echo ""

# Prompt for database password
echo -e "${YELLOW}Enter the database password from terraform.tfvars:${NC}"
read -s DB_PASSWORD
echo ""

if [ -z "$DB_PASSWORD" ]; then
    print_error "Database password cannot be empty"
    exit 1
fi

# Prompt for Gemini API key
echo -e "${YELLOW}Enter your Gemini API key:${NC}"
echo -e "${BLUE}Get it from: https://makersuite.google.com/app/apikey${NC}"
read -s GEMINI_API_KEY
echo ""

if [ -z "$GEMINI_API_KEY" ]; then
    print_error "Gemini API key cannot be empty"
    exit 1
fi

# Create secrets
print_info "Creating secrets in Google Secret Manager..."
echo ""

# 1. Redis URL
print_info "Creating REDIS_URL secret..."
REDIS_URL="redis://$REDIS_HOST:6379"
CREATED_REDIS=false

if gcloud secrets describe REDIS_URL &> /dev/null; then
    print_warning "REDIS_URL secret already exists"
    echo -n "  Do you want to update it? (y/N): "
    read -r UPDATE_REDIS
    if [[ $UPDATE_REDIS =~ ^[Yy]$ ]]; then
        echo "$REDIS_URL" | gcloud secrets versions add REDIS_URL --data-file=-
        print_status "REDIS_URL secret updated"
        CREATED_REDIS=true
    else
        print_info "Skipping REDIS_URL"
    fi
else
    echo "$REDIS_URL" | gcloud secrets create REDIS_URL \
        --data-file=- \
        --replication-policy="automatic"
    print_status "REDIS_URL secret created"
    CREATED_REDIS=true
fi

# 2. Database URL
print_info "Creating DATABASE_URL secret..."
DATABASE_URL="postgresql://crowdflow_user:$DB_PASSWORD@localhost/crowdflow?host=/cloudsql/$DB_CONNECTION_NAME"
CREATED_DB=false

if gcloud secrets describe DATABASE_URL &> /dev/null; then
    print_warning "DATABASE_URL secret already exists"
    echo -n "  Do you want to update it? (y/N): "
    read -r UPDATE_DB
    if [[ $UPDATE_DB =~ ^[Yy]$ ]]; then
        echo "$DATABASE_URL" | gcloud secrets versions add DATABASE_URL --data-file=-
        print_status "DATABASE_URL secret updated"
        CREATED_DB=true
    else
        print_info "Skipping DATABASE_URL"
    fi
else
    echo "$DATABASE_URL" | gcloud secrets create DATABASE_URL \
        --data-file=- \
        --replication-policy="automatic"
    print_status "DATABASE_URL secret created"
    CREATED_DB=true
fi

# 3. Gemini API Key
print_info "Creating GEMINI_API_KEY secret..."
CREATED_GEMINI=false

if gcloud secrets describe GEMINI_API_KEY &> /dev/null; then
    print_warning "GEMINI_API_KEY secret already exists"
    echo -n "  Do you want to update it? (y/N): "
    read -r UPDATE_GEMINI
    if [[ $UPDATE_GEMINI =~ ^[Yy]$ ]]; then
        echo "$GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-
        print_status "GEMINI_API_KEY secret updated"
        CREATED_GEMINI=true
    else
        print_info "Skipping GEMINI_API_KEY"
    fi
else
    echo "$GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY \
        --data-file=- \
        --replication-policy="automatic"
    print_status "GEMINI_API_KEY secret created"
    CREATED_GEMINI=true
fi

echo ""

# Grant service account access to secrets
print_info "Granting service account access to secrets..."

SECRETS=("REDIS_URL" "DATABASE_URL" "GEMINI_API_KEY")

for SECRET in "${SECRETS[@]}"; do
    echo -n "  Granting access to $SECRET... "
    gcloud secrets add-iam-policy-binding $SECRET \
        --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
        --role="roles/secretmanager.secretAccessor" \
        --quiet > /dev/null
    echo "✓"
done

print_status "Service account access granted"
echo ""

# Verify secrets
print_info "Verifying secrets..."
gcloud secrets list

# Summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Secret Creation Summary${NC}"
echo -e "${GREEN}========================================${NC}\n"

if [ "$CREATED_REDIS" = true ]; then printf "  ${GREEN}✓${NC} REDIS_URL\n"; fi
if [ "$CREATED_DB" = true ]; then printf "  ${GREEN}✓${NC} DATABASE_URL\n"; fi
if [ "$CREATED_GEMINI" = true ]; then printf "  ${GREEN}✓${NC} GEMINI_API_KEY\n"; fi

echo -e "\n${BLUE}Note:${NC} The Cloud Run service will automatically use the 'latest' version of these secrets."
echo ""

print_info "Next steps:"
echo "  1. Verify secrets: gcloud secrets list"
echo "  2. Test secret access: gcloud secrets versions access latest --secret=REDIS_URL"
echo "  3. Deploy application: git push origin main"
echo ""

print_warning "Security reminder:"
echo "  - Never commit secrets to git"
echo "  - Rotate secrets regularly"
echo "  - Use least-privilege access"
echo ""
