const db = require('../config/db');

const getPayments = async (req, res) => {
    try {
        let rows;
        if (req.user.role === 'admin') {
            [rows] = await db.query(
                `SELECT p.*, u.name as patient_name, u.email as patient_email,
                        a.date as appointment_date, a.time as appointment_time,
                        a.treatment_type
                 FROM payments p
                 LEFT JOIN users u ON p.user_id = u.id
                 LEFT JOIN appointments a ON p.appointment_id = a.id
                 WHERE (p.is_archived = 0 OR p.is_archived IS NULL)
                 ORDER BY p.created_at DESC`
            );
        } else {
            [rows] = await db.query(
                `SELECT p.*, a.date as appointment_date, a.time as appointment_time,
                        a.treatment_type, a.status as appointment_status
                 FROM payments p
                 LEFT JOIN appointments a ON p.appointment_id = a.id
                 WHERE p.user_id = ?
                 ORDER BY p.created_at DESC`,
                [req.user.id]
            );
        }
        res.json({ success: true, payments: rows });
    } catch (err) {
        console.error('Get payments error:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'completed'].includes(status))
            return res.status(400).json({ success: false, message: 'Invalid status.' });

        const [existing] = await db.query('SELECT * FROM payments WHERE id = ?', [id]);
        if (existing.length === 0)
            return res.status(404).json({ success: false, message: 'Payment not found.' });

        const wasCompleted = existing[0].status === 'completed';
        const nowCompleted = status === 'completed';

        await db.query('UPDATE payments SET status = ? WHERE id = ?', [status, id]);

        if (!wasCompleted && nowCompleted) {
            await db.query('UPDATE analytics SET total_revenue = total_revenue + 400 WHERE id = 1');
        } else if (wasCompleted && !nowCompleted) {
            await db.query('UPDATE analytics SET total_revenue = GREATEST(0, total_revenue - 400) WHERE id = 1');
        }

        res.json({ success: true, message: 'Payment status updated.' });
    } catch (err) {
        console.error('Update payment error:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

const archivePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query(
            'UPDATE payments SET is_archived = 1 WHERE id = ?', [id]
        );
        if (result.affectedRows === 0)
            return res.status(404).json({ success: false, message: 'Payment not found.' });
        res.json({ success: true, message: 'Payment removed from view.' });
    } catch (err) {
        console.error('Archive payment error:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { getPayments, updatePaymentStatus, archivePayment };
