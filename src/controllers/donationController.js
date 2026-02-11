const Donation = require('../models/Donation');
const User = require('../models/User');
const admin = require('../config/firebase'); // Import Firebase Admin

// Helper to update Firestore
const syncToFirestore = async (donation) => {
  try {
    const db = admin.firestore();
    await db.collection('donations').doc(donation._id.toString()).set({
      ...donation.toObject(),
      _id: donation._id.toString(),
      donorId: donation.donorId._id ? donation.donorId._id.toString() : donation.donorId.toString(),
      createdAt: donation.createdAt ? donation.createdAt.toISOString() : new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Firestore Sync Error:', err);
  }
};

const deleteFromFirestore = async (id) => {
  try {
    const db = admin.firestore();
    await db.collection('donations').doc(id.toString()).delete();
  } catch (err) {
    console.error('Firestore Delete Error:', err);
  }
};


// @desc    Create a new donation
// @route   POST /api/donations/create
// @access  Private (Donor)
const createDonation = async (req, res, next) => {
  try {
    const { title, description, items, images, location, expiryTime } = req.body;

    // Basic validation
    // Handle location: if string, convert to GeoJSON with dummy coords
    // If missing, default to Unknown
    let locationData = location;
    if (typeof location === 'string' && location.trim() !== '') {
      locationData = {
        type: 'Point',
        coordinates: [0, 0], // Default coordinates
        formattedAddress: location
      };
    } else if (!location || !location.coordinates) {
      // User requested to remove field requirement, so we default it
      locationData = {
        type: 'Point',
        coordinates: [0, 0],
        formattedAddress: 'Unknown Location'
      };
    }

    const donation = await Donation.create({
      donorId: req.user._id,
      // Backend model requires 'title'.
      // Frontend CreateDonationModal sends: { foodType, description, quantity ... }
      // It does NOT send 'title'.
      // We map foodType to title.
      title: req.body.title || req.body.foodType || 'Food Donation',
      description,
      items,
      images, // Expecting array of URLs
      location: locationData,
      expiryTime,
      status: 'POSTED',
      quantity: req.body.quantity // Sync quantity for stats
    });

    // innovative fix: Sync directly to Firestore for Real-time stats
    await syncToFirestore(donation);

    res.status(201).json(donation);
  } catch (error) {
    next(error);
  }
};

// @desc    Get nearby donations
// @route   GET /api/donations/nearby
// @access  Private (NGO, Volunteer, Admin) - maybe Donor too?
const getNearbyDonations = async (req, res, next) => {
  try {
    const { long, lat, distance } = req.query;

    let query = {
      status: 'POSTED',
      expiryTime: { $gt: new Date() } // Not expired
    };

    if (long && lat) {
      const maxDistance = distance ? parseInt(distance) : 5000; // Default 5km
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(long), parseFloat(lat)]
          },
          $maxDistance: maxDistance
        }
      };
    }

    // Execute query
    // If geo-query is used, sort is implied by distance usually, but we can't sort by other fields easily with $near
    // If no geo-query, explicit sort by createdAt
    let dbQuery = Donation.find(query).populate('donorId', 'name profileImage rating');

    if (!long || !lat) {
      dbQuery = dbQuery.sort({ createdAt: -1 });
    }

    const donations = await dbQuery;

    // -----------------------------------------------------
    // Mock Data (to match user "Original Style" request)
    // -----------------------------------------------------
    const mockDonations = [
      {
        _id: 'mock-d-1',
        title: 'Snacks',
        description: 'best one',
        quantity: '1 kg',
        location: { formattedAddress: 'palakollu' },
        donorId: { _id: 'm1', name: 'chakravarthi', role: 'donor' },
        status: 'CLAIMED',
        createdAt: new Date('2024-12-22T23:06:00'),
        expiryTime: new Date('2024-12-21T23:06:00') // Expired
      },
      {
        _id: 'mock-d-2',
        title: 'Fruits',
        description: 'Fresh apples and bananas',
        quantity: '10 kg',
        location: { formattedAddress: 'tagarapuvalasa' },
        donorId: { _id: 'm1', name: 'chakravarthi', role: 'donor' },
        status: 'POSTED', // Available
        createdAt: new Date('2024-12-22T22:37:00'),
        expiryTime: new Date('2024-12-21T22:37:00') // Expired
      },
      {
        _id: 'mock-d-3',
        title: 'Snacks',
        description: 'snacks with good energy',
        quantity: '1 kg',
        location: { formattedAddress: 'tagarapuvalasa' },
        donorId: { _id: 'm2', name: 'katukuri suriya', role: 'donor' },
        status: 'CLAIMED',
        createdAt: new Date('2024-12-17T18:27:00'),
        expiryTime: new Date('2024-12-16T18:27:00')
      },
      {
        _id: 'mock-d-4',
        title: 'Prepared Meals',
        description: 'hostel food with full meals',
        quantity: '10 kg',
        location: { formattedAddress: 'sangivalasa' },
        donorId: { _id: 'm2', name: 'katukuri suriya', role: 'donor' },
        status: 'CLAIMED',
        createdAt: new Date('2024-12-17T18:20:00'),
        expiryTime: new Date('2024-12-16T18:20:00')
      },
      {
        _id: 'mock-d-5',
        title: 'Snacks',
        description: 'best and healthy',
        quantity: '1 kg',
        location: { formattedAddress: 'tagarapuvalasa' },
        donorId: { _id: 'm1', name: 'chakravarthi', role: 'donor' },
        status: 'CLAIMED',
        createdAt: new Date('2024-12-02T10:50:00'),
        expiryTime: new Date('2024-12-01T10:50:00')
      },
      {
        _id: 'mock-d-6',
        title: 'Fruits',
        description: 'bananas and papayas',
        quantity: '4 kg',
        location: { formattedAddress: 'tagarapuvalasa' },
        donorId: { _id: 'm3', name: 'sai', role: 'donor' },
        status: 'CLAIMED',
        createdAt: new Date('2024-10-10T11:21:00'),
        expiryTime: new Date('2024-10-09T11:21:00')
      }
    ];

    // Combine and Sort
    const allDonations = [...donations, ...mockDonations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(allDonations);
  } catch (error) {
    next(error);
  }
};

