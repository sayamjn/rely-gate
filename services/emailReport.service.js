const EmailReportModel = require('../models/emailReport.model');
const AnalyticsService = require('./analytics.service');
const responseUtils = require('../utils/constants');
const nodemailer = require('nodemailer');
const PdfPrinter = require('pdfmake');
const moment = require('moment-timezone');

class EmailReportService {
  // Get email recipients for tenant
  static async getEmailRecipients(tenantId) {
    try {
      const recipients = await EmailReportModel.getEmailRecipients(tenantId);
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: recipients,
        responseMessage: 'Email recipients retrieved successfully'
      };
    } catch (error) {
      console.error('Error getting email recipients:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to retrieve email recipients'
      };
    }
  }

  // Add email recipient  
  static async addEmailRecipient(tenantId, recipientEmail, recipientName, userId) {
    try {
      // Check if email already exists
      const exists = await EmailReportModel.emailExists(tenantId, recipientEmail);
      if (exists) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ALREADY_EXISTS,
          responseMessage: 'Email already exists for this tenant'
        };
      }

      const recipient = await EmailReportModel.addEmailRecipient(tenantId, recipientEmail, recipientName, userId);
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: recipient,
        responseMessage: 'Email recipient added successfully'
      };
    } catch (error) {
      console.error('Error adding email recipient:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to add email recipient'
      };
    }
  }

  // Delete email recipient
  static async deleteEmailRecipient(recipientId, tenantId, userId) {
    try {
      const deleted = await EmailReportModel.deleteEmailRecipient(recipientId, tenantId, userId);
      if (!deleted) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'Recipient not found or already deleted'
        };
      }

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        responseMessage: 'Email recipient deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting email recipient:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to delete email recipient'
      };
    }
  }

  // Generate and send daily report
  static async generateAndSendDailyReport(tenantId, date = null) {
    try {
      // Get recipients
      const recipients = await EmailReportModel.getEmailRecipients(tenantId);
      if (recipients.length === 0) {
        return {
          responseCode: responseUtils.RESPONSE_CODES.ERROR,
          responseMessage: 'No email recipients found for this tenant'
        };
      }

      // Get current date in DD/MM/YYYY format for API
      const currentDate = moment().tz('Asia/Kolkata').format('DD/MM/YYYY');
      
      // Get tenant info, stats, purpose-based analytics, and trend data
      const [tenantInfo, stats, visitorPurposes, staffPurposes, studentPurposes, gatePassPurposes, trendData] = await Promise.all([
        EmailReportModel.getTenantInfo(tenantId),
        EmailReportModel.getDailyStats(tenantId, date),
        EmailReportModel.getVisitorPurposeStats(tenantId, date),
        EmailReportModel.getStaffPurposeStats(tenantId, date),
        EmailReportModel.getStudentPurposeStats(tenantId, date),
        EmailReportModel.getGatePassPurposeStats(tenantId, date),
        AnalyticsService.getTrendByCategory(tenantId, currentDate, currentDate)
      ]);

      const analyticsData = {
        visitorPurposes,
        staffPurposes,
        studentPurposes,
        gatePassPurposes,
        trendData: trendData?.data || []
      };

      // Generate PDF
      const pdfBuffer = await this.generatePDF(tenantInfo, stats, analyticsData, date);

      // Send emails
      const emailResults = await this.sendEmails(recipients, pdfBuffer, tenantInfo, stats, analyticsData, date);

      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: {
          recipientCount: recipients.length,
          emailResults,
          statistics: stats,
          analytics: analyticsData
        },
        responseMessage: `Daily report sent to ${recipients.length} recipients`
      };
    } catch (error) {
      console.error('Error generating and sending daily report:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to generate and send daily report'
      };
    }
  }

  // Generate PDF report
  static async generatePDF(tenantInfo, stats, analyticsData, date) {
    const reportDate = date || moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
    const formattedDate = moment(reportDate).format('MMMM DD, YYYY');

    const fonts = {
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };

    const printer = new PdfPrinter(fonts);

    console.log("tenantInfo: ", tenantInfo)

    // Build PDF content dynamically
    const content = [
      // Header
      { text: `Daily Statistics Report`, style: 'header', alignment: 'center' },
      { text: tenantInfo?.tenantname || 'Unknown Tenant', style: 'subheader', alignment: 'center' },
      { text: formattedDate, style: 'date', alignment: 'center', margin: [0, 0, 0, 20] },
      
      // Summary Table
      { text: 'Summary', style: 'sectionHeader' },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            [
              { text: 'Total Check-ins', style: 'tableHeader' },
              { text: 'Total Check-outs', style: 'tableHeader' },
              { text: 'Currently Inside', style: 'tableHeader' }
            ],
            [
              { text: this.getTotalCheckins(stats).toString(), alignment: 'center' },
              { text: this.getTotalCheckouts(stats).toString(), alignment: 'center' },
              { text: this.getTotalInside(stats).toString(), alignment: 'center' }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },

      // Module wise statistics
      { text: 'Module-wise Statistics', style: 'sectionHeader' },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*', '*'],
          body: [
            [
              { text: 'Module', style: 'tableHeader' },
              { text: 'Check-ins', style: 'tableHeader' },
              { text: 'Check-outs', style: 'tableHeader' },
              { text: 'Currently Inside', style: 'tableHeader' }
            ],
            [
              'Visitors',
              { text: stats.visitor_checkins?.toString() || '0', alignment: 'center' },
              { text: stats.visitor_checkouts?.toString() || '0', alignment: 'center' },
              { text: stats.visitor_inside?.toString() || '0', alignment: 'center' }
            ],
            [
              'Staff',
              { text: stats.staff_checkins?.toString() || '0', alignment: 'center' },
              { text: stats.staff_checkouts?.toString() || '0', alignment: 'center' },
              { text: stats.staff_inside?.toString() || '0', alignment: 'center' }
            ],
            [
              'Students',
              { text: stats.student_checkins?.toString() || '0', alignment: 'center' },
              { text: stats.student_checkouts?.toString() || '0', alignment: 'center' },
              { text: stats.student_inside?.toString() || '0', alignment: 'center' }
            ],
            [
              'Buses',
              { text: stats.bus_checkins?.toString() || '0', alignment: 'center' },
              { text: stats.bus_checkouts?.toString() || '0', alignment: 'center' },
              { text: stats.bus_inside?.toString() || '0', alignment: 'center' }
            ],
            [
              'Gate Pass',
              { text: stats.gatepass_checkins?.toString() || '0', alignment: 'center' },
              { text: stats.gatepass_checkouts?.toString() || '0', alignment: 'center' },
              { text: stats.gatepass_inside?.toString() || '0', alignment: 'center' }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      }
    ];

    // Add detailed module tables with purpose data
    if (analyticsData) {
      content.push({ text: 'Detailed Module Reports', style: 'sectionHeader', pageBreak: 'before' });

      // Visitors Table
      if (analyticsData.visitorPurposes && analyticsData.visitorPurposes.length > 0) {
        content.push(
          { text: 'Visitors', style: 'moduleHeader' },
          {
            table: {
              headerRows: 1,
              widths: ['*', '*', '*', '*'],
              body: [
                [
                  { text: 'Purpose', style: 'tableHeader' },
                  { text: 'Check-ins', style: 'tableHeader' },
                  { text: 'Check-outs', style: 'tableHeader' },
                  { text: 'Currently Inside', style: 'tableHeader' }
                ],
                ...analyticsData.visitorPurposes.map(purpose => [
                  purpose.purpose_name,
                  { text: purpose.checkin_count.toString(), alignment: 'center' },
                  { text: purpose.checkout_count.toString(), alignment: 'center' },
                  { text: Math.max(0, purpose.checkin_count - purpose.checkout_count).toString(), alignment: 'center' }
                ])
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 20]
          }
        );
      } else {
        // Show table with no purpose data
        content.push(
          { text: 'Visitors', style: 'moduleHeader' },
          {
            table: {
              headerRows: 1,
              widths: ['*', '*', '*', '*'],
              body: [
                [
                  { text: 'Purpose', style: 'tableHeader' },
                  { text: 'Check-ins', style: 'tableHeader' },
                  { text: 'Check-outs', style: 'tableHeader' },
                  { text: 'Currently Inside', style: 'tableHeader' }
                ],
                [
                  '-',
                  { text: stats.visitor_checkins?.toString() || '0', alignment: 'center' },
                  { text: stats.visitor_checkouts?.toString() || '0', alignment: 'center' },
                  { text: Math.max(0, stats.visitor_inside) || '0', alignment: 'center' }
                ]
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 20]
          }
        );
      }

      // Staff Table
      if (analyticsData.staffPurposes && analyticsData.staffPurposes.length > 0) {
        content.push(
          { text: 'Staff', style: 'moduleHeader' },
          {
            table: {
              headerRows: 1,
              widths: ['*', '*', '*', '*'],
              body: [
                [
                  { text: 'Purpose', style: 'tableHeader' },
                  { text: 'Check-ins', style: 'tableHeader' },
                  { text: 'Check-outs', style: 'tableHeader' },
                  { text: 'Currently Inside', style: 'tableHeader' }
                ],
                ...analyticsData.staffPurposes.map(purpose => [
                  purpose.purpose_name,
                  { text: purpose.checkin_count.toString(), alignment: 'center' },
                  { text: purpose.checkout_count.toString(), alignment: 'center' },
                  { text: Math.max(0, purpose.checkin_count - purpose.checkout_count).toString(), alignment: 'center' }
                ])
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 20]
          }
        );
      } else {
        content.push(
          { text: 'Staff', style: 'moduleHeader' },
          {
            table: {
              headerRows: 1,
              widths: ['*', '*', '*', '*'],
              body: [
                [
                  { text: 'Purpose', style: 'tableHeader' },
                  { text: 'Check-ins', style: 'tableHeader' },
                  { text: 'Check-outs', style: 'tableHeader' },
                  { text: 'Currently Inside', style: 'tableHeader' }
                ],
                [
                  '-',
                  { text: stats.staff_checkins?.toString() || '0', alignment: 'center' },
                  { text: stats.staff_checkouts?.toString() || '0', alignment: 'center' },
                  { text: Math.max(0, stats.staff_inside) || '0', alignment: 'center' }
                ]
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 20]
          }
        );
      }

      // Students Table
      if (analyticsData.studentPurposes && analyticsData.studentPurposes.length > 0) {
        content.push(
          { text: 'Students', style: 'moduleHeader' },
          {
            table: {
              headerRows: 1,
              widths: ['*', '*', '*', '*'],
              body: [
                [
                  { text: 'Purpose', style: 'tableHeader' },
                  { text: 'Check-ins', style: 'tableHeader' },
                  { text: 'Check-outs', style: 'tableHeader' },
                  { text: 'Currently Inside', style: 'tableHeader' }
                ],
                ...analyticsData.studentPurposes.map(purpose => [
                  purpose.purpose_name,
                  { text: purpose.checkin_count.toString(), alignment: 'center' },
                  { text: purpose.checkout_count.toString(), alignment: 'center' },
                  { text: Math.max(0, purpose.checkin_count - purpose.checkout_count).toString(), alignment: 'center' }
                ])
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 20]
          }
        );
      } else {
        content.push(
          { text: 'Students', style: 'moduleHeader' },
          {
            table: {
              headerRows: 1,
              widths: ['*', '*', '*', '*'],
              body: [
                [
                  { text: 'Purpose', style: 'tableHeader' },
                  { text: 'Check-ins', style: 'tableHeader' },
                  { text: 'Check-outs', style: 'tableHeader' },
                  { text: 'Currently Inside', style: 'tableHeader' }
                ],
                [
                  '-',
                  { text: stats.student_checkins?.toString() || '0', alignment: 'center' },
                  { text: stats.student_checkouts?.toString() || '0', alignment: 'center' },
                  { text: Math.max(0, stats.student_inside) || '0', alignment: 'center' }
                ]
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 20]
          }
        );
      }

      // Buses Table (Bus purpose data is usually minimal, so we'll show a simple table)
      content.push(
        { text: 'Buses', style: 'moduleHeader' },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', '*', '*'],
            body: [
              [
                { text: 'Purpose', style: 'tableHeader' },
                { text: 'Check-ins', style: 'tableHeader' },
                { text: 'Check-outs', style: 'tableHeader' },
                { text: 'Currently Inside', style: 'tableHeader' }
              ],
              [
                'Bus Operations',
                { text: stats.bus_checkins?.toString() || '0', alignment: 'center' },
                { text: stats.bus_checkouts?.toString() || '0', alignment: 'center' },
                { text: Math.max(0, stats.bus_inside) || '0', alignment: 'center' }
              ]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20]
        }
      );

      // Gate Pass Table
      if (analyticsData.gatePassPurposes && analyticsData.gatePassPurposes.length > 0) {
        content.push(
          { text: 'Gate Pass', style: 'moduleHeader' },
          {
            table: {
              headerRows: 1,
              widths: ['*', '*', '*', '*'],
              body: [
                [
                  { text: 'Purpose', style: 'tableHeader' },
                  { text: 'Check-ins', style: 'tableHeader' },
                  { text: 'Check-outs', style: 'tableHeader' },
                  { text: 'Currently Inside', style: 'tableHeader' }
                ],
                ...analyticsData.gatePassPurposes.map(purpose => [
                  purpose.purpose_name,
                  { text: purpose.checkin_count.toString(), alignment: 'center' },
                  { text: purpose.checkout_count.toString(), alignment: 'center' },
                  { text: Math.max(0, purpose.checkin_count - purpose.checkout_count).toString(), alignment: 'center' }
                ])
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 20]
          }
        );
      } else {
        content.push(
          { text: 'Gate Pass', style: 'moduleHeader' },
          {
            table: {
              headerRows: 1,
              widths: ['*', '*', '*', '*'],
              body: [
                [
                  { text: 'Purpose', style: 'tableHeader' },
                  { text: 'Check-ins', style: 'tableHeader' },
                  { text: 'Check-outs', style: 'tableHeader' },
                  { text: 'Currently Inside', style: 'tableHeader' }
                ],
                [
                  '-',
                  { text: stats.gatepass_checkins?.toString() || '0', alignment: 'center' },
                  { text: stats.gatepass_checkouts?.toString() || '0', alignment: 'center' },
                  { text: Math.max(0, stats.gatepass_inside) || '0', alignment: 'center' }
                ]
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 20]
          }
        );
      }
    }


    // Footer
    content.push({
      text: `Generated on: ${moment().tz('Asia/Kolkata').format('MMMM DD, YYYY [at] hh:mm A [IST]')}`,
      style: 'footer',
      alignment: 'center',
      margin: [0, 20, 0, 0]
    });

    const docDefinition = {
      content,
      styles: {
        header: { fontSize: 20, bold: true, color: '#2c3e50' },
        subheader: { fontSize: 16, bold: true, color: '#34495e' },
        date: { fontSize: 12, color: '#7f8c8d' },
        sectionHeader: { fontSize: 14, bold: true, color: '#2c3e50', margin: [0, 20, 0, 10] },
        moduleHeader: { fontSize: 13, bold: true, color: '#2c3e50', margin: [0, 15, 0, 8] },
        tableHeader: { fontSize: 12, bold: true, color: 'white', fillColor: '#3498db' },
        totalRow: { fontSize: 11, bold: true, fillColor: '#ecf0f1' },
        footer: { fontSize: 10, color: '#7f8c8d' }
      }
    };

    return new Promise((resolve, reject) => {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks = [];
      
      pdfDoc.on('data', chunk => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      
      pdfDoc.end();
    });
  }

  // Send emails to recipients
  static async sendEmails(recipients, pdfBuffer, tenantInfo, stats, analyticsData, date) {
    // Gmail SMTP configuration
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: 'admin@relyhealthtech.com',
        pass: 'jatccmxktmzmbtdf'
      }
    });

    const reportDate = date || moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
    const formattedDate = moment(reportDate).format('MMMM DD, YYYY');
    const filename = `daily-report-${tenantInfo?.TenantCode || 'tenant'}-${reportDate}.pdf`;
    const tenantName = tenantInfo?.TenantName || tenantInfo?.tenantname || 'Unknown Tenant';

    const results = [];
    for (const recipient of recipients) {
      try {
        const mailOptions = {
          from: {
            name: 'Rely Gate Reports',
            address: 'admin@relyhealthtech.com'
          },
          to: recipient.recipientemail || recipient.RecipientEmail,
          subject: `Daily Statistics Report - ${tenantName} - ${formattedDate}`,
          html: this.generateEmailHTML(tenantInfo, stats, analyticsData, formattedDate),
          attachments: [{
            filename: filename,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }]
        };

        await transporter.sendMail(mailOptions);
        results.push({ email: recipient.recipientemail || recipient.RecipientEmail, success: true });
      } catch (error) {
        console.error(`Failed to send email to ${recipient.recipientemail || recipient.RecipientEmail}:`, error);
        results.push({ email: recipient.recipientemail || recipient.RecipientEmail, success: false, error: error.message });
      }
    }

    return results;
  }

  // Generate trend data table for current date
  static generateTrendDataTable(trendData, currentDate) {
    // Find data for current date
    const currentDateData = trendData.find(item => item.VisitDate === currentDate);
    
    if (!currentDateData) {
      // Return default zero values if no data found
      return `
        <h3 style="margin-top: 25px;">Today's Activity Summary:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: #2ecc71; color: white;">
            <th style="padding: 10px; border: 1px solid #ddd;">Module</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Check-ins</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Check-outs</th>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Visitors</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">0</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">0</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Staff</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">0</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">0</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Students</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">0</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">0</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Buses</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">0</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">0</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Gate Pass</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">0</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">0</td>
          </tr>
        </table>
      `;
    }
    
    return `
      <h3 style="margin-top: 25px;">Today's Activity Summary:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background-color: #2ecc71; color: white;">
          <th style="padding: 10px; border: 1px solid #ddd;">Module</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Check-ins</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Check-outs</th>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">Visitors</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${currentDateData.VisitorsIN || '0'}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${currentDateData.VisitorsOUT || '0'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">Staff</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${currentDateData.StaffIN || '0'}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${currentDateData.StaffOUT || '0'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">Students</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${currentDateData.StudentIN || '0'}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${currentDateData.StudentOUT || '0'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">Buses</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${currentDateData.BusIN || '0'}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${currentDateData.BusOUT || '0'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">Gate Pass</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${currentDateData.GatePassIN || '0'}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${currentDateData.GatePassOUT || '0'}</td>
        </tr>
      </table>
    `;
  }

  // Generate email HTML content
  static generateEmailHTML(tenantInfo, stats, analyticsData, formattedDate) {
    const totalCheckins = this.getTotalCheckins(stats);
    const totalCheckouts = this.getTotalCheckouts(stats);
    const totalInside = this.getTotalInside(stats);

    console.log('DEBUG - tenantInfo in generateEmailHTML:', tenantInfo); // Debug log

    // Helper function to generate module table HTML
    const generateModuleTable = (moduleName, purposes, moduleStats) => {
      if (!purposes || purposes.length === 0) {
        // Show 0 values instead of "No specific purposes recorded"
        if (moduleStats.checkins === 0 && moduleStats.checkouts === 0 && moduleStats.inside === 0) {
          return `
            <div style="margin-top: 20px;">
              <h4 style="color: #2c3e50; margin-bottom: 10px;">${moduleName}</h4>
              <table style="width: 100%; border-collapse: collapse; background-color: white;">
                <thead>
                  <tr style="background-color: #3498db; color: white;">
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Purpose</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Check-ins</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Check-outs</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Inside</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">-</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">0</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">0</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          `;
        }
        
        return `
          <div style="margin-top: 20px;">
            <h4 style="color: #2c3e50; margin-bottom: 10px;">${moduleName}</h4>
            <table style="width: 100%; border-collapse: collapse; background-color: white;">
              <thead>
                <tr style="background-color: #3498db; color: white;">
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Purpose</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Check-ins</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Check-outs</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Inside</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">Other</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${moduleStats.checkins}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${moduleStats.checkouts}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${moduleStats.inside}</td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
      }

      return `
        <div style="margin-top: 20px;">
          <h4 style="color: #2c3e50; margin-bottom: 10px;">${moduleName}</h4>
          <table style="width: 100%; border-collapse: collapse; background-color: white;">
            <thead>
              <tr style="background-color: #3498db; color: white;">
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Purpose</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Check-ins</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Check-outs</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Inside</th>
              </tr>
            </thead>
            <tbody>
              ${purposes.map(purpose => {
                const inside = Math.max(0, purpose.checkin_count - purpose.checkout_count); // Prevent negative values
                return `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${purpose.purpose_name}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${purpose.checkin_count}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${purpose.checkout_count}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${inside}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    };

    return `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <div style="background-color: #3498db; color: white; padding: 20px; text-align: center;">
          <h1>Daily Statistics Report</h1>
          <h2>${tenantInfo?.TenantName || tenantInfo?.tenantname || 'Unknown Tenant'}</h2>
          <p>${formattedDate}</p>
        </div>
        
        <div style="padding: 20px; background-color: #f8f9fa;">
          ${this.generateTrendDataTable(analyticsData.trendData, moment().tz('Asia/Kolkata').format('DD/MM/YYYY'))}
          
          ${analyticsData ? `
            <h3 style="margin-top: 30px;">Detailed Module Reports:</h3>
            ${generateModuleTable('Visitors', analyticsData.visitorPurposes, {
              checkins: stats.visitor_checkins || 0,
              checkouts: stats.visitor_checkouts || 0,
              inside: stats.visitor_inside || 0
            })}
            ${generateModuleTable('Staff', analyticsData.staffPurposes, {
              checkins: stats.staff_checkins || 0,
              checkouts: stats.staff_checkouts || 0,
              inside: stats.staff_inside || 0
            })}
            ${generateModuleTable('Students', analyticsData.studentPurposes, {
              checkins: stats.student_checkins || 0,
              checkouts: stats.student_checkouts || 0,
              inside: stats.student_inside || 0
            })}
            ${generateModuleTable('Buses', [], {
              checkins: stats.bus_checkins || 0,
              checkouts: stats.bus_checkouts || 0,
              inside: stats.bus_inside || 0
            })}
            ${generateModuleTable('Gate Pass', analyticsData.gatePassPurposes, {
              checkins: stats.gatepass_checkins || 0,
              checkouts: stats.gatepass_checkouts || 0,
              inside: stats.gatepass_inside || 0
            })}
          ` : ''}
          
          <p style="margin-top: 25px;">Please find the detailed PDF report attached with complete module breakdowns and analytics.</p>
          <p>Best regards,<br><strong>Rely Gate System</strong></p>
        </div>
        
        <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
          Generated on: ${moment().tz('Asia/Kolkata').format('MMMM DD, YYYY [at] hh:mm A [IST]')}
        </div>
      </div>
    `;
  }

  // Helper methods
  static getTotalCheckins(stats) {
    return (parseInt(stats.visitor_checkins) || 0) + 
           (parseInt(stats.staff_checkins) || 0) + 
           (parseInt(stats.student_checkins) || 0) + 
           (parseInt(stats.bus_checkins) || 0) + 
           (parseInt(stats.gatepass_checkins) || 0);
  }

  static getTotalCheckouts(stats) {
    return (parseInt(stats.visitor_checkouts) || 0) + 
           (parseInt(stats.staff_checkouts) || 0) + 
           (parseInt(stats.student_checkouts) || 0) + 
           (parseInt(stats.bus_checkouts) || 0) + 
           (parseInt(stats.gatepass_checkouts) || 0);
  }

  static getTotalInside(stats) {
    return (parseInt(stats.visitor_inside) || 0) + 
           (parseInt(stats.staff_inside) || 0) + 
           (parseInt(stats.student_inside) || 0) + 
           (parseInt(stats.bus_inside) || 0) + 
           (parseInt(stats.gatepass_inside) || 0);
  }
}

module.exports = EmailReportService;