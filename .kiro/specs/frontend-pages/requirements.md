# Requirements Document

## Introduction

The CrowdFlow frontend pages feature defines the complete set of Next.js 14 App Router pages, layouts, and navigation structures that tie the platform's existing components and APIs into a cohesive user experience. The platform serves two distinct user groups — event attendees using a mobile PWA and operations staff using a web dashboard — each with their own layout, navigation, and page hierarchy. This spec covers the page-level integration: route definitions, layout wrappers, navigation patterns, data-fetching strategies at the page boundary, loading/error states, and the connections between pages and the underlying component library and API layer.

The existing codebase already has page files in place (`src/app/dashboard/`, `src/app/operations/`, `src/app/assistant/`). This spec formalises the requirements for those pages and identifies gaps — missing layouts, incomplete navigation wiring, absent loading/error boundaries, and pages that exist as stubs without real component integration.

## Glossary

- **AttendeeLayout**: The shared layout wrapping all attendee-facing pages under `/dashboard`, providing sidebar navigation, mobile bottom nav, and global header
- **OpsLayout**: The shared layout wrapping all operations pages under `/operations`, providing the collapsible sidebar and sticky command header
- **RootLayout**: The top-level Next.js layout at `src/app/layout.tsx` wrapping all routes with global fonts, metadata, and skip-navigation
- **HomePage**: The public landing page at `/` — the marketing/onboarding entry point
- **AttendeeDashboard**: The attendee overview page at `/dashboard` — the primary hub showing heatmap, queue summary, and schedule preview
- **WayfindingPage**: The full-screen navigation page at `/dashboard/map`
- **QueuesPage**: The queue wait-time page at `/dashboard/queues`
- **SchedulePage**: The event schedule page at `/dashboard/schedule`
- **SafetyPage**: The safety and alerts page at `/dashboard/safety`
- **AssistantPage**: The AI chat page at `/assistant`
- **OpsOverviewPage**: The operations command dashboard at `/operations`
- **IncidentsPage**: The incident management page at `/operations/incidents`
- **StaffPage**: The staff coordination page at `/operations/staff`
- **MonitoringPage**: The system health monitoring page at `/operations/monitoring`
- **Page_Boundary**: The point at which a Next.js page component fetches or subscribes to data before passing it to child components
- **SSE_Connection**: A Server-Sent Events connection used for real-time data streaming from the backend
- **Loading_State**: A UI state displayed while page-level data is being fetched
- **Error_Boundary**: A React error boundary or Next.js `error.tsx` file that catches and displays page-level errors
- **PWA**: Progressive Web App — the attendee app is installable and works offline for cached content
- **Route_Guard**: Logic that redirects unauthenticated or unauthorised users away from protected pages

---

## Requirements

### Requirement 1: Root Layout and Global Shell

**User Story:** As any user of the CrowdFlow platform, I want a consistent global shell that handles fonts, metadata, accessibility anchors, and client-side initialisation, so that every page loads with the correct baseline experience.

#### Acceptance Criteria

1. THE RootLayout SHALL apply the Outfit and JetBrains Mono font variables to the `<html>` element on every page
2. THE RootLayout SHALL render a skip-navigation link as the first focusable element in the DOM, pointing to `#main-content`
3. THE RootLayout SHALL set the page `<title>` to "CrowdFlow | Real-Time Venue Intelligence" as the default, allowing individual pages to override it via Next.js metadata exports
4. THE RootLayout SHALL wrap all page content in a `<main id="main-content">` element to support the skip-navigation target
5. WHEN the viewport meta tag is rendered, THE RootLayout SHALL set `width=device-width`, `initialScale=1`, and `themeColor=#0a0a0a`
6. THE RootLayout SHALL initialise client-side services (session management, notification permissions) via the `ClientSideInit` component without blocking the initial render

---

### Requirement 2: Public Landing Page (HomePage)

**User Story:** As a prospective attendee, I want a public landing page that explains the platform and provides entry points into the attendee app, so that I can understand the product and get started quickly.

