const express = require('express');
const router = express.Router();
const { getCommunityMembers } = require('../controllers/communityController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/members', protect, getCommunityMembers);

module.exports = router;
