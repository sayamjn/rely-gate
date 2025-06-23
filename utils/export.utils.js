class ExportUtils {
  // Generate CSV from data array
  static generateCSV(data, headers = null) {
    if (!data || data.length === 0) {
      throw new Error('No data provided for export');
    }

    const csvHeaders = headers || Object.keys(data[0]);
    const csvRows = [csvHeaders.join(',')];
    
    data.forEach(row => {
      const values = csvHeaders.map(header => {
        const value = row[header] || '';
        const stringValue = value.toString();
        
        // Escape quotes and wrap in quotes if contains comma, quotes, or newlines
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  // Generate Excel-compatible CSV with BOM
  static generateExcelCSV(data, headers = null) {
    const csvContent = this.generateCSV(data, headers);
    // Add BOM for Excel compatibility
    return '\uFEFF' + csvContent;
  }

  // Validate export filters
  static validateExportFilters(filters) {
    const errors = [];

    if (filters.fromDate && filters.toDate) {
      const fromDate = new Date(filters.fromDate);
      const toDate = new Date(filters.toDate);
      
      if (fromDate > toDate) {
        errors.push('From date cannot be later than to date');
      }

      // Limit export range to 1 year
      const daysDiff = (toDate - fromDate) / (1000 * 60 * 60 * 24);
      if (daysDiff > 365) {
        errors.push('Export date range cannot exceed 365 days');
      }
    }

    return errors;
  }
}

module.exports = {
  ExportUtils
};