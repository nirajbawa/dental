const db = require('../config/db');

// GET /api/patients  — admin only
const getAllPatients = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT u.id, u.name, u.email, u.phone, u.created_at,
              COUNT(DISTINCT a.id) as total_appointments,
              COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) as paid_count
       FROM users u
       LEFT JOIN appointments a ON a.user_id = u.id
       LEFT JOIN payments p ON p.user_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
        );
        res.json({ success: true, patients: rows });
    } catch (err) {
        console.error('Get patients error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// GET /api/patients/profile  — patient sees own profile
const getProfile = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        if (rows.length === 0)
            return res.status(404).json({ success: false, message: 'User not found.' });

        res.json({ success: true, user: rows[0] });
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { getAllPatients, getProfile };
