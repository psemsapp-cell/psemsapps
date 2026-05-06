const express = require('express');
const router = express.Router();
const controller = require('../controllers/BatchController');
const verifyToken = require('../middleware/authMiddleware'); // 👈 import

// 📥 Get all batches
router.get('/', verifyToken, controller.getAllBatches);

// ✅ Get batches by user ID FIRST
router.get('/user/:user_id', verifyToken, controller.getBatchesByUserId);

// ✅ then single batch by id
router.get('/:id', verifyToken, controller.getBatchById);

// ➕ Add batch
router.post('/add', verifyToken, controller.addBatch);

// ✏️ Update batch
router.put('/:id', verifyToken, controller.updateBatch);

// ❌ Delete batch
router.delete('/:id', verifyToken, controller.deleteBatch);

router.get('/:id/harvest-limit', verifyToken, controller.getHarvestLimit);

module.exports = router;