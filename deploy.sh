#!/bin/bash

# Eduverse Automated Deployment Script
echo "🚀 Starting Deployment Process..."

# 1. Pull latest code from GitHub
echo "📥 Pulling latest changes from master..."
git pull origin master

# 2. Backend Deployment
echo "⚙️  Updating Backend..."
cd backend
npm install
npm run build
npx prisma db push
cd ..

# 3. Frontend Deployment
echo "🎨 Updating Frontend..."
cd frontend
npm install
npm run build
cd ..

# 4. Restart Services with PM2
echo "🔄 Restarting PM2 processes..."
pm2 restart ecosystem.config.js --update-env || pm2 start ecosystem.config.js --update-env
pm2 save

echo "✅ Deployment Successful! Eduverse is up and running."
echo "Backend: Port 3008"
echo "Frontend: Port 3009"
