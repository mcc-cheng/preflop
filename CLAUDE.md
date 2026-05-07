# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Preflop** is a poker settlement tracker — a hybrid full-stack platform for tracking buy-ins, rebuys, and cashouts during poker games, then auto-calculating who owes whom with minimal transfers.

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server on port 3000
npm run build        # Generate Prisma client + Next.js production build
npm run start        # Start production server
npm run lint         # Run Next.js ESLint

# Database
npm run db:push      # Sync Prisma schema to database (no migration files)
npm run db:migrate   # Create and apply a new migration
npm run db:seed      # Seed demo data (alice, bob, charlie + room DEMO01)
npm run db:studio    # Open Prisma Studio GUI at localhost:5555
```

Mobile app (in `mobile/`):
```bash
npx expo start       # Start Expo dev server
```

Setup scripts (in `scripts/`):
```bash
./scripts/setup-database.sh   # Interactive database setup
./scripts/finish-setup.sh     # Run after configuring .env
./scripts/fix-file-limit.sh   # Fix macOS "too many open files" error
```

## Architecture

### Stack
- **Backend**: Next.js App Router (API routes + server components)
- **Auth**: NextAuth.js v4 with JWT strategy and credentials provider (bcryptjs)
- **Database**: PostgreSQL via Neon (serverless), Prisma 5 ORM
- **Validation**: Zod schemas for all API request bodies
- **Mobile**: React Native + Expo, using Axios for HTTP, SecureStore for token storage

### Key directories
- `app/api/` — All API routes (15+ endpoints)
- `lib/` — Core business logic: `settlement.ts` (algorithm), `auth.ts` (NextAuth config + `getCurrentUser()`), `api.ts` (response helpers, Zod schemas, `validatePaymentIdentifier()`), `prisma.ts` (singleton client)
- `components/` — React UI components (EventModal, SettlementView, QRCode, etc.)
- `prisma/schema.prisma` — 12 models: User, Room, RoomMember, Event, CashOutRequest, Settlement, PaymentMethod, UserStats, Friendship, FriendRequest
- `mobile/src/` — Expo app with screens, navigation (tab + stack), AuthContext
- `docs/` — Project documentation
- `scripts/` — Setup and utility shell scripts

### Data model conventions
- **Money is always stored in cents** (integers). Divide by 100 for display only. This prevents floating-point rounding errors in settlement math.
- All event records are append-only (no edits). Transactions are immutable.
- Room codes are unique 6-character alphanumeric strings.

### Cash-out approval flow
Non-host players cannot cash out directly. When a player submits a CASH_OUT:
1. API validates amount ≤ table balance (totalBuyIns − totalCashOuts)
2. Creates a `CashOutRequest` (PENDING) instead of an Event
3. Host sees a pending requests panel and can approve or reject
4. On approve: balance re-checked inside a **Serializable** transaction, then Event created atomically
5. On room end: all remaining PENDING requests are auto-rejected

### Settlement algorithm (`lib/settlement.ts`)
Greedy matching: compute each player's net (cashOut − buyIns), split into debtors and creditors sorted by magnitude, match largest pairs. The result is stored as a JSON array of transfer edges in the `Settlement` table.

### API patterns
- All routes call `requireAuth()` (from `lib/auth.ts`) before any data access — it returns the current user or throws a 401.
- Room-scoped endpoints verify membership before returning data.
- `handleApiError()` (from `lib/api.ts`) is the centralized error handler — never return raw `error.message`.
- Request bodies are validated with Zod schemas defined in `lib/api.ts`.
- `validatePaymentIdentifier(type, identifier)` enforces per-platform rules for all payment method writes.

### Payment method identifier rules
| Type | Rule |
|---|---|
| Venmo | 5–30 chars; letters/numbers/periods/hyphens; must start and end with letter or number |
| Cash App | Optional `$` prefix; 1–20 chars; must start with a letter; letters/numbers/underscores |
| Zelle | Valid email or phone number |
| Apple Pay | Valid email or phone number |
| PayPal | 1–20 char username or email address |
| Bank Transfer | 2–120 chars (free-form) |
| Debit Card | Exactly 4 digits |

### Auth flow
Credentials provider → bcrypt verify → JWT token (no session table). Registration is a 2-step flow: account info (phone required) → payment methods (minimum 2 required before accessing the app).

### Security notes
- Payment method `type` is immutable after creation — cannot be changed via PATCH.
- Registration duplicate errors return a generic message (no field-level enumeration).
- `maxPlayers` is enforced at join time.

## Environment Variables

Required in `.env`:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `NEXTAUTH_URL` — e.g. `http://localhost:3000`
- `NEXTAUTH_SECRET` — JWT signing key
- `NEXT_PUBLIC_APP_URL` — Used by the mobile app to point at the API

## Demo Accounts (after `npm run db:seed`)

| Email | Password | Default Payment |
|---|---|---|
| alice@example.com | password | Venmo |
| bob@example.com | password | Apple Pay |
| charlie@example.com | password | Zelle |

Room code: `DEMO01`
