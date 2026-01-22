# Setup Instructions

## 1. Create .env file

Create a `.env` file in the root directory with the following content:

```bash
# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/preflop?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="csZioK3VyCCCk5K0hVSGyZx49snpfrK3IDul+U03fXc="

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Important**: Update the `DATABASE_URL` with your actual PostgreSQL credentials!

## 2. Set up PostgreSQL

You need a PostgreSQL database running. Options:

### Option A: Local PostgreSQL
```bash
# macOS with Homebrew
brew install postgresql@15
brew services start postgresql@15
createdb preflop
```

### Option B: Docker
```bash
docker run --name preflop-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=preflop -p 5432:5432 -d postgres:15
```

### Option C: Cloud (Recommended for quick start)
Use a free PostgreSQL database from:
- [Supabase](https://supabase.com) - Free tier includes PostgreSQL
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [Railway](https://railway.app) - Simple deployment

Get the connection string and update `DATABASE_URL` in your `.env` file.

## 3. Initialize the database

```bash
# Push the schema to your database
npm run db:push

# Seed with demo data
npm run db:seed
```

## 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 5. Login with demo accounts

- **alice@example.com** / password (Host)
- **bob@example.com** / password
- **charlie@example.com** / password

Demo room code: **DEMO01**

## Troubleshooting

### "Can't reach database server"
- Make sure PostgreSQL is running
- Check your DATABASE_URL is correct
- Test connection: `psql <your-database-url>`

### "Environment variable not found: DATABASE_URL"
- Make sure you created the `.env` file in the project root
- Restart your dev server after creating `.env`

### Port 3000 already in use
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9
# Or use a different port
PORT=3001 npm run dev
```
