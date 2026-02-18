# Tact-Time Tracker - Quick Reference

## 📸 Camera Access on HTTP
The barcode scanner uses **html5-qrcode** library which supports camera access on:
- ✅ `http://localhost:5174/`
- ✅ `http://127.0.0.1:5174/`
- ✅ `https://` (any HTTPS domain)
- ⚠️ `http://` (other IPs/domains) - Browser may block camera for security

**Note:** Modern browsers restrict camera access on non-HTTPS connections except localhost. If deploying to a server, use HTTPS for full camera support.

## 🎨 Logo Setup

**Location:** `d:\4.0\Apps\tact-time\public\logo.png`

1. Replace the placeholder file with your company logo
2. Recommended format: PNG with transparent background
3. Maximum display size: 120px × 80px (auto-resizes)
4. Logo appears in top-right corner of dashboard

## 🔐 Admin Features

**Hidden Export Button:**
- Press `Ctrl + Shift + E` on the dashboard to export data to Excel
- This feature is hidden from regular users
- Only admin/managers who know the shortcut can export

## 🎯 App Features

1. **Start Recording:** Click "Start New Recording" button
2. **Scan VIN:** Use camera or manual input
3. **Select Category:** Mechanic, Paint, Running, or From Final
4. **Timer:** Automatically tracks duration
5. **Finish:** Click "Finish Recording" to save
6. **Multi-User:** Up to 5+ users can work simultaneously
7. **Real-time Updates:** See other users' completions instantly

## 🚀 Running the App

```bash
# Start development server
npm run dev

# App runs at:
http://localhost:5174/
```

## 📊 Data Storage
- Active recordings: LocalStorage
- Completed records: LocalStorage (cross-tab sync)
- Format: JSON with all required fields
