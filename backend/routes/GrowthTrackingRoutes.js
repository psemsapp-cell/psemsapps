const express = require('express');
const router = express.Router();
const controller = require('../controllers/GrowthTrackingController');
const verifyToken = require('../middleware/authMiddleware'); // 👈 import

// 🟢 Add a new growth record
router.post('/add_growth', verifyToken, controller.addGrowth);

// 🟢 Get all growth records
router.get('/', verifyToken, controller.getAllGrowth);

// 🟢 Get growth records by user_id
router.get('/user_growth/:user_id', verifyToken, controller.getGrowthByUserId);

// 🟢 Get a single growth record by its ID
router.get('/:id', verifyToken, controller.getGrowthById);

// 🟢 Update growth record by ID
router.put('/:id', verifyToken, controller.updateGrowth);

// 🟢 Delete growth record by ID
router.delete('/:id', verifyToken, controller.deleteGrowth);

module.exports = router;