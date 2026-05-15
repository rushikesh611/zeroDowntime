# Zero Downtime Server Specification

This document provides a comprehensive technical overview of the `zeroDowntime` server backend. It serves as the primary reference for system architecture, business rules, API standards, and infrastructure constraints.

## 1. Overview and Architecture

The `zeroDowntime` backend is a distributed RESTful API server responsible for real-time website monitoring, incident management, and public status communication.

### Project Structure
- **`src/index.ts`**: Main entry point. Bootstraps Express, global middleware (CORS, Rate Limiting, API Standardization), and starts background services.
- **`src/routes/`**: Domain-specific API routers (Auth, Monitors, Incidents, StatusPages, Teams, Billing).
- **`src/services/`**: Core business logic.
  - `monitoringService.ts`: Manages global AWS Lambda orchestrations.
  - `notifierService.ts`: Dispatches alerts via Email and Webhooks.
  - `logSourceService.ts`: Manages API keys for the Log Vault.
- **`src/jobs/`**: Background tasks.
  - `uptimeCheck.ts`: The primary heartbeat engine (running every 30s).
- **`src/lib/`**: Singleton instances for Prisma, Stripe, and AWS SDKs.

## 2. Technology Stack

- **Core**: Node.js, TypeScript, Express.js.
- **Data Persistence**: MongoDB with Prisma ORM.
- **Infrastructure**: AWS Lambda (for distributed health checks).
- **Security**: Passport.js (GitHub/Google OAuth), JWT (HTTP-only cookies), Helmet, Rate Limiting.
- **Integrations**: Stripe (Payments), Resend (Email), Axios (Webhooks).

## 3. Plan-Based Limits and Constraints

The system strictly enforces limits based on the user's subscription tier:

| Feature | FREE | PRO | PRO_PLUS |
| :--- | :--- | :--- | :--- |
| **Monitors** | 1 | 15 | 50 |
| **Min. Frequency** | 900s (15m) | 60s (1m) | 30s |
| **Max Regions** | 3 | 5 | 10 |
| **Status Pages** | 1 | 10 | 50 |
| **Monitors per Page**| 1 | 15 | 50 |
| **Team Members** | N/A | 20 | 50 |

## 4. Feature Implementation Details

### A. Distributed Uptime Monitoring (`uptimeCheck.ts`)
- **Heartbeat**: Runs every 30 seconds via `node-cron`.
- **Global Checks**: Invocations are dispatched in parallel to AWS Lambda functions in the user's selected regions.
- **Optimization**: To prevent database bottlenecks, check results are stored in an **in-memory cache**. A batch insert (`createMany`) is triggered only after **10 checks** have accumulated for a specific monitor.
- **Down Detection**: An alert is triggered if `any` selected region reports a failure.

### B. Team Collaboration & RBAC
- **Roles**: 
  - `OWNER`: Full control.
  - `WRITE`: Can update, delete, and test monitors; cannot manage team membership.
  - `READ`: View-only access to monitors and logs.
- **Auto-Provisioning**: Upgrading to a paid plan automatically initializes a "My Team" workspace for the user.

### C. Incident Management Lifecycle
- **Statuses**: `INVESTIGATING` → `IDENTIFIED` → `MONITORING` → `RESOLVED`.
- **Severities**: `SEV1` (Critical), `SEV2_CRITICAL`, `SEV2`, `SEV3`.
- **Post-Mortem**: Supports Markdown content for Root Cause Analysis (RCA), visible only to team members.
- **Auto-Resolution**: Setting an incident to `RESOLVED` automatically captures the `resolvedAt` timestamp.

### D. Public Status Pages
- **Visibility**: Can be toggled `isPublic`. Supports both custom `subdomain` and verified `customDomain`.
- **Uptime History**: Aggregates the last **7 days** of logs into daily buckets.
- **Health Mapping**:
  - `OPERATIONAL`: >99.0% uptime.
  - `DEGRADED`: 95.0% - 99.0% uptime.
  - `OUTAGE`: <95.0% uptime.

### E. Alerting Integrations
- **Webhooks**: Dispatches a Slack-compatible JSON payload with `event`, `monitor`, and `timestamp` metadata. 5-second timeout enforced.
- **Email**: Templates managed via Resend, triggered for both downtime and manual testing.

## 5. API Standards and Security

### A. Global Response Standards
- **Standard Success**: `200 OK` for data; `204 No Content` for empty results (handled by global middleware).
- **Error Format**: `{ "error": "Message" }`.
- **Cache Control**: `ETags` are disabled globally to ensure real-time accuracy.

### B. Access Control (IDOR Protection)
- Every request targeting a specific ID (Monitor, StatusPage, Incident) performs an ownership or team membership check.
- `req.user` is populated by the `auth` middleware from the JWT cookie.
- Database queries use strict filters (e.g., `where: { id, userId }` or team membership lookups) to prevent unauthorized data access.

### C. Log Ingestion (Log Vault)
- Protected by `X-API-Key` header.
- API keys are unique per `LogSource` and hashed/indexed for performant validation.
