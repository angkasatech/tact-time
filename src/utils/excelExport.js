import * as XLSX from 'xlsx';

/**
 * Export records to Excel file
 * @param {Array} records - Array of record objects
 */
export const exportToExcel = (records) => {
    if (!records || records.length === 0) {
        alert('No data to export');
        return;
    }

    // Prepare data for Excel
    const excelData = records.map(record => ({
        'ID': record.id,
        'Date Created': new Date(record.dateCreated).toLocaleString(),
        'VIN Number': record.vin,
        'Category': record.category,
        'Start Time': new Date(record.startTime).toLocaleString(),
        'End Time': new Date(record.endTime).toLocaleString(),
        'Duration (Seconds)': record.durationSeconds,
        'Duration (Minutes)': record.durationMinutes
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
        { wch: 20 }, // ID
        { wch: 20 }, // Date Created
        { wch: 20 }, // VIN Number
        { wch: 15 }, // Category
        { wch: 20 }, // Start Time
        { wch: 20 }, // End Time
        { wch: 18 }, // Duration (Seconds)
        { wch: 18 }  // Duration (Minutes)
    ];

    worksheet['!cols'] = columnWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tact Time Records');

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `TactTime_Records_${date}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
};
