const express = require('express');
const router = express.Router();
const { sendMessage, getConversations } = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/send', sendMessage);
router.get('/conversations', getConversations);

module.exports = router;
