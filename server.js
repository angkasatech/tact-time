// Tact-Time Tracker - Production Server with REST API
// Managed by PM2

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// In production (PM2), PORT=8080 is set via ecosystem.config.cjs
// In dev, use 3001 to avoid conflict with Vite preview (8080)
const PORT = process.env.PORT || 3001;

// Data file path - lives at project root/data/, survives builds
const DATA_DIR = path.join(__dirname, 'data');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(RECORDS_FILE)) {
    fs.writeFileSync(RECORDS_FILE, JSON.stringify({ records: [] }, null, 2));
    console.log('Created data/records.json');
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// ─── API Routes ────────────────────────────────────────────────────────────────

// GET /api/records - Return all records
app.get('/api/records', (req, res) => {
    try {
        const raw = fs.readFileSync(RECORDS_FILE, 'utf8');
        const data = JSON.parse(raw);
        res.json(data.records || []);
    } catch (err) {
        console.error('Error reading records:', err);
        res.status(500).json({ error: 'Failed to read records' });
    }
});

// POST /api/records - Append a new record
app.post('/api/records', (req, res) => {
    try {
        const newRecord = req.body;

        if (!newRecord || !newRecord.vin || !newRecord.category) {
            return res.status(400).json({ error: 'Invalid record data' });
        }

        // Read current records
        const raw = fs.readFileSync(RECORDS_FILE, 'utf8');
        const data = JSON.parse(raw);
        const records = data.records || [];

        // Append new record
        records.push(newRecord);

        // Write back atomically (write to temp file, then rename)
        const tempFile = RECORDS_FILE + '.tmp';
        fs.writeFileSync(tempFile, JSON.stringify({ records }, null, 2));
        fs.renameSync(tempFile, RECORDS_FILE);

        console.log(`Record saved: ${newRecord.vin} - ${newRecord.category}`);
        res.status(201).json({ success: true, record: newRecord });
    } catch (err) {
        console.error('Error saving record:', err);
        res.status(500).json({ error: 'Failed to save record' });
    }
});

// ─── SPA Fallback ──────────────────────────────────────────────────────────────

// Must be AFTER API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ─── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tact-Time Tracker running on port ${PORT}`);
    console.log(`Data file: ${RECORDS_FILE}`);
});
