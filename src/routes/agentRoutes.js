const express = require('express');
const router = express.Router();
const { runAgent } = require('../controllers/agentController');

router.post('/run', runAgent);
router.get('/test', (req, res) => res.json({ message: 'Agent API is working' }));

module.exports = router;
