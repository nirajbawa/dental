const db = require('../config/db');
const { validatePhone } = require('../middleware/validate');
const { sendBookingConfirmation, sendRejectionEmail } = require('../services/emailService');

// Reminder days per treatment type
const REMINDER_DAYS = {
    'Implants': 7,
    'Root Canal': 3,
    'Whitening': 30,
    'Braces': 30,
    'Extraction': 2,
    'Gum Surgery': 5,
    'General': 180
};

const addDays = (dateStr, days) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
};

// POST /api/appointments  — patient books appointment
const bookAppointment = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const { name, phone, email, date, time, treatment_type, payment_option } = req.body;
        const user_id = req.user.id;

        if (!name || !phone || !email || !date || !time || !treatment_type || !payment_option)
            return res.status(400).json({ success: false, message: 'All fields are required.' });

        if (!validatePhone(phone))
            return res.status(400).json({ success: false, message: 'Phone must be exactly 10 digits.' });

        // Check slot availability
        const [slotCheck] = await conn.query(
            'SELECT id FROM appointments WHERE date = ? AND time = ?',
            [date, time]
        );
        if (slotCheck.length > 0) {
            await conn.rollback();
            return res.status(409).json({ success: false, message: 'This time slot is already booked. Please choose another.' });
        }

        // Insert appointment
        const [apptResult] = await conn.query(
            `INSERT INTO appointments (user_id, name, phone, email, date, time, treatment_type, payment_option)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, name, phone, email, date, time, treatment_type, payment_option]
        );
        const appointment_id = apptResult.insertId;

        // Insert payment record
        const payment_mode = payment_option === 'pay_now' ? 'online' : 'clinic';
        const payment_status = payment_option === 'pay_now' ? 'completed' : 'pending';
        await conn.query(
            `INSERT INTO payments (user_id, appointment_id, amount, payment_mode, status)
       VALUES (?, ?, 400.00, ?, ?)`,
            [user_id, appointment_id, payment_mode, payment_status]
        );

        // Insert reminder
        const days = REMINDER_DAYS[treatment_type] || 180;
        const reminder_date = addDays(date, days);
        const message = `Follow-up reminder for your ${treatment_type} treatment. Please visit the clinic.`;
        await conn.query(
            `INSERT INTO reminders (user_id, appointment_id, message, reminder_date)
       VALUES (?, ?, ?, ?)`,
            [user_id, appointment_id, message, reminder_date]
        );

        // Update analytics
        await conn.query(
            `UPDATE analytics SET
        total_appointments = total_appointments + 1,
        total_revenue = total_revenue + IF(? = 'completed', 400, 0)
       WHERE id = 1`,
            [payment_status]
        );

        await conn.commit();

        // Send booking confirmation email — fires after commit, never blocks the response
        sendBookingConfirmation({
            email,          // recipient address
            name,
            date,
            time,
            treatment_type,
            payment_status
        });

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully.',
            appointment_id
        });
    } catch (err) {
        await conn.rollback();
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'This time slot is already booked.' });
        }
        console.error('Book appointment error:', err);
        res.status(500).json({ success: false, message: 'Server error while booking appointment.' });
    } finally {
        conn.release();
    }
};

// GET /api/appointments  — patient sees own, admin sees all
const getAppointments = async (req, res) => {
    try {
        let rows;
        if (req.user.role === 'admin') {
            try {
                [rows] = await db.query(
                    `SELECT a.*, u.name as patient_name, u.email as patient_email,
                    p.status as payment_status, p.payment_mode, p.amount, p.id as payment_id
                    FROM appointments a
                    LEFT JOIN users u ON a.user_id = u.id
                    LEFT JOIN payments p ON p.appointment_id = a.id
                    WHERE a.is_hidden = 0
                    ORDER BY a.date DESC, a.time ASC`
                );
            } catch {
                // is_hidden column not yet added — fall back to unfiltered
                [rows] = await db.query(
                    `SELECT a.*, u.name as patient_name, u.email as patient_email,
                    p.status as payment_status, p.payment_mode, p.amount, p.id as payment_id
                    FROM appointments a
                    LEFT JOIN users u ON a.user_id = u.id
                    LEFT JOIN payments p ON p.appointment_id = a.id
                    ORDER BY a.date DESC, a.time ASC`
                );
            }
        } else {
            [rows] = await db.query(
                `SELECT a.*, p.status as payment_status, p.payment_mode, p.amount
                FROM appointments a
                LEFT JOIN payments p ON p.appointment_id = a.id
                WHERE a.user_id = ?
                ORDER BY a.date DESC, a.time ASC`,
                [req.user.id]
            );
        }
        res.json({ success: true, appointments: rows });
    } catch (err) {
        console.error('Get appointments error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};
// GET /api/appointments/slots?date=YYYY-MM-DD  — check booked slots
const getBookedSlots = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ success: false, message: 'Date is required.' });

        const [rows] = await db.query(
            'SELECT time FROM appointments WHERE date = ?',
            [date]
        );
        const booked = rows.map(r => r.time);
        res.json({ success: true, booked_slots: booked });
    } catch (err) {
        console.error('Get slots error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// PUT /api/appointments/:id/status  — admin updates status
const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'accepted', 'rejected'].includes(status))
            return res.status(400).json({ success: false, message: 'Invalid status value.' });

        const [result] = await db.query(
            'UPDATE appointments SET status = ? WHERE id = ?',
            [status, id]
        );
        if (result.affectedRows === 0)
            return res.status(404).json({ success: false, message: 'Appointment not found.' });

        // Send rejection email if status changed to rejected
        if (status === 'rejected') {
            try {
                const [rows] = await db.query(
                    'SELECT name, email, date, time, treatment_type FROM appointments WHERE id = ?', [id]
                );
                if (rows.length > 0) {
                    const { name, email, date, time, treatment_type } = rows[0];
                    sendRejectionEmail({ email, name, date, time, treatment_type });
                }
            } catch (emailErr) {
                console.error('Rejection email failed:', emailErr.message);
            }
        }

        res.json({ success: true, message: `Appointment ${status} successfully.` });
    } catch (err) {
        console.error('Update status error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// PATCH /api/appointments/:id/hide  — admin soft-removes an appointment
const hideAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if is_hidden column exists; if not, return a clear message
        const [cols] = await db.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments' AND COLUMN_NAME = 'is_hidden'`
        );
        if (cols.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'DB migration not run. Please run: ALTER TABLE appointments ADD COLUMN is_hidden TINYINT(1) NOT NULL DEFAULT 0;'
            });
        }

        const [result] = await db.query(
            'UPDATE appointments SET is_hidden = 1 WHERE id = ?',
            [id]
        );
        if (result.affectedRows === 0)
            return res.status(404).json({ success: false, message: 'Appointment not found.' });

        res.json({ success: true, message: 'Appointment hidden.' });
    } catch (err) {
        console.error('Hide appointment error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = { bookAppointment, getAppointments, getBookedSlots, updateAppointmentStatus, hideAppointment };
