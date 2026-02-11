const express = require('express');
const router = express.Router();
const {
    getGlobalImpact,
    getUserImpact
} = require('../controllers/impactController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/global', getGlobalImpact);
router.get('/user/:id', protect, getUserImpact);

module.exports = router;
