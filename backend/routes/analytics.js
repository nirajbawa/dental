const express = require('express');
const router = express.Router();

const { verifyToken, requireAdmin } = require('../middleware/auth');
const { getAnalytics } = require('../controllers/analyticsController');

// GET /api/analytics
router.get('/', verifyToken, requireAdmin, getAnalytics);

module.exports = router;