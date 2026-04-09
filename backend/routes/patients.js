const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { getAllPatients, getProfile } = require('../controllers/patientController');

router.get('/profile', verifyToken, getProfile);
router.get('/', verifyToken, requireAdmin, getAllPatients);

module.exports = router;
