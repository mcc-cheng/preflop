# 🚀 START HERE - Complete Setup Guide

## 🎯 Two Options to Get Running

---

## ⚡ Option 1: Automated Setup (Recommended)

Just run this command and follow the prompts:

```bash
cd /Users/mingchuan/Desktop/preflop
./setup-database.sh
```

The script will:
1. Help you choose a database provider
2. Create your `.env` file
3. Set up the database
4. Seed demo data
5. You're done! 🎉

**Then just run:**
```bash
npm run dev
```

---

## 📝 Option 2: Manual Setup

### Step 1: Get a Free Database (2 minutes)

#### Using Neon (Fastest):

1. Visit: **https://console.neon.tech**
2. Click "Sign up" → Use GitHub or Email (no credit card)
3. Click "Create a project"
   - Name: `Preflop`
   - Region: Choose closest to you
   - Click "Create"
4. **Copy the connection string** shown on screen
   - Looks like: `postgresql://neondb_owner:xxxxx@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require`
   - Click the copy icon next to it

#### Or using Supabase:

1. Visit: **https://supabase.com/dashboard**
2. Sign up → "New project"
   - Name: `Preflop`
   - Database Password: Create one (save it!)
   - Region: Choose closest
   - Click "Create new project" (takes ~2 min)
3. Once ready: Settings (⚙️) → Database
4. Scroll to "Connection string" → URI tab
5. Copy it and **replace `[YOUR-PASSWORD]`** with the password you created

### Step 2: Create .env File

**Create a file named `.env`** in the project root with this content:

```bash
DATABASE_URL="PASTE_YOUR_CONNECTION_STRING_HERE"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="csZioK3VyCCCk5K0hVSGyZx49snpfrK3IDul+U03fXc="
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Replace** `PASTE_YOUR_CONNECTION_STRING_HERE` with the connection string you copied.

**Quick way in terminal:**

```bash
cd /Users/mingchuan/Desktop/preflop

# Create .env file (you'll need to edit it after)
cat > .env << 'EOF'
DATABASE_URL="PASTE_YOUR_CONNECTION_STRING_HERE"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="csZioK3VyCCCk5K0hVSGyZx49snpfrK3IDul+U03fXc="
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EOF

# Then edit it
nano .env
# or
code .env
# or
open -e .env
```

### Step 3: Initialize Database

```bash
npm run db:push
```

You should see:
```
✔ Your database is now in sync with your Prisma schema.
```

### Step 4: Add Demo Data

```bash
npm run db:seed
```

You should see:
```
🌱 Seeding database...
✅ Created users
✅ Created room: DEMO01
✅ Created sample events
```

### Step 5: Start the App!

```bash
npm run dev
```

Look for:
```
✓ Ready in 2s
Local: http://localhost:3000
```

**Open** http://localhost:3000 in your browser 🎉

---

## 🎮 Try It Out!

### Demo Accounts:
- **alice@example.com** / password (Host - can end games)
- **bob@example.com** / password (Player)
- **charlie@example.com** / password (Player)

### Demo Room:
- Code: **DEMO01**
- Already has some buy-ins and cashouts

### Test Flow:
1. Login as Alice
2. Click "My Rooms" → Open DEMO01
3. See the live dashboard with player positions
4. Click "Buy In" to add a buy-in
5. Click "Preview Settlement" to see who owes whom
6. Click "End Room" to finalize (host only)

---

## 🔧 Common Issues

### "Can't reach database server"

**Cause**: Database URL is wrong or database isn't ready

**Fix**:
1. Check your `.env` file - no extra spaces or quotes
2. Verify the connection string is complete
3. If Supabase, make sure you replaced `[YOUR-PASSWORD]`
4. Try connecting manually: `psql "YOUR_DATABASE_URL"`

### ".env file not found"

**Cause**: File needs to be in project root

**Fix**:
```bash
cd /Users/mingchuan/Desktop/preflop
ls -la .env  # Should show the file
```

If not there, create it (see Step 2 above)

### "Module not found" errors

**Cause**: Prisma client not generated

**Fix**:
```bash
npx prisma generate
npm run dev
```

### Port 3000 already in use

**Fix**:
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### "Invalid `prisma.user.findUnique()`"

**Cause**: Database schema not pushed

**Fix**:
```bash
npm run db:push
npm run db:seed
```

---

## 📁 Project Overview

```
preflop/
├── app/              # Next.js pages & API routes
├── components/       # React components
├── lib/
│   ├── settlement.ts   # ⭐ Settlement algorithm
│   └── payments/       # ⭐ Payment interface (stubbed)
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── seed.ts         # Demo data
└── .env              # Your config (create this!)
```

---

## 🎯 What You're Building

This is an **MVP poker payouts tracker** with:

✅ **Complete ledger system** - Track all buy-ins/cashouts
✅ **Smart settlement** - Minimizes transfers between players  
✅ **Real-time updates** - See changes as they happen (2s polling)
✅ **Audit log** - Immutable record of all transactions
✅ **Stubbed payments** - Interface ready for Plaid/Stripe

**For MVP**: No real money moves - it's a tracking ledger only.

**For Production**: Replace `MockPaymentsProvider` with real payment integration.

---

## 📚 More Resources

- **RUN-ME-FIRST.md** - Quick reference
- **GET-DATABASE.md** - Detailed database setup
- **SETUP.md** - Full setup guide
- **QUICKSTART.md** - Feature overview
- **README.md** - Complete documentation

---

## 🆘 Still Stuck?

1. Check if all steps completed without errors
2. Verify `.env` file exists and has real database URL
3. Try the automated setup: `./setup-database.sh`
4. Check the other docs in the repo

---

**Ready to go? Run this:**

```bash
cd /Users/mingchuan/Desktop/preflop
./setup-database.sh
```

**Or if you already have .env set up:**

```bash
npm run db:push && npm run db:seed && npm run dev
```

🎉 **You got this!**
