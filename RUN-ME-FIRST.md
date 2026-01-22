# 🚀 Run Me First!

## Quick Start (Choose One Path)

### 🤖 Path A: Automated Setup (Easiest)

Run this single command:

```bash
./setup-database.sh
```

It will guide you through everything!

---

### 📝 Path B: Manual Setup (3 steps)

#### Step 1: Get a Free Database

**Using Neon (Recommended - 2 minutes):**

1. Go to: **https://console.neon.tech**
2. Sign up (free, no credit card)
3. Create a new project
4. Copy the connection string (looks like `postgresql://...`)

**Or using Supabase:**

1. Go to: **https://supabase.com/dashboard**
2. Sign up → New project
3. Go to Settings → Database
4. Copy the URI connection string

#### Step 2: Create .env File

```bash
# Copy the template
cp .env.template .env

# Edit it with your database URL
nano .env
# or
code .env
# or just open it in any text editor
```

Replace the `DATABASE_URL` line with your actual connection string.

#### Step 3: Initialize & Run

```bash
# Set up database
npm run db:push
npm run db:seed

# Start the app
npm run dev
```

---

## ✅ You're Ready When You See:

```
✓ Ready in 2.3s
○ Compiling / ...
✓ Compiled / in 1.2s
```

Then open: **http://localhost:3000**

---

## 🎮 Demo Login

- **alice@example.com** / password (Host)
- **bob@example.com** / password
- **charlie@example.com** / password

Room code: **DEMO01**

---

## 🆘 Troubleshooting

**"Command not found: ./setup-database.sh"**
```bash
chmod +x setup-database.sh
./setup-database.sh
```

**"Can't reach database server"**
- Check your DATABASE_URL in .env
- Make sure you copied the full connection string
- No extra spaces or quotes

**"Module not found"**
```bash
npm install
npx prisma generate
```

**Still stuck?**
- Check `GET-DATABASE.md` for detailed database setup
- Check `SETUP.md` for full setup guide
- Check `QUICKSTART.md` for overview