#### Acceptance Criteria

1. THE HomePage SHALL render at the `/` route without requiring authentication
2. THE HomePage SHALL display a hero section with a headline, description, and at least two call-to-action buttons linking to the attendee dashboard and venue exploration
3. THE HomePage SHALL display a "Live Venue Pulse" section showing real-time facility status cards (route suggestions, crowd density, queue status)
4. THE HomePage SHALL display a ticket synchronisation section allowing attendees to link their event pass
5. THE HomePage SHALL render a footer with links to Privacy Policy, Terms of Service, and Support Center
6. WHEN the HomePage is rendered on a mobile viewport (320px–428px wide), THE HomePage SHALL stack all sections vertically without horizontal overflow
7. THE HomePage SHALL include the `FluidNav` navigation component providing links to the attendee dashboard and assistant

---

### Requirement 3: Attendee Layout (AttendeeLayout)

**User Story:** As an attendee, I want a persistent navigation shell around all attendee pages, so that I can move between the dashboard, map, queues, schedule, assistant, and safety pages without losing context.

#### Acceptance Criteria

1. THE AttendeeLayout SHALL render a desktop sidebar (visible at `lg` breakpoint and above) containing the CrowdFlow logo and navigation links for: Overview (`/dashboard`), Wayfinding (`/dashboard/map`), Queues (`/dashboard/queues`), Schedule (`/dashboard/schedule`), Assistant (`/assistant`), and Safety (`/dashboard/safety`)
2. THE AttendeeLayout SHALL render a mobile bottom navigation bar (visible below `lg` breakpoint) containing the same six navigation destinations as the desktop sidebar
3. WHEN a navigation item matches the current pathname, THE AttendeeLayout SHALL apply an active visual indicator to that item using a shared `layoutId` animation
4. THE AttendeeLayout SHALL render a sticky global header showing the venue status label, queue score metric, and a user profile icon
5. THE AttendeeLayout SHALL wrap the page content area in an `AnimatePresence` block so that route transitions animate with opacity and vertical slide
6. WHEN the page content area is scrolled, THE AttendeeLayout SHALL maintain the sidebar and header in fixed positions without scrolling off-screen
7. THE AttendeeLayout SHALL provide a user identity card in the sidebar footer showing the anonymous guest ID

---

### Requirement 4: Attendee Dashboard Overview Page (AttendeeDashboard)

**User Story:** As an attendee, I want an overview page that surfaces the most important real-time information — upcoming events, crowd density, queue comfort, and a mini map — so that I can make quick decisions without navigating to individual pages.

#### Acceptance Criteria

1. THE AttendeeDashboard SHALL display a "Next Up" widget showing the next scheduled event with title, speaker, location, and time until start
2. THE AttendeeDashboard SHALL display a global saturation metric showing current venue occupancy as a percentage
3. THE AttendeeDashboard SHALL display a queue comfort metric linking to the `/dashboard/queues` page
4. THE AttendeeDashboard SHALL render the `LuminaMap` component in a mini-map card with a "Full Screen Wayfinding" link to `/dashboard/map`
5. THE AttendeeDashboard SHALL render an assistant quick-entry card with a link to `/assistant`
6. WHEN the `LuminaMap` component is loading, THE AttendeeDashboard SHALL display a skeleton placeholder with the text "Loading venue map" until the component is ready
7. THE AttendeeDashboard SHALL use `next/dynamic` with `ssr: false` to load the `LuminaMap` component, preventing server-side rendering of the map canvas

---

### Requirement 5: Wayfinding Page (WayfindingPage)

**User Story:** As an attendee, I want a dedicated full-screen wayfinding page that combines the interactive venue map with the route-planning interface, so that I can navigate the venue efficiently.

#### Acceptance Criteria

