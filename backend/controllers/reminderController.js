const db = require('../config/db');

const getReminders = async (req, res) => {
    try {
        // Safety fallback: auto-mark past-due completed reminders as deleted
        // Wrapped in try/catch in case is_deleted column doesn't exist yet
        try {
            await db.query(
                `UPDATE reminders SET is_deleted = 1
                 WHERE reminder_date < CURDATE() AND status = 'completed' AND is_deleted = 0`
            );
        } catch (_) { /* column not yet added — skip */ }

        let rows;
        if (req.user.role === 'admin') {
            try {
                [rows] = await db.query(
                    `SELECT r.*, r.is_read, u.name as patient_name, u.email as patient_email,
                            a.treatment_type, a.date as appointment_date
                     FROM reminders r
                     LEFT JOIN users u ON r.user_id = u.id
                     LEFT JOIN appointments a ON r.appointment_id = a.id
                     WHERE r.is_deleted = 0
                     ORDER BY r.reminder_date ASC`
                );
            } catch (_) {
                // is_deleted column not yet added — fall back to unfiltered
                [rows] = await db.query(
                    `SELECT r.*, r.is_read, u.name as patient_name, u.email as patient_email,
                            a.treatment_type, a.date as appointment_date
                     FROM reminders r
                     LEFT JOIN users u ON r.user_id = u.id
                     LEFT JOIN appointments a ON r.appointment_id = a.id
                     ORDER BY r.reminder_date ASC`
                );
            }
        } else {
            [rows] = await db.query(
                `SELECT r.*, r.is_read, a.treatment_type, a.date as appointment_date
                 FROM reminders r
                 LEFT JOIN appointments a ON r.appointment_id = a.id
                 WHERE r.user_id = ?
                 ORDER BY r.reminder_date ASC`,
                [req.user.id]
            );
        }
        res.json({ success: true, reminders: rows });
    } catch (err) {
        console.error('Get reminders error:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

const updateReminderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'completed'].includes(status))
            return res.status(400).json({ success: false, message: 'Invalid status.' });

        const [result] = await db.query(
            'UPDATE reminders SET status = ? WHERE id = ?',
            [status, id]
        );
        if (result.affectedRows === 0)
            return res.status(404).json({ success: false, message: 'Reminder not found.' });

        // If marking completed, also soft-delete so it disappears from admin panel
        if (status === 'completed') {
            try {
                await db.query('UPDATE reminders SET is_deleted = 1 WHERE id = ?', [id]);
            } catch (_) { /* is_deleted column not yet added */ }
        }

        res.json({ success: true, message: 'Reminder updated.' });
    } catch (err) {
        console.error('Update reminder error:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

const markRemindersRead = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'ids must be a non-empty array.' });
        }

        const [result] = await db.query(
            'UPDATE reminders SET is_read = 1 WHERE id IN (?) AND user_id = ?',
            [ids, req.user.id]
        );

        res.json({ success: true, updated: result.affectedRows });
    } catch (err) {
        console.error('Mark reminders read error:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { getReminders, updateReminderStatus, markRemindersRead };
