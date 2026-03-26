const express = require('express');
const router = express.Router();
const { runAgent } = require('../controllers/agentController');

router.post('/run', runAgent);

module.exports = router;
