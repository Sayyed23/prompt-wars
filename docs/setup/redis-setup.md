# Manual Redis Setup Guide for CrowdFlow

Complete guide for manually creating and configuring Google Cloud Memorystore Redis instance for the CrowdFlow platform.

## Overview

This guide walks you through manually setting up a Redis instance on Google Cloud Memorystore without using Terraform. Use this if you prefer manual configuration or need to troubleshoot automated deployments.

## Prerequisites

- Google Cloud account with billing enabled
- `gcloud` CLI installed and authenticated
- Project ID: `prompt-wars-493611` (or your project ID)
- Existing VPC network (or we'll create one)

## Table of Contents

1. [Enable Required APIs](#1-enable-required-apis)
2. [Create VPC Network](#2-create-vpc-network)
3. [Create Redis Instance](#3-create-redis-instance)
4. [Configure VPC Access Connector](#4-configure-vpc-access-connector)
5. [Create Secret for Redis URL](#5-create-secret-for-redis-url)
6. [Grant Service Account Access](#6-grant-service-account-access)
7. [Verify Connection](#7-verify-connection)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Enable Required APIs

First, enable the necessary Google Cloud APIs:

```bash
# Set your project
gcloud config set project prompt-wars-493611

# Enable Redis (Memorystore) API
gcloud services enable redis.googleapis.com

# Enable Compute Engine API (for VPC)
gcloud services enable compute.googleapis.com

# Enable VPC Access API (for Cloud Run connectivity)
gcloud services enable vpcaccess.googleapis.com

# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com
```

**Wait 2-3 minutes** for APIs to be fully enabled.

### Verify APIs are Enabled

```bash
gcloud services list --enabled | grep -E "(redis|compute|vpcaccess|secretmanager)"
```

---

## 2. Create VPC Network

Redis requires a VPC network for private connectivity.

### Option A: Use Default VPC (Recommended for Testing)

```bash
# Check if default VPC exists
gcloud compute networks list
```

If you see a `default` network, you can use it. Skip to Step 3.

### Option B: Create Custom VPC (Recommended for Production)

```bash
# Create VPC network
gcloud compute networks create crowdflow-vpc \
  --subnet-mode=auto \
  --bgp-routing-mode=regional \
  --description="VPC network for CrowdFlow platform"

# Verify network creation
gcloud compute networks describe crowdflow-vpc
```

### Create Firewall Rules (if using custom VPC)

```bash
# Allow internal traffic
gcloud compute firewall-rules create crowdflow-allow-internal \
  --network=crowdflow-vpc \
  --allow=tcp,udp,icmp \
  --source-ranges=10.128.0.0/9 \
  --description="Allow internal traffic within VPC"

# Allow Redis port (6379) from VPC
gcloud compute firewall-rules create crowdflow-allow-redis \
  --network=crowdflow-vpc \
  --allow=tcp:6379 \
  --source-ranges=10.128.0.0/9 \
  --description="Allow Redis connections within VPC"
```

---

## 3. Create Redis Instance

Now create the Memorystore Redis instance.

### 3.1 Basic Redis Instance (Standard Tier, 5GB)

```bash
gcloud redis instances create crowdflow-redis \
  --size=5 \
  --region=asia-south1 \
  --tier=STANDARD_HA \
  --redis-version=redis_7_0 \
  --network=default \
  --display-name="CrowdFlow Redis Cache"
```

**Configuration Details:**
- **Name:** `crowdflow-redis`
- **Size:** 5GB (adjust based on your needs)
- **Tier:** `STANDARD_HA` (High Availability with automatic failover)
- **Version:** Redis 7.0
- **Network:** `default` (or `crowdflow-vpc` if you created custom VPC)
- **Region:** `asia-south1`

**⏱️ This takes 5-8 minutes to complete.**

### 3.2 Alternative: Basic Tier (Lower Cost, No HA)

For development/testing, you can use Basic tier:

```bash
gcloud redis instances create crowdflow-redis \
  --size=1 \
  --region=asia-south1 \
  --tier=BASIC \
  --redis-version=redis_7_0 \
  --network=default \
  --display-name="CrowdFlow Redis Cache (Dev)"
```

**Cost Comparison:**
- **BASIC (1GB):** ~$40/month
- **STANDARD_HA (5GB):** ~$200/month

### 3.3 Monitor Creation Progress

```bash
# Check instance status
gcloud redis instances describe crowdflow-redis \
  --region=asia-south1

# List all Redis instances
gcloud redis instances list --region=asia-south1
```

Wait until `state: READY` appears.

### 3.4 Get Redis Connection Details

```bash
# Get Redis host IP
gcloud redis instances describe crowdflow-redis \
  --region=asia-south1 \
  --format="value(host)"

# Get Redis port (default: 6379)
gcloud redis instances describe crowdflow-redis \
  --region=asia-south1 \
  --format="value(port)"

# Save these values - you'll need them later
REDIS_HOST=$(gcloud redis instances describe crowdflow-redis \
  --region=asia-south1 \
  --format="value(host)")

REDIS_PORT=$(gcloud redis instances describe crowdflow-redis \
  --region=asia-south1 \
  --format="value(port)")

echo "Redis URL: redis://$REDIS_HOST:$REDIS_PORT"
```

---

## 4. Configure VPC Access Connector

Cloud Run needs a VPC Access Connector to communicate with Redis in the VPC.

### 4.1 Create VPC Access Connector

```bash
gcloud compute networks vpc-access connectors create crowdflow-connector \
  --region=asia-south1 \
  --network=default \
  --range=10.8.0.0/28 \
  --min-instances=2 \
  --max-instances=3 \
  --machine-type=e2-micro
```

**Configuration Details:**
- **Name:** `crowdflow-connector`
- **Network:** `default` (or `crowdflow-vpc`)
- **IP Range:** `10.8.0.0/28` (16 IPs, adjust if conflicts exist)
- **Instances:** 2-3 (auto-scales based on traffic)
- **Machine Type:** `e2-micro` (sufficient for most workloads)

**⏱️ This takes 2-3 minutes to complete.**

### 4.2 Verify Connector Creation

```bash
gcloud compute networks vpc-access connectors describe crowdflow-connector \
  --region=asia-south1
```

Wait until `state: READY` appears.

### 4.3 List All Connectors

```bash
gcloud compute networks vpc-access connectors list --region=asia-south1
```

---

## 5. Create Secret for Redis URL

Store the Redis connection string in Secret Manager.

### 5.1 Create Redis URL Secret

```bash
# Get Redis host (if not already saved)
REDIS_HOST=$(gcloud redis instances describe crowdflow-redis \
  --region=asia-south1 \
  --format="value(host)")

REDIS_PORT=$(gcloud redis instances describe crowdflow-redis \
  --region=asia-south1 \
  --format="value(port)")

# Create secret
echo "redis://$REDIS_HOST:$REDIS_PORT" | gcloud secrets create REDIS_URL \
  --data-file=- \
  --replication-policy="automatic"
```

### 5.2 Verify Secret Creation

```bash
gcloud secrets list | grep REDIS_URL

# View secret value (for verification)
gcloud secrets versions access latest --secret=REDIS_URL
```

---

## 6. Grant Service Account Access

Grant your Cloud Run service account access to the Redis secret.

### 6.1 Get Service Account Email

```bash
PROJECT_ID=$(gcloud config get-value project)
SERVICE_ACCOUNT="crowdflow-sa@$PROJECT_ID.iam.gserviceaccount.com"

echo "Service Account: $SERVICE_ACCOUNT"
```

### 6.2 Grant Secret Access

```bash
gcloud secrets add-iam-policy-binding REDIS_URL \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"
```

### 6.3 Grant Redis Editor Role (Optional)

If your application needs to manage Redis instances:

```bash
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/redis.editor"
```

### 6.4 Verify Permissions

```bash
gcloud secrets get-iam-policy REDIS_URL
```

You should see your service account listed with `secretAccessor` role.

---

## 7. Verify Connection

Test the Redis connection from Cloud Run.

5. **Install Redis Client Library**
   Ensure the `redis` package is installed in your project:
   ```bash
   npm install redis
   ```

6. **Deploy the updated configuration** to Cloud Run.

### 7.1 Update Cloud Run Service

Add VPC connector to your Cloud Run service:

```bash
gcloud run services update crowdflow-platform \
  --region=asia-south1 \
  --vpc-connector=crowdflow-connector \
  --vpc-egress=private-ranges-only
```

**VPC Egress Options:**
- `private-ranges-only`: Route only private IPs through VPC (recommended)
- `all-traffic`: Route all traffic through VPC (higher cost)

### 7.2 Verify Cloud Run Configuration

```bash
gcloud run services describe crowdflow-platform \
  --region=asia-south1 \
  --format="value(spec.template.spec.containers[0].env)"
```

### 7.3 Test Redis Connection

Deploy a test endpoint in your application:

```typescript
// Add to your Next.js API route (e.g., pages/api/test-redis.ts)
import { createClient } from 'redis';

export default async function handler(req, res) {
  const redisUrl = process.env.REDIS_URL;
  
  try {
    const client = createClient({ url: redisUrl });
    await client.connect();
    
    await client.set('test-key', 'Hello from CrowdFlow!');
    const value = await client.get('test-key');
    
    await client.disconnect();
    
    res.status(200).json({ 
      success: true, 
      message: 'Redis connection successful',
      value 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
```

Then test:

```bash
SERVICE_URL=$(gcloud run services describe crowdflow-platform \
  --region=asia-south1 \
  --format="value(status.url)")

curl $SERVICE_URL/api/test-redis
```

---

## 8. Troubleshooting

### Issue: Redis Instance Creation Fails

**Error:** `Insufficient quota` or `Resource exhausted`

**Solution:**
1. Check your project quotas:
   ```bash
   gcloud compute project-info describe --project=$PROJECT_ID
   ```
2. Request quota increase in GCP Console → IAM & Admin → Quotas
3. Try a smaller instance size (1GB instead of 5GB)

### Issue: Cannot Connect to Redis from Cloud Run

**Error:** `Connection timeout` or `ECONNREFUSED`

**Solution:**
1. Verify VPC connector is attached to Cloud Run:
   ```bash
   gcloud run services describe crowdflow-platform \
     --region=asia-south1 \
     --format="value(spec.template.metadata.annotations)"
   ```
2. Check Redis and Cloud Run are in the same VPC network
3. Verify firewall rules allow traffic on port 6379
4. Ensure VPC connector is in `READY` state

### Issue: Permission Denied Accessing Secret

**Error:** `Permission denied` when accessing `REDIS_URL`

**Solution:**
```bash
#   # First, ensure the service account exists
   gcloud iam service-accounts create crowdflow-sa \
       --display-name="CrowdFlow Service Account" || true

   # Grant the necessary role
   gcloud projects add-iam-policy-binding $PROJECT_ID \
       --member="serviceAccount:crowdflow-sa@$PROJECT_ID.iam.gserviceaccount.com" \
       --role="roles/redis.viewer" --quietmanager.secretAccessor"
```

### Issue: VPC Connector IP Range Conflicts

**Error:** `IP range conflicts with existing subnet`

**Solution:**
Try a different IP range:
```bash
# Delete existing connector
gcloud compute networks vpc-access connectors delete crowdflow-connector \
  --region=asia-south1

# Create with different range
gcloud compute networks vpc-access connectors create crowdflow-connector \
  --region=asia-south1 \
  --network=default \
  --range=10.9.0.0/28
```

### Issue: Redis Instance is Slow or Unresponsive

**Solution:**
1. Check Redis metrics in GCP Console
2. Verify you're not hitting memory limits
3. Consider upgrading to larger instance:
   ```bash
   gcloud redis instances update crowdflow-redis \
     --region=asia-south1 \
     --size=10
   ```

---

## Configuration Summary

After completing this guide, you should have:

| Resource | Name | Configuration |
|----------|------|---------------|
| **Redis Instance** | `crowdflow-redis` | 5GB, Standard HA, Redis 7.0 |
| **VPC Network** | `default` or `crowdflow-vpc` | Auto-subnet mode |
| **VPC Connector** | `crowdflow-connector` | 2-3 instances, e2-micro |
| **Secret** | `REDIS_URL` | `redis://[HOST]:6379` |
| **Firewall Rules** | `crowdflow-allow-redis` | Allow TCP 6379 |

---

## Quick Reference Commands

### View Redis Instance Details

```bash
gcloud redis instances describe crowdflow-redis --region=asia-south1
```

### Update Redis Instance Size

```bash
gcloud redis instances update crowdflow-redis \
  --region=asia-south1 \
  --size=10
```

### Delete Redis Instance

```bash
gcloud redis instances delete crowdflow-redis --region=asia-south1
```

### View VPC Connector Status

```bash
gcloud compute networks vpc-access connectors describe crowdflow-connector \
  --region=asia-south1
```

### Update Cloud Run VPC Configuration

```bash
gcloud run services update crowdflow-platform \
  --region=asia-south1 \
  --vpc-connector=crowdflow-connector
```

---

## Cost Optimization Tips

1. **Use Basic Tier for Development:**
   ```bash
   gcloud redis instances create crowdflow-redis-dev \
     --size=1 \
     --tier=BASIC \
     --region=asia-south1
   ```

2. **Schedule Downtime for Non-Production:**
   - Delete dev instances when not in use
   - Recreate when needed (data will be lost)

3. **Monitor Usage:**
   ```bash
   gcloud redis instances describe crowdflow-redis \
     --region=asia-south1 \
     --format="value(currentLocationId,memorySizeGb,persistenceIamIdentity)"
   ```

4. **Right-Size Your Instance:**
   - Start with 1GB and scale up based on actual usage
   - Monitor memory usage in GCP Console

---

## Next Steps

After completing Redis setup:

1. ✅ **Redis Instance Created** - Memorystore Redis is running
2. ✅ **VPC Connectivity Configured** - Cloud Run can access Redis
3. ✅ **Secrets Configured** - Connection string stored securely
4. ➡️ **Update Application Code** - Implement Redis caching layer
5. ➡️ **Test Performance** - Verify caching improves response times

---

## Related Documentation

- [GCP_SETUP_GUIDE.md](GCP_SETUP_GUIDE.md) - Complete infrastructure setup
- [README_GCP_SETUP.md](README_GCP_SETUP.md) - Quick start guide
- [Memorystore Redis Documentation](https://cloud.google.com/memorystore/docs/redis)
- [VPC Access Connector Documentation](https://cloud.google.com/vpc/docs/configure-serverless-vpc-access)

---

**Last Updated:** April 2026  
**Version:** 1.0
