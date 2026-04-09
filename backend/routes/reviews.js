const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const {
    getReviews,
    getReviewsAdmin,
    submitReview,
    deleteReview,
    restoreReview
} = require('../controllers/reviewController');

router.get('/', getReviews);                                          // public
router.get('/admin', verifyToken, requireAdmin, getReviewsAdmin);     // admin
router.post('/', verifyToken, submitReview);                          // patient
router.delete('/:id', verifyToken, requireAdmin, deleteReview);       // admin
router.put('/:id/restore', verifyToken, requireAdmin, restoreReview); // admin

module.exports = router;
