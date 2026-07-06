const Donation = require("../models/Donation");
const User = require("../models/User");
const mongoose = require("mongoose");
const { analyzeFoodFreshness } = require("../services/aiService");
const { saveDonationWithDualSync, deleteDonationWithDualSync } = require("../services/dbSyncService");
const cacheService = require("../services/cacheService");
const { uploadBase64ImageToStorage } = require("../services/imageUploadService");

// GET /api/donations/nearby
const getNearbyDonations = async (req, res) => {
  try {
    const cacheKey = "donations:nearby";
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Populate donorId reference with user details (like name) for UI display
    const donations = await Donation.find().populate('donorId', 'name').sort({ createdAt: -1 });
    // Map donorId.name to donorName dynamically to match frontend expectations
    const mapped = donations.map(d => {
      const obj = d.toObject();
      obj.donorName = d.donorId?.name || "Anonymous Donor";
      return obj;
    });

    // Save to cache with a 5-minute TTL (300 seconds)
    await cacheService.set(cacheKey, mapped, 300);
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/donations/:id
const getDonationById = async (req, res) => {
  try {
    const cacheKey = `donation:${req.params.id}`;
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const donation = await Donation.findById(req.params.id).populate('donorId', 'name');
    if (!donation) return res.status(404).json({ message: "Not found" });
    const obj = donation.toObject();
    obj.donorName = donation.donorId?.name || "Anonymous Donor";

    // Save to cache with a 10-minute TTL (600 seconds)
    await cacheService.set(cacheKey, obj, 600);
    res.json(obj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/donations/analyze-freshness
const analyzeFreshness = async (req, res) => {
  try {
    const { imageBase64, mimeType, preparationTime, storageMethod } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ message: "Image is required for AI analysis." });
    }

    const aiResult = await analyzeFoodFreshness(imageBase64, mimeType || 'image/jpeg', Number(preparationTime) || 0, storageMethod);
    res.json(aiResult);
  } catch (err) {
    console.error("Analyze Freshness error:", err.message);
    res.status(500).json({ message: "Failed to analyze freshness." });
  }
};

// POST /api/donations/create
const createDonation = async (req, res) => {
  try {
    let donorObjectId = req.user._id || req.user.id;
    
    // Resolve string Firebase UID to MongoDB ObjectId
    if (typeof donorObjectId === 'string' && !mongoose.Types.ObjectId.isValid(donorObjectId)) {
      const user = await User.findOne({ firebaseUid: donorObjectId });
      if (user) {
        donorObjectId = user._id;
      } else {
        return res.status(400).json({ message: "User not found in database. Please register first." });
      }
    }

    // Format plain address string to GeoJSON location object expected by schema
    let locationObj = req.body.location;
    if (typeof locationObj === 'string') {
      locationObj = {
        type: "Point",
        coordinates: [0, 0], // Default coordinates
        formattedAddress: req.body.location
      };
    }

    // Convert base64 images in req.body.images to public URLs
    const imageUrls = [];
    if (req.body.images && Array.isArray(req.body.images)) {
      for (const img of req.body.images) {
        if (img.startsWith('data:image')) {
          try {
            const url = await uploadBase64ImageToStorage(img);
            imageUrls.push(url);
          } catch (uploadErr) {
            console.error("Failed to upload base64 image during donation creation:", uploadErr);
            imageUrls.push(img); // fallback to base64
          }
        } else {
          imageUrls.push(img);
        }
      }
    }

    const newDonation = new Donation({
      title: req.body.title || req.body.foodType || "Donation",
      ...req.body,
      images: imageUrls,
      donorId: donorObjectId,
      location: locationObj,
      status: "POSTED",
    });
    
    await saveDonationWithDualSync(newDonation);
    
    res.status(201).json(newDonation);
  } catch (err) {
    console.error("Donation creation error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/donations/my-donations
const getUserDonations = async (req, res) => {
  try {
    let donorObjectId = req.user._id || req.user.id;
    
    // Resolve string Firebase UID to MongoDB ObjectId
    if (typeof donorObjectId === 'string' && !mongoose.Types.ObjectId.isValid(donorObjectId)) {
      const user = await User.findOne({ firebaseUid: donorObjectId });
      if (user) {
        donorObjectId = user._id;
      }
    }

    const donations = await Donation.find({ donorId: donorObjectId }).populate('donorId', 'name').sort({ createdAt: -1 });
    const mapped = donations.map(d => {
      const obj = d.toObject();
      obj.donorName = d.donorId?.name || "Anonymous Donor";
      return obj;
    });
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/donations/:id/status
const updateDonationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: "Donation not found" });

    donation.status = status;
    
    // Also set pickedUpAt / deliveredAt based on status
    if (status === 'PICKED_UP') donation.pickedUpAt = new Date();
    if (status === 'DELIVERED') donation.deliveredAt = new Date();

    await saveDonationWithDualSync(donation);
    
    res.json(donation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/donations/cancel/:id
const deleteDonation = async (req, res) => {
  try {
    await deleteDonationWithDualSync(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getNearbyDonations,
  getDonationById,
  analyzeFreshness,
  createDonation,
  getUserDonations,
  updateDonationStatus,
  deleteDonation,
};
