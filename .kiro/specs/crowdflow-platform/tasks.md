# Implementation Plan: CrowdFlow Platform

## Overview

This implementation plan builds a real-time crowd management platform using Next.js 14, deployed on Google Cloud Run, with Gemini AI integration. The system provides attendee mobile apps and operations dashboards for venue staff, processing IoT sensor data to deliver crowd density visualization, queue predictions, smart wayfinding, and AI assistance. Implementation follows an incremental approach: infrastructure setup, core data models, API endpoints, UI components, real-time features, and deployment configuration.

## Tasks

- [ ] 1. Project setup and infrastructure foundation
  - Initialize Next.js 14 project with TypeScript and App Router
  - Configure project structure: `/app`, `/components`, `/lib`, `/types`
  - Set up ESLint, Prettier, and TypeScript strict mode
  - Install core dependencies: React, Next.js 14, TypeScript
  - Create `.env.local` template with required environment variables
  - _Requirements: 13.1, 13.3, 13.4, 13.5_

- [ ] 2. Define core data models and TypeScript interfaces
  - [ ] 2.1 Create type definitions for venue and crowd data
    - Define `VenueZone`, `Coordinates`, `Polygon`, `ZoneType` interfaces
    - Define `DensitySnapshot`, `ZoneDensity`, `DensityLevel`, `Trend` types
    - Implement density level calculation logic (low: 0-40%, moderate: 41-70%, high: 71-90%, critical: 91-100%)
    - _Requirements: 1.3, 11.1_

  - [ ]* 2.2 Write property test for density level calculation
    - **Property 1: Density Level Color Mapping**
    - **Validates: Requirements 1.1, 1.3**

  - [ ] 2.3 Create queue prediction and route data models
    - Define `QueuePrediction`, `ConfidenceLevel`, `Facility` interfaces
    - Define `Route`, `Waypoint` interfaces for navigation
    - _Requirements: 2.1, 2.4, 3.1, 3.4, 3.5_

  - [ ]* 2.4 Write property test for queue prediction format
    - **Property 7: Whole Number Wait Time Format**
    - **Validates: Requirements 2.4**

  - [ ] 2.5 Create alert and notification data models
    - Define `Alert`, `AlertPriority`, `AlertType`, `AlertStatus` interfaces
    - Define `NotificationPreferences`, `NotificationType` interfaces
    - Define `ChatSession`, `ChatMessage` interfaces
    - _Requirements: 6.1, 6.2, 12.1, 12.2, 4.1_

- [ ] 3. Set up Google Cloud infrastructure and configuration
  - [ ] 3.1 Create Dockerfile for Cloud Run deployment
    - Implement multi-stage build with Node.js 20 Alpine base
    - Configure Next.js standalone output mode
    - Set up non-root user and port 8080 configuration
    - _Requirements: 10.1_

  - [ ] 3.2 Create Cloud Run service configuration
    - Define `cloudrun.yaml` with scaling parameters (min: 2, max: 100, concurrency: 80)
    - Configure resource limits (2 vCPU, 2 GiB memory)
    - Set up environment variables and secret references
    - _Requirements: 10.1, 10.3_

  - [ ] 3.3 Set up Terraform infrastructure as code
    - Create Terraform configuration for Cloud Run service
    - Define VPC Access Connector for Memorystore Redis
    - Configure Memorystore Redis instance (5 GB, Standard HA)
    - Set up Cloud SQL PostgreSQL instance for time-series data
    - Configure Cloud CDN and Load Balancer
    - _Requirements: 10.1, 10.5_

  - [ ] 3.4 Create GitHub Actions CI/CD pipeline
    - Implement `.github/workflows/deploy.yml` for automated deployment
    - Configure Docker build and push to Google Container Registry
    - Set up Cloud Run deployment with health checks
    - Implement smoke tests and rollback capability
    - _Requirements: 10.2, 10.4_

  - [ ]* 3.5 Write property test for deployment timing
    - **Property 36: Automated Deployment Timing**
    - **Validates: Requirements 10.2**

- [ ] 4. Checkpoint - Verify infrastructure setup
  - Ensure Docker build succeeds locally
  - Verify Terraform configuration is valid
  - Confirm GitHub Actions workflow syntax is correct
  - Ask the user if questions arise

