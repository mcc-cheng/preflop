# 🃏 Preflop - Home Poker Payouts

A companion app for live home poker games. Track buy-ins, rebuys, and cashouts in real-time with automatic settlement calculation.

## Features

- **Real-time tracking**: Players buy-in, rebuy, and cash out during the game
- **Immutable audit log**: Complete history of all transactions
- **Smart settlement**: Minimizes number of transfers needed to settle debts
- **Private rooms**: Join with 6-character code
- **Host controls**: Only host can end room and trigger settlement

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js with credentials provider
- **Real-time**: Polling (2s interval) - simple and robust for MVP

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted)

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd preflop
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`

4. Initialize database:
```bash
npm run db:push
npm run db:seed
```

5. Start development server:
```bash
npm run dev
```

6. Open http://localhost:3000

### Demo Accounts

After seeding, you can login with:
- `alice@example.com` / `password` (Host)
- `bob@example.com` / `password`
- `charlie@example.com` / `password`

Demo room code: `DEMO01`

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth handlers

### Rooms
- `GET /api/rooms` - List user's rooms
- `POST /api/rooms` - Create new room
- `POST /api/rooms/join` - Join room by code
- `GET /api/rooms/[code]` - Get room details
- `POST /api/rooms/[code]/end` - End room (host only)

### Events
- `POST /api/rooms/[code]/events` - Create event (BUY_IN, REBUY, CASH_OUT)

### Settlement
- `GET /api/rooms/[code]/settlement` - Get settlement calculation

## Settlement Logic

Location: `lib/settlement.ts`

### Algorithm

1. **Calculate nets**: For each player, `net = cashOut - buyIn`
   - Positive = player is owed money (creditor)
   - Negative = player owes money (debtor)

2. **Greedy matching**: Match largest debtor with largest creditor
   - Minimizes number of transfers
   - Simple and transparent

3. **Output**: List of transfers `{ from, to, amount }`

### Example

```
Alice: -$150 (owes)
Bob: +$150 (owed)
Charlie: -$50 (owes)
```

Settlement:
- Alice pays Bob $150
- Charlie pays Bob $50

## Payments Integration (Stubbed)

Location: `lib/payments/provider.ts`

### Interface

```typescript
interface PaymentsProvider {
  authorizeAndHold(userId, amountCents, roomId): Promise<holdId>
  releaseHold(holdId): Promise<void>
  transfer(fromUserId, toUserId, amountCents, roomId): Promise<transferId>
}
```

### Current Implementation

MVP uses `MockPaymentsProvider` that logs actions to console. No real money is moved.

### Future: Real Payments

To integrate real payments:

1. **Bank linking**: Plaid Link
   - Users connect bank accounts
   - Verify account ownership

2. **Custody/Escrow**: During game
   - Authorize hold on buy-in amount
   - Hold funds in escrow (Stripe or similar)
   - Release on cash-out or game end

3. **Settlement transfers**: ACH via Stripe Connect
   - Execute computed settlement edges
   - Handle failures and retries

4. **Compliance**:
   - KYC/AML checks (required for money transmission)
   - Gambling legality (varies by jurisdiction)
   - Terms of service
   - Transaction limits

## Product Decisions

### MVP Scope
- ✅ No real money custody (payments stubbed)
- ✅ Manual cashout entry (future: photo of chips)
- ✅ USD only (future: multi-currency)
- ✅ Simple polling for updates (future: WebSockets)
- ✅ Amounts stored as integer cents (no floating point errors)

### Data Rules
- Events are **immutable** (append-only log)
- To correct mistakes, create reversing event or NOTE
- Host can end room; others cannot
- Room code is 6 uppercase alphanumeric chars

## Development

```bash
# Run dev server
npm run dev

# Database operations
npm run db:push        # Push schema changes
npm run db:migrate     # Create migration
npm run db:seed        # Seed with demo data
npm run db:studio      # Open Prisma Studio

# Build for production
npm run build
npm start
```

## Future Enhancements

- [ ] Plaid integration for bank linking
- [ ] Stripe Connect for ACH transfers
- [ ] Real-time updates via WebSockets
- [ ] Mobile app (React Native)
- [ ] Chip photo recognition (ML)
- [ ] Multi-currency support
- [ ] Tournament mode (bounties, rebuys limits)
- [ ] Analytics dashboard (ROI, win rate, etc.)
- [ ] Notifications (SMS/Push when your turn, settlement ready)
- [ ] Compliance: KYC/AML flows

## License

MIT
