# Project Overview: Remote Telescope Web Platform

**Version**: 0.1
**Author**: AI (ChatGPT 5) using the team's project document (authored by **Team 404: Stars not Found**)
**Proofreading and Editing**: Haidar Alsalih (Student ID: 22209634)
**Note:** Substantial editing and proofreading. This is a living document.

## 1. Summary
A full-stack web application for remotely operating an astrophotography telescope. The system provides real-time weather-aware safety controls, low-latency dual-camera streams (telescope and all-sky), selection of observable targets using an astronomical database, precise motorized equatorial mount control (slew/track), image capture with scientific metadata, and session/queue management. It follows best practices for modularity, maintainability, and extensibility.

## 2. Goals and Success Criteria
- Deliver a stable, secure, browser-accessible platform to observe the sky and capture images.
- Maintain reliable hardware communication under variable network conditions.
- Provide a safe operating environment with automated and configurable protections (e.g., humidity-based lens closure).
- Enable non-experts (teachers/students) and enthusiasts to run observations via guided workflows/sequences.
- Ensure codebase is well-documented and maintainable.

**Measurable outcomes:**
- Low-latency dual video feeds accessible on modern browsers.
- Accurate slew and tracking to user-selected or coordinate-entered targets.
- Weather data integration with actionable alerts and optional automatic lens closure.
- Capture, store, and download images with embedded/associated metadata.
- Queue-based session control that avoids conflicting commands.

## 3. Scope

### 3.1 Must-haves
- Best-practice web app (modular architecture, maintainability, extensibility).
- Weather data integration via API for live conditions and safety actions.
    - Configurable threshold actions (e.g., humidity too high → warn or close lens).
- Remote motorized equatorial mount control via command/control protocol.
    - Slew to coordinates or database-derived targets; manage tracking over session duration.
    - Handle real-time inputs and pre-set observation sequences.
- Reliable hardware communication under varying network/deployment conditions.
- Dual live camera streams:
    - Telescope camera feed (low-latency, browser-accessible).
    - All-sky camera feed (low-latency, browser-accessible).
    - Optional third view for orientation/mount control (simple animation acceptable).
- Astronomical object selection UI:
    - Location/time-aware filtering for visible/optimal targets.
    - Database lookup for object details and coordinates; auto-move telescope.
    - Search for specific objects; display name, type, magnitude.
- Image capture and saving:
    - Snapshots during live sessions with organized storage.
    - Metadata: date/time, location, object details, telescope coordinates; embed as footer and/or sidecar metadata.
    - Downloadable images; support saving simulated feed as well.
- Safety settings:
    - Warnings and admin-configurable automatic actions for dangerous conditions.
- Conflict management:
    - First-come, first-serve access pattern with visibility into current usage; admin monitoring and overrides.

### 3.2 Nice-to-haves
- Adaptive video quality (automatic/manual resolution based on bandwidth).
- Enhanced metadata export (EXIF, CSV; separate export options).
- Extended mount and camera configurability (exposure, gain, filters; tracking rates, guide settings).
- Appointment booking (reserve future telescope time; admin schedule visibility).

## 4. User Stories (Grouped by Requirement)
- Web app best practices
    - Developer-friendly modular components; clear documentation and separation of concerns.
- Weather integration
    - Users view real-time conditions to inform operations.
- Mount control
    - Users issue movement commands; select objects to auto-point; teachers input custom coordinates; pre-set sequences; automatic slewing/tracking; resilience to network hiccups.
- Network reliability
    - Stable communication under poor connectivity; automatic retries and connection monitoring.
- Live video
    - Real-time telescope and all-sky streams; simultaneous view; low latency in standard browsers.
- Object selection
    - Visible-now lists by location/time; automatic coordinate calculation and move; searchability; filters by visibility/conditions; show object details.
- Image capture
    - Capture during sessions; embedded/associated metadata; download images.
- Equipment safety
    - Automatic warnings; admin-configurable auto-closure for humidity; customizable thresholds/responses.
- Conflict management
    - Show when in-use; FCFS queue; admin monitoring and session management.
- Documentation and security (must-have documentation)
    - User manuals, task guides, troubleshooting.
    - Technical docs: architecture, install, deployment.
    - Security guidelines, testing/validation results, QA coverage.
