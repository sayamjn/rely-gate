const cron = require('node-cron');
const EmailReportService = require('./emailReport.service');
const moment = require('moment-timezone');

class CronJobService {
  static initializeJobs() {
    // Schedule daily email report at 9:00 PM IST (UTC+5:30)
    // Cron expression: 0 30 15 * * * (3:30 PM UTC = 9:00 PM IST)
    cron.schedule('0 30 15 * * *', async () => {
      console.log('Starting daily email report cron job at', moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss IST'));
      
      try {
        await CronJobService.sendDailyEmailReports();
        console.log('Daily email report cron job completed successfully');
      } catch (error) {
        console.error('Error in daily email report cron job:', error);
      }
    }, {
      timezone: 'UTC'
    });

    console.log('Cron jobs initialized - Daily email reports scheduled for 9:00 PM IST');
  }

  static async sendDailyEmailReports() {
    try {
      // Get previous day's date in IST
      const reportDate = moment().tz('Asia/Kolkata').subtract(1, 'day').format('YYYY-MM-DD');
      
      console.log(`Sending daily email reports for date: ${reportDate}`);

      // Get all tenants that have email report recipients configured
      const tenants = await EmailReportService.getTenantsWithEmailRecipients();
      
      if (!tenants || tenants.length === 0) {
        console.log('No tenants found with email recipients configured');
        return;
      }

      // Send reports for each tenant
      for (const tenant of tenants) {
        try {
          console.log(`Sending email report for tenant: ${tenant.TenantName} (ID: ${tenant.TenantID})`);
          
          // Call the email service to send the daily report
          await EmailReportService.sendDailyReportForTenant(tenant.TenantID, reportDate);
          
          console.log(`Email report sent successfully for tenant: ${tenant.TenantName}`);
        } catch (tenantError) {
          console.error(`Error sending email report for tenant ${tenant.TenantName}:`, tenantError);
          // Continue with other tenants even if one fails
        }
      }

    } catch (error) {
      console.error('Error in sendDailyEmailReports:', error);
      throw error;
    }
  }

  // Method to manually trigger the daily report (for testing)
  static async triggerDailyReportManually(date = null) {
    const reportDate = date || moment().tz('Asia/Kolkata').subtract(1, 'day').format('YYYY-MM-DD');
    console.log(`Manually triggering daily email reports for date: ${reportDate}`);
    
    return await CronJobService.sendDailyEmailReports();
  }
}

module.exports = CronJobService;