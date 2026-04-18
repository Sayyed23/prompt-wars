# CrowdFlow GCP Setup Flow Diagram

Visual guide showing the complete setup process and resource relationships.

## Setup Process Flow

```mermaid
graph TD
    Start[Start Setup] --> Auth[Authenticate with gcloud]
    Auth --> EnableAPIs[Enable Required APIs]
    EnableAPIs --> CreateSA[Create Service Account]
    CreateSA --> GrantIAM[Grant IAM Roles]
    GrantIAM --> CreateKey[Create SA Key]
    CreateKey --> ArtifactReg[Create Artifact Registry]
    ArtifactReg --> TerraformInit[Terraform Init]
    TerraformInit --> TerraformApply[Terraform Apply]
    TerraformApply --> CreateSecrets[Create Secrets]
    CreateSecrets --> GitHubSecrets[Add Key to GitHub]
    GitHubSecrets --> Deploy[Push to Deploy]
    Deploy --> Verify[Verify Deployment]
    Verify --> Complete[Setup Complete ✓]

    style Start fill:#e1f5ff
    style Complete fill:#c8e6c9
    style TerraformApply fill:#fff9c4
    style Deploy fill:#fff9c4
```

## Infrastructure Architecture

```mermaid
graph TB
    subgraph "GitHub"
        Repo[Repository]
        Actions[GitHub Actions]
        Secrets[GitHub Secrets]
    end

    subgraph "Google Cloud Platform"
        subgraph "Networking"
            VPC[VPC Network]
            Connector[VPC Access Connector]
            LB[Load Balancer]
        end

        subgraph "Compute"
            CloudRun[Cloud Run Service<br/>2-100 instances<br/>2 vCPU, 2GB RAM]
        end

        subgraph "Data Layer"
            Redis[Memorystore Redis<br/>5GB Standard HA]
            CloudSQL[Cloud SQL PostgreSQL<br/>Time-series buffer]
        end

        subgraph "Storage & Registry"
            ArtifactReg[Artifact Registry<br/>Docker images]
            SecretMgr[Secret Manager<br/>API keys & credentials]
        end

        subgraph "IAM"
            SA[Service Account<br/>crowdflow-sa]
        end
    end

    subgraph "External Services"
        Gemini[Gemini API<br/>AI Assistant]
        IoT[IoT Simulator<br/>Crowd sensors]
    end

    subgraph "Clients"
        Mobile[Mobile App<br/>Attendees]
        Dashboard[Operations Dashboard<br/>Staff]
    end

    Repo --> Actions
    Actions --> Secrets
    Actions --> ArtifactReg
    ArtifactReg --> CloudRun
    CloudRun --> SA
    SA --> SecretMgr
    SA --> Redis
    SA --> CloudSQL
    CloudRun --> Connector
    Connector --> VPC
    VPC --> Redis
    VPC --> CloudSQL
    LB --> CloudRun
    CloudRun --> Gemini
    IoT --> CloudRun
    Mobile --> LB
    Dashboard --> LB

    style CloudRun fill:#4285f4,color:#fff
    style Redis fill:#dc4437,color:#fff
    style CloudSQL fill:#4285f4,color:#fff
    style Gemini fill:#fbbc04
```

## Resource Dependencies

```mermaid
graph LR
    subgraph "Phase 1: Foundation"
        APIs[Enabled APIs]
        SA[Service Account]
        IAM[IAM Roles]
        AR[Artifact Registry]
    end

    subgraph "Phase 2: Infrastructure"
        VPC[VPC Network]
        Connector[VPC Connector]
        Redis[Redis Instance]
        SQL[Cloud SQL]
        CloudRun[Cloud Run]
    end

    subgraph "Phase 3: Configuration"
        Secrets[Secret Manager]
        GitHub[GitHub Secrets]
    end

    APIs --> SA
    SA --> IAM
    IAM --> AR
    APIs --> VPC
    VPC --> Connector
    VPC --> Redis
    VPC --> SQL
    Connector --> CloudRun
    Redis --> Secrets
    SQL --> Secrets
    Secrets --> CloudRun
    IAM --> GitHub
    GitHub --> CloudRun

    style APIs fill:#e8f5e9
    style VPC fill:#fff3e0
    style Secrets fill:#f3e5f5
```

