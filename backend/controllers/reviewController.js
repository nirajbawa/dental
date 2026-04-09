const db = require('../config/db');

// GET /api/reviews — public, returns all visible reviews with patient name
const getReviews = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT r.id, r.rating, r.review_text, r.created_at,
                    u.name as patient_name,
                    a.treatment_type
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             JOIN appointments a ON r.appointment_id = a.id
             WHERE r.is_visible = 1
             ORDER BY r.created_at DESC`
        );
        const [[{ avg_rating }]] = await db.query(
            'SELECT ROUND(AVG(rating), 1) as avg_rating FROM reviews WHERE is_visible = 1'
        );
        const [[{ total }]] = await db.query(
            'SELECT COUNT(*) as total FROM reviews WHERE is_visible = 1'
        );
        res.json({ success: true, reviews: rows, avg_rating: avg_rating || 0, total });
    } catch (err) {
        console.error('Get reviews error:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// GET /api/reviews/admin — admin sees all reviews including hidden
const getReviewsAdmin = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT r.*, u.name as patient_name, u.email as patient_email,
                    a.treatment_type, a.date as appointment_date
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             JOIN appointments a ON r.appointment_id = a.id
             ORDER BY r.created_at DESC`
        );
        res.json({ success: true, reviews: rows });
    } catch (err) {
        console.error('Get admin reviews error:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// POST /api/reviews — patient submits a review
const submitReview = async (req, res) => {
    try {
        const { appointment_id, rating, review_text } = req.body;
        const user_id = req.user.id;

        if (!appointment_id || !rating || !review_text?.trim())
            return res.status(400).json({ success: false, message: 'appointment_id, rating, and review_text are required.' });

        if (rating < 1 || rating > 5)
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });

        if (review_text.trim().length < 10)
            return res.status(400).json({ success: false, message: 'Review must be at least 10 characters.' });

        // Verify appointment belongs to this user and is accepted
        const [apptRows] = await db.query(
            "SELECT id FROM appointments WHERE id = ? AND user_id = ? AND status = 'accepted'",
            [appointment_id, user_id]
        );
        if (apptRows.length === 0)
            return res.status(403).json({
                success: false,
                message: 'You can only review accepted appointments.'
            });

        // Check for duplicate
        const [existing] = await db.query(
            'SELECT id FROM reviews WHERE user_id = ? AND appointment_id = ?',
            [user_id, appointment_id]
        );
        if (existing.length > 0)
            return res.status(409).json({ success: false, message: 'You have already reviewed this appointment.' });

        await db.query(
            'INSERT INTO reviews (user_id, appointment_id, rating, review_text) VALUES (?, ?, ?, ?)',
            [user_id, appointment_id, rating, review_text.trim()]
        );

        res.status(201).json({ success: true, message: 'Review submitted successfully.' });
    } catch (err) {
        console.error('Submit review error:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// DELETE /api/reviews/:id — admin deletes (hides) a review
const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query(
            'UPDATE reviews SET is_visible = 0 WHERE id = ?',
            [id]
        );
        if (result.affectedRows === 0)
            return res.status(404).json({ success: false, message: 'Review not found.' });

        res.json({ success: true, message: 'Review hidden successfully.' });
    } catch (err) {
        console.error('Delete review error:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// PUT /api/reviews/:id/restore — admin restores a hidden review
const restoreReview = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE reviews SET is_visible = 1 WHERE id = ?', [id]);
        res.json({ success: true, message: 'Review restored.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { getReviews, getReviewsAdmin, submitReview, deleteReview, restoreReview };
