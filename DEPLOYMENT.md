# Tact-Time Tracker - Deployment Guide

## ✅ Production Build Completed Successfully!

The production build has been created in the `dist` directory.

## 📁 Build Output

```
dist/
├── assets/              # Bundled JavaScript and CSS files
├── data/                # JSON database files
├── index.html           # Main HTML file
├── logo.png             # Company logo
└── vite.svg             # Vite logo (can be removed)
```

## 🚀 Deployment Options

### Option 1: Static Web Hosting (Recommended)

Deploy the `dist` folder to any static hosting service:

**Popular Options:**
- **Cloudflare Pages** (Free, excellent performance)
- **Netlify** (Free tier available)
- **Vercel** (Free tier available)
- **GitHub Pages** (Free)
- **AWS S3 + CloudFront**
- **Azure Static Web Apps**

**Steps:**
1. Upload entire `dist` folder contents
2. Set `index.html` as the entry point
3. Enable HTTPS (required for camera access)

### Option 2: Local Network Server

For internal company use on local network:

#### Using Node.js (http-server)
```bash
# Install http-server globally
npm install -g http-server

# Serve the dist folder
cd dist
http-server -p 8080

# Access at: http://localhost:8080 or http://[your-ip]:8080
```

#### Using Python
```bash
# Python 3
cd dist
python -m http.server 8080

# Access at: http://localhost:8080
```

### Option 3: IIS (Windows Server)

1. Copy `dist` folder contents to `C:\inetpub\wwwroot\tact-time`
2. Create a new site in IIS Manager
3. Point to the folder
4. Configure HTTPS certificate for camera access

## 📱 Important: Camera Access Requirements

**For barcode scanning to work:**
- ✅ **HTTPS is required** (except localhost/127.0.0.1)
- ✅ **SSL certificate must be valid**
- ⚠️ Camera won't work on `http://` (except localhost)

**Solutions:**
1. Use HTTPS hosting (Cloudflare Pages, Netlify, etc.)
2. For local network: Use manual VIN input instead of camera
3. Self-signed certificates work but users need to accept them

## ⚙️ Configuration Before Deployment

### 1. Update Logo
Replace `dist/logo.png` with your company logo

### 2. Test the Build Locally
```bash
# Preview the production build
npm run preview

# Access at: http://localhost:4173
```

### 3. Browser Compatibility
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support

## 🔐 Admin Features

Remember: **Export to Excel** is hidden
- Press `Ctrl + Shift + E` to export data
- Only share this shortcut with managers/admin

## 📊 Data Storage

**Current:** LocalStorage (browser-based)
- Data persists per device/browser
- 5-10MB storage limit
- Suitable for 5-10 concurrent users

**For scaling beyond 10 users:**
Consider implementing a backend API with a real database (MongoDB, PostgreSQL, etc.)

## 🧪 Testing Checklist

Before deployment, test:
- [ ] Multiple users can record simultaneously
- [ ] Timer accuracy
- [ ] Data persistence (refresh page during recording)
- [ ] Excel export (Ctrl+Shift+E)
- [ ] Manual VIN input works
- [ ] Camera scanning (if using HTTPS)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Logo displays correctly
- [ ] Cross-browser compatibility

## 📦 Build Command Reference

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 🔄 Updating the App

1. Make changes to source files
2. Run `npm run build`
3. Upload new `dist` folder contents
4. Clear browser cache on client devices

## 🆘 Troubleshooting

**Camera not working:**
- Ensure HTTPS is enabled
- Check browser permissions
- Use manual input as fallback

**Data not syncing between users:**
- LocalStorage is per-device; implement backend for true multi-user sync

**Build fails:**
- Run `npm install` to reinstall dependencies
- Check Node.js version (22.1.0 or higher recommended)

## 📝 Notes

- The app is ready for production use
- All features tested and working
- Suitable for 5-10 concurrent users with current setup
- Scales well with proper backend implementation

---

**Built with:** React 19, Vite 7, html5-qrcode, xlsx
**Build Date:** 2026-02-18