- Authentication/Authorization and System Security
    - Secure login; RBAC; account/permission management; session expiry.
    - Encryption in transit; audit logs; rate limiting; input validation; backups; intrusion detection.

## 5. Architecture Overview

### 5.1 High-Level Components
- Web App (Browser)
    - What it is: The user interface.
    - Shows: Live video, weather, telescope status, session/queue, controls, and image gallery.
    - How it talks:
        - REST: normal requests (login, lists, settings, start/stop actions).
        - WebSocket: live updates (telemetry, session/queue changes, safety alerts).
        - WebRTC: low‑latency video.

- Backend Server (API)
    - What it is: The main server the browser talks to. It is the only internet‑facing service.
    - Does:
        - Authentication and roles (who can do what).
        - Session/queue (who currently controls the telescope).
        - Weather fetching and caching (from an external provider).
        - Validates inputs; applies safety checks on risky actions.
        - REST endpoints + WebSocket events for the Web App.
        - Audit logs (who did what, when).
        - WebRTC signaling for the video stream (so only authorized users can watch).

- Device Control Service (Mount + Camera)
    - What it is: Module/service that knows how to talk to the physical devices.
    - Does:
        - Execute commands (slew/track/stop/park).
        - Report telemetry (position, status, heartbeats).
        - Handle still image capture and basic metadata (time, target, coordinates).

    - How it connects:
        - Called by the Backend (keep it simple: local module or internal API).

- Video Streaming Service
    - What it is: Live video path with low delay.
    - Does:
        - Ingest camera feed (e.g., RTSP) and deliver to browsers via WebRTC.
        - Enforces access (only authenticated sessions).

    - Optional later:
        - Add fallback like Low‑Latency HLS for recorded playback or broader compatibility.

- Safety Monitor
    - What it is: A simple rules engine for safety.
    - Does:
        - Watches weather and device status.
        - If thresholds are exceeded (e.g., humidity/wind), triggers warnings and safe actions (pause/close), and notifies users.

    - Keep rules simple and configurable (thresholds and what to do).

- Data & Storage
    - What it is: Where data is stored.
    - Includes:
        - Database: users, roles, sessions, queue, image metadata, audit logs.
        - Object storage or filesystem: image files.

    - Simple endpoints to list/download images and view activity logs.

- How it connects (at a glance)
    - Web App → Backend: REST (normal actions), WebSocket (live updates), WebRTC signaling (video setup).
    - Backend → Device Control: Direct calls/internal API (simple).
    - Backend → Video Streaming: Signaling/auth; streaming service sends the actual media to the browser via WebRTC.
    - Backend → Weather Provider: Periodic API calls with caching.
    - Everything runs over HTTPS; only the Backend is publicly exposed.

### 5.2 Minimal Interfaces (What messages look like)
- REST (examples):
    - POST /auth/login, POST /mount/slew, POST /mount/track, POST /session/take, POST /session/release, GET /weather, GET /images, GET /targets

- WebSocket events:
    - telemetry:update, session:update, safety:alert, command:ack/failed

- WebRTC signaling:
    - startStream, stopStream; SDP/ICE messages exchanged via the Backend

Keep payloads small and include a requestId/commandId so you can match acks and log actions.

### 5.3 Roles and Permissions (RBAC)
- Roles: admin, teacher, student
- Each role can give some or all of its permissions to others.
- Examples:
    - student: view video, read weather/telemetry, request session, capture image, limited control.
    - teacher: can take session, control mount, capture images.
    - admin: everything above + override sessions, view audit logs, change settings.

### 5.4 Reliability and Safety Basics
- Heartbeats:
    - Device Control sends periodic “I’m alive” messages; Backend shows staleness in UI.

- Retries and timeouts:
    - Set timeouts on device commands; retry with backoff for transient errors.

- Safe defaults:
    - If telemetry or weather is stale or lost, show warnings; optionally, auto‑pause.

### 5.5 Environments and Config
- Dev: permissive CORS, mock devices or simulators, verbose logs.
- Prod: TLS enabled, real devices, rate limits, stricter logs.
- Config via environment variables: weather API key, site location, thresholds, stream URLs.

### 5.6 Observability (So we can debug)
- Logs: structured logs with requestId/commandId; errors include stack traces (dev).
- Metrics (optional): command success rate, stream uptime, queue wait time.
- Basic alerts (optional): device heartbeat lost, weather stale, many command failures.

