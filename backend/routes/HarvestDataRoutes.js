// routes/HarvestDataRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/HarvestDataController');
const verifyToken = require('../middleware/authMiddleware'); // 👈 import

// ✅ must have :user_id in the path
router.get('/:user_id', verifyToken, controller.getHarvestsByUser);

module.exports = router;