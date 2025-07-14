class DateFormatter {
  // Format date and time as "DD/MM/YYYY HH12:MI AM"
  static formatDateTime(date) {
    if (!date) return null;
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).replace(',', '');
  }

  // Format just date as "DD/MM/YYYY"
  static formatDate(date) {
    if (!date) return null;
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric"
    });
  }

  // Format just time as "HH:MM AM/PM"
  static formatTime(date) {
    if (!date) return null;
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  }

  // PostgreSQL format string for date and time
  static get PG_DATETIME_FORMAT() {
    return 'DD/MM/YYYY HH12:MI AM';
  }

  // PostgreSQL format string for date only
  static get PG_DATE_FORMAT() {
    return 'DD/MM/YYYY';
  }

  // PostgreSQL format string for time only
  static get PG_TIME_FORMAT() {
    return 'HH12:MI AM';
  }
}

module.exports = DateFormatter;