- [ ] 5. Implement data storage and caching layer
  - [ ] 5.1 Set up Redis client for Memorystore connection
    - Create Redis client configuration with connection pooling
    - Implement helper functions for cache operations (get, set, delete with TTL)
    - _Requirements: 11.5_

  - [ ] 5.2 Create data buffer service for time-series storage
    - Implement Cloud SQL or Firestore client for 5-minute rolling window
    - Create functions to append density data and query historical trends
    - Implement automatic data purging for entries older than 5 minutes
    - _Requirements: 11.5_

  - [ ]* 5.3 Write property test for data buffer retention
    - **Property 42: Five-Minute Data Buffer**
    - **Validates: Requirements 11.5**

  - [ ] 5.4 Implement session data management
    - Create client-side session storage utilities for chat and preferences
    - Implement session cleanup logic with 1-hour TTL
    - _Requirements: 9.4, 4.5_

  - [ ]* 5.5 Write property test for session data cleanup
    - **Property 34: Session Data Cleanup Timing**
    - **Validates: Requirements 9.4**

- [ ] 6. Build IoT data ingestion and validation
  - [ ] 6.1 Create IoT data validation functions
    - Implement `validateIoTData` with timestamp, zone ID, and occupancy checks
    - Add validation for occupancy within capacity limits (0 to 120% of capacity)
    - _Requirements: 11.1, 11.4_

  - [ ]* 6.2 Write property test for IoT data validation
    - **Property 38: IoT Data JSON Format**
    - **Property 41: Invalid IoT Data Handling**
    - **Validates: Requirements 11.1, 11.4**

  - [ ] 6.3 Implement IoT data ingestion API endpoint
    - Create `POST /api/iot/ingest` route handler
    - Process incoming sensor data, validate, and update Redis cache
    - Append to time-series buffer and broadcast updates via SSE
    - Log errors for invalid data and continue with previous valid data
    - _Requirements: 11.2, 11.3, 11.4_

  - [ ]* 6.4 Write property test for IoT processing timing
    - **Property 39: IoT Data Processing Timing**
    - **Validates: Requirements 11.2**

  - [ ]* 6.5 Write property test for IoT throughput
    - **Property 40: IoT Data Update Throughput**
    - **Validates: Requirements 11.3**

- [ ] 7. Implement crowd density APIs
  - [ ] 7.1 Create crowd density snapshot API
    - Implement `GET /api/crowd/density` endpoint
    - Fetch current density data from Redis cache
    - Return formatted `DensitySnapshot` with <200ms response time
    - Configure cache headers (stale-while-revalidate, 10s TTL)
    - _Requirements: 1.1, 1.2, 5.2_

  - [ ]* 7.2 Write property test for API response timing
    - **Property 17: API Response Time Constraint**
    - **Validates: Requirements 5.2**

  - [ ] 7.3 Create zone-specific density API
    - Implement `GET /api/crowd/density/:zoneId` endpoint
    - Return current density plus 5-minute historical data
    - _Requirements: 1.2, 11.5_

  - [ ]* 7.4 Write property test for crowd data refresh timing
    - **Property 2: Crowd Data Refresh Timing**
    - **Validates: Requirements 1.2**

- [ ] 8. Build queue prediction system
  - [ ] 8.1 Implement queue prediction algorithm
    - Create prediction calculation based on current density and historical patterns
    - Calculate confidence level based on sample count (high: >100, medium: 50-100, low: 10-49, insufficient: <10)
    - Round wait times to whole numbers (ceiling)
    - _Requirements: 2.1, 2.4, 2.5_

  - [ ] 8.2 Create queue predictions API
    - Implement `GET /api/queues/predictions` endpoint
    - Support filtering by facility type (food_stall, entry_gate)
    - Recalculate predictions when density data updates
    - _Requirements: 2.1, 2.2_

  - [ ]* 8.3 Write property test for prediction completeness
    - **Property 5: Complete Queue Predictions**
    - **Validates: Requirements 2.1**

  - [ ]* 8.4 Write property test for prediction recalculation timing
    - **Property 6: Queue Prediction Recalculation Timing**
    - **Validates: Requirements 2.2**

  - [ ] 8.5 Create facility-specific prediction API
    - Implement `GET /api/queues/predictions/:facilityId` endpoint
    - Return prediction with confidence metrics
    - _Requirements: 2.1, 2.5_

