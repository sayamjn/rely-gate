const cron = require('node-cron');
const MealAutomaticRegistrationService = require('../services/mealAutomaticRegistration.service');
const MealSettingsModel = require('../models/mealSettings.model.simple');
const { query } = require('../config/database');

class MealCronJobs {
  static isInitialized = false;
  static jobs = new Map();

  // Initialize all meal cron jobs for all active tenants
  static async initializeCronJobs() {
    if (this.isInitialized) {
      console.log('Meal cron jobs already initialized');
      return;
    }

    try {
      // console.log('Initializing meal automatic registration cron jobs...');

      // Get all active tenants
      const tenants = await this.getActiveTenants();
      // console.log(`Found ${tenants.length} active tenants`);

      if (tenants.length === 0) {
        console.log('No active tenants found, skipping cron job initialization');
        return;
      }

      // Initialize cron jobs for each tenant
      for (const tenant of tenants) {
        await this.initializeTenantCronJobs(tenant.tenantid);
      }

      this.isInitialized = true;
      console.log('✅ Meal cron jobs initialization completed successfully');

    } catch (error) {
      console.error('❌ Error initializing meal cron jobs:', error);
      throw error;
    }
  }

  // Initialize cron jobs for a specific tenant
  static async initializeTenantCronJobs(tenantId) {
    try {
      // console.log(`Initializing cron jobs for tenant: ${tenantId}`);

      // Get tenant's meal settings
      const settings = await MealSettingsModel.getMealSettings(tenantId);
      if (!settings) {
        // console.log(`No meal settings found for tenant ${tenantId}, skipping cron jobs`);
        return;
      }

      // Schedule lunch registration cron jobs for each day of the week
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      for (const day of days) {
        // Check if lunch is enabled for this day
        const lunchEnabledKey = `lunchEnabled${day}`;
        const lunchBookingStartKey = `lunchBookingStart${day}`;
        
        if (settings[lunchEnabledKey] && settings[lunchBookingStartKey]) {
          this.scheduleLunchRegistration(tenantId, day, settings[lunchBookingStartKey]);
        }

        // Check if dinner is enabled for this day
        const dinnerEnabledKey = `dinnerEnabled${day}`;
        const dinnerBookingStartKey = `dinnerBookingStart${day}`;
        
        if (settings[dinnerEnabledKey] && settings[dinnerBookingStartKey]) {
          this.scheduleDinnerRegistration(tenantId, day, settings[dinnerBookingStartKey]);
        }
      }

      // console.log(`✅ Cron jobs initialized for tenant ${tenantId}`);

    } catch (error) {
      console.error(`❌ Error initializing cron jobs for tenant ${tenantId}:`, error);
    }
  }

  // Schedule lunch registration for a specific day and time
  static scheduleLunchRegistration(tenantId, dayName, startTime) {
    try {
      // Convert day name to cron day number (0 = Sunday, 1 = Monday, etc.)
      const dayMap = {
        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
        'Thursday': 4, 'Friday': 5, 'Saturday': 6
      };
      
      const dayNumber = dayMap[dayName];
      const [hours, minutes] = startTime.split(':');
      
      // Cron expression: minute hour * * day-of-week
      const cronExpression = `${minutes} ${hours} * * ${dayNumber}`;
      
      const jobKey = `lunch_${tenantId}_${dayName}`;
      
      // Schedule the cron job
      const job = cron.schedule(cronExpression, async () => {
        console.log(`🍽️ [CRON] Triggering lunch registration for tenant ${tenantId} on ${dayName} at ${startTime}`);
        
        try {
          const result = await MealAutomaticRegistrationService.autoRegisterStudentsForMeals(
            tenantId,
            'lunch',
            null, // Use current date
            'LUNCH_CRON_JOB'
          );
          
          console.log(`✅ [CRON] Lunch registration completed for tenant ${tenantId}:`, result);
          
        } catch (error) {
          console.error(`❌ [CRON] Lunch registration failed for tenant ${tenantId}:`, error);
        }
      }, {
        scheduled: false, // Start manually
        timezone: 'Asia/Kolkata' // Adjust based on your timezone
      });

      // Store the job for later management
      this.jobs.set(jobKey, job);
      
      // Start the job
      job.start();
      
      // console.log(`📅 Lunch registration cron scheduled for tenant ${tenantId} on ${dayName} at ${startTime} (${cronExpression})`);

    } catch (error) {
      console.error(`❌ Error scheduling lunch registration for tenant ${tenantId} on ${dayName}:`, error);
    }
  }

