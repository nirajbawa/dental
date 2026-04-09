const db = require('../config/db');

const getAnalytics = async (req, res) => {
    try {
        const [analyticsRows] = await db.query('SELECT * FROM analytics WHERE id = 1');
        const analytics = analyticsRows[0] || {};

        const [[{ pending_appointments }]] = await db.query(
            "SELECT COUNT(*) as pending_appointments FROM appointments WHERE status = 'pending'"
        );
        const [[{ pending_payments }]] = await db.query(
            "SELECT COUNT(*) as pending_payments FROM payments WHERE status = 'pending'"
        );
        const [[{ today_appointments }]] = await db.query(
            'SELECT COUNT(*) as today_appointments FROM appointments WHERE date = CURDATE()'
        );

        // Use YEAR/MONTH instead of DATE_FORMAT to avoid strict SQL mode issues
        const [monthly] = await db.query(
            `SELECT YEAR(date) as yr, MONTH(date) as mo, COUNT(*) as count
             FROM appointments
             GROUP BY YEAR(date), MONTH(date)
             ORDER BY yr DESC, mo DESC
             LIMIT 6`
        );

        const [treatmentStats] = await db.query(
            `SELECT treatment_type, COUNT(*) as count
             FROM appointments
             GROUP BY treatment_type
             ORDER BY count DESC`
        );

        // Format month labels in JS instead of MySQL
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthly_appointments = monthly.map(r => ({
            month: `${monthNames[r.mo - 1]} ${r.yr}`,
            count: r.count
        }));

        res.json({
            success: true,
            analytics: {
                ...analytics,
                pending_appointments,
                pending_payments,
                today_appointments,
                monthly_appointments,
                treatment_stats: treatmentStats
            }
        });
    } catch (err) {
        console.error('Analytics error:', err.message);
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
};

module.exports = { getAnalytics };
