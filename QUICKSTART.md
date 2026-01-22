# 🃏 Preflop - Quick Start Guide

## ✅ What's Implemented

Your complete MVP is ready with:

### Core Features
- ✅ Email/password authentication with NextAuth
- ✅ Create private poker rooms with join codes
- ✅ Real-time buy-in, rebuy, and cashout tracking
- ✅ Live player dashboard with current positions
- ✅ Immutable audit log of all events
- ✅ Smart settlement algorithm (greedy matching)
- ✅ Host controls (end room, view settlement)
- ✅ Responsive UI with Tailwind CSS

### Tech Stack
- ✅ Next.js 14 (App Router)
- ✅ TypeScript
- ✅ Prisma + PostgreSQL
- ✅ NextAuth.js
- ✅ Tailwind CSS
- ✅ Real-time updates (2s polling)

### Payment Integration (Stubbed)
- ✅ `PaymentsProvider` interface
- ✅ `MockPaymentsProvider` implementation
- ✅ Ready for Plaid + Stripe integration

## 🚀 Get Started in 3 Steps

### 1. Create `.env` file

Create a file named `.env` in the project root:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/preflop?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="csZioK3VyCCCk5K0hVSGyZx49snpfrK3IDul+U03fXc="
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Update `DATABASE_URL`** with your PostgreSQL connection string!

**Quick Database Options:**
- **Supabase** (free): https://supabase.com
- **Neon** (free): https://neon.tech
- **Local**: `brew install postgresql && createdb preflop`

### 2. Initialize Database

```bash
npm run db:push    # Create tables
npm run db:seed    # Add demo data
```

### 3. Start the App

```bash
npm run dev
```

Open **http://localhost:3000**

## 🎮 Try It Out

### Demo Accounts
- **alice@example.com** / password (Host)
- **bob@example.com** / password
- **charlie@example.com** / password

### Demo Room
- Code: **DEMO01**
- Already has sample events loaded

### Flow to Test
1. Login as Alice
2. Go to rooms → Open DEMO01
3. See existing events and player positions
4. Click "Buy In" or "Rebuy" to add events
5. Click "Preview Settlement" to see transfers
6. Click "End Room" to finalize (host only)

## 📁 Project Structure

```
preflop/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth + registration
│   │   └── rooms/        # Room management, events, settlement
│   ├── rooms/            # UI pages
│   │   ├── [code]/       # Live room dashboard
│   │   ├── new/          # Create room
│   │   └── join/         # Join by code
│   ├── login/            # Auth pages
│   └── page.tsx          # Landing page
├── components/           # React components
│   ├── EventModal.tsx    # Buy-in/rebuy/cashout modal
│   ├── SettlementView.tsx # Settlement preview
│   └── LogoutButton.tsx
├── lib/
│   ├── settlement.ts     # ⭐ Settlement algorithm
│   ├── payments/
│   │   └── provider.ts   # ⭐ Payment interface (stubbed)
│   ├── auth.ts           # Auth helpers
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Utilities
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Demo data
└── README.md             # Full documentation
```

## 🎯 Key Files to Know

### Settlement Logic
**File**: `lib/settlement.ts`

```typescript
getPlayerNets(roomId)       // Calculate net positions
computeSettlement(nets)     // Minimize transfers (greedy)
saveSettlement(roomId)      // Store in DB
```

**Algorithm**: Greedy matching - pairs largest debtor with largest creditor to minimize number of transfers.

### Payments (Stubbed)
**File**: `lib/payments/provider.ts`

```typescript
interface PaymentsProvider {
  authorizeAndHold(userId, amount, roomId)  // Hold funds
  releaseHold(holdId)                       // Release hold
  transfer(fromUserId, toUserId, amount)    // Transfer money
}
```

**Current**: `MockPaymentsProvider` logs to console.
**Future**: Replace with real Plaid + Stripe implementation.

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create account |
| `/api/auth/[...nextauth]` | POST | Login |
| `/api/rooms` | GET | List user's rooms |
| `/api/rooms` | POST | Create room |
| `/api/rooms/join` | POST | Join by code |
| `/api/rooms/[code]` | GET | Room details |
| `/api/rooms/[code]/events` | POST | Add event |
| `/api/rooms/[code]/end` | POST | End room (host) |
| `/api/rooms/[code]/settlement` | GET | Get settlement |

## 💡 Product Decisions

### What's Included (MVP)
- ✅ Ledger + settlement engine (complete)
- ✅ Stubbed payments (interface ready)
- ✅ Real-time updates (polling every 2s)
- ✅ Amounts stored as cents (no float errors)
- ✅ Immutable event log (append-only)

### What's Stubbed for Later
- ⏳ Real money custody (Plaid + Stripe)
- ⏳ Bank account linking
- ⏳ ACH transfers
- ⏳ KYC/AML compliance
- ⏳ Chip photo recognition (ML)

### Design Decisions
- **No real money**: MVP is ledger-only, no actual transfers
- **Manual cashouts**: Player enters amount (future: chip photo)
- **USD only**: Multi-currency support later
- **Polling for updates**: Simple & robust (WebSockets later)
- **Host controls**: Only host can end room

## 🔧 Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Run production build

npm run db:push      # Push schema changes
npm run db:migrate   # Create migration
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio
```

## 🚨 Troubleshooting

**Database connection failed?**
- Check your `DATABASE_URL` in `.env`
- Make sure PostgreSQL is running
- Try: `psql <your-database-url>`

**Port 3000 in use?**
```bash
lsof -ti:3000 | xargs kill -9
# or
PORT=3001 npm run dev
```

**.env not found?**
- Create it in project root (same folder as package.json)
- Restart dev server after creating

## 🎉 Next Steps

1. Test the demo flow with sample accounts
2. Create your own room and invite players
3. Update `DATABASE_URL` if using local PostgreSQL
4. Deploy to Vercel (optional)
5. Plan real payments integration

## 📞 Need Help?

- See `SETUP.md` for detailed setup instructions
- See `README.md` for full documentation
- Check `lib/settlement.ts` for settlement logic
- Check `lib/payments/provider.ts` for payment interface

---

**Built with ❤️ for home poker players**