1. THE WayfindingPage SHALL render at `/dashboard/map` within the AttendeeLayout
2. THE WayfindingPage SHALL display the `LuminaWayfinding` component in a sidebar panel for route input and turn-by-turn instructions
3. THE WayfindingPage SHALL display the `LuminaMap` component as the primary full-height map canvas
4. THE WayfindingPage SHALL display contextual proximity tips below the wayfinding panel, highlighting zones to avoid and fast-moving queues
5. WHEN the WayfindingPage is rendered on a mobile viewport, THE WayfindingPage SHALL stack the wayfinding panel above the map canvas in a single column layout
6. THE WayfindingPage SHALL set the page title to "Venue Wayfinding | CrowdFlow" via a Next.js metadata export

---

### Requirement 6: Queues Page (QueuesPage)

**User Story:** As an attendee, I want a dedicated queues page that shows live wait-time predictions for all facilities, so that I can choose the shortest line before moving.

#### Acceptance Criteria

1. THE QueuesPage SHALL render at `/dashboard/queues` within the AttendeeLayout
2. THE QueuesPage SHALL display the `QueueDisplay` component showing live wait-time predictions for all monitored facilities
3. THE QueuesPage SHALL display a summary header with three highlight cards: fastest entry gate, best food stop, and prediction refresh cycle
4. THE QueuesPage SHALL display a route suggestion card linking to `/dashboard/map` with a recommended low-density path to a facility
5. WHEN queue predictions are loading, THE QueuesPage SHALL display a loading indicator within the `QueueDisplay` section
6. THE QueuesPage SHALL set the page title to "Queue Intelligence | CrowdFlow" via a Next.js metadata export

---

### Requirement 7: Schedule Page (SchedulePage)

**User Story:** As an attendee, I want a schedule page showing the full event programme, so that I can plan my day and navigate to sessions on time.

#### Acceptance Criteria

1. THE SchedulePage SHALL render at `/dashboard/schedule` within the AttendeeLayout
2. THE SchedulePage SHALL render the `LuminaSchedule` component displaying the full event timetable
3. THE SchedulePage SHALL constrain the content to a maximum width of `6xl` (72rem) and centre it horizontally
4. THE SchedulePage SHALL set the page title to "Event Schedule | CrowdFlow" via a Next.js metadata export

---

### Requirement 8: Safety Page (SafetyPage)

**User Story:** As an attendee, I want a safety page that surfaces active alerts, emergency exits, and first-aid locations, so that I can respond quickly to safety situations.

#### Acceptance Criteria

1. THE SafetyPage SHALL render at `/dashboard/safety` within the AttendeeLayout
2. THE SafetyPage SHALL render the `LuminaSafety` component as the primary content
3. THE SafetyPage SHALL animate in with an opacity and vertical slide transition on mount
4. THE SafetyPage SHALL set the page title to "Safety & Alerts | CrowdFlow" via a Next.js metadata export

---

### Requirement 9: AI Assistant Page (AssistantPage)

**User Story:** As an attendee, I want a dedicated AI assistant page with a full chat interface and quick-action shortcuts, so that I can get venue information conversationally without navigating away.

#### Acceptance Criteria

1. THE AssistantPage SHALL render at `/assistant` and be accessible from the AttendeeLayout navigation
2. THE AssistantPage SHALL render the `AIAssistantChat` component as the primary chat interface
3. THE AssistantPage SHALL display a grid of quick-action buttons (Find Food, Restrooms, First Aid, Nearest Exit) that pre-populate the chat input
4. THE AssistantPage SHALL display a live venue snapshot card showing total saturation percentage and average queue time
5. THE AssistantPage SHALL render a sticky header with a back link to `/dashboard` and the CrowdFlow brand mark
6. WHEN the AssistantPage is rendered on a mobile viewport, THE AssistantPage SHALL display the chat interface in full width with the quick-action grid and venue snapshot stacked below
7. THE AssistantPage SHALL set the page title to "AI Concierge | CrowdFlow" via a Next.js metadata export

---

### Requirement 10: Operations Layout

