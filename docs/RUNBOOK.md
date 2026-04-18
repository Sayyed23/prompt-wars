# CrowdFlow Platform — Operations Runbook

## Table of Contents
1. [Monitoring Setup](#monitoring-setup)
2. [Incident Response](#incident-response)
3. [Troubleshooting](#troubleshooting)
4. [Scaling Configuration](#scaling-configuration)
5. [Backup & Recovery](#backup--recovery)
6. [Performance Tuning](#performance-tuning)

---

## Monitoring Setup

### Dashboards

Import the dashboard configuration from `monitoring/dashboards.json`:

```bash
gcloud monitoring dashboards create --config-from-file=monitoring/dashboards.json
```

**Key Metrics to Watch:**
| Metric | Healthy Range | Warning | Critical |
|--------|--------------|---------|----------|
| API P95 Latency | <500ms | >500ms | >1000ms |
| Error Rate | <1% | >3% | >5% |
| Instance Count | 2-20 | >50 | >80 |
| Redis Memory | <60% | >70% | >80% |
| DB Connections | <15 | >18 | >20 (max) |
| Cold Start Duration | <1s | >2s | >5s |

### Alerting Policies

Import alerting policies from `monitoring/alerting-policies.json`:

```bash
# Create each policy
gcloud alpha monitoring policies create --policy-from-file=monitoring/alerting-policies.json
```

### Notification Channels

Configure notification channels for alerts:

```bash
# Email
gcloud monitoring channels create --type=email --channel-labels=email_address=ops@company.com

# Slack (webhook)
gcloud monitoring channels create --type=slack --channel-labels=channel_name=crowdflow-alerts
```

---

## Incident Response

### Severity Levels

| Level | Response Time | Example |
|-------|--------------|---------|
| **P1 - Critical** | <15 min | Service outage, data loss, security breach |
| **P2 - High** | <30 min | Major feature broken, >5% error rate |
| **P3 - Medium** | <2 hours | Performance degradation, non-critical bugs |
| **P4 - Low** | Next business day | Minor UI issues, documentation gaps |

### Incident Workflow

1. **Detect**: Alert triggers via Cloud Monitoring
2. **Triage**: Check `/api/health` endpoint and Cloud Logging
3. **Mitigate**: Rollback if release-related; scale up if load-related
4. **Resolve**: Fix root cause, deploy fix, verify
5. **Post-mortem**: Document timeline, root cause, and preventive measures

### Common Incident Playbooks

#### High Error Rate (>5%)

```bash
# 1. Check error logs
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --project=prompt-wars-493611 --limit=50 --format=json

# 2. Check recent deployments
gcloud run revisions list --service=crowdflow-platform --region=asia-south1 --limit=5

# 3. Rollback if needed
gcloud run services update-traffic crowdflow-platform \
  --region=asia-south1 \
  --to-revisions=PREVIOUS_REVISION=100

# 4. Verify
curl -s https://crowdflow-platform-xxx.run.app/api/health
```

#### High Latency (P95 >1000ms)

```bash
# 1. Check Redis latency
gcloud redis instances describe crowdflow-redis --region=asia-south1 --format="value(host)"

# 2. Check DB connection pool
gcloud sql instances describe crowdflow-db --format="value(settings.databaseFlags)"

# 3. Check Cloud Trace for slow requests
gcloud traces list --project=prompt-wars-493611 --limit=10

# 4. Scale up if load-related
gcloud run services update crowdflow-platform \
  --region=asia-south1 \
  --min-instances=5
```

#### Redis Memory Exhaustion

```bash
# 1. Check current memory usage
gcloud redis instances describe crowdflow-redis --region=asia-south1

# 2. Flush expired keys
redis-cli -h REDIS_IP DBSIZE
redis-cli -h REDIS_IP INFO memory

# 3. Review TTL policies in src/lib/cache.ts

# 4. Scale Redis if persistent
gcloud redis instances update crowdflow-redis \
  --region=asia-south1 --size=10
```

---

## Troubleshooting

### Connection Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Redis connection refused | VPC connector misconfigured | Check `crowdflow-connector` status |
| DB connection timeout | Connection pool exhausted | Increase `POOL_CONFIG.postgres.maxConnections` |
| 502 Bad Gateway | Container crashed | Check container logs for OOM |
| SSE connections dropping | Request timeout too low | Increase Cloud Run timeout to 60s |

### Build Failures

```bash
# Check build logs
gcloud builds log LATEST_BUILD_ID

# Common fixes:
# - Clear Docker build cache: docker builder prune
# - Update lockfile: npm ci
# - Check Node.js version matches Dockerfile (20-alpine)
```

### Performance Degradation

1. Check Cloud Trace for latency breakdown
2. Review Redis hit rate (should be >80%)
3. Check PostgreSQL slow query log
4. Monitor Cloud Run CPU/memory utilization

---

## Scaling Configuration

### Event Hours (8am - 11pm)
```yaml
minScale: '2'
maxScale: '100'
containerConcurrency: 80
cpu: '2'
memory: '2Gi'
```

### Off-Hours (11pm - 8am)
```yaml
minScale: '0'    # Scale to zero
maxScale: '10'   # Lower max
```

### Cost Savings
- Scale-to-zero during off-hours saves ~$200/month
- CPU-only-during-request allocation reduces idle costs
- Cloud CDN reduces Cloud Run requests by ~60%

---

## Backup & Recovery

### Database Backups
- **Automated**: Cloud SQL daily backups, 7-day retention
- **On-demand**: `gcloud sql backups create --instance=crowdflow-db`
- **Restore**: `gcloud sql backups restore BACKUP_ID --restore-instance=crowdflow-db`

### Redis
- **HA**: Standard HA with automatic failover
- **No persistent backup needed** — Redis is a cache layer; data is regenerated from IoT sensors
- **Recovery**: Restart instance; caches rebuild within 30 seconds

### Revision Retention
- Cloud Run retains previous revisions for 24 hours
- Rollback possible to any retained revision

---

## Performance Tuning

### Redis
- **Hit rate target**: >80%
- **Recommended TTLs**: See `src/lib/cache.ts`
- **Max memory policy**: `allkeys-lru` (evict least recently used)

### PostgreSQL
- **Connection pooling**: 20 max per instance
- **Idle timeout**: 30 seconds
- **Query timeout**: 10 seconds

### Cloud Run
- **Concurrency**: 80 (balance between throughput and per-request latency)
- **CPU boost**: Enabled for <1s cold starts
- **Min instances**: 2 during event hours (avoid cold starts)

---

## Escalation Contacts

| Role | Contact | Availability |
|------|---------|-------------|
| On-Call Engineer | Slack: #crowdflow-oncall | 24/7 during events |
| Platform Lead | ops@company.com | Business hours |
| GCP Support | Cloud Console | 24/7 with Premium Support |