// @desc    Get my donations
// @route   GET /api/donations/my-donations
// @access  Private
const getMyDonations = async (req, res, next) => {
  try {
    const donations = await Donation.find({ donorId: req.user._id }).sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    next(error);
  }
};

// @desc    Get donation by ID
// @route   GET /api/donations/:id
// @access  Private
const getDonationById = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donorId', 'name email phone profileImage')
      .populate('claimedBy', 'name email phone profileImage');

    if (!donation) {
      res.status(404);
      throw new Error('Donation not found');
    }

    res.json(donation);
  } catch (error) {
    next(error);
  }
};

// @desc    Update donation status
// @route   PATCH /api/donations/:id/status
// @access  Private (Donor, Claimer, Admin)
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      res.status(404);
      throw new Error('Donation not found');
    }

    // Role checks
    // If Donor: can Cancel, or Mark as Delivered?
    // If NGO/Volunteer: can Accept, Pick Up, Deliver
    // Validate state transitions

    // Simple logic for now:
    // If ACCEPTED, set claimedBy to user
    if (status === 'ACCEPTED') {
      if (donation.status !== 'POSTED') {
        res.status(400);
        throw new Error('Donation is not available');
      }
      donation.claimedBy = req.user._id;
    }

    donation.status = status;

    // Timestamps
    if (status === 'PICKED_UP') donation.pickedUpAt = Date.now();
    if (status === 'DELIVERED') donation.deliveredAt = Date.now();

    await donation.save();

    // Sync Update to Firestore
    await syncToFirestore(donation);

    res.json(donation);
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel donation (Delete or set status CANCELLED)
// @route   DELETE /api/donations/:id
// @access  Private (Donor only)
const cancelDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      res.status(404);
      throw new Error('Donation not found');
    }

    if (donation.donorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to cancel this donation');
    }

    // Hard delete or soft delete? User requirement says DELETE /cancel
    // Let's use status CANCELLED for history, or remove it.
    // "DELETE /api/donations/cancel" implies an action, but usually DELETE is resource based.
    // I'll implement as status update to CANCELLED for better tracking, 
    // or if purely DELETE verb, remove from DB.
    // Let's remove from DB if status is POSTED, otherwise set to CANCELLED?
    // For simplicity and "DELETE" verb, let's remove.

    await donation.deleteOne(); // or findByIdAndDelete

    // Sync Delete to Firestore
    await deleteFromFirestore(req.params.id);

    res.json({ message: 'Donation removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDonation,
  getNearbyDonations,
  getMyDonations,
  getDonationById,
  updateStatus,
  cancelDonation
};
