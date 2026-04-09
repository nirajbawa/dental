const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const {
    bookAppointment,
    getAppointments,
    getBookedSlots,
    updateAppointmentStatus,
    hideAppointment
} = require('../controllers/appointmentController');

// Public: check booked slots for a date
router.get('/slots', getBookedSlots);

// Protected: book appointment (patient)
router.post('/', verifyToken, bookAppointment);

// Protected: get appointments (patient sees own, admin sees all)
router.get('/', verifyToken, getAppointments);

// Admin: update appointment status
router.put('/:id/status', verifyToken, requireAdmin, updateAppointmentStatus);

// Admin: hide (soft-remove) an appointment
router.patch('/:id/hide', verifyToken, requireAdmin, hideAppointment);

module.exports = router;
