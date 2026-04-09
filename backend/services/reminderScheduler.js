const cron = require('node-cron');
const db = require('../config/db');
const { sendDayBeforeReminder } = require('./emailService');

// Runs every day at 8:00 AM IST
// Finds all appointments scheduled for tomorrow and sends reminder emails
const startReminderScheduler = () => {
    // Cron: '0 8 * * *' = 8:00 AM every day
    cron.schedule('0 8 * * *', async () => {
        console.log('⏰ Running day-before reminder job...');
        await sendTomorrowReminders();
    }, {
        timezone: 'Asia/Kolkata'
    });

    console.log('✅ Reminder scheduler started — runs daily at 8:00 AM IST');
};

const sendTomorrowReminders = async () => {
    try {
        // Get all accepted/pending appointments for tomorrow
        const [appointments] = await db.query(
            `SELECT a.id, a.name, a.email, a.date, a.time, a.treatment_type,
                    p.status as payment_status
             FROM appointments a
             LEFT JOIN payments p ON p.appointment_id = a.id
             WHERE a.date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
               AND a.status != 'rejected'`,
        );

        if (appointments.length === 0) {
            console.log('📭 No appointments tomorrow — no reminders to send.');
            return;
        }

        console.log(`📬 Sending ${appointments.length} day-before reminder(s)...`);

        for (const appt of appointments) {
            await sendDayBeforeReminder({
                email: appt.email,
                name: appt.name,
                date: appt.date instanceof Date
                    ? appt.date.toISOString().split('T')[0]
                    : String(appt.date).split('T')[0],
                time: appt.time,
                treatment_type: appt.treatment_type,
                payment_status: appt.payment_status || 'pending'
            });
        }

        console.log('✅ Day-before reminders sent.');

        // Auto-mark past due completed reminders as read + deleted so they disappear from admin panel
        await db.query(
            `UPDATE reminders SET is_read = 1, is_deleted = 1
             WHERE reminder_date < CURDATE() AND status = 'completed' AND is_deleted = 0`
        );
    } catch (err) {
        console.error('❌ Reminder scheduler error:', err.message);
    }
};

// Export so it can also be triggered manually (e.g. for testing)
module.exports = { startReminderScheduler, sendTomorrowReminders };
