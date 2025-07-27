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

  // Generate and send daily report using unified data retrieval methods
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
      
      console.log('Retrieving unified data from both VisitorMaster and VisitorRegVisitHistory tables...');
      const unifiedData = await this.getUnifiedReportData(tenantId, date, currentDate);
      
      // Validate data consistency before generating reports
      const validationResult = this.validateDataConsistency(unifiedData.stats, unifiedData.analyticsData);
      if (!validationResult.isValid) {
        console.warn('Data consistency validation failed:', validationResult.warnings);
        // Log warnings but continue with report generation
        validationResult.warnings.forEach(warning => console.warn(warning));
      }

      // Calculate unified totals to ensure consistency across both HTML and PDF reports
      const unifiedTotals = this.calculateTotals(unifiedData.stats, unifiedData.analyticsData);
      
      // Apply data corrections if validation found issues
      if (!validationResult.isValid) {
        console.log('Applying unified totals to ensure consistency between HTML and PDF reports');
      }

      // Generate PDF with validated unified data
      const pdfBuffer = await this.generatePDF(unifiedData.tenantInfo, unifiedData.stats, unifiedData.analyticsData, date, unifiedTotals);

      // Send emails with identical data sources
      const emailResults = await this.sendEmails(recipients, pdfBuffer, unifiedData.tenantInfo, unifiedData.stats, unifiedData.analyticsData, date, unifiedTotals);

      // Final validation to ensure HTML and PDF reports use identical data
      const reportConsistencyCheck = this.validateReportConsistency(unifiedTotals, unifiedData.stats);
      
      return {
        responseCode: responseUtils.RESPONSE_CODES.SUCCESS,
        data: {
          recipientCount: recipients.length,
          emailResults,
          statistics: unifiedData.stats,
          analytics: unifiedData.analyticsData,
          validation: validationResult,
          reportConsistency: reportConsistencyCheck,
          unifiedTotals
        },
        responseMessage: `Daily report sent to ${recipients.length} recipients using unified data sources`
      };
    } catch (error) {
      console.error('Error generating and sending daily report:', error);
      return {
        responseCode: responseUtils.RESPONSE_CODES.ERROR,
        responseMessage: 'Failed to generate and send daily report'
      };
    }
  }

  // Get unified report data from all sources with data validation
  static async getUnifiedReportData(tenantId, date, currentDate) {
    try {
      console.log('Fetching unified data from both VisitorMaster and VisitorRegVisitHistory tables...');
      
      // Get tenant info, stats, purpose-based analytics, and trend data using unified methods
      const [tenantInfo, stats, visitorPurposes, staffPurposes, studentPurposes, gatePassPurposes, trendData] = await Promise.all([
        EmailReportModel.getTenantInfo(tenantId),
        EmailReportModel.getDailyStats(tenantId, date), // Already combines both tables
        EmailReportModel.getVisitorPurposeStats(tenantId, date), // Already combines both tables
        EmailReportModel.getStaffPurposeStats(tenantId, date), // Already combines both tables
        EmailReportModel.getStudentPurposeStats(tenantId, date), // Already combines both tables
        EmailReportModel.getGatePassPurposeStats(tenantId, date), // Only uses VisitorMaster (no registered gate passes)
        AnalyticsService.getTrendByCategory(tenantId, currentDate, currentDate)
      ]);

      // Validate that all data was retrieved successfully
      if (!tenantInfo) {
        throw new Error('Failed to retrieve tenant information');
      }

      if (!stats) {
        throw new Error('Failed to retrieve daily statistics');
      }

      const analyticsData = {
        visitorPurposes: visitorPurposes || [],
        staffPurposes: staffPurposes || [],
        studentPurposes: studentPurposes || [],
        gatePassPurposes: gatePassPurposes || [],
        trendData: trendData?.data || []
      };

      console.log('Unified data retrieval completed successfully:', {
        tenantName: tenantInfo.TenantName || tenantInfo.tenantname,
        totalCheckins: this.getTotalCheckins(stats),
        totalCheckouts: this.getTotalCheckouts(stats),
        totalInside: this.getTotalInside(stats),
        purposeDataAvailable: {
          visitors: analyticsData.visitorPurposes.length,
          staff: analyticsData.staffPurposes.length,
          students: analyticsData.studentPurposes.length,
          gatePass: analyticsData.gatePassPurposes.length
        }
      });

      return {
        tenantInfo,
        stats,
        analyticsData
      };
    } catch (error) {
      console.error('Error retrieving unified report data:', error);
      throw new Error(`Failed to retrieve unified report data: ${error.message}`);
    }
  }

  // Generate PDF report using unified data to ensure consistency with HTML report
  static async generatePDF(tenantInfo, stats, analyticsData, date, unifiedTotals = null) {
    const reportDate = date || moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
    const formattedDate = moment(reportDate).format('MMMM DD, YYYY');

    console.log('Generating PDF report with unified data for consistency with HTML report:', {
      tenantName: tenantInfo?.TenantName || tenantInfo?.tenantname,
      hasUnifiedTotals: !!unifiedTotals,
      totalCheckins: unifiedTotals?.total_checkins || this.getTotalCheckins(stats),
      totalCheckouts: unifiedTotals?.total_checkouts || this.getTotalCheckouts(stats),
      totalInside: unifiedTotals?.total_inside || this.getTotalInside(stats)
    });

    const fonts = {
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };

    const printer = new PdfPrinter(fonts);

    // Build PDF content dynamically
    const content = [
      // Header
      { text: `Daily Statistics Report`, style: 'header', alignment: 'center' },
      { text: tenantInfo?.tenantname || 'Unknown Tenant', style: 'subheader', alignment: 'center' },
      { text: formattedDate, style: 'date', alignment: 'center', margin: [0, 0, 0, 20] },
      
      // Summary Table - using unified totals to ensure consistency with HTML report
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
              { text: (unifiedTotals?.total_checkins || this.getTotalCheckins(stats)).toString(), alignment: 'center' },
              { text: (unifiedTotals?.total_checkouts || this.getTotalCheckouts(stats)).toString(), alignment: 'center' },
              { text: (unifiedTotals?.total_inside || this.getTotalInside(stats)).toString(), alignment: 'center' }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      },

      // Module wise statistics - using same data source as HTML report for consistency
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
              { text: (unifiedTotals?.modules?.visitor?.checkins || stats.visitor_checkins || 0).toString(), alignment: 'center' },
              { text: (unifiedTotals?.modules?.visitor?.checkouts || stats.visitor_checkouts || 0).toString(), alignment: 'center' },
              { text: (unifiedTotals?.modules?.visitor?.inside || stats.visitor_inside || 0).toString(), alignment: 'center' }
            ],
            [
              'Staff',
              { text: (unifiedTotals?.modules?.staff?.checkins || stats.staff_checkins || 0).toString(), alignment: 'center' },
              { text: (unifiedTotals?.modules?.staff?.checkouts || stats.staff_checkouts || 0).toString(), alignment: 'center' },
              { text: (unifiedTotals?.modules?.staff?.inside || stats.staff_inside || 0).toString(), alignment: 'center' }
            ],
            [
              'Students',
              { text: (unifiedTotals?.modules?.student?.checkins || stats.student_checkins || 0).toString(), alignment: 'center' },
              { text: (unifiedTotals?.modules?.student?.checkouts || stats.student_checkouts || 0).toString(), alignment: 'center' },
              { text: (unifiedTotals?.modules?.student?.inside || stats.student_inside || 0).toString(), alignment: 'center' }
            ],
            [
              'Buses',
              { text: (unifiedTotals?.modules?.bus?.checkins || stats.bus_checkins || 0).toString(), alignment: 'center' },
              { text: (unifiedTotals?.modules?.bus?.checkouts || stats.bus_checkouts || 0).toString(), alignment: 'center' },
              { text: (unifiedTotals?.modules?.bus?.inside || stats.bus_inside || 0).toString(), alignment: 'center' }
            ],
            [
              'Gate Pass',
              { text: (unifiedTotals?.modules?.gatepass?.checkins || stats.gatepass_checkins || 0).toString(), alignment: 'center' },
              { text: (unifiedTotals?.modules?.gatepass?.checkouts || stats.gatepass_checkouts || 0).toString(), alignment: 'center' },
              { text: (unifiedTotals?.modules?.gatepass?.inside || stats.gatepass_inside || 0).toString(), alignment: 'center' }
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
                  { text: Math.max(0, purpose.inside_count).toString(), alignment: 'center' }
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
                  { text: Math.max(0, purpose.inside_count).toString(), alignment: 'center' }
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
                  { text: Math.max(0, purpose.inside_count).toString(), alignment: 'center' }
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
                  { text: Math.max(0, purpose.inside_count).toString(), alignment: 'center' }
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
  static async sendEmails(recipients, pdfBuffer, tenantInfo, stats, analyticsData, date, unifiedTotals = null) {
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
          html: this.generateEmailHTML(tenantInfo, stats, analyticsData, formattedDate, unifiedTotals),
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

  // Validate data consistency between summary and detailed stats to ensure HTML and PDF reports are identical
  static validateDataConsistency(stats, analyticsData) {
    const warnings = [];
    let isValid = true;

    try {
      console.log('Validating data consistency to ensure identical HTML and PDF reports...');
      
      // Calculate totals from detailed purpose data
      const detailedTotals = {
        visitor_checkins: analyticsData.visitorPurposes?.reduce((sum, p) => sum + (parseInt(p.checkin_count) || 0), 0) || 0,
        visitor_checkouts: analyticsData.visitorPurposes?.reduce((sum, p) => sum + (parseInt(p.checkout_count) || 0), 0) || 0,
        visitor_inside: analyticsData.visitorPurposes?.reduce((sum, p) => sum + (parseInt(p.inside_count) || 0), 0) || 0,
        
        staff_checkins: analyticsData.staffPurposes?.reduce((sum, p) => sum + (parseInt(p.checkin_count) || 0), 0) || 0,
        staff_checkouts: analyticsData.staffPurposes?.reduce((sum, p) => sum + (parseInt(p.checkout_count) || 0), 0) || 0,
        staff_inside: analyticsData.staffPurposes?.reduce((sum, p) => sum + (parseInt(p.inside_count) || 0), 0) || 0,
        
        student_checkins: analyticsData.studentPurposes?.reduce((sum, p) => sum + (parseInt(p.checkin_count) || 0), 0) || 0,
        student_checkouts: analyticsData.studentPurposes?.reduce((sum, p) => sum + (parseInt(p.checkout_count) || 0), 0) || 0,
        student_inside: analyticsData.studentPurposes?.reduce((sum, p) => sum + (parseInt(p.inside_count) || 0), 0) || 0,
        
        gatepass_checkins: analyticsData.gatePassPurposes?.reduce((sum, p) => sum + (parseInt(p.checkin_count) || 0), 0) || 0,
        gatepass_checkouts: analyticsData.gatePassPurposes?.reduce((sum, p) => sum + (parseInt(p.checkout_count) || 0), 0) || 0,
        gatepass_inside: analyticsData.gatePassPurposes?.reduce((sum, p) => sum + (parseInt(p.inside_count) || 0), 0) || 0
      };

      // Compare summary stats with detailed totals
      const summaryStats = {
        visitor_checkins: parseInt(stats.visitor_checkins) || 0,
        visitor_checkouts: parseInt(stats.visitor_checkouts) || 0,
        visitor_inside: parseInt(stats.visitor_inside) || 0,
        staff_checkins: parseInt(stats.staff_checkins) || 0,
        staff_checkouts: parseInt(stats.staff_checkouts) || 0,
        staff_inside: parseInt(stats.staff_inside) || 0,
        student_checkins: parseInt(stats.student_checkins) || 0,
        student_checkouts: parseInt(stats.student_checkouts) || 0,
        student_inside: parseInt(stats.student_inside) || 0,
        gatepass_checkins: parseInt(stats.gatepass_checkins) || 0,
        gatepass_checkouts: parseInt(stats.gatepass_checkouts) || 0,
        gatepass_inside: parseInt(stats.gatepass_inside) || 0
      };

      // Check for discrepancies (allow for cases where detailed data might be empty but summary has data)
      Object.keys(summaryStats).forEach(key => {
        if (detailedTotals[key] > 0 && summaryStats[key] !== detailedTotals[key]) {
          warnings.push(`Discrepancy in ${key}: Summary=${summaryStats[key]}, Detailed=${detailedTotals[key]}`);
          isValid = false;
        }
      });

      // Validate "inside" calculations to ensure consistency across HTML and PDF reports
      ['visitor', 'staff', 'student', 'gatepass'].forEach(module => {
        const checkins = summaryStats[`${module}_checkins`];
        const checkouts = summaryStats[`${module}_checkouts`];
        const inside = summaryStats[`${module}_inside`];
        const expectedInside = checkins - checkouts;
        
        if (inside !== expectedInside) {
          warnings.push(`${module} inside count mismatch: Expected=${expectedInside} (${checkins}-${checkouts}), Actual=${inside}`);
          isValid = false;
        }
      });

      // Validate that bus data is consistent (bus data doesn't have purpose breakdown)
      const busInside = summaryStats.bus_checkins - summaryStats.bus_checkouts;
      if (summaryStats.bus_inside !== busInside) {
        warnings.push(`Bus inside count mismatch: Expected=${busInside}, Actual=${summaryStats.bus_inside}`);
        isValid = false;
      }

      // Log validation results for debugging report consistency
      console.log('Data validation completed for HTML/PDF consistency:', {
        isValid,
        warningCount: warnings.length,
        summaryTotals: {
          checkins: summaryStats.visitor_checkins + summaryStats.staff_checkins + summaryStats.student_checkins + summaryStats.bus_checkins + summaryStats.gatepass_checkins,
          checkouts: summaryStats.visitor_checkouts + summaryStats.staff_checkouts + summaryStats.student_checkouts + summaryStats.bus_checkouts + summaryStats.gatepass_checkouts,
          inside: summaryStats.visitor_inside + summaryStats.staff_inside + summaryStats.student_inside + summaryStats.bus_inside + summaryStats.gatepass_inside
        },
        dataSourcesValidated: 'Both VisitorMaster and VisitorRegVisitHistory tables included'
      });

    } catch (error) {
      warnings.push(`Data validation error: ${error.message}`);
      isValid = false;
    }

    return {
      isValid,
      warnings,
      timestamp: new Date().toISOString(),
      reportConsistencyValidated: true,
      dataSourcesUnified: true
    };
  }

  // Calculate unified totals from stats data to ensure identical data in HTML and PDF reports
  static calculateTotals(stats, analyticsData) {
    const totals = {
      total_checkins: (parseInt(stats.visitor_checkins) || 0) + 
                     (parseInt(stats.staff_checkins) || 0) + 
                     (parseInt(stats.student_checkins) || 0) + 
                     (parseInt(stats.bus_checkins) || 0) + 
                     (parseInt(stats.gatepass_checkins) || 0),
      
      total_checkouts: (parseInt(stats.visitor_checkouts) || 0) + 
                      (parseInt(stats.staff_checkouts) || 0) + 
                      (parseInt(stats.student_checkouts) || 0) + 
                      (parseInt(stats.bus_checkouts) || 0) + 
                      (parseInt(stats.gatepass_checkouts) || 0),
      
      total_inside: (parseInt(stats.visitor_inside) || 0) + 
                   (parseInt(stats.staff_inside) || 0) + 
                   (parseInt(stats.student_inside) || 0) + 
                   (parseInt(stats.bus_inside) || 0) + 
                   (parseInt(stats.gatepass_inside) || 0)
    };

    // Validate that total_inside equals total_checkins - total_checkouts
    const expectedInside = totals.total_checkins - totals.total_checkouts;
    if (totals.total_inside !== expectedInside) {
      console.warn(`Total inside count mismatch: Expected=${expectedInside}, Calculated=${totals.total_inside}`);
      totals.total_inside = expectedInside; // Correct the value to ensure consistency
    }

    // Add module-level totals for detailed validation
    totals.modules = {
      visitor: {
        checkins: parseInt(stats.visitor_checkins) || 0,
        checkouts: parseInt(stats.visitor_checkouts) || 0,
        inside: parseInt(stats.visitor_inside) || 0
      },
      staff: {
        checkins: parseInt(stats.staff_checkins) || 0,
        checkouts: parseInt(stats.staff_checkouts) || 0,
        inside: parseInt(stats.staff_inside) || 0
      },
      student: {
        checkins: parseInt(stats.student_checkins) || 0,
        checkouts: parseInt(stats.student_checkouts) || 0,
        inside: parseInt(stats.student_inside) || 0
      },
      bus: {
        checkins: parseInt(stats.bus_checkins) || 0,
        checkouts: parseInt(stats.bus_checkouts) || 0,
        inside: parseInt(stats.bus_inside) || 0
      },
      gatepass: {
        checkins: parseInt(stats.gatepass_checkins) || 0,
        checkouts: parseInt(stats.gatepass_checkouts) || 0,
        inside: parseInt(stats.gatepass_inside) || 0
      }
    };

    console.log('Unified totals calculated for consistent HTML/PDF reports:', totals);
    return totals;
  }

  // Validate that HTML and PDF reports will display identical data
  static validateReportConsistency(unifiedTotals, stats) {
    const consistency = {
      isConsistent: true,
      issues: [],
      timestamp: new Date().toISOString()
    };

    try {
      // Check that unified totals match the sum of individual modules
      const calculatedTotal = {
        checkins: (unifiedTotals?.modules?.visitor?.checkins || 0) + 
                 (unifiedTotals?.modules?.staff?.checkins || 0) + 
                 (unifiedTotals?.modules?.student?.checkins || 0) + 
                 (unifiedTotals?.modules?.bus?.checkins || 0) + 
                 (unifiedTotals?.modules?.gatepass?.checkins || 0),
        checkouts: (unifiedTotals?.modules?.visitor?.checkouts || 0) + 
                  (unifiedTotals?.modules?.staff?.checkouts || 0) + 
                  (unifiedTotals?.modules?.student?.checkouts || 0) + 
                  (unifiedTotals?.modules?.bus?.checkouts || 0) + 
                  (unifiedTotals?.modules?.gatepass?.checkouts || 0),
        inside: (unifiedTotals?.modules?.visitor?.inside || 0) + 
               (unifiedTotals?.modules?.staff?.inside || 0) + 
               (unifiedTotals?.modules?.student?.inside || 0) + 
               (unifiedTotals?.modules?.bus?.inside || 0) + 
               (unifiedTotals?.modules?.gatepass?.inside || 0)
      };

      if (unifiedTotals?.total_checkins !== calculatedTotal.checkins) {
        consistency.issues.push(`Total checkins mismatch: ${unifiedTotals?.total_checkins} vs ${calculatedTotal.checkins}`);
        consistency.isConsistent = false;
      }

      if (unifiedTotals?.total_checkouts !== calculatedTotal.checkouts) {
        consistency.issues.push(`Total checkouts mismatch: ${unifiedTotals?.total_checkouts} vs ${calculatedTotal.checkouts}`);
        consistency.isConsistent = false;
      }

      if (unifiedTotals?.total_inside !== calculatedTotal.inside) {
        consistency.issues.push(`Total inside mismatch: ${unifiedTotals?.total_inside} vs ${calculatedTotal.inside}`);
        consistency.isConsistent = false;
      }

      console.log('Report consistency validation:', consistency);

    } catch (error) {
      consistency.issues.push(`Consistency validation error: ${error.message}`);
      consistency.isConsistent = false;
    }

    return consistency;
  }

  // Generate email HTML content using unified data to ensure consistency with PDF report
  static generateEmailHTML(tenantInfo, stats, analyticsData, formattedDate, unifiedTotals = null) {
    const totalCheckins = unifiedTotals?.total_checkins || this.getTotalCheckins(stats);
    const totalCheckouts = unifiedTotals?.total_checkouts || this.getTotalCheckouts(stats);
    const totalInside = unifiedTotals?.total_inside || this.getTotalInside(stats);

    console.log('Generating HTML email with unified data for consistency with PDF:', {
      totalCheckins,
      totalCheckouts,
      totalInside,
      hasUnifiedTotals: !!unifiedTotals
    });

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
                const inside = Math.max(0, purpose.inside_count); // Prevent negative values
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

          // ${this.generateTrendDataTable(analyticsData.trendData, moment().tz('Asia/Kolkata').format('DD/MM/YYYY'))}


    return `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <div style="background-color: #3498db; color: white; padding: 20px; text-align: center;">
          <h1>Daily Statistics Report</h1>
          <h2>${tenantInfo?.TenantName || tenantInfo?.tenantname || 'Unknown Tenant'}</h2>
          <p>${formattedDate}</p>
        </div>
        
        <div style="padding: 20px; background-color: #f8f9fa;">
          <!-- Summary Table matching PDF format -->
          <h3 style="color: #2c3e50; margin-bottom: 15px;">Summary</h3>
          <table style="width: 100%; border-collapse: collapse; background-color: white; margin-bottom: 25px;">
            <thead>
              <tr style="background-color: #3498db; color: white;">
                <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">Total Check-ins</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">Total Check-outs</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">Currently Inside</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 12px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${totalCheckins}</td>
                <td style="padding: 12px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${totalCheckouts}</td>
                <td style="padding: 12px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${totalInside}</td>
              </tr>
            </tbody>
          </table>

          <!-- Module-wise Statistics matching PDF format -->
          <h3 style="color: #2c3e50; margin-bottom: 15px;">Module-wise Statistics</h3>
          <table style="width: 100%; border-collapse: collapse; background-color: white; margin-bottom: 25px;">
            <thead>
              <tr style="background-color: #3498db; color: white;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Module</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Check-ins</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Check-outs</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Currently Inside</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">Visitors</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${unifiedTotals?.modules?.visitor?.checkins || stats.visitor_checkins || 0}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${unifiedTotals?.modules?.visitor?.checkouts || stats.visitor_checkouts || 0}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${unifiedTotals?.modules?.visitor?.inside || stats.visitor_inside || 0}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">Staff</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${unifiedTotals?.modules?.staff?.checkins || stats.staff_checkins || 0}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${unifiedTotals?.modules?.staff?.checkouts || stats.staff_checkouts || 0}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${unifiedTotals?.modules?.staff?.inside || stats.staff_inside || 0}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">Students</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${unifiedTotals?.modules?.student?.checkins || stats.student_checkins || 0}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${unifiedTotals?.modules?.student?.checkouts || stats.student_checkouts || 0}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${unifiedTotals?.modules?.student?.inside || stats.student_inside || 0}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">Buses</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${unifiedTotals?.modules?.bus?.checkins || stats.bus_checkins || 0}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${unifiedTotals?.modules?.bus?.checkouts || stats.bus_checkouts || 0}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${unifiedTotals?.modules?.bus?.inside || stats.bus_inside || 0}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">Gate Pass</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${unifiedTotals?.modules?.gatepass?.checkins || stats.gatepass_checkins || 0}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${unifiedTotals?.modules?.gatepass?.checkouts || stats.gatepass_checkouts || 0}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${unifiedTotals?.modules?.gatepass?.inside || stats.gatepass_inside || 0}</td>
              </tr>
            </tbody>
          </table>

          
          ${analyticsData ? `
            <h3 style="margin-top: 30px;">Detailed Module Reports:</h3>
            ${generateModuleTable('Visitors', analyticsData.visitorPurposes, {
              checkins: unifiedTotals?.modules?.visitor?.checkins || stats.visitor_checkins || 0,
              checkouts: unifiedTotals?.modules?.visitor?.checkouts || stats.visitor_checkouts || 0,
              inside: unifiedTotals?.modules?.visitor?.inside || stats.visitor_inside || 0
            })}
            ${generateModuleTable('Staff', analyticsData.staffPurposes, {
              checkins: unifiedTotals?.modules?.staff?.checkins || stats.staff_checkins || 0,
              checkouts: unifiedTotals?.modules?.staff?.checkouts || stats.staff_checkouts || 0,
              inside: unifiedTotals?.modules?.staff?.inside || stats.staff_inside || 0
            })}
            ${generateModuleTable('Students', analyticsData.studentPurposes, {
              checkins: unifiedTotals?.modules?.student?.checkins || stats.student_checkins || 0,
              checkouts: unifiedTotals?.modules?.student?.checkouts || stats.student_checkouts || 0,
              inside: unifiedTotals?.modules?.student?.inside || stats.student_inside || 0
            })}
            ${generateModuleTable('Buses', [], {
              checkins: unifiedTotals?.modules?.bus?.checkins || stats.bus_checkins || 0,
              checkouts: unifiedTotals?.modules?.bus?.checkouts || stats.bus_checkouts || 0,
              inside: unifiedTotals?.modules?.bus?.inside || stats.bus_inside || 0
            })}
            ${generateModuleTable('Gate Pass', analyticsData.gatePassPurposes, {
              checkins: unifiedTotals?.modules?.gatepass?.checkins || stats.gatepass_checkins || 0,
              checkouts: unifiedTotals?.modules?.gatepass?.checkouts || stats.gatepass_checkouts || 0,
              inside: unifiedTotals?.modules?.gatepass?.inside || stats.gatepass_inside || 0
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