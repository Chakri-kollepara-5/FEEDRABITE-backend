const express = require('express');
const router = express.Router();
const { getCommunityMembers, getCommunityEvents } = require('../controllers/communityController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/members', protect, getCommunityMembers);
router.get('/events', protect, getCommunityEvents);

module.exports = router;