- [ ] 9. Checkpoint - Verify data flow and APIs
  - Test IoT data ingestion with sample data
  - Verify crowd density APIs return correct data
  - Confirm queue predictions calculate properly
  - Ensure all tests pass, ask the user if questions arise

- [ ] 10. Implement wayfinding and navigation system
  - [ ] 10.1 Create route optimization algorithm
    - Implement pathfinding algorithm (A* or Dijkstra) with crowd density weighting
    - Prioritize routes through low/moderate density zones
    - Calculate estimated travel time based on crowd conditions
    - Generate turn-by-turn waypoint instructions
    - _Requirements: 3.1, 3.2, 3.5_

  - [ ]* 10.2 Write property test for route generation timing
    - **Property 8: Route Generation Timing**
    - **Validates: Requirements 3.1**

  - [ ]* 10.3 Write property test for low density prioritization
    - **Property 9: Low Density Route Prioritization**
    - **Validates: Requirements 3.2**

  - [ ] 10.4 Create wayfinding API endpoint
    - Implement `POST /api/wayfinding/route` endpoint
    - Accept origin, destination, and preferences
    - Return optimized `Route` object within 2 seconds
    - _Requirements: 3.1, 3.4_

  - [ ] 10.5 Implement route recalculation logic
    - Create `GET /api/wayfinding/recalculate/:routeId` endpoint
    - Monitor waypoint zone density changes >20%
    - Trigger recalculation and return updated route
    - _Requirements: 3.3_

  - [ ]* 10.6 Write property test for route recalculation trigger
    - **Property 10: Route Recalculation on Density Change**
    - **Validates: Requirements 3.3**

  - [ ]* 10.7 Write property test for route completeness
    - **Property 11: Route Visual Display Completeness**
    - **Property 12: Route Travel Time Calculation**
    - **Validates: Requirements 3.4, 3.5**

- [ ] 11. Integrate Gemini AI assistant
  - [ ] 11.1 Set up Gemini API client
    - Configure Gemini API client with API key from Secret Manager
    - Set model to `gemini-1.5-flash`, temperature 0.7, max tokens 500
    - Create system prompt with venue context
    - _Requirements: 4.4, 13.2_

  - [ ] 11.2 Implement chat message validation
    - Create `validateChatMessage` function (non-empty, ≤500 chars, no PII)
    - Implement basic PII detection patterns
    - _Requirements: 4.1, 9.1_

  - [ ]* 11.3 Write property test for query acceptance
    - **Property 13: AI Assistant Query Acceptance**
    - **Validates: Requirements 4.1**

  - [ ] 11.4 Create AI assistant API endpoint
    - Implement `POST /api/assistant/chat` with streaming response
    - Use Server-Sent Events to stream Gemini API responses
    - Implement 3-second timeout with fallback error message
    - Store conversation in sessionStorage only (client-side)
    - _Requirements: 4.2, 4.3, 4.5_

  - [ ]* 11.5 Write property test for response timing
    - **Property 14: AI Assistant Response Timing**
    - **Validates: Requirements 4.2**

  - [ ]* 11.6 Write property test for chat data non-persistence
    - **Property 15: Chat Data Non-Persistence**
    - **Validates: Requirements 4.5, 9.3**

