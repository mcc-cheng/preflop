# Get Your Free Database

## 🚀 Fastest: Neon (Recommended)

**Takes 2 minutes, no credit card needed**

1. **Go to**: https://console.neon.tech
2. **Sign up** with GitHub or email (free)
3. **Create a project**:
   - Name: "Preflop" (or anything)
   - Region: Choose closest to you
   - Click "Create Project"
4. **Get connection string**:
   - After project is created, you'll see a connection string
   - It looks like: `postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`
   - Click "Copy" next to the connection string

5. **Paste it below** (keep reading)

---

## Alternative: Supabase

1. **Go to**: https://supabase.com/dashboard
2. **Sign up** (free)
3. **New project**:
   - Name: "Preflop"
   - Database password: (choose one, save it)
   - Region: Choose closest
   - Click "Create new project" (takes ~2 min to provision)
4. **Get connection string**:
   - Go to Settings (gear icon) → Database
   - Scroll to "Connection string"
   - Select "URI" tab
   - Copy the connection string
   - **Important**: Replace `[YOUR-PASSWORD]` with your actual password

---

## ✅ Once You Have Your Connection String

### Create `.env` file:

In your terminal:

```bash
cd /Users/mingchuan/Desktop/preflop
cat > .env << 'EOF'
DATABASE_URL="PASTE_YOUR_CONNECTION_STRING_HERE"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="csZioK3VyCCCk5K0hVSGyZx49snpfrK3IDul+U03fXc="
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EOF
```

**Then edit the file** to replace `PASTE_YOUR_CONNECTION_STRING_HERE` with your actual connection string:

```bash
nano .env
# or
code .env
# or
open -e .env
```

### Initialize database:

```bash
npm run db:push
npm run db:seed
```

### Start the app:

```bash
npm run dev
```

Open http://localhost:3000 🎉

---

## 🆘 Need Help?

**Connection string format:**
```
postgresql://username:password@host:port/database?params
```

**Common issues:**

1. **"Can't reach database"**
   - Check your connection string is complete
   - Make sure there's no extra spaces or quotes
   - Verify the database is actually created

2. **"SSL required"**
   - Add `?sslmode=require` to the end of your connection string

3. **Still stuck?**
   - Run: `./setup-database.sh` (automated setup)
   - Or ping me for help!