## Deployment Pipeline Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as GitHub
    participant Actions as GitHub Actions
    participant GCR as Artifact Registry
    participant CloudRun as Cloud Run
    participant Secrets as Secret Manager

    Dev->>Git: Push to main branch
    Git->>Actions: Trigger workflow
    Actions->>Actions: Run lint & tests
    Actions->>Actions: Build Docker image
    Actions->>GCR: Push image
    Actions->>Secrets: Fetch secrets
    Actions->>CloudRun: Deploy new revision
    CloudRun->>CloudRun: Health check
    CloudRun->>CloudRun: Route traffic
    CloudRun-->>Dev: Deployment complete
```

## Data Flow Architecture

```mermaid
graph LR
    subgraph "Data Sources"
        IoT[IoT Sensors<br/>10s updates]
        User[User Requests]
    end

    subgraph "API Layer"
        Ingest[/api/iot/ingest]
        Crowd[/api/crowd/density]
        Queue[/api/queues/predictions]
        Nav[/api/wayfinding/route]
        AI[/api/assistant/chat]
    end

    subgraph "Processing"
        Validate[Validation]
        Calculate[Calculations]
        GeminiAPI[Gemini API]
    end

    subgraph "Storage"
        RedisCache[(Redis Cache<br/>Hot data)]
        TimeSeries[(Cloud SQL<br/>5min buffer)]
    end

    subgraph "Clients"
        Mobile[Mobile App]
        Dash[Dashboard]
    end

    IoT --> Ingest
    Ingest --> Validate
    Validate --> RedisCache
    Validate --> TimeSeries
    
    User --> Crowd
    User --> Queue
    User --> Nav
    User --> AI
    
    Crowd --> RedisCache
    Queue --> Calculate
    Calculate --> RedisCache
    Nav --> Calculate
    AI --> GeminiAPI
    
    RedisCache --> Mobile
    RedisCache --> Dash
    TimeSeries --> Calculate

    style RedisCache fill:#dc4437,color:#fff
    style TimeSeries fill:#4285f4,color:#fff
    style GeminiAPI fill:#fbbc04
```

## Security & Access Flow

```mermaid
graph TB
    subgraph "Authentication"
        User[User/Service]
        GitHub[GitHub Actions]
    end

    subgraph "IAM"
        SA[Service Account<br/>crowdflow-sa]
    end

    subgraph "Permissions"
        SecretAccess[Secret Accessor]
        SQLClient[Cloud SQL Client]
        RedisEditor[Redis Editor]
        RunAdmin[Cloud Run Admin]
        ArtifactWriter[Artifact Writer]
    end

    subgraph "Resources"
        Secrets[Secret Manager]
        SQL[Cloud SQL]
        Redis[Redis]
        CloudRun[Cloud Run]
        Artifact[Artifact Registry]
    end

    GitHub --> SA
    SA --> SecretAccess
    SA --> SQLClient
    SA --> RedisEditor
    SA --> RunAdmin
    SA --> ArtifactWriter

    SecretAccess --> Secrets
    SQLClient --> SQL
    RedisEditor --> Redis
    RunAdmin --> CloudRun
    ArtifactWriter --> Artifact

    User --> CloudRun
    CloudRun --> SA

    style SA fill:#4285f4,color:#fff
    style Secrets fill:#f3e5f5
```

## Cost Breakdown

```mermaid
pie title Monthly Cost Distribution (~$300-750)
    "Cloud Run (2-100 instances)" : 50
    "Memorystore Redis (5GB HA)" : 30
    "Cloud SQL PostgreSQL" : 10
    "VPC Access Connector" : 5
    "Artifact Registry" : 3
    "Other (Networking, Secrets)" : 2
