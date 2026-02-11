const express = require('express');
const router = express.Router();
const {
    getUsers,
    verifyNGO,
    getDonationAnalytics,
    getSystemStats
} = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/users', getUsers);
router.patch('/verify-ngo/:id', verifyNGO);
router.get('/donation-analytics', getDonationAnalytics);
router.get('/system-stats', getSystemStats);

module.exports = router;
