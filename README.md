# 💰 Preflop - Poker Settlement Tracker

**Track buy-ins, cashouts, and settle up after poker night.**

> **Note:** Preflop is NOT a poker game. It's a money tracking app for when you play poker with physical chips and need to figure out who owes who at the end.

---

## 🎯 What It Does

Preflop solves the end-of-night settlement problem:
- ✅ Record all buy-ins and cashouts during the game
- ✅ Auto-calculate who owes who
- ✅ Minimize number of transfers
- ✅ Complete transaction audit log
- ✅ Track your performance over time

**It's like Splitwise, but specifically for poker night.**

---

## 🚀 Tech Stack

### Mobile App (Frontend)
- **React Native + Expo** - Cross-platform mobile
- **TypeScript** - Type safety
- **React Navigation** - Native navigation
- **Expo SecureStore** - Secure token storage

### Backend API
- **Next.js 14** (App Router)
- **PostgreSQL + Prisma** - Database
- **NextAuth.js** - Authentication
- **Neon** - Serverless Postgres

---

## 📱 Quick Start

### 1. Backend API

```bash
cd /Users/mingchuan/Desktop/preflop

# Install dependencies
npm install

# Set up .env (update DATABASE_URL)
cp .env.example .env

# Initialize database
npx prisma db push
npx tsx prisma/seed.ts

# Start backend
npm run dev
```

Backend runs at: `http://localhost:3000`

### 2. Mobile App

```bash
cd /Users/mingchuan/Desktop/preflop/mobile

# Install dependencies
npm install

# Start Expo
npx expo start
```

Then:
- **iOS**: Press `i` for simulator or scan QR with Expo Go app
- **Android**: Press `a` for emulator or scan with Expo Go app

---

## 🎮 How to Use

### 1. Create a Session
- Open app → "Create Room"
- Set game name (e.g., "Friday Night Poker")
- Set default buy-in amount
- Get 6-character code (e.g., "ABC123")

### 2. Players Join
- Others open app → "Join Room"
- Enter code → Joined!

### 3. Track Money
During the game, record transactions:
- **Buy In** - Player joins with $X
- **Rebuy** - Player adds more $X
- **Cash Out** - Player leaves with $X

All recorded with timestamps, can't be edited.

### 4. Live Dashboard
See in real-time:
- Each player's net position (+/-)
- Total money in vs out
- Complete transaction log
- Current standings

### 5. End & Settle
Host ends session:
- Auto-calculates final positions
- Shows who owes who
- Minimizes number of transfers
- Everyone's stats update automatically

---

## 📊 Features

### Core (MVP)
- ✅ User registration with username
- ✅ Create/join private rooms
- ✅ Track buy-ins, rebuys, cashouts
- ✅ Live dashboard with player positions
- ✅ Smart settlement algorithm
- ✅ Immutable transaction log
- ✅ Host-only room controls

### Social
- ✅ Friends system (search, add, requests)
- ✅ User profiles with stats
- ✅ Games played, hours, winnings
- ✅ Hourly win rate tracking

### Payments
- ✅ Store payment methods (Venmo, Zelle, Apple Pay)
- ✅ Set default payment
- ⏳ Real payment integration (future)

---

## 🗄️ Database Schema

```prisma
User {
  username, email, password
  paymentMethods[]
  stats
  friends[]
}

Room {
  code (6 chars)
  settings (name, buyIn, blinds)
  members[]
  events[]
  endedAt
}

Event {
  type: BUY_IN | REBUY | CASH_OUT
  amount (cents)
  timestamp
  user, room
}

UserStats {
  gamesPlayed
  hoursPlayed
  totalWinnings
  hourlyRate
}

PaymentMethod {
  type: VENMO | APPLE_PAY | ZELLE | etc
  identifier
  isDefault
}

Friendship {
  user <-> friend (bidirectional)
}
```

---

## 💡 Settlement Algorithm

**Goal:** Minimize number of transfers

