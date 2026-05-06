const express = require('express');
const router = express.Router();
const controller = require('../controllers/ForecastController');
const verifyToken = require('../middleware/authMiddleware'); // 👈 import

// ✅ No user_id required
router.get('/', verifyToken, controller.getForecast);

module.exports = router;