**User Story:** As an operations staff member, I want a persistent operations shell with a collapsible sidebar and sticky command header, so that I can navigate between dashboard sections without losing the global context panel.

#### Acceptance Criteria

1. THE OpsLayout SHALL render a collapsible sidebar (default expanded at `lg` breakpoint) containing navigation links for: Dashboard (`/operations`), Incidents (`/operations/incidents`), Staff (`/operations/staff`), and Monitoring (`/operations/monitoring`)
2. WHEN the sidebar collapse toggle is activated, THE OpsLayout SHALL animate the sidebar width from 288px (expanded) to 96px (collapsed), hiding text labels while keeping icons visible
3. WHEN a navigation item matches the current pathname, THE OpsLayout SHALL apply the `aria-current="page"` attribute and an active highlight style to that item
4. THE OpsLayout SHALL render a sticky command header showing the live net occupancy count, a settings button, and a "Broadcast Alert" button
5. THE OpsLayout SHALL subscribe to the `/api/realtime/density` SSE endpoint and update the net occupancy count in the header as density data arrives
6. WHEN the OpsLayout is rendered on a mobile viewport, THE OpsLayout SHALL hide the sidebar and show a hamburger menu button in the header instead
7. THE OpsLayout SHALL apply a dark theme (`bg-background text-foreground`) distinct from the attendee light theme

---

### Requirement 11: Operations Overview Page (OpsOverviewPage)

**User Story:** As a venue manager, I want an operations overview page that shows live crowd density, queue velocity, mission logs, and the alert centre in a single command view, so that I can monitor all critical metrics at a glance.

#### Acceptance Criteria

1. THE OpsOverviewPage SHALL render at `/operations` within the OpsLayout
2. THE OpsOverviewPage SHALL display a "Neural Heat Signature" card showing live density data for up to four venue zones, each with occupancy count and a density progress bar
3. THE OpsOverviewPage SHALL display a "Queue Velocity Pulse" card showing wait times for monitored gates and concessions
4. THE OpsOverviewPage SHALL display a "Global Mission Log" card showing the two most recent system events with timestamps and descriptions
5. THE OpsOverviewPage SHALL render the `AlertCenter` component in the main content area
6. THE OpsOverviewPage SHALL render a "Quantum State" sidebar card showing system latency, sync node count, and threat level
7. WHEN the "Broadcast Alert" button is clicked, THE OpsOverviewPage SHALL open a modal overlay containing the `AlertCreationForm` component
8. WHEN the modal is dismissed, THE OpsOverviewPage SHALL return focus to the "Broadcast Alert" button
9. THE OpsOverviewPage SHALL fetch initial density data from `/api/crowd/density` on mount and update it via the SSE connection managed by the OpsLayout

---

### Requirement 12: Incidents Page (IncidentsPage)

**User Story:** As an operations manager, I want a dedicated incident command page with tabbed views for the alert stream, staff dispatch, and mission logs, so that I can manage active incidents from a single focused interface.

#### Acceptance Criteria

1. THE IncidentsPage SHALL render at `/operations/incidents` within the OpsLayout
2. THE IncidentsPage SHALL display a tab navigation with three tabs: "Alert Stream", "Staff Dispatch", and "Mission Logs"
3. WHEN the "Alert Stream" tab is active, THE IncidentsPage SHALL render the `AlertCenter` component
4. WHEN the "Staff Dispatch" tab is active, THE IncidentsPage SHALL render the `StaffAlertPanel` component alongside a staff deployment map placeholder
5. WHEN the "Mission Logs" tab is active, THE IncidentsPage SHALL display an encrypted/locked state placeholder indicating logs are secured
6. THE IncidentsPage SHALL display a tactical sidebar showing venue saturation percentage and active incident count
7. WHEN the "Broadcast Incident" button is clicked, THE IncidentsPage SHALL open a modal overlay containing the `AlertCreationForm` component
8. THE IncidentsPage SHALL set the page title to "Incident Command | CrowdFlow" via a Next.js metadata export