- [ ] 12. Build alert and notification system
  - [ ] 12.1 Create alert management API
    - Implement `POST /api/alerts/create` endpoint
    - Validate alert data and store in Redis
    - Dispatch push notifications to assigned staff within 5 seconds
    - _Requirements: 6.1, 6.2_

  - [ ]* 12.2 Write property test for alert delivery timing
    - **Property 21: Alert Delivery Timing**
    - **Validates: Requirements 6.1**

  - [ ]* 12.3 Write property test for notification content completeness
    - **Property 22: Alert Notification Content Completeness**
    - **Validates: Requirements 6.2, 6.3**

  - [ ] 12.2 Implement alert status update API
    - Create `PATCH /api/alerts/:alertId/status` endpoint
    - Allow status updates (acknowledged, in-progress, resolved)
    - _Requirements: 6.4_

  - [ ]* 12.4 Write property test for alert status updates
    - **Property 23: Alert Status Update Capability**
    - **Validates: Requirements 6.4**

  - [ ] 12.3 Create active alerts API
    - Implement `GET /api/alerts/active` endpoint
    - Return all active alerts with staff assignments
    - _Requirements: 6.5_

  - [ ]* 12.5 Write property test for dashboard alert display
    - **Property 24: Active Alert Dashboard Display**
    - **Validates: Requirements 6.5**

  - [ ] 12.4 Implement notification system
    - Create `POST /api/notifications/send` endpoint
    - Implement rate limiting (3 per 15 minutes per user)
    - Support targeted and broadcast notifications
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 12.6 Write property test for notification rate limiting
    - **Property 46: Notification Rate Limiting**
    - **Validates: Requirements 12.4**

  - [ ]* 12.7 Write property test for high density notifications
    - **Property 43: High Density Notification Trigger**
    - **Validates: Requirements 12.1**

  - [ ]* 12.8 Write property test for venue-wide announcements
    - **Property 47: Venue-Wide Announcement Delivery**
    - **Validates: Requirements 12.5**

- [ ] 13. Checkpoint - Verify backend functionality
  - Test all API endpoints with sample requests
  - Verify Gemini AI integration works
  - Confirm alert creation and notification delivery
  - Ensure all tests pass, ask the user if questions arise

- [ ] 14. Implement real-time communication layer
  - [ ] 14.1 Create Server-Sent Events (SSE) endpoints
    - Implement `GET /api/realtime/density` for crowd updates
    - Implement `GET /api/realtime/alerts` for staff notifications
    - Configure event streaming with 10-second update cycle
    - _Requirements: 1.2, 5.4_

  - [ ] 14.2 Add WebSocket fallback for bidirectional communication
    - Implement WebSocket support for staff coordination features
    - Add connection lifecycle management (connect, disconnect, reconnect)
    - _Requirements: 6.1, 6.4_

  - [ ] 14.3 Implement polling fallback for unsupported browsers
    - Create 15-second polling mechanism as last resort
    - Detect SSE/WebSocket support and gracefully degrade
    - _Requirements: 5.4_

  - [ ]* 14.4 Write property test for automatic updates
    - **Property 19: Automatic Visualization Updates**
    - **Validates: Requirements 5.4**

- [ ] 15. Build attendee app UI components
  - [ ] 15.1 Create CrowdHeatmapViewer component
    - Implement SVG-based venue map with color-coded density overlay
    - Add accessibility labels and ARIA attributes
    - Connect to SSE endpoint for real-time updates
    - Display timestamp of last update
    - _Requirements: 1.1, 1.3, 1.5, 8.2_

  - [ ]* 15.2 Write property test for critical density indicator
    - **Property 3: Critical Density Visual Indicator**
    - **Validates: Requirements 1.4**

  - [ ]* 15.3 Write property test for timestamp display
    - **Property 4: Dashboard Timestamp Presence**
    - **Validates: Requirements 1.5**

  - [ ] 15.4 Create QueueTimeDisplay component
    - Display wait time predictions sorted by proximity
    - Show confidence indicators for predictions
    - Handle insufficient data case with appropriate message
    - _Requirements: 2.1, 2.3, 2.5_

  - [ ] 15.5 Create WayfindingNavigator component
    - Implement interactive map with route visualization
    - Display turn-by-turn instructions
    - Handle route recalculation notifications
    - Add haptic feedback for mobile waypoints
    - _Requirements: 3.1, 3.3, 3.4_

  - [ ] 15.6 Create AIAssistantChat component
    - Build conversational interface with message history
    - Implement streaming response display
    - Store conversation in sessionStorage only
    - Auto-clear on session end
    - _Requirements: 4.1, 4.2, 4.5_

  - [ ] 15.7 Create NotificationCenter component
    - Display notification preferences UI
    - Implement notification list with priority indicators
    - Add rate limiting display (show remaining quota)
    - _Requirements: 12.1, 12.2, 12.4_

  - [ ] 15.8 Create StaffAlertPanel component (staff mode)
    - Display assigned alerts with status
    - Allow status updates (acknowledge, in-progress, resolved)
    - Show real-time staff locations
    - _Requirements: 6.3, 6.4_

