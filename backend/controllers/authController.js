const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { validatePhone } = require('../middleware/validate');

const generateToken = (payload) =>
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// POST /api/auth/signup  — patients only
const signup = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !email || !phone || !password)
            return res.status(400).json({ success: false, message: 'All fields are required.' });

        if (!validatePhone(phone))
            return res.status(400).json({ success: false, message: 'Phone must be exactly 10 digits.' });

        if (password.length < 6)
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

        // Check duplicates
        const [existing] = await db.query(
            'SELECT id FROM users WHERE email = ? OR phone = ?',
            [email, phone]
        );
        if (existing.length > 0)
            return res.status(409).json({ success: false, message: 'Email or phone already registered.' });

        const hashed = await bcrypt.hash(password, 12);
        const [result] = await db.query(
            'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
            [name, email, phone, hashed]
        );

        // Update analytics
        await db.query('UPDATE analytics SET total_patients = total_patients + 1 WHERE id = 1');

        const token = generateToken({ id: result.insertId, role: 'patient', name });
        res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            token,
            user: { id: result.insertId, name, email, phone, role: 'patient' }
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ success: false, message: 'Server error during signup.' });
    }
};

// POST /api/auth/login  — patients
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ success: false, message: 'Email and password are required.' });

        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0)
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match)
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });

        const token = generateToken({ id: user.id, role: 'patient', name: user.name });
        res.json({
            success: true,
            message: 'Login successful.',
            token,
            user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: 'patient' }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};

// POST /api/auth/admin/login  — admins only
const adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password)
            return res.status(400).json({ success: false, message: 'Username and password are required.' });

        const [rows] = await db.query('SELECT * FROM admin WHERE username = ?', [username]);
        if (rows.length === 0)
            return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });

        const admin = rows[0];
        const match = await bcrypt.compare(password, admin.password);
        if (!match)
            return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });

        const token = generateToken({ id: admin.id, role: 'admin', username: admin.username });
        res.json({
            success: true,
            message: 'Admin login successful.',
            token,
            user: { id: admin.id, username: admin.username, role: 'admin' }
        });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ success: false, message: 'Server error during admin login.' });
    }
};

module.exports = { signup, login, adminLogin };
