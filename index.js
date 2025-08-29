require("dotenv").config();

// Initialize file-based logging system FIRST
const { initializeFileLogging } = require("./utils/logger");
initializeFileLogging();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const helmet = require("helmet")

// Import configuration
const config = require("./config/default");
const { testConnection } = require("./config/database");

// Import middleware
const { handleError, notFound } = require("./middleware/error");
const { generalLimit } = require("./middleware/rateLimit");

// Import models for initialization
const EmailReportModel = require("./models/emailReport.model");

// Import services
const CronJobService = require("./services/cronJob.service");
const MealCronJobs = require("./jobs/mealCronJobs");

// Import routes
const authRoutes = require("./routes/auth.routes");
const protectedRoutes = require("./routes/protected.routes");
const visitorRoutes = require("./routes/visitor.routes");
const fileRoutes = require("./routes/file.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const bulkRoutes = require("./routes/bulk.routes");
const fcmRoutes = require("./routes/fcm.routes");
const vehicleRoutes = require("./routes/vehicle.routes");
const studentRoutes = require("./routes/student.routes");
const busRoutes = require("./routes/bus.routes");
const staffRoutes = require("./routes/staff.routes");
const gatePassRoutes = require("./routes/gatepass.routes");
const emailReportRoutes = require("./routes/emailReport.routes");
const tenantSettingRoutes = require("./routes/tenantSetting.routes");
const studentDayBoardingRoutes = require("./routes/studentDayBoarding.routes");
const linkedTenantsRoutes = require("./routes/linkedTenants.routes");
const mealSettingsRoutes = require("./routes/mealSettings.routes");
const mealRoutes = require("./routes/meal.routes");
const userManagementRoutes = require("./routes/userManagement.routes");
const roleRoutes = require("./routes/role.routes");
const messRoutes = require("./routes/mess.routes");
const logsRoutes = require("./routes/logs.routes");

const app = express();
const PORT = config.port || 9002;

// Middleware
app.use(
  cors({
    origin: "*",
    // origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    // credentials: true
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(helmet())
// app.use(csrf())

// Apply general rate limiting to all routes
app.use(generalLimit);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Create upload directories
const uploadDirs = [
  "uploads",
  "uploads/temp",
  "uploads/visitors",
  "uploads/registered_visitors",
  "uploads/vehicles",
  "uploads/visitor_ids",
  "uploads/qr_codes",
  "uploads/logos",
  "uploads/users",
];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Serve static files with proper headers
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "1d", // Cache for 1 day
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".jpeg") || filePath.endsWith(".jpg")) {
        res.set("Content-Type", "image/jpeg");
      } else if (filePath.endsWith(".png")) {
        res.set("Content-Type", "image/png");
      }

      res.set("X-Content-Type-Options", "nosniff");
      res.set("Cache-Control", "public, max-age=86400"); // 1 day
    },
  })
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api", protectedRoutes);
app.use("/api/visitors", visitorRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/bulk", bulkRoutes);
app.use("/api/fcm", fcmRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/gatepass", gatePassRoutes);
app.use("/api/email-reports", emailReportRoutes);
app.use("/api/tenant-settings", tenantSettingRoutes);
app.use("/api/student-day-boarding", studentDayBoardingRoutes);
app.use("/api/linked-tenants", linkedTenantsRoutes);
app.use("/api/meal-settings", mealSettingsRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/users", userManagementRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/mess", messRoutes);
app.use("/api/logs", logsRoutes);

// Error handling middleware (must be last)
app.use(handleError);
app.use(notFound);
app.disable("x-powered-by");

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 System running in ${config.env} mode on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
  console.log(`📁 File-based logging active - logs saved to: logs/month/dd-mm-yyyy.log`);

  try {
    await testConnection();
    console.log("Database connection established successfully");

    // console.log(
    //   `Email reports available at: http://localhost:${PORT}/api/email-reports`
    // );

    CronJobService.initializeJobs();
    console.log("⏰ Cron jobs initialized successfully");
    
    await MealCronJobs.initializeCronJobs();
    console.log("Meal auto-registration cron jobs initialized successfully");
  } catch (error) {
    console.error("Failed to connect to database:", error.message);
    console.error("Please check your database configuration in .env file");
  }
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });

  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message);
  console.error(err.stack);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  console.error(err.stack);
  process.exit(1);
});

module.exports = app;
