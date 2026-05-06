const express = require('express');
const router = express.Router();
const controller = require('../controllers/MortalityController');
const verifyToken = require('../middleware/authMiddleware'); // 👈 import

// 🟢 Add a new mortality record
router.post('/add_mortality', controller.addMortality);

// 🟢 Get all mortalities
router.get('/', controller.getMortalities);

// 🟢 Get mortalities by user_id
router.get('/user_mortality/:user_id', controller.getMortalitiesByUserId);

// 🟢 Get a single mortality record by its ID
router.get('/:id', controller.getMortalityById);

// 🟢 Update mortality record by ID
router.put('/:id', controller.updateMortality);

// 🟢 Delete mortality record by ID
router.delete('/:id', controller.deleteMortality);

module.exports = router;