- [ ] 16. Build operations dashboard UI components
  - [ ] 16.1 Create LiveCrowdDashboard component
    - Implement full-screen heatmap with zone statistics
    - Add pulsing border for critical density zones
    - Display last update timestamp
    - Support drill-down to zone details
    - _Requirements: 1.1, 1.3, 1.4, 1.5_

  - [ ] 16.2 Create QueueManagementPanel component
    - Build tabular view of all queue predictions
    - Show prediction accuracy metrics
    - Allow manual override for special conditions
    - _Requirements: 2.1, 2.3_

  - [ ] 16.3 Create AlertCreationForm component
    - Build form for creating staff alerts
    - Validate required fields (priority, location, description)
    - Confirm delivery status after dispatch
    - _Requirements: 6.1, 6.2_

  - [ ] 16.4 Create StaffCoordinationView component
    - Display real-time staff locations and task status
    - Show staff availability and assignments
    - Support drag-and-drop task reassignment
    - _Requirements: 6.4, 6.5_

  - [ ] 16.5 Create PerformanceMonitor component
    - Display system health metrics (API response times, error rates)
    - Show loading indicators for requests >200ms
    - Monitor active connections and throughput
    - _Requirements: 5.5_

  - [ ]* 16.6 Write property test for loading indicator display
    - **Property 20: Loading Indicator Display**
    - **Validates: Requirements 5.5**

- [ ] 17. Implement responsive design and mobile optimization
  - [ ] 17.1 Create responsive layouts for all viewports
    - Implement mobile (320-428px), tablet (768-1024px), desktop (>1024px) layouts
    - Ensure no layout overflow or text truncation
    - Test all components across viewport ranges
    - _Requirements: 7.1, 7.2, 7.4_

  - [ ]* 17.2 Write property test for responsive rendering
    - **Property 25: Responsive Rendering Across Viewports**
    - **Validates: Requirements 7.1, 7.2, 7.4**

  - [ ] 17.3 Optimize touch targets for mobile
    - Ensure all interactive elements are at least 44x44px
    - Add adequate spacing between touch targets
    - _Requirements: 7.3_

  - [ ]* 17.4 Write property test for touch-friendly controls
    - **Property 26: Touch-Friendly Controls**
    - **Validates: Requirements 7.3**

  - [ ] 17.5 Set minimum font sizes
    - Configure base font size to 16px for body text
    - Ensure all text elements meet minimum size requirements
    - _Requirements: 7.5_

  - [ ]* 17.6 Write property test for minimum font size
    - **Property 27: Minimum Font Size**
    - **Validates: Requirements 7.5**

- [ ] 18. Checkpoint - Verify UI components
  - Test all components render correctly
  - Verify responsive layouts work across viewports
  - Confirm real-time updates display properly
  - Ensure all tests pass, ask the user if questions arise

- [ ] 19. Implement accessibility features
  - [ ] 19.1 Add keyboard navigation support
    - Ensure all interactive elements are keyboard accessible
    - Implement focus management and visible focus indicators
    - Test Tab, Enter, Space, Arrow key navigation
    - _Requirements: 8.1_

  - [ ]* 19.2 Write property test for keyboard navigation
    - **Property 28: Keyboard Navigation Completeness**
    - **Validates: Requirements 8.1**

  - [ ] 19.3 Add screen reader support
    - Add ARIA labels, roles, and descriptions to all components
    - Implement live regions for dynamic content updates
    - Test with NVDA and VoiceOver
    - _Requirements: 8.2_

  - [ ]* 19.4 Write property test for screen reader labels
    - **Property 29: Screen Reader Label Presence**
    - **Validates: Requirements 8.2**

  - [ ] 19.5 Ensure color contrast compliance
    - Verify all text meets WCAG AA contrast ratios (4.5:1 normal, 3:1 large)
    - Adjust color palette as needed
    - _Requirements: 8.3_

  - [ ]* 19.6 Write property test for color contrast
    - **Property 30: Color Contrast Compliance**
    - **Validates: Requirements 8.3**

  - [ ] 19.7 Add text alternatives for non-text content
    - Provide alt text for images
    - Add aria-labels for maps and charts
    - Include adjacent descriptions where appropriate
    - _Requirements: 8.4_

  - [ ]* 19.8 Write property test for text alternatives
    - **Property 31: Non-Text Content Alternatives**
    - **Validates: Requirements 8.4**

  - [ ] 19.9 Test zoom functionality
    - Verify all functionality works at 200% browser zoom
    - Ensure no horizontal scrolling required
    - _Requirements: 8.5_

  - [ ]* 19.10 Write property test for zoom preservation
    - **Property 32: Zoom Functionality Preservation**
    - **Validates: Requirements 8.5**