---

### Requirement 13: Staff Coordination Page (StaffPage)

**User Story:** As an operations manager, I want a staff coordination page showing real-time staff locations and task assignments, so that I can deploy and redirect ground units efficiently.

#### Acceptance Criteria

1. THE StaffPage SHALL render at `/operations/staff` within the OpsLayout
2. THE StaffPage SHALL render the `StaffCoordinationView` component as the primary full-height content area
3. THE StaffPage SHALL display a floating "Deployment Overview" overlay card showing current staff unit assignments and zone locations
4. THE StaffPage SHALL display a floating "Unit Telemetry" overlay card showing a spectral coverage distribution chart
5. THE StaffPage SHALL display a tactical footer bar showing GPS sync health and encryption key status
6. THE StaffPage SHALL set the page title to "Staff Coordination | CrowdFlow" via a Next.js metadata export

---

### Requirement 14: System Monitoring Page (MonitoringPage)

**User Story:** As a DevOps engineer, I want a system monitoring page showing infrastructure health metrics, so that I can identify performance issues and respond to incidents before they affect users.

#### Acceptance Criteria

1. THE MonitoringPage SHALL render at `/operations/monitoring` within the OpsLayout
2. THE MonitoringPage SHALL render the `SystemMonitoringView` component as the primary content
3. THE MonitoringPage SHALL display a left stats bar showing CPU usage, memory usage, network throughput, and power status
4. THE MonitoringPage SHALL display a scrolling ticker footer showing real-time system metrics (sync state, buffer load, heartbeat, throughput, packet loss, redundancy status)
5. THE MonitoringPage SHALL set the page title to "System Health | CrowdFlow" via a Next.js metadata export

---

### Requirement 15: Page-Level Loading States

**User Story:** As any user, I want to see meaningful loading indicators while page data is being fetched, so that I know the application is working and I am not left staring at a blank screen.

#### Acceptance Criteria

1. THE AttendeeDashboard SHALL display a skeleton placeholder for the `LuminaMap` component while it is loading via `next/dynamic`
2. WHEN any attendee page is navigating between routes, THE AttendeeLayout SHALL display the route transition animation (opacity + blur fade) to indicate the transition is in progress
3. WHEN the OpsOverviewPage is fetching initial density data, THE OpsOverviewPage SHALL display an "Initializing Density Mesh..." placeholder in the heat signature card
4. WHEN any operations page component is loading data from an API, THE OpsLayout SHALL maintain the sticky header and sidebar in their rendered state so the chrome does not disappear during loading
5. IF a page-level data fetch fails, THEN THE CrowdFlow_Platform SHALL display a user-facing error message within the affected page section without crashing the entire page

---

### Requirement 16: Page-Level Error Handling

**User Story:** As any user, I want graceful error states on pages when data is unavailable, so that I can still use other parts of the application even when one section fails.

#### Acceptance Criteria

1. IF the `/api/crowd/density` fetch fails on the OpsOverviewPage, THEN THE OpsOverviewPage SHALL display "Data temporarily unavailable" in the heat signature card and retain the last successfully fetched data
2. IF the SSE connection to `/api/realtime/density` drops, THEN THE OpsLayout SHALL display a connection status indicator and attempt reconnection with exponential backoff (1s, 2s, 4s, 8s, max 30s)
3. IF the `LuminaMap` component throws a render error, THEN THE AttendeeDashboard SHALL display a fallback message "Map temporarily unavailable" without crashing the rest of the page
4. THE CrowdFlow_Platform SHALL provide a Next.js `error.tsx` boundary at the `/dashboard` route segment to catch unhandled errors in attendee pages
5. THE CrowdFlow_Platform SHALL provide a Next.js `error.tsx` boundary at the `/operations` route segment to catch unhandled errors in operations pages

---

### Requirement 17: Navigation and Routing Correctness

**User Story:** As any user, I want navigation links to route me to the correct pages and for the active state to always reflect my current location, so that I always know where I am in the application.

