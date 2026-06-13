const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

const {
  getNearbyDonations,
  createDonation,
  analyzeFreshness,
  getUserDonations,
  updateDonationStatus,
  deleteDonation,
  getDonationById
} = require("../controllers/donationController");

// PUBLIC
router.get("/nearby", getNearbyDonations);

// PROTECTED - specific paths must come before /:id
router.get("/my-donations", authMiddleware, getUserDonations);
router.post("/analyze-freshness", authMiddleware, analyzeFreshness);
router.post("/create", authMiddleware, createDonation);
router.patch("/:id/status", authMiddleware, updateDonationStatus);
router.delete("/cancel/:id", authMiddleware, deleteDonation);

// PUBLIC (Fallback param route)
router.get("/:id", getDonationById);

module.exports = router;
