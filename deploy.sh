#!/bin/bash

echo "🚀 Deploying Tact-Time Tracker..."

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build production bundle
npm run build

# Restart PM2
pm2 restart ecosystem.config.cjs

echo "✅ Deployment complete!"
echo ""
pm2 status
