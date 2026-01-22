#!/bin/bash

echo "🎯 Finishing Preflop Setup"
echo "=========================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Run ./setup-database.sh first"
    exit 1
fi

# Check if DATABASE_URL looks like a real connection
if grep -q "localhost:5432" .env; then
    echo "⚠️  WARNING: You're using the placeholder database URL!"
    echo ""
    echo "Please update your .env file with a real database connection string."
    echo ""
    echo "Get a free database at:"
    echo "  • Neon: https://console.neon.tech"
    echo "  • Supabase: https://supabase.com/dashboard"
    echo ""
    read -p "Have you updated the DATABASE_URL in .env? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please update .env first, then run this script again."
        exit 0
    fi
fi

echo "📦 Step 1/3: Generating Prisma Client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo ""
echo "🗄️  Step 2/3: Setting up database schema..."
npm run db:push

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to set up database"
    echo ""
    echo "Common issues:"
    echo "  • Check your DATABASE_URL in .env"
    echo "  • Make sure the database exists and is accessible"
    echo "  • Verify network connection"
    exit 1
fi

echo ""
echo "🌱 Step 3/3: Seeding demo data..."
npm run db:seed

if [ $? -ne 0 ]; then
    echo "⚠️  Seeding failed (this is okay if you already seeded)"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Start the app with:"
echo "   npm run dev"
echo ""
echo "📝 Then open: http://localhost:3000"
echo ""
echo "🎮 Demo login:"
echo "   alice@example.com / password"
echo "   Room code: DEMO01"
echo ""
