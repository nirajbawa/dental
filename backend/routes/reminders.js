const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin, requirePatient } = require('../middleware/auth');
const { getReminders, updateReminderStatus, markRemindersRead } = require('../controllers/reminderController');

router.get('/', verifyToken, getReminders);
router.patch('/mark-read', verifyToken, requirePatient, markRemindersRead);
router.put('/:id', verifyToken, requireAdmin, updateReminderStatus);

module.exports = router;