#### Acceptance Criteria

1. THE AttendeeLayout navigation SHALL use Next.js `<Link>` components for all internal navigation to enable client-side routing without full page reloads
2. WHEN the current pathname matches a navigation item's `href` exactly, THE AttendeeLayout SHALL mark that item as active using both a visual indicator and `aria-current="page"`
3. THE OpsLayout navigation SHALL use Next.js `<Link>` components for all internal navigation
4. WHEN the current pathname matches a navigation item's `href` exactly, THE OpsLayout SHALL mark that item as active using both a visual indicator and `aria-current="page"`
5. THE HomePage SHALL provide a navigation component (`FluidNav`) with links to the attendee dashboard and assistant page
6. WHEN a user navigates from the AssistantPage back to the dashboard, THE AssistantPage back link SHALL route to `/dashboard` using a Next.js `<Link>` component

---

### Requirement 18: Mobile Responsiveness of Pages

**User Story:** As an attendee using a smartphone, I want all attendee pages to be fully usable on a small screen, so that I can access crowd information while moving through the venue.

#### Acceptance Criteria

1. THE AttendeeLayout SHALL hide the desktop sidebar and show the mobile bottom navigation bar on viewports narrower than the `lg` breakpoint (1024px)
2. THE AttendeeDashboard SHALL render the schedule widget and map card in a single-column layout on mobile viewports
3. THE WayfindingPage SHALL stack the wayfinding panel above the map canvas in a single column on mobile viewports
4. THE AssistantPage SHALL render the chat interface at full width with the quick-action grid and venue snapshot below it on mobile viewports
5. THE QueuesPage SHALL render the summary cards in a single column on mobile viewports narrower than the `md` breakpoint (768px)
6. WHEN the mobile bottom navigation bar is rendered, THE AttendeeLayout SHALL add bottom padding to the page content area to prevent content from being obscured by the navigation bar

---

### Requirement 19: Accessibility of Page Navigation

**User Story:** As an attendee or staff member using assistive technology, I want all page navigation to be keyboard-accessible and screen-reader-friendly, so that I can use the platform independently.

#### Acceptance Criteria

1. THE AttendeeLayout sidebar navigation SHALL be wrapped in a `<nav>` element with an accessible label (e.g., `aria-label="Attendee navigation"`)
2. THE AttendeeLayout mobile bottom navigation SHALL be wrapped in a `<nav>` element with an accessible label (e.g., `aria-label="Mobile navigation"`)
3. THE OpsLayout sidebar navigation SHALL be wrapped in a `<nav>` element with an `aria-label="Operations navigation"` attribute
4. WHEN the OpsLayout sidebar collapse toggle is activated via keyboard, THE OpsLayout SHALL update the sidebar state and move focus appropriately
5. THE OpsOverviewPage modal overlay for alert creation SHALL trap keyboard focus within the modal while it is open
6. WHEN the OpsOverviewPage modal is closed, THE OpsOverviewPage SHALL return focus to the element that triggered the modal
7. THE RootLayout skip-navigation link SHALL become visible on keyboard focus and route focus to `#main-content`

---

### Requirement 20: PWA and Offline Support

**User Story:** As an attendee, I want the attendee app to be installable as a PWA and to show cached content when offline, so that I can still access venue maps and schedules without a network connection.

#### Acceptance Criteria

1. THE RootLayout SHALL include a `<link rel="manifest">` reference to a Web App Manifest file
2. THE CrowdFlow_Platform SHALL register a service worker that caches static assets (HTML, CSS, JS bundles, fonts) for offline access
3. WHEN the attendee device is offline, THE AttendeeDashboard SHALL display a banner indicating offline mode and show the last cached crowd data with a stale data warning
4. THE WayfindingPage SHALL cache venue map tiles in IndexedDB so that the map renders without a network connection
5. WHEN the attendee device reconnects to the network, THE CrowdFlow_Platform SHALL automatically refresh stale cached data and remove the offline banner
