import * as XLSX from 'xlsx';
import { formatDurationMMSS } from './timer';

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Format a Date to dd/mm/yy */
const fmtDate = (d) => {
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yy = String(dt.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
};

/** Only include valid VINs (17+ chars) — same rule as analytics dashboard */
const isValidVin = (r) => r.vin && r.vin.trim().length >= 17;

// ─── Detail Export ────────────────────────────────────────────────────────────

/**
 * Export all records (one row per record) to Excel.
 * Only valid VINs (≥17 chars) are included.
 * @param {Array} records
 */
export const exportToExcel = (records) => {
    if (!records || records.length === 0) {
        alert('No data to export');
        return;
    }

    const validRecords = records.filter(isValidVin);
    if (validRecords.length === 0) {
        alert('No valid records to export (all entries are test/dummy VINs).');
        return;
    }

    const excelData = validRecords.map(record => ({
        'ID': record.id,
        'Date Created': new Date(record.dateCreated).toLocaleString(),
        'VIN Number': record.vin,
        'Category': record.category,
        'Start Time': new Date(record.startTime).toLocaleString(),
        'End Time': new Date(record.endTime).toLocaleString(),
        'Duration (MM:SS)': formatDurationMMSS(record.durationMinutes),
        'Duration (Seconds)': record.durationSeconds,
        'Break Time (MM:SS)': formatDurationMMSS((record.totalPausedTime || 0) / 60000),
        'Break Time (Seconds)': Math.round((record.totalPausedTime || 0) / 1000),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet['!cols'] = [
        { wch: 22 }, // ID
        { wch: 20 }, // Date Created
        { wch: 20 }, // VIN Number
        { wch: 15 }, // Category
        { wch: 20 }, // Start Time
        { wch: 20 }, // End Time
        { wch: 16 }, // Duration (MM:SS)
        { wch: 18 }, // Duration (Seconds)
        { wch: 18 }, // Break Time (MM:SS)
        { wch: 20 }, // Break Time (Seconds)
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tact Time Records');

    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `TactTime_Records_${date}.xlsx`);
};

// ─── VIN Summary Export ───────────────────────────────────────────────────────

/**
 * Export one row per unique VIN, summing duration and break time across all
 * categories. Status = "NG" if total duration > 10 minutes, else "OK".
 * Only valid VINs (≥17 chars) are included.
 * @param {Array} records
 */
export const exportVINSummary = (records) => {
    if (!records || records.length === 0) {
        alert('No data to export');
        return;
    }

    const validRecords = records.filter(isValidVin);
    if (validRecords.length === 0) {
        alert('No valid records to export (all entries are test/dummy VINs).');
        return;
    }

    // Group by VIN (case-insensitive, trimmed)
    const vinMap = new Map();
    for (const r of validRecords) {
        const key = r.vin.trim().toUpperCase();
        if (!vinMap.has(key)) {
            vinMap.set(key, {
                vin: r.vin.trim(),
                latestDate: r.dateCreated,
                categories: new Set(),
                totalDurationMinutes: 0,
                totalPausedMs: 0,
            });
        }
        const entry = vinMap.get(key);
        // Track the latest completion date for this VIN
        if (new Date(r.dateCreated) > new Date(entry.latestDate)) {
            entry.latestDate = r.dateCreated;
        }
        entry.categories.add(r.category);
        entry.totalDurationMinutes += parseFloat(r.durationMinutes) || 0;
        entry.totalPausedMs += parseFloat(r.totalPausedTime) || 0;
    }

    const excelData = Array.from(vinMap.values()).map(v => {
        const isNG = v.totalDurationMinutes > 10;
        return {
            'Date (dd/mm/yy)': fmtDate(v.latestDate),
            'VIN Number': v.vin,
            'Category': Array.from(v.categories).join(', '),
            'Duration (MM:SS)': formatDurationMMSS(v.totalDurationMinutes),
            'Break Time (MM:SS)': formatDurationMMSS(v.totalPausedMs / 60000),
            'Status': isNG ? 'NG' : 'OK',
        };
    });

    // Sort by date desc then VIN
    excelData.sort((a, b) => {
        if (a['Date (dd/mm/yy)'] < b['Date (dd/mm/yy)']) return 1;
        if (a['Date (dd/mm/yy)'] > b['Date (dd/mm/yy)']) return -1;
        return a['VIN Number'].localeCompare(b['VIN Number']);
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Style header row bold (basic)
    worksheet['!cols'] = [
        { wch: 14 }, // Date
        { wch: 20 }, // VIN Number
        { wch: 28 }, // Category
        { wch: 16 }, // Duration
        { wch: 16 }, // Break Time
        { wch: 8  }, // Status
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'VIN Summary');

    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `TactTime_VIN_Summary_${date}.xlsx`);
};