  // Schedule dinner registration for a specific day and time
  static scheduleDinnerRegistration(tenantId, dayName, startTime) {
    try {
      // Convert day name to cron day number (0 = Sunday, 1 = Monday, etc.)
      const dayMap = {
        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
        'Thursday': 4, 'Friday': 5, 'Saturday': 6
      };
      
      const dayNumber = dayMap[dayName];
      const [hours, minutes] = startTime.split(':');
      
      // Cron expression: minute hour * * day-of-week
      const cronExpression = `${minutes} ${hours} * * ${dayNumber}`;
      
      const jobKey = `dinner_${tenantId}_${dayName}`;
      
      // Schedule the cron job
      const job = cron.schedule(cronExpression, async () => {
        console.log(`🍽️ [CRON] Triggering dinner registration for tenant ${tenantId} on ${dayName} at ${startTime}`);
        
        try {
          const result = await MealAutomaticRegistrationService.autoRegisterStudentsForMeals(
            tenantId,
            'dinner',
            null, // Use current date
            'DINNER_CRON_JOB'
          );
          
          console.log(`✅ [CRON] Dinner registration completed for tenant ${tenantId}:`, result);
          
        } catch (error) {
          console.error(`❌ [CRON] Dinner registration failed for tenant ${tenantId}:`, error);
        }
      }, {
        scheduled: false, // Start manually
        timezone: 'Asia/Kolkata' // Adjust based on your timezone
      });

      // Store the job for later management
      this.jobs.set(jobKey, job);
      
      // Start the job
      job.start();
      
      // console.log(`📅 Dinner registration cron scheduled for tenant ${tenantId} on ${dayName} at ${startTime} (${cronExpression})`);

    } catch (error) {
      console.error(`❌ Error scheduling dinner registration for tenant ${tenantId} on ${dayName}:`, error);
    }
  }

  // Get all active tenants
  static async getActiveTenants() {
    try {
      const sql = `
        SELECT TenantID 
        FROM Tenant 
        WHERE IsActive = 'Y' 
        ORDER BY TenantID
      `;
      
      const result = await query(sql);
      return result.rows;
      
    } catch (error) {
      console.error('Error getting active tenants:', error);
      throw error;
    }
  }

  // Stop all cron jobs
  static stopAllJobs() {
    console.log('🛑 Stopping all meal cron jobs...');
    
    this.jobs.forEach((job, jobKey) => {
      try {
        job.stop();
        console.log(`✅ Stopped cron job: ${jobKey}`);
      } catch (error) {
        console.error(`❌ Error stopping cron job ${jobKey}:`, error);
      }
    });
    
    this.jobs.clear();
    this.isInitialized = false;
    console.log('✅ All meal cron jobs stopped');
  }

  // Restart cron jobs (useful for configuration updates)
  static async restartJobs() {
    console.log('🔄 Restarting meal cron jobs...');
    this.stopAllJobs();
    await this.initializeCronJobs();
    console.log('✅ Meal cron jobs restarted');
  }

  // Get status of all cron jobs
  static getJobsStatus() {
    const status = {
      initialized: this.isInitialized,
      totalJobs: this.jobs.size,
      jobs: []
    };

    this.jobs.forEach((job, jobKey) => {
      status.jobs.push({
        key: jobKey,
        running: job.running,
        scheduled: job.scheduled
      });
    });

    return status;
  }

  // Manual trigger for specific tenant and meal type (for testing)
  static async manualTrigger(tenantId, mealType) {
    try {
      console.log(`🧪 [MANUAL] Triggering ${mealType} registration for tenant ${tenantId}`);
      
      const result = await MealAutomaticRegistrationService.autoRegisterStudentsForMeals(
        tenantId,
        mealType,
        null, // Use current date
        'MANUAL_TRIGGER'
      );
      
      console.log(`✅ [MANUAL] ${mealType} registration completed for tenant ${tenantId}:`, result);
      return result;
      
    } catch (error) {
      console.error(`❌ [MANUAL] ${mealType} registration failed for tenant ${tenantId}:`, error);
      throw error;
    }
  }
}

module.exports = MealCronJobs;