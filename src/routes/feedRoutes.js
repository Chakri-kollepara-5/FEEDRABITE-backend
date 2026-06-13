const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { createFeed, getFeeds } = require("../controllers/feedController");

const router = express.Router();

router.get("/", getFeeds);
router.post("/", authMiddleware.protect || authMiddleware, createFeed);

module.exports = router;
