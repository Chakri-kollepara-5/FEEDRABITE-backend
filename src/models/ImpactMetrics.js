const mongoose = require('mongoose');

const impactMetricsSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now,
        unique: true // One record per day for global stats, or change logic for user stats
    },
    totalMealsSaved: {
        type: Number,
        default: 0
    },
    totalWeightSaved: { // in kg
        type: Number,
        default: 0
    },
    co2Saved: { // in kg
        type: Number,
        default: 0
    },
    // If we want to track per user, we might need a different schema or field
    // For now, let's assume this is for daily global aggregation
    // To track User impact, we can aggregate from Donations or store in User model
});

module.exports = mongoose.model('ImpactMetrics', impactMetricsSchema);
