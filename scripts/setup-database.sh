#!/bin/bash

# Preflop Database Setup Script
# This script helps you set up your database connection

echo "🃏 Preflop Database Setup"
echo "========================"
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

echo "📊 Getting your database connection string..."
echo ""
echo "Choose a database option:"
echo "1) Neon (Recommended - Serverless PostgreSQL, Free tier)"
echo "2) Supabase (PostgreSQL with extras, Free tier)"
echo "3) I have my own PostgreSQL URL"
echo ""
read -p "Select option (1-3): " db_option

DATABASE_URL=""

case $db_option in
    1)
        echo ""
        echo "🚀 Setting up with Neon:"
        echo "1. Go to: https://console.neon.tech"
        echo "2. Sign up (free, no credit card needed)"
        echo "3. Create a new project"
        echo "4. Copy the connection string (it starts with postgresql://)"
        echo ""
        read -p "Paste your Neon connection string here: " DATABASE_URL
        ;;
    2)
        echo ""
        echo "🚀 Setting up with Supabase:"
        echo "1. Go to: https://supabase.com/dashboard"
        echo "2. Sign up (free, no credit card needed)"
        echo "3. Create a new project"
        echo "4. Go to Settings > Database"
        echo "5. Copy the 'Connection string' (URI format)"
        echo ""
        read -p "Paste your Supabase connection string here: " DATABASE_URL
        ;;
    3)
        echo ""
        read -p "Paste your PostgreSQL connection string: " DATABASE_URL
        ;;
    *)
        echo "Invalid option. Exiting."
        exit 1
        ;;
esac

# Validate DATABASE_URL
if [[ ! $DATABASE_URL =~ ^postgresql:// ]]; then
    echo "❌ Invalid connection string. Must start with 'postgresql://'"
    exit 1
fi

# Generate NextAuth secret
echo ""
echo "🔐 Generating secure NextAuth secret..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Create .env file
cat > .env << EOF
# Database
DATABASE_URL="$DATABASE_URL"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EOF

echo ""
echo "✅ .env file created successfully!"
echo ""

# Test database connection
echo "🔍 Testing database connection..."
npx prisma db execute --stdin <<< "SELECT 1;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
else
    echo "⚠️  Could not verify connection (this is okay, we'll try during setup)"
fi

echo ""
echo "📦 Setting up database schema..."
npm run db:push

if [ $? -eq 0 ]; then
    echo "✅ Database schema created!"
    echo ""
    echo "🌱 Seeding demo data..."
    npm run db:seed
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 Setup complete!"
        echo ""
        echo "You can now run:"
        echo "  npm run dev"
        echo ""
        echo "Demo accounts:"
        echo "  alice@example.com / password (Host)"
        echo "  bob@example.com / password"
        echo "  charlie@example.com / password"
        echo ""
        echo "Demo room code: DEMO01"
    fi
else
    echo "❌ Database setup failed. Please check your connection string."
    exit 1
fi