- [ ] 20. Implement security and privacy features
  - [ ] 20.1 Ensure no PII storage
    - Audit all data storage points for PII
    - Implement anonymous session tokens (JWT, 4-hour expiry)
    - Process only aggregate crowd data
    - _Requirements: 9.1, 9.2_

  - [ ]* 20.2 Write property test for no PII storage
    - **Property 33: No PII Storage**
    - **Validates: Requirements 9.1, 9.2**

  - [ ] 20.3 Enforce HTTPS for all connections
    - Configure Next.js to redirect HTTP to HTTPS
    - Verify all API calls use HTTPS protocol
    - _Requirements: 9.5_

  - [ ]* 20.4 Write property test for HTTPS transmission
    - **Property 35: HTTPS Transmission**
    - **Validates: Requirements 9.5**

  - [ ] 20.4 Implement rate limiting
    - Add rate limiting middleware for all API endpoints
    - Configure limits: attendees (100/min), IoT (1000/min), AI (10/min), ops (500/min)
    - _Requirements: 5.2_

  - [ ] 20.5 Set up authentication and authorization
    - Implement anonymous session tokens for attendees
    - Configure API key validation for IoT simulator
    - Set up OAuth for operations dashboard
    - _Requirements: 9.1_

- [ ] 21. Implement performance optimizations
  - [ ] 21.1 Optimize API response times
    - Implement Redis caching for hot data
    - Use parallel data fetching with Promise.all()
    - Add response streaming for large payloads
    - Configure aggressive HTTP caching headers
    - _Requirements: 5.2_

  - [ ] 21.2 Optimize page load times
    - Enable Next.js code splitting by route
    - Implement lazy loading for below-the-fold components
    - Optimize images with Next.js Image component
    - Prefetch critical API data during SSR
    - _Requirements: 5.1_

  - [ ]* 21.3 Write property test for dashboard load timing
    - **Property 16: Dashboard Initial Load Timing**
    - **Validates: Requirements 5.1**

  - [ ]* 21.4 Write property test for concurrent user performance
    - **Property 18: Concurrent User Performance**
    - **Validates: Requirements 5.3**

  - [ ] 21.3 Configure Cloud Run for optimal performance
    - Set min instances to 2 during events, 0 off-hours
    - Enable startup CPU boost for faster cold starts
    - Configure connection pooling for Redis and Cloud SQL
    - _Requirements: 10.3_

  - [ ]* 21.5 Write property test for server-side rendering
    - **Property 48: Server-Side Rendering**
    - **Validates: Requirements 13.4**

- [ ] 22. Checkpoint - Verify performance and security
  - Run performance tests to verify API response times <500ms
  - Test page load times <2s
  - Verify security measures are in place
  - Ensure all tests pass, ask the user if questions arise

- [ ] 23. Set up monitoring and observability
  - [ ] 23.1 Configure Cloud Logging
    - Implement structured JSON logging with severity levels
    - Add request/response logging with trace IDs
    - Log error stack traces with source maps
    - _Requirements: 11.4_

  - [ ] 23.2 Set up Cloud Monitoring dashboards
    - Create dashboards for API response times (P50, P95, P99)
    - Monitor error rates by endpoint and status code
    - Track Cloud Run instance metrics (CPU, memory, count)
    - Monitor Redis and Cloud SQL performance
    - _Requirements: 5.2, 10.3_

  - [ ] 23.3 Configure Cloud Trace
    - Enable distributed tracing for API requests
    - Track latency breakdown by component
    - Set trace sampling to 10% of requests
    - _Requirements: 5.2_

  - [ ] 23.4 Create alerting policies
    - Alert on error rate >5% for 5 minutes
    - Alert on P95 latency >1000ms for 5 minutes
    - Alert on Cloud Run instance count >80
    - Alert on Redis/SQL resource usage >80%
    - _Requirements: 5.2_