**Algorithm:** Greedy matching
1. Calculate net for each player: `cashOut - buyIn`
2. Split into debtors (negative) and creditors (positive)
3. Sort both by amount (largest first)
4. Match largest debtor with largest creditor
5. Create transfer, reduce both amounts
6. Repeat until all settled

**Example:**
```
Alice: -$150 (owes)
Bob:   +$150 (owed)
Charlie: -$50 (owes)

Settlement:
- Alice → Bob $150
- Charlie → Bob $50
```

Code: `lib/settlement.ts`

---

## 📱 Mobile App Structure

```
mobile/
├── src/
│   ├── screens/
│   │   ├── auth/           # Login, Register, Welcome
│   │   ├── main/           # Rooms, Friends, Profile  
│   │   ├── rooms/          # Create, Join, Detail
│   │   └── profile/        # Settings, Stats
│   ├── navigation/         # Tab & Stack navigation
│   ├── context/            # Auth, state management
│   └── config/             # API endpoints
├── App.tsx                 # Entry point
└── app.json               # Expo config
```

---

## 🔌 API Endpoints

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/callback/credentials` - Login

### Rooms
- `GET /api/rooms` - List user's rooms
- `POST /api/rooms` - Create room
- `POST /api/rooms/join` - Join by code
- `GET /api/rooms/[code]` - Room details
- `POST /api/rooms/[code]/end` - End room (host only)

### Events
- `POST /api/rooms/[code]/events` - Record transaction

### Settlement
- `GET /api/rooms/[code]/settlement` - Calculate settlement

### Friends
- `GET /api/friends` - List friends
- `GET /api/friends/search` - Search users
- `POST /api/friends/requests` - Send request
- `POST /api/friends/requests/[id]` - Accept/decline

### Profile
- `GET /api/profile` - Get profile
- `PATCH /api/profile` - Update profile

### Payment Methods
- `GET /api/payment-methods` - List methods
- `POST /api/payment-methods` - Add method
- `DELETE /api/payment-methods/[id]` - Remove method

---

## 🎨 Design Principles

### Mobile-First
- Bottom tab navigation
- Large touch targets
- Thumb-friendly layout
- Native feel (iOS/Android)

### Dark Theme
- Easy on eyes during night games
- Matches poker aesthetic
- Better for OLED screens

### Clear Typography
- Important numbers are large
- Hierarchy clear
- Easy to scan quickly

### Minimal Input
- Defaults for common actions
- Quick entry for transactions
- Confirmation only when destructive

---

## 🚧 What's NOT Built (Future)

- [ ] Real payment integration (Plaid + Stripe)
- [ ] Push notifications
- [ ] Photo chip stack recognition
- [ ] In-app messaging
- [ ] Game invitations
- [ ] Tournament mode
- [ ] Multi-currency
- [ ] Leaderboards

---

## 📖 Documentation

- **MOBILE-APP-SETUP.md** - Mobile app guide
- **APP-DESCRIPTION.md** - Product overview
- **NEW-FEATURES.md** - Feature list
- **WHATS-NEW.md** - Recent updates

---

## 🐛 Troubleshooting

**Backend won't start:**
```bash
npx prisma generate
npm run dev
```

**Mobile can't connect:**
- Ensure backend is running
- Check same WiFi network
- Update `mobile/app.json` → `extra.apiUrl`

**Database errors:**
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

---

## 📝 Demo Accounts

```
alice@example.com / password
bob@example.com / password
charlie@example.com / password

Room code: DEMO01
```

---

## 🏗️ Build for Production

### iOS
```bash
cd mobile
eas build --platform ios
eas submit --platform ios
```

### Android
```bash
eas build --platform android
eas submit --platform android
```

---

## 📄 License

MIT

---

## 🎯 Remember

**Preflop is a settlement tracker, not a poker game.**

It tracks money during your real poker game and helps you settle up fairly at the end. That's all it does!
