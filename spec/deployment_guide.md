# Zero Downtime Deployment & Production Guide

This guide outlines the steps to move your BeacnAI/ZeroDowntime application from a local development environment to a production environment on **Vercel**.

## 1. Architectural Adjustments for Vercel

Vercel uses **Serverless Functions** (AWS Lambda) to host Express servers. This means your server is not "always on."

### 🚨 The Cron Job Issue
Your current `node-cron` setup in `uptimeCheck.ts` will **not work** on Vercel because the process is killed after every request.

**Solution: Vercel Cron Jobs**
1.  **Expose an Endpoint**: We must create a secure POST route (e.g., `/api/cron/uptime`) that triggers the check.
2.  **Configure `vercel.json`**: Add a cron schedule to ping this endpoint.
    ```json
    {
      "crons": [{
        "path": "/api/cron/uptime",
        "schedule": "*/1 * * * *"
      }]
    }
    ```

## 2. Stripe Production Checklist

Before going live, you must complete these steps in the Stripe Dashboard:

- [ ] **Switch to Live Mode**: Ensure "Test Mode" is toggled OFF.
- [ ] **API Keys**: Update `STRIPE_SECRET_KEY` in Vercel with your live secret key.
- [ ] **Webhook Endpoint**: 
    - URL: `https://your-api.vercel.app/api/stripe/webhook`
    - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
- [ ] **Webhook Secret**: Update `STRIPE_WEBHOOK_SECRET` with the new `whsec_...` key.
- [ ] **Product Naming**: Ensure your "Pro Plus" product name in Stripe contains the word **"plus"** (case-insensitive) to match the server logic.

## 3. Environment Variables (Vercel Dashboard)

Add these to your **Vercel Project Settings > Environment Variables**:

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | Your MongoDB Atlas production string. |
| `JWT_SECRET` | A long, random string (at least 32 chars). |
| `GITHUB_CLIENT_ID` | Production ID from GitHub Developer settings. |
| `GITHUB_CLIENT_SECRET` | Production Secret from GitHub. |
| `GOOGLE_CLIENT_ID` | Production ID from Google Cloud Console. |
| `GOOGLE_CLIENT_SECRET` | Production Secret from Google Cloud Console. |
| `CLIENT_URL` | Your frontend URL (e.g., `https://beacnai.com`). |
| `SERVER_URL` | Your backend URL. |
| `AWS_ACCESS_KEY_ID` | AWS key with Lambda Invoke permissions. |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key. |
| `RESEND_API_KEY` | Live API key from Resend. |
| `EMAIL_SOURCE` | Your verified domain email (e.g., `alerts@beacnai.com`). |
| `STRIPE_SECRET_KEY` | Stripe Live Secret Key. |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Signing Secret (`whsec_...`). |
| `CRON_SECRET` | **Required**: A secret token to protect your cron endpoint from public abuse. |

## 4. Third-Party Console Updates

### GitHub / Google OAuth
Update your **Callback URLs** to point to your production server:
- `https://your-api.vercel.app/api/auth/github/callback`
- `https://your-api.vercel.app/api/auth/google/callback`

### MongoDB Atlas
- Go to **Network Access**.
- Add IP Address `0.0.0.0/0` (required for Vercel since their IPs are dynamic) OR use a static IP proxy if higher security is required.

## 5. Deployment Commands

1.  **Prisma**: Ensure `npx prisma generate` is part of your build command.
    *   Build Command: `npx prisma generate && tsc`
2.  **Vercel CLI**:
    ```bash
    # From the root or server directory
    vercel --prod
    ```