```

## Setup Timeline

```mermaid
gantt
    title CrowdFlow GCP Setup Timeline
    dateFormat YYYY-MM-DD
    axisFormat %Y-%m-%d

    section Phase 1
    Authenticate & Configure    :2026-04-17, 1d
    Enable APIs                 :2026-04-17, 1d
    Create Service Account      :2026-04-18, 1d
    Grant IAM Roles            :2026-04-18, 1d
    Create Artifact Registry   :2026-04-19, 1d

    section Phase 2
    Terraform Init             :2026-04-20, 1d
    Terraform Apply            :2026-04-20, 2d
    
    section Phase 3
    Create Secrets             :2026-04-22, 1d
    Configure GitHub           :2026-04-22, 1d
    
    section Phase 4
    Initial Deployment         :2026-04-23, 1d
    Verification              :2026-04-24, 1d
```

## Quick Navigation Guide

### 1. Initial Setup (0-10 min)
```bash
./scripts/gcp-setup.sh
```
**Creates:** Service account, IAM roles, Artifact Registry

### 2. Infrastructure (10-25 min)
```bash
cd terraform
terraform init
terraform apply
```
**Creates:** VPC, Redis, Cloud SQL, Cloud Run

### 3. Secrets (25-30 min)
```bash
./scripts/create-secrets.sh
```
**Creates:** REDIS_URL, DATABASE_URL, GEMINI_API_KEY

### 4. GitHub (30-32 min)
- Add `gcp-sa-key.json` to GitHub Secrets

### 5. Deploy (32-42 min)
```bash
git push origin main
```
**Triggers:** GitHub Actions → Build → Deploy

### 6. Verify (42-45 min)
```bash
gcloud run services describe crowdflow-platform --region=asia-south1
```

## Resource Naming Convention

| Resource Type | Name Pattern | Example |
|--------------|--------------|---------|
| Service Account | `{app}-sa` | `crowdflow-sa` |
| Cloud Run Service | `{app}-platform` | `crowdflow-platform` |
| Redis Instance | `{app}-cache` | `crowdflow-cache` |
| Cloud SQL Instance | `{app}-db-instance` | `crowdflow-db-instance` |
| VPC Network | `{app}-vpc` | `crowdflow-vpc` |
| VPC Connector | `{app}-connector` | `crowdflow-connector` |
| Artifact Registry | `{app}` | `crowdflow` |
| Secrets | `UPPER_SNAKE_CASE` | `REDIS_URL` |

## Health Check Flow

```mermaid
sequenceDiagram
    participant LB as Load Balancer
    participant CR as Cloud Run
    participant App as Next.js App
    participant Redis as Redis
    participant SQL as Cloud SQL

    LB->>CR: Health check request
    CR->>App: GET /
    App->>Redis: Check connection
    Redis-->>App: OK
    App->>SQL: Check connection
    SQL-->>App: OK
    App-->>CR: 200 OK
    CR-->>LB: Healthy
    
    Note over LB,SQL: Startup: 10s initial, 10s period<br/>Liveness: 30s period
```

## Troubleshooting Decision Tree

```mermaid
graph TD
    Start[Deployment Failed?]
    Start --> CheckLogs{Check Logs}
    CheckLogs --> APIError[API Error?]
    CheckLogs --> PermError[Permission Error?]
    CheckLogs --> ConnError[Connection Error?]
    
    APIError --> EnableAPI[Enable Required API]
    PermError --> GrantRole[Grant IAM Role]
    ConnError --> CheckVPC{VPC Connected?}
    
    CheckVPC --> NoVPC[Create VPC Connector]
    CheckVPC --> YesVPC[Check Secrets]
    
    EnableAPI --> Retry[Retry Deployment]
    GrantRole --> Retry
    NoVPC --> Retry
    YesVPC --> Retry
    
    Retry --> Success[Success ✓]
    
    style Start fill:#ffebee
    style Success fill:#c8e6c9
```

---

## Quick Reference Links

- **Setup Guide:** `GCP_SETUP_GUIDE.md`
- **Checklist:** `GCP_SETUP_CHECKLIST.md`
- **Scripts:** `scripts/README.md`
- **Terraform:** `terraform/main.tf`
- **GitHub Actions:** `.github/workflows/deploy.yml`

---

**Last Updated:** April 2026
