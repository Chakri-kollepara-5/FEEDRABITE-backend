const Donation = require('../models/Donation');

// @desc    Get impact metrics (total food saved, meals, CO2)
// @route   GET /api/stats/impact
// @access  Public
const getImpactMetrics = async (req, res) => {
    try {
        // Aggregate total quantity from all donations (exclude only cancelled/expired)
        const result = await Donation.aggregate([
            {
                $match: {
                    status: { $nin: ['CANCELLED', 'EXPIRED'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalFoodSaved: { $sum: '$quantity' },
                    totalDonations: { $sum: 1 }
                }
            }
        ]);

        const totalFoodSaved = result.length > 0 ? result[0].totalFoodSaved : 0;
        const totalDonations = result.length > 0 ? result[0].totalDonations : 0;

        // Calculate derived metrics
        const mealsProvided = Math.round(totalFoodSaved * 3); // 1kg ≈ 3 meals
        const co2Saved = Math.round(totalFoodSaved * 2.3); // 1kg food waste ≈ 2.3kg CO2

        // Count unique donors (exclude only cancelled/expired)
        const uniqueDonors = await Donation.distinct('donorId', {
            status: { $nin: ['CANCELLED', 'EXPIRED'] }
        });

        res.json({
            totalFoodSaved,
            totalDonations,
            mealsProvided,
            co2Saved,
            activeDonors: uniqueDonors.length
        });
    } catch (error) {
        console.error('Impact metrics error:', error);
        res.status(500).json({
            message: 'Failed to fetch impact metrics',
            error: error.message
        });
    }
};

module.exports = { getImpactMetrics };
