# Subscription Overload Manager — PRD

## Original problem statement
Full-stack web application to help users manage, track, and optimize recurring digital subscriptions. Solves: subscription overload, lack of expense awareness, missed renewals, unused subscriptions.

User-stated stack: **Node.js + MongoDB + React + Recharts**, light theme default with toggle, JWT auth, Resend for email (verification, forgot password, instant test email button).

## Architecture
- Backend: Node.js + Express + Mongoose (MongoDB), running on `0.0.0.0:8001`. Bootstrapped from `server.py` (1-line `os.execvp` shim) because the platform's supervisor command is locked to uvicorn — exec replaces the process so supervisor keeps the same PID with Node behind it. **No Python business logic.**
- Frontend: React (CRA + craco) + Recharts + Sonner toasts + Tailwind + Shadcn primitives.
- DB: MongoDB local via `MONGO_URL` (preserved from env).
- Email: Resend SDK, `onboarding@resend.dev` default sender.

## Core features implemented (Apr 26, 2026)
### Auth
- Register, login, logout, me — JWT (HS256) returned as both httpOnly cookie and Bearer token (dual fallback for cross-site preview cookies).
- Email verification flow with token + 24h expiry, resend verification, dashboard banner if unverified.
- Forgot password / reset password (token, 1h expiry, no user enumeration).
- bcryptjs password hashing.

### Subscriptions
- CRUD with serviceName, cost, billingCycle (monthly/yearly), renewalDate, category (OTT/SaaS/Cloud/Fitness/Music/News/Learning/Gaming/Other), status (active/cancelled/expired), lastPaymentDate, notes.
- Filters: category, status, search (regex), minCost, maxCost.
- Sorts: renewal asc/desc, cost asc/desc, name.
- Payment simulation endpoint that recomputes next billing date based on cycle.

### Dashboard
- KPIs: monthly spend, yearly spend, active count, upcoming renewals (7-day window).
- Recharts: cumulative spending trend line, category pie, monthly bar.
- Budget vs spending with progress bar, over-budget alert + suggestion.
- Upcoming renewals list (next 5).

### Notifications
- In-app feed (renewal / budget / system / email types).
- Auto-created on subscription add and test-email send.
- Mark single read, mark all read, delete.

### Profile
- Update name / email (re-verifies if changed) / profile picture URL / monthly budget.
- Change password with current password verification.
- Email verification status indicator + resend button.

### Email check button (top-bar)
- "Email check" button in header sends an instant test email to the signed-in user's address via Resend.
- Toast feedback + notification entry on success.

### UI / UX
- Light default + dark toggle (persists to localStorage), earthy palette (moss green / terracotta / sand).
- Work Sans (headings) + IBM Plex Sans (body).
- Sidebar nav, sticky topbar, Shadcn-styled forms, Lucide icons.
- All interactive elements have `data-testid` attributes.

## Backlog (P1)
- [ ] Cron-driven email reminders 2 days before renewal (currently in-app only; the `node-cron` dep is installed and ready).
- [ ] Spending insights ML / "cancel suggestions" with usage signals.
- [ ] CSV export of subscriptions.
- [ ] Multi-currency support.

## Backlog (P2)
- [ ] Shared family / household subscriptions.
- [ ] Mobile push via web push.
- [ ] Two-factor auth.

## Test credentials
See `/app/memory/test_credentials.md`.
