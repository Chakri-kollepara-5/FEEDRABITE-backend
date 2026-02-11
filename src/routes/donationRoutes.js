const express = require('express');
const router = express.Router();
const {
    createDonation,
    getNearbyDonations,
    getMyDonations,
    getDonationById,
    updateStatus,
    cancelDonation
} = require('../controllers/donationController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.route('/create').post(protect, authorize('donor', 'admin'), createDonation);
router.route('/nearby').get(protect, getNearbyDonations);
router.route('/my-donations').get(protect, getMyDonations);
router.route('/:id').get(protect, getDonationById);
router.route('/:id/status').patch(protect, updateStatus);
router.route('/cancel/:id').delete(protect, cancelDonation); // Maps to DELETE /api/donations/cancel/:id roughly, or just DELETE /:id

module.exports = router;
