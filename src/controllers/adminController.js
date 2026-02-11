const User = require('../models/User');
const Donation = require('../models/Donation');
const ImpactMetrics = require('../models/ImpactMetrics');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        next(error);
    }
};

// @desc    Verify NGO
// @route   PATCH /api/admin/verify-ngo/:id
// @access  Private (Admin)
const verifyNGO = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        if (user.role !== 'ngo') {
            res.status(400);
            throw new Error('User is not an NGO');
        }

        user.isVerified = true;
        await user.save();

        res.json({ message: 'NGO verified', user });
    } catch (error) {
        next(error);
    }
};

// @desc    Get donation analytics
// @route   GET /api/admin/donation-analytics
// @access  Private (Admin)
const getDonationAnalytics = async (req, res, next) => {
    try {
        const totalDonations = await Donation.countDocuments();
        const statusCounts = await Donation.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.json({
            totalDonations,
            statusCounts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get system stats
// @route   GET /api/admin/system-stats
// @access  Private (Admin)
const getSystemStats = async (req, res, next) => {
    try {
        const userCount = await User.countDocuments();
        const donorCount = await User.countDocuments({ role: 'donor' });
        const ngoCount = await User.countDocuments({ role: 'ngo' });
        const volunteerCount = await User.countDocuments({ role: 'volunteer' });

        res.json({
            userCount,
            donors: donorCount,
            ngos: ngoCount,
            volunteers: volunteerCount
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUsers,
    verifyNGO,
    getDonationAnalytics,
    getSystemStats
};
