const express = require("express");
const router = express.Router();

const {
  getDashboardSummary,
  getRecentFeeds,
} = require("../controllers/dashboardController");

const authMiddleware = require("../middlewares/authMiddleware");

// Dashboard endpoints
router.get("/", authMiddleware, getDashboardSummary);
router.get("/feeds", authMiddleware, getRecentFeeds);

module.exports = router;
