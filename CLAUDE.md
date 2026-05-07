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

## Architecture

### Stack
- **Backend**: Next.js App Router (API routes + server components)
- **Auth**: NextAuth.js v4 with JWT strategy and credentials provider (bcryptjs)
- **Database**: PostgreSQL via Neon (serverless), Prisma 5 ORM
- **Validation**: Zod schemas for all API request bodies
- **Mobile**: React Native + Expo, using Axios for HTTP, SecureStore for token storage

### Key directories
- `app/api/` — All API routes (15+ endpoints)
- `lib/` — Core business logic: `settlement.ts` (algorithm), `auth.ts` (NextAuth config + `getCurrentUser()`), `api.ts` (response helpers + Zod schemas), `prisma.ts` (singleton client)
- `components/` — React UI components (EventModal, SettlementView, QRCode, etc.)
- `prisma/schema.prisma` — 11 models: User, Room, RoomMember, Event, Settlement, PaymentMethod, UserStats, Friendship, FriendRequest
- `mobile/src/` — Expo app with screens, navigation (tab + stack), AuthContext

### Data model conventions
- **Money is always stored in cents** (integers). Divide by 100 for display only. This prevents floating-point rounding errors in settlement math.
- All event records are append-only (no edits). Transactions are immutable.
- Room codes are unique 6-character alphanumeric strings.

### Settlement algorithm (`lib/settlement.ts`)
Greedy matching: compute each player's net (cashOut − buyIns), split into debtors and creditors sorted by magnitude, match largest pairs. The result is stored as a JSON array of transfer edges in the `Settlement` table.

### API patterns
- All routes call `requireAuth()` (from `lib/auth.ts`) before any data access — it returns the current user or throws a 401.
- Room-scoped endpoints verify membership before returning data.
- `handleApiError()` (from `lib/api.ts`) is the centralized error handler.
- Request bodies are validated with Zod schemas defined in `lib/api.ts`.

### Auth flow
Credentials provider → bcrypt verify → JWT token (no session table). Protected pages use NextAuth `useSession` on the client or `getServerSession` on the server.

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
