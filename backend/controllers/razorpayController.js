const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');

const isTestMode = () =>
    !process.env.RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID.includes('XXXX') ||
    process.env.RAZORPAY_KEY_ID === 'rzp_test_XXXXXXXXXXXXXXXX';

// POST /api/razorpay/create-order
const createOrder = async (req, res) => {
    try {
        const { appointment_id } = req.body;
        if (!appointment_id)
            return res.status(400).json({ success: false, message: 'appointment_id is required.' });

        const [rows] = await db.query(
            'SELECT * FROM appointments WHERE id = ? AND user_id = ?',
            [appointment_id, req.user.id]
        );
        if (rows.length === 0)
            return res.status(404).json({ success: false, message: 'Appointment not found.' });

        const [payRows] = await db.query(
            "SELECT * FROM payments WHERE appointment_id = ? AND status = 'completed'",
            [appointment_id]
        );
        if (payRows.length > 0)
            return res.status(400).json({ success: false, message: 'Payment already completed.' });

        // TEST MODE — return a simulated order (no real Razorpay call)
        if (isTestMode()) {
            const fakeOrderId = `order_TEST_${Date.now()}`;
            return res.json({
                success: true,
                test_mode: true,
                order_id: fakeOrderId,
                amount: 40000,
                currency: 'INR',
                key_id: 'TEST_MODE'
            });
        }

        // LIVE MODE — real Razorpay order
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const order = await razorpay.orders.create({
            amount: 40000,
            currency: 'INR',
            receipt: `appt_${appointment_id}_${Date.now()}`,
            notes: {
                appointment_id: String(appointment_id),
                user_id: String(req.user.id),
                clinic: 'The Smile Dental Clinic'
            }
        });

        res.json({
            success: true,
            test_mode: false,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (err) {
        console.error('Razorpay create order error:', err.message);
        res.status(500).json({ success: false, message: 'Could not create payment order: ' + err.message });
    }
};

// POST /api/razorpay/verify
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointment_id } = req.body;

        if (!appointment_id)
            return res.status(400).json({ success: false, message: 'appointment_id is required.' });

        // TEST MODE — skip signature check, just mark paid
        if (isTestMode() || (razorpay_order_id && razorpay_order_id.startsWith('order_TEST_'))) {
            await db.query(
                `UPDATE payments SET status = 'completed', payment_mode = 'online',
                 razorpay_order_id = ?, razorpay_payment_id = ?
                 WHERE appointment_id = ?`,
                [razorpay_order_id || 'TEST', razorpay_payment_id || 'TEST_PAY_' + Date.now(), appointment_id]
            );
            await db.query('UPDATE analytics SET total_revenue = total_revenue + 400 WHERE id = 1');
            return res.json({ success: true, message: 'Test payment recorded successfully.' });
        }

        // LIVE MODE — verify HMAC signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature)
            return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });

        await db.query(
            `UPDATE payments SET status = 'completed', payment_mode = 'online',
             razorpay_order_id = ?, razorpay_payment_id = ?
             WHERE appointment_id = ?`,
            [razorpay_order_id, razorpay_payment_id, appointment_id]
        );
        await db.query('UPDATE analytics SET total_revenue = total_revenue + 400 WHERE id = 1');

        res.json({ success: true, message: 'Payment verified and recorded successfully.' });
    } catch (err) {
        console.error('Razorpay verify error:', err.message);
        res.status(500).json({ success: false, message: 'Payment verification error.' });
    }
};

module.exports = { createOrder, verifyPayment };
