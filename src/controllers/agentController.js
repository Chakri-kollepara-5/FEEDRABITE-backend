const { runFeedraAgentPipeline } = require('../services/agentService');
const mongoose = require('mongoose');

exports.runAgent = async (req, res) => {
  try {
    // fetch REAL donations from MongoDB
    const realDonations = await mongoose.connection.db
      .collection('donations')
      .find({})
      .toArray();

    console.log(`✅ Fetched ${realDonations.length} real donations from MongoDB`);
    console.log('Donations:', JSON.stringify(realDonations.map(d => ({
      foodType: d.foodType,
      quantity: d.quantity,
      city: d.city,
      donor: d.donor,
      expiryDate: d.expiryDate
    })), null, 2));

    // pass real data to agents
    const result = await runFeedraAgentPipeline(realDonations);
    res.json({ success: true, data: result });

  } catch (err) {
    console.error('Agent pipeline error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