- [ ] 24. Write end-to-end tests
  - [ ]* 24.1 Test attendee views crowd heatmap and queue times
    - Verify heatmap displays with correct colors
    - Verify queue predictions show with confidence levels
    - _Requirements: 1.1, 1.3, 2.1_

  - [ ]* 24.2 Test attendee requests navigation
    - Verify route generation within 2 seconds
    - Verify route avoids high density zones
    - Verify turn-by-turn instructions display
    - _Requirements: 3.1, 3.2, 3.4_

  - [ ]* 24.3 Test attendee uses AI assistant
    - Verify query acceptance and response within 3 seconds
    - Verify conversation stored in sessionStorage only
    - _Requirements: 4.1, 4.2, 4.5_

  - [ ]* 24.4 Test manager creates alert
    - Verify alert creation and notification delivery within 5 seconds
    - Verify staff receives notification with complete details
    - _Requirements: 6.1, 6.2_

  - [ ]* 24.5 Test staff acknowledges and updates alert
    - Verify status update capability
    - Verify dashboard displays updated status
    - _Requirements: 6.4, 6.5_

  - [ ]* 24.6 Test IoT data loss and recovery
    - Verify system continues with previous valid data
    - Verify error logging for invalid data
    - _Requirements: 11.4_

- [ ] 25. Create deployment documentation
  - [ ] 25.1 Document environment variables and secrets
    - List all required environment variables
    - Document Secret Manager setup for API keys
    - Provide configuration examples
    - _Requirements: 10.1_

  - [ ] 25.2 Document deployment procedures
    - Provide step-by-step deployment guide
    - Document rollback procedures
    - Include troubleshooting tips
    - _Requirements: 10.2, 10.4_

  - [ ] 25.3 Create runbook for operations
    - Document monitoring and alerting setup
    - Provide incident response procedures
    - Include common troubleshooting scenarios
    - _Requirements: 10.3_

- [ ] 26. Final integration and testing
  - [ ] 26.1 Deploy to staging environment
    - Deploy complete application to Cloud Run staging
    - Verify all integrations work (Redis, Cloud SQL, Gemini API)
    - Run full E2E test suite
    - _Requirements: 10.1, 10.2_

  - [ ] 26.2 Perform load testing
    - Simulate 10,000 concurrent attendee connections
    - Verify API response times remain <500ms at P95
    - Test SSE connection stability under load
    - _Requirements: 5.2, 5.3_

  - [ ] 26.3 Conduct accessibility audit
    - Run automated accessibility tests (axe-core, Lighthouse)
    - Perform manual screen reader testing
    - Verify keyboard navigation completeness
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 26.4 Security review
    - Audit for PII storage violations
    - Verify HTTPS enforcement
    - Test rate limiting effectiveness
    - Review authentication and authorization
    - _Requirements: 9.1, 9.2, 9.5_

- [ ] 27. Final checkpoint - Production readiness
  - Verify all functional requirements are met
  - Confirm all performance benchmarks achieved
  - Ensure all security and privacy measures in place
  - Review deployment documentation completeness
  - Ensure all tests pass, ask the user if questions arise

- [ ] 28. Production deployment
  - [ ] 28.1 Deploy to production Cloud Run
    - Merge to main branch to trigger CI/CD pipeline
    - Monitor deployment progress and health checks
    - Verify smoke tests pass
    - _Requirements: 10.2_

  - [ ]* 28.2 Verify deployment rollback capability
    - **Property 37: Deployment Rollback Timing**
    - **Validates: Requirements 10.4**

  - [ ] 28.3 Monitor initial production traffic
    - Watch error rates and latency metrics for first hour
    - Verify real-time features work correctly
    - Confirm alerting policies trigger appropriately
    - _Requirements: 5.2, 10.3_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and user feedback opportunities
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Implementation follows incremental approach: infrastructure → backend → frontend → deployment
- All code should be production-ready with proper error handling and logging
