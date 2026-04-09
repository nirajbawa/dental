const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { getPayments, updatePaymentStatus, archivePayment } = require('../controllers/paymentController');

router.get('/', verifyToken, getPayments);
router.put('/:id', verifyToken, requireAdmin, updatePaymentStatus);
router.patch('/:id/archive', verifyToken, requireAdmin, archivePayment);

module.exports = router;
