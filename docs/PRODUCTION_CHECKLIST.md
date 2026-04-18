# CrowdFlow Platform — Production Readiness Checklist

## Functional Requirements

- [ ] **Crowd Density (Req 1)**: Heatmap displays with 4 density levels (low/moderate/high/critical)
- [ ] **Queue Predictions (Req 2)**: Predictions show with confidence levels per facility
- [ ] **Wayfinding (Req 3)**: Routes avoid high-density zones, turn-by-turn instructions
- [ ] **AI Assistant (Req 4)**: Responds within 3 seconds, validates PII in messages
- [ ] **Real-Time Updates (Req 5)**: SSE connections deliver updates within 30 seconds
- [ ] **Alert System (Req 6)**: Create, assign, acknowledge, and resolve alerts
- [ ] **Responsive UI (Req 7)**: Works on mobile (320px) through desktop (1920px+)
- [ ] **Accessibility (Req 8)**: ARIA labels, keyboard nav, screen reader compatible, WCAG AA contrast

## Performance Benchmarks

- [ ] **API Response Time**: P95 <500ms for all endpoints
- [ ] **Page Load Time**: Initial load <2 seconds
- [ ] **Concurrent Users**: 10,000 simultaneous attendees
- [ ] **SSE Update Latency**: <30 seconds for density updates
- [ ] **Cold Start**: <1 second with CPU boost enabled
- [ ] **Cache Hit Rate**: >80% for density and prediction data

## Security & Privacy

- [ ] **No PII Storage**: No names, emails, or phone numbers stored anywhere
- [ ] **HTTPS Enforcement**: HTTP→HTTPS redirect in production
- [ ] **Security Headers**: HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- [ ] **Rate Limiting**: All endpoints protected (100/min attendee, 1000/min IoT, 10/min AI)
- [ ] **Anonymous Sessions**: JWT tokens with 4-hour expiry, no PII
- [ ] **API Key Auth**: IoT endpoints require valid X-API-Key header
- [ ] **Container Security**: Non-root user, vulnerability scanning enabled
- [ ] **Network Security**: VPC connector, private IPs for databases
- [ ] **Secret Management**: All credentials in GCP Secret Manager
- [ ] **Input Validation**: XSS, SQL injection, PII pattern detection

## Infrastructure

- [ ] **Cloud Run**: Multi-region deployment (asia-south1, us-central1, europe-west1)
- [ ] **Load Balancer**: Global with automatic failover and health checks
- [ ] **Cloud CDN**: Edge caching for static assets
- [ ] **Memorystore Redis**: 5 GB Standard HA, Redis 7.0
- [ ] **Cloud SQL**: PostgreSQL 15, private IP, automated backups
- [ ] **Terraform**: All infrastructure defined as code

## Monitoring & Observability

- [ ] **Structured Logging**: JSON format with severity, trace IDs, sampling
- [ ] **Health Check**: `/api/health` returns Redis + DB connectivity status
- [ ] **Dashboards**: API latency, error rates, instance count, Redis/SQL metrics
- [ ] **Alerting**: Error rate >5%, P95 >1000ms, Redis >80%, DB connections >90%
- [ ] **Tracing**: Distributed tracing with Cloud Trace (10% sampling)

## Testing

- [ ] **Unit Tests**: All core modules (density, queue, alerts, navigation, IoT)
- [ ] **Property Tests**: 15+ properties covering data invariants
- [ ] **E2E Tests**: Heatmap, navigation, AI assistant, alerts, IoT recovery, deployment
- [ ] **Security Tests**: PII detection, session tokens, headers, rate limiting
- [ ] **Performance Tests**: Cache TTLs, connection pools, SSR verification

## Documentation

- [ ] **DEPLOYMENT.md**: Environment variables, deployment procedures, rollback
- [ ] **RUNBOOK.md**: Monitoring, incident response, troubleshooting
- [ ] **INFRASTRUCTURE.md**: Terraform, VPC, Redis, PostgreSQL, CDN, costs
- [ ] **README_GCP_SETUP.md**: Quick start guide
- [ ] **PRODUCTION_CHECKLIST.md**: This document

## Final Sign-Off

| Area | Reviewer | Date | Status |
|------|----------|------|--------|
| Functional | | | Pending |
| Performance | | | Pending |
| Security | | | Pending |
| Infrastructure | | | Pending |
| Documentation | | | Pending |