### 5.7 Testing Plan (Practical)
- Unit tests: safety rules, input validation, simple command handlers.
- Integration tests: login flow, queue take/release, basic slew command with a simulator.
- Manual tests: watch video, slew to a target, capture image, weather alert behavior.
- “Sim mode” for devices so we can develop without real hardware.

### 5.8 Security Essentials
- HTTPS everywhere; secure WebSocket.
- Use secure, HTTP‑only cookies or short‑lived tokens.
- Validate all inputs against a schema (especially mount commands).
- Rate limit control endpoints; lock after repeated auth failures.
- Store secrets in env variables or a secret manager (not in the repo).

## 6. Example Data Model (Conceptual)
- User, Role, Session (login session), ObservationSession (ownership, schedule, device lock).
- TargetObject (id, name, type, magnitude, RA/Dec, visibility windows).
- WeatherReading (timestamp, humidity, temp, wind, precipitation status, site).
- SafetyPolicy (thresholds and actions, e.g., humidity_close_lens=true, humidity>85%).
- ImageAsset (file, thumbnail, metadata: object, timestamp, coordinates, site, exposure).
- AuditLog (actor, action, target, timestamp, outcome, IP).

## 7. Workflows

### 7.1 Start Observation
1. User logs in; obtains role-based permissions.
2. If desired, the user enters the queue or starts a session if available (FCFS).
3. UI displays live weather and safety status; warnings if thresholds are breached.
4. User selects target from visible list, or searches/inputs coordinates, or manually slews telescope.
5. If a target is selected, the backend fetches coordinates (catalog lookup) and commands mount to slew, then track.
6. Streams are visible; user can capture images with metadata.
7. Session ends; audit and image data stored; queue advances.

### 7.2 Safety Response (Humidity Example)
1. Weather service polls/streams data.
2. If humidity crosses warning threshold: UI alert + log event.
3. If auto-close enabled and critical threshold exceeded: close lens; pause mount/camera as configured; notify users/admins.

### 7.3 Network Disruption
1. Watchdog detects lost heartbeat.
2. Retry with exponential backoff; buffer commands if safe to do so.
3. Fallback to a safe state if the connection is not recoverable; notify users and log.

## 8. Non-Functional Requirements
- Performance: low-latency streaming; command round-trip within acceptable control bounds.
- Availability: recover gracefully from transient faults; automated restarts.
- Compatibility: standard web browsers without plugins.
- Maintainability: modular code, automated tests, linting, CI.
- Observability: metrics, logs, audit trails, security events.
- Privacy & Security: encryption in transit; minimal data collection; principle of least privilege.

## 9. Security and Compliance
- Authentication: secure login, session expiry, password policies, or SSO integration.
- Authorization: RBAC for admin/teacher/student roles.
- Transport Security: TLS for all communications; secure WebSockets for control/telemetry.
- Input Validation: strict schema validation for telescope commands and APIs.
- Abuse Prevention: rate limits on control endpoints.
- Auditability: immutable audit logs for operations.
- Backups: routine backups of configurations and critical data.
- Advanced: intrusion detection and alerting.

## 10. Documentation and QA
- User Docs: quick start, task guides (select target, start/stop tracking, capture image), troubleshooting.
- Technical Docs: architecture diagrams, API reference, setup/installation, deployment guide.
- QA: test plans for mount control, streaming, weather safety, queueing; automated and manual test reports.
- Security Testing: vulnerability scans, dependency checks, pen-test results, remediation tracking.

## 11. Assumptions
- Mount and camera expose stable control/streaming interfaces or supported adapters.
- Weather provider offers reliable API with adequate rate limits.
- Hosting environment can support persistent connections for streaming and control.

## 12. Risks and Mitigations
- Network instability: retries, buffering, safe state fallbacks.
- Weather API outage: cached last-known good values + conservative safety defaults.
- Hardware protocol variance: adapter abstraction + configuration profiles.
- Browser compatibility for streaming: use standards-based, widely supported protocols.

## 13. Glossary
- Slew: Rapid movement of the mount to a target position.
- Tracking: Continuous movement to compensate for Earth’s rotation and keep target centered.
- All-sky camera: Wide-field camera used to monitor sky conditions.
- FCFS: First-Come, First-Serve session access model.
