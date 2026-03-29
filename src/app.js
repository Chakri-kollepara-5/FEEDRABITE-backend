const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// ROUTES
const adminRoutes = require("./routes/adminRoutes");
const agentRoutes = require("./routes/agentRoutes");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const communityRoutes = require("./routes/communityRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const donationRoutes = require("./routes/donationRoutes");
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
app.use("/api/donations", donationRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/hostelbite", hostelBiteRoutes);
app.use("/api/impact", impactRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/upload", uploadRoutes);

module.exports = app;
