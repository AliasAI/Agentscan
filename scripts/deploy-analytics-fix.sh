#!/bin/bash
# Deploy analytics integer overflow fix
# Run this script on the production server

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════╗"
echo "║         Deploying Analytics Fix to Production            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Change to project directory
cd /home/ubuntu/Agentscan || { echo "❌ Project directory not found"; exit 1; }

# Show current branch and commit
echo "📍 Current status:"
git branch --show-current
git log -1 --oneline
echo ""

# Fetch and pull latest changes
echo "📥 Pulling latest changes from dev branch..."
git fetch origin
git checkout dev
git pull origin dev

echo ""
echo "📝 Latest commit:"
git log -1 --oneline
echo ""

# Restart backend container
echo "🔄 Restarting backend container..."
docker compose restart backend

# Wait for backend to start
echo ""
echo "⏳ Waiting for backend to initialize (10 seconds)..."
sleep 10

# Check container status
echo ""
echo "📊 Container status:"
docker compose ps backend

# Test the analytics endpoint
echo ""
echo "🧪 Testing analytics endpoint..."
echo ""

response=$(curl -s "http://localhost:8080/api/analytics/overview?days=30&limit=10")
if echo "$response" | grep -q "stats"; then
    echo "✅ Analytics endpoint working!"
    echo ""
    echo "Sample response:"
    echo "$response" | head -50
else
    echo "⚠️  Response:"
    echo "$response" | head -100
fi

# Check logs for errors
echo ""
echo "📋 Recent backend logs:"
docker compose logs --tail=20 backend

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                    ✅ Deployment Complete                 ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Public endpoint:"
echo "http://43.199.214.110:8080/api/analytics/overview?days=30&limit=10"
echo ""
