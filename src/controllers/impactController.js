const ImpactMetrics = require('../models/ImpactMetrics');
const Donation = require('../models/Donation');

// @desc    Get global impact metrics
// @route   GET /api/impact/global
// @access  Public
const getGlobalImpact = async (req, res, next) => {
    try {
        const stats = await Donation.aggregate([
            { $match: { status: { $ne: 'CANCELLED' } } }, // Count all non-cancelled? Or just delivered?
            // User screenshot shows "Total Donations: 13". 
            // If we have 13 total, we should count all.
            // But "Food Saved" implies completed.
            // Let's do two aggregations or one with conditional sums.
            {
                $group: {
                    _id: null,
                    totalDonations: { $sum: 1 },
                    // Only count delivered/claimed for impact?
                    // Let's simplified: If status in [CLAIMED, DELIVERED, PICKED_UP, ACCEPTED] -> add to meals
                    mealsSaved: {
                        $sum: {
                            $cond: [{ $in: ["$status", ["CLAIMED", "DELIVERED", "PICKED_UP", "ACCEPTED"]] }, 5, 0]
                        }
                    },
                    co2Saved: {
                        $sum: {
                            $cond: [{ $in: ["$status", ["CLAIMED", "DELIVERED", "PICKED_UP", "ACCEPTED"]] }, 12.5, 0]
                        }
                    }
                }
            }
        ]);

        // Get Active Donors count
        // Distinct donors who have at least one donation
        const donors = await Donation.distinct('donorId');
        const activeDonors = donors.length;

        if (stats.length === 0) {
            return res.json({
                totalDonations: 0,
                activeDonors: 0,
                meals_saved: 0,
                food_weight_saved: 0,
                co2_saved: 0
            });
        }

        res.json({
            totalDonations: stats[0].totalDonations,
            activeDonors: activeDonors,
            meals_saved: stats[0].mealsSaved,
            food_weight_saved: stats[0].mealsSaved * 0.5,
            co2_saved: stats[0].co2Saved
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user impact metrics
// @route   GET /api/impact/user/:id
// @access  Private
const getUserImpact = async (req, res, next) => {
    try {
        const stats = await Donation.aggregate([
            { $match: { donorId: req.params.id, status: 'DELIVERED' } }, // Match User ID logic needed
            // If user is Donor: count their donations
            // If user is Volunteer/NGO: count their claimed donations?
            // Let's assume this is for ANY user role based on their ID in relevant fields
            // But query above works for Donor.
            // For now, let's implement for Donor impact.
            {
                $group: {
                    _id: null,
                    totalDonations: { $sum: 1 },
                    mealsSaved: { $sum: 5 },
                    co2Saved: { $sum: 12.5 }
                }
            }
        ]);

        if (stats.length === 0) {
            return res.json({
                meals_saved: 0,
                food_weight_saved: 0,
                co2_saved: 0
            });
        }

        res.json({
            meals_saved: stats[0].mealsSaved,
            food_weight_saved: stats[0].mealsSaved * 0.5,
            co2_saved: stats[0].co2Saved
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getGlobalImpact,
    getUserImpact
};
