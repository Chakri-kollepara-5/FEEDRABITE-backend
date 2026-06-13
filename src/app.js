const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const cacheService = require("./services/cacheService");

const app = express();

// 1. Scalability: Trust proxy settings for horizontal scaling on Render
// This allows express-rate-limit and logger to resolve the client's actual IP,
// rather than the IP of Render's reverse proxies.
app.set("trust proxy", 1);

// 2. Security Middleware
app.use(helmet());

// 3. Compression Middleware
app.use(compression());

// 4. CORS settings
app.use(cors());

// 5. Rate Limiting Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes."
  }
});
app.use("/api/", limiter);

app.use(express.json());

// 6. Custom request logging middleware (excluding spammy polling endpoints)
app.use((req, res, next) => {
  const start = Date.now();
  const skipLogs = ['/api/donations/nearby', '/api/stats/impact'];
  const isPolling = skipLogs.some(url => req.originalUrl.startsWith(url));
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    // Only log if it's a non-polling request, an error (>=400), or exceptionally slow (>500ms)
    if (status >= 400 || !isPolling || duration > 500) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${status} (${duration}ms) - IP: ${req.ip}`);
    }
  });
  next();
});

// 7. Health Check Endpoint
app.get("/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
  const cacheStatus = cacheService.getStatus();
  
  res.json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date(),
    services: {
      database: dbStatus,
      cache: cacheStatus
    }
  });
});

// ROUTES
const adminRoutes = require("./routes/adminRoutes");
const agentRoutes = require("./routes/agentRoutes");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const communityRoutes = require("./routes/communityRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const feedRoutes = require("./routes/feedRoutes");
const hostelBiteRoutes = require("./routes/hostelBiteRoutes");
const impactRoutes = require("./routes/impactRoutes");
const statsRoutes = require("./routes/statsRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

app.use("/api/admin", adminRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/hostelbite", hostelBiteRoutes);
app.use("/api/impact", impactRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/donations", require("./routes/donationRoutes"));

// 8. Global Error Handler Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.error(`🔥 Error caught on ${req.method} ${req.originalUrl}:`, err);
  
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack
  });
});

module.exports = app;
