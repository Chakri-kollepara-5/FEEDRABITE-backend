const express = require('express');
const router = express.Router();
const { getImpactMetrics } = require('../controllers/statsController');

// Public route - no auth required for viewing stats
router.get('/impact', getImpactMetrics);

module.exports = router;
