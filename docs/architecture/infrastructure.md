# CrowdFlow Platform — Infrastructure Guide

## Overview

CrowdFlow runs on Google Cloud Platform with the following core services:

```
┌─────────────────────────────────────────────────────┐
│                  Cloud Load Balancer                 │
│              (Global, HTTPS, Cloud CDN)             │
├──────────────┬──────────────┬───────────────────────┤
│  asia-south1 │  us-central1 │  europe-west1         │
│  Cloud Run   │  Cloud Run   │  Cloud Run            │
│  (Primary)   │  (Secondary) │  (Secondary)          │
└──────┬───────┴──────┬───────┴───────────┬───────────┘
       │              │                   │
  VPC Connector   VPC Connector      VPC Connector
       │              │                   │
  ┌────┴────┐    ┌────┴────┐        ┌────┴────┐
  │  Redis  │    │  Redis  │        │  Redis  │
  │  (HA)   │    │  (HA)   │        │  (HA)   │
  └─────────┘    └─────────┘        └─────────┘
       │
  ┌────┴────┐
  │Cloud SQL│
  │  (PG15) │
  └─────────┘
```

---

## Terraform Configuration

### Directory Structure
```
terraform/
├── main.tf              # All resources
├── variables.tf         # Variable definitions
├── terraform.tfstate    # State (migrate to GCS for production)
└── .terraform.lock.hcl  # Provider lock
```

### Getting Started

```bash
cd terraform

# Initialize Terraform
terraform init

# Review plan
terraform plan -var="project_id=prompt-wars-493611" -var="region=asia-south1"

# Apply changes
terraform apply -var="project_id=prompt-wars-493611" -var="region=asia-south1"
```

### State Management

For production, migrate state to a remote GCS backend:

```hcl
terraform {
  backend "gcs" {
    bucket = "crowdflow-tf-state"
    prefix = "terraform/state"
  }
}
```

```bash
# Create state bucket
gsutil mb -l asia-south1 gs://crowdflow-tf-state
gsutil versioning set on gs://crowdflow-tf-state
```

---

## VPC Network

### Configuration
| Setting | Value |
|---------|-------|
| Network | `default` |
| Connector | `crowdflow-connector` |
| CIDR | `10.8.0.0/28` |
| Min Instances | 2 |
| Max Instances | 3 |
| Machine Type | `e2-micro` |

### Private Service Access
All Cloud SQL and Memorystore Redis instances use private IPs only. No public IPs are assigned.

```bash
# Verify VPC connector
gcloud compute networks vpc-access connectors describe crowdflow-connector \
  --region=asia-south1

# Test connectivity from Cloud Run
# (deploy a test container that pings Redis)
```

---

## Memorystore Redis

### Configuration
| Setting | Value |
|---------|-------|
| Instance ID | `crowdflow-redis` |
| Region | `asia-south1` |
| Tier | Standard (HA) |
| Memory | 5 GB |
| Version | Redis 7.0 |
| Maintenance | Sunday 02:00 UTC |
| Auth | Enabled |

### Manual Setup
See `REDIS_MANUAL_SETUP.md` for step-by-step CLI commands.

### Monitoring
- Memory usage: Target <80%
- Hit rate: Target >80%
- Connection count: Target <50 per instance

---

## Cloud SQL PostgreSQL

### Configuration
| Setting | Value |
|---------|-------|
| Instance ID | `crowdflow-db` |
| Region | `asia-south1` |
| Database Version | PostgreSQL 15 |
| Machine Type | `db-custom-2-7680` (2 vCPU, 7.5 GB) |
| Storage | 10 GB SSD, no auto-increase |
| IP | Private only |
| Backups | Daily, 7-day retention |
| HA | Regional (production) |

### Connection
```bash
# Via Cloud SQL Proxy (local development)
cloud-sql-proxy prompt-wars-493611:asia-south1:crowdflow-db

# Connection string format
postgresql://USER:PASSWORD@PRIVATE_IP:5432/crowdflow
```

---

## Cloud CDN & Load Balancer

### CDN Configuration
| Setting | Value |
|---------|-------|
| Cache Mode | `USE_ORIGIN_HEADERS` |
| Default TTL | 3600s (1 hour) |
| Max TTL | 86400s (24 hours) |
| Cache Key | Include host, path |
| Negative Caching | 5 minutes for 404 |

### Static Assets
- `/​_next/static/*` — Cache 1 year (`immutable`)
- `/api/*` — No cache or short SWR
- `/api/realtime/*` — No cache (SSE)

### SSL Certificates
Managed SSL certificates via Google-managed HTTPS. Auto-renewed, no manual intervention.

---

## Cost Estimates

### Monthly Cost Breakdown (Active Event Period)

| Service | Configuration | Est. Cost |
|---------|--------------|-----------|
| Cloud Run | 2-100 instances, 2 vCPU, 2 GiB | $200-400 |
| Memorystore Redis | 5 GB Standard HA | $150 |
| Cloud SQL | db-custom-2-7680, 10 GB | $100-150 |
| Cloud CDN | ~100 GB/month | $10-20 |
| Cloud Load Balancer | Global, 5 forwarding rules | $20-30 |
| Secret Manager | 5 secrets | $1 |
| Networking | VPC connector, egress | $20-50 |
| **Total** | | **$500-800** |

### Cost Optimization Tips
1. **Scale-to-zero off-hours**: Saves ~$200/month on Cloud Run
2. **Cloud CDN**: Reduces Cloud Run requests by ~60%
3. **CPU-only-during-request**: Pay only for active processing
4. **Fixed storage**: Disable auto-increase on Cloud SQL
5. **Right-size Redis**: 5 GB sufficient for current workload

### Budget Alerts
```bash
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT \
  --display-name="CrowdFlow Monthly Budget" \
  --budget-amount=800 \
  --threshold-rules=percent=80 \
  --threshold-rules=percent=100
```
