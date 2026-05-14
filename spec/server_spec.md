# Zero Downtime Server Specification

This document provides a comprehensive overview of the `zeroDowntime` server backend. It is designed to help developers and AI agents understand the system's architecture, feature set, business rules, and technology stack.

## 1. Overview and Architecture

The `zeroDowntime` backend is a RESTful API server responsible for managing user accounts, monitoring website/API uptimes, managing teams, processing payments, and dispatching alerts. 

### Project Structure
- **`src/index.ts`**: The main entry point. It bootstraps the Express application, configures global middleware (CORS, Rate Limiting, Helmet, Cookie Parser), initializes Passport authentication, mounts route handlers, and starts background jobs.
- **`src/routes/`**: Contains Express routers separated by domain logic (e.g., `auth.ts`, `monitors.ts`, `teams.ts`).
- **`src/services/`**: The business logic layer that handles complex operations, abstracting them away from the route handlers (e.g., `monitoringService.ts`, `notifierService.ts`, `logSourceService.ts`).
- **`src/jobs/`**: Contains background tasks, specifically the `uptimeCheck.ts` cron job which runs on a continuous interval.
- **`src/lib/`**: Singleton instances of third-party libraries (e.g., Prisma Client, Stripe Client).
- **`prisma/`**: Contains the `schema.prisma` file defining the database models.

## 2. Technology Stack

- **Runtime Environment**: Node.js
- **Language**: TypeScript
- **Web Framework**: Express.js
- **Database**: MongoDB
- **ORM**: Prisma (`@prisma/client`)
- **Authentication**: Passport.js (GitHub & Google OAuth 2.0), JSON Web Tokens (JWT) stored in HTTP-only cookies.
- **Background Jobs**: `node-cron`
- **Billing & Subscriptions**: Stripe
- **Email & Notifications**: Resend (for emails), Axios (for Webhooks)
- **Logging**: Winston (with Daily Rotate File transport)
- **Security**: Helmet, Express Rate Limit

## 3. Features and Business Rules

### A. Authentication & Users
- **Mechanism**: OAuth 2.0 via GitHub or Google.
- **Session**: Upon successful OAuth callback, a JWT is generated containing the `userId`. This token is stored in an `httpOnly`, `lax` cookie named `token` with a 24-hour expiration.
- **Middleware**: The `auth` middleware extracts the JWT from the cookie, verifies it against `JWT_SECRET`, and attaches the `req.user` object to the request.
- **Plans**: Users are assigned a plan (`FREE`, `PRO`, `PRO_PLUS`), which dictates their limits across the platform.

### B. Monitors
Users can create monitors to track the uptime of HTTP endpoints or TCP ports.
- **Types**: `http` (supports custom methods, headers, body, assertions) or `tcp` (host, port).
- **Plan Limits**:
  - **FREE**: Maximum 1 monitor. Minimum frequency of 900 seconds. Maximum 3 regions.
  - **PRO**: Maximum 15 monitors. Minimum frequency of 60 seconds. Maximum 5 regions.
  - **PRO_PLUS**: Maximum 50 monitors. Minimum frequency of 30 seconds. Maximum 10 regions.
- **Access Control**: A user can only view, modify, or delete a monitor if they are the owner (`userId` match) OR if the monitor has been shared with a Team they belong to. Write operations require the `WRITE` role in that team. These checks are strictly enforced on the server for every request to prevent IDOR (Insecure Direct Object Reference) and plan bypassing.

### C. Background Uptime Checking (`uptimeCheck.ts`)
- **Cron Schedule**: Runs every 30 seconds (`*/30 * * * * *`).
- **Execution**: 
  1. Fetches all monitors with `status: 'RUNNING'`.
  2. Compares the current time with the monitor's `lastCheckedAt` cache. If the elapsed time exceeds the monitor's configured `frequency`, an uptime check is initiated.
  3. Dispatches HTTP/TCP requests to the target URL from the configured regions.
  4. If the endpoint is down (any region fails), a warning is logged, and an alert is dispatched via the associated `Notifier`.
- **Database Optimization**: Results are cached in memory. To reduce database write pressure, logs are batch-inserted into the `MonitorLog` table only after 10 checks have accumulated for a specific monitor.

### D. Notifiers
Channels through which users receive downtime alerts.
- **Types**: `Email` or `Webhook`.
- **Security**: Users can only create, test, modify, or delete their own notifiers.
- **Execution**: When a monitor fails, `notifierService.sendAlert` retrieves the notifier details. If it's an email, it uses the Resend API. If it's a webhook, it sends a standardized JSON payload via Axios.

### E. Teams and Collaboration
Allows users to share monitors with colleagues.
- **Plan Requirement**: The team admin (creator) must be on a `PRO` or `PRO_PLUS` plan.
- **Limits**: PRO admins can invite up to 20 members. PRO_PLUS admins can invite up to 50 members.
- **Roles**: Invited members are assigned a role (`READ` or `WRITE`).
- **Sharing**: The admin can assign monitors they own to the team. Members can then view (and modify, if they have `WRITE` access) those monitors.

### F. Status Pages
Public-facing pages displaying the uptime history of a specific monitor.
- **Configuration**: Mapped by a unique `subdomain`. Can be toggled public or private (`isPublic`).
- **Data**: The public route (`/public/:subdomain`) fetches the status page and the last 24 hours of logs to generate uptime charts on the frontend.

### G. Billing (Stripe)
- **Integration**: Handled via Stripe Webhooks (`stripeWebhook.ts`).
- **Security**: The raw request body is verified against the `STRIPE_WEBHOOK_SECRET` signature.
- **Events**:
  - `checkout.session.completed`: Updates the user's `stripeCustomerId` and assigns the `PRO` or `PRO_PLUS` plan based on the purchased product name.
  - `customer.subscription.updated` / `customer.subscription.deleted`: Automatically downgrades the user to `FREE` if a subscription is canceled or unpaid, and handles plan upgrades/downgrades.

### H. Log Vault (Log Sources)
- **Purpose**: Allows users to ingest custom logs via an API key.
- **Security**: Users generate an API key (`LogSource`). The ingestion endpoint expects this key in the `X-API-Key` header, validating it before accepting logs.

## 4. How to Run Locally

### Prerequisites
- Node.js (v20 or higher)
- pnpm (recommended)
- MongoDB Database (Local or Atlas)

### Environment Variables (`.env`)
Create a `.env` file in the `server` directory with the following keys:
```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000
DATABASE_URL=mongodb+srv://...
JWT_SECRET=your_super_secret_jwt_key
SESSION_SECRET=your_session_secret

# OAuth
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Integrations
RESEND_API_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

### Installation and Execution
1. **Install dependencies**:
   ```bash
   pnpm install
   ```
2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```
3. **Start Development Server** (Uses `tsx watch` for hot-reloading):
   ```bash
   pnpm run dev
   ```
4. **Build for Production**:
   ```bash
   pnpm run build
   ```
5. **Start Production Server**:
   ```bash
   pnpm run start
   ```
