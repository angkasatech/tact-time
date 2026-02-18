# Linux Production Deployment Guide with PM2

## 🚀 Complete Deployment Steps

### 1. **Server Prerequisites**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v20+ recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

### 2. **Clone and Setup**

```bash
# Navigate to your app directory (e.g., /var/www)
cd /var/www

# Clone the repository
git clone https://github.com/angkasatech/tact-time.git
cd tact-time

# Install dependencies
npm install

# Build the production bundle
npm run build
```

### 3. **Configure Port (Optional)**

Edit `ecosystem.config.js` to change the port:

```javascript
"env": {
  "NODE_ENV": "production",
  "PORT": 8080  // Change to your desired port
}
```

### 4. **Start with PM2**

```bash
# Create logs directory
mkdir -p logs

# Start the app with PM2
pm2 start ecosystem.config.js

# Or start directly:
pm2 start server.js --name tact-time
```

### 5. **Verify & Monitor**

```bash
# Check status
pm2 status

# View logs
pm2 logs tact-time

# Monitor in real-time
pm2 monit
```

### 6. **Setup PM2 Auto-Startup**

```bash
# Generate startup script
pm2 startup

# Save current PM2 process list
pm2 save

# Now PM2 will auto-start on server reboot
```

## 🔧 PM2 Management Commands

```bash
# Start
pm2 start tact-time

# Stop
pm2 stop tact-time

# Restart
pm2 restart tact-time

# Delete from PM2
pm2 delete tact-time

# View detailed info
pm2 show tact-time

# View logs
pm2 logs tact-time --lines 100

# Clear logs
pm2 flush
```

## 🔄 Updating the App

When you push new changes to GitHub:

```bash
# On the server
cd /var/www/tact-time

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Rebuild
npm run build

# Restart PM2
pm2 restart tact-time

# Or use PM2 reload (zero-downtime)
pm2 reload tact-time
```

## 🌐 Configure Nginx (Recommended)

For better performance and HTTPS support:

### Install Nginx

```bash
sudo apt install -y nginx
```

### Create Nginx Config

Create `/etc/nginx/sites-available/tact-time`:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # For large uploads (if needed)
        client_max_body_size 10M;
    }
}
```

### Enable the site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/tact-time /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Enable HTTPS with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

## 📊 Monitoring & Logs

### PM2 Monitoring

```bash
# Install PM2 web dashboard (optional)
pm2 install pm2-server-monit

# Or use PM2 Plus (free tier)
pm2 link your-secret-key your-public-key
```

### Log Rotation

```bash
# Install PM2 log rotate
pm2 install pm2-logrotate

# Configure (keep logs for 7 days)
pm2 set pm2-logrotate:retain 7
```

## 🔒 Security Best Practices

```bash
# Create dedicated user
sudo useradd -m -s /bin/bash tacttime
sudo usermod -aG www-data tacttime

# Move app to user directory
sudo mv /var/www/tact-time /home/tacttime/
sudo chown -R tacttime:tacttime /home/tacttime/tact-time

# Run PM2 as tacttime user
sudo su - tacttime
cd /home/tacttime/tact-time
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

## 🔥 Firewall Configuration

```bash
# Allow HTTP & HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# If not using Nginx, allow your app port
sudo ufw allow 8080/tcp

# Enable firewall
sudo ufw enable
```

## 🎯 Quick Start Script

Save this as `deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Deploying Tact-Time Tracker..."

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Restart PM2
pm2 restart tact-time

echo "✅ Deployment complete!"
pm2 status
```

Make it executable:
```bash
chmod +x deploy.sh
```

Run deployment:
```bash
./deploy.sh
```

## 📋 Troubleshooting

### App won't start
```bash
# Check logs
pm2 logs tact-time --err

# Try manual start
node server.js
```

### Port already in use
```bash
# Find process using port 8080
sudo lsof -i :8080

# Kill it
sudo kill -9 <PID>
```

### PM2 not starting on reboot
```bash
# Regenerate startup script
pm2 unstartup
pm2 startup
pm2 save
```

## 📞 Support

Your app is now running on:
- **Direct:** `http://your-server-ip:8080`
- **With Nginx:** `http://your-domain.com`
- **With HTTPS:** `https://your-domain.com`

**PM2 Dashboard:** `pm2 monit` or install PM2 Plus for web interface

---

**Built with PM2, Express, React, and Vite**
**Deployment Date:** 2026-02-18
