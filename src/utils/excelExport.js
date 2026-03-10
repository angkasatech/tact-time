import * as XLSX from 'xlsx';
import { formatDurationMMSS } from './timer';

/**
 * Export records to Excel file.
 * Only includes valid VINs (17+ characters) — same filter as the analytics dashboard.
 * @param {Array} records - Array of record objects
 */
export const exportToExcel = (records) => {
    if (!records || records.length === 0) {
        alert('No data to export');
        return;
    }

    // Apply the same valid-VIN filter as the dashboard
    const validRecords = records.filter(r => r.vin && r.vin.trim().length >= 17);

    if (validRecords.length === 0) {
        alert('No valid records to export (all entries are test/dummy VINs).');
        return;
    }

    // Prepare data for Excel
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

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
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

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tact Time Records');

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `TactTime_Records_${date}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
};
