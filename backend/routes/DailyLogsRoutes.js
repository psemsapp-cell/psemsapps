const express = require('express');
const router = express.Router();
const controller = require('../controllers/DailyLogsController');
const verifyToken = require('../middleware/authMiddleware'); // 👈 import

// 🟢 Add a new daily log
router.post('/add_daily', verifyToken, controller.addDailyLog);

// 🟢 Get all daily logs
router.get('/', verifyToken, controller.getDailyLogs);

// 🟢 Get daily logs by user_id
router.get('/user_daily/:user_id', verifyToken, controller.getDailyLogsByUserId);

// 🟢 Get a single daily log by its ID
router.get('/:id', verifyToken, controller.getDailyLogById);

// 🟢 Update daily log by ID
router.put('/:id', verifyToken, controller.updateDailyLog);

// 🟢 Delete daily log by ID
router.delete('/:id', verifyToken, controller.deleteDailyLog);

module.exports = router;