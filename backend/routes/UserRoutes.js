const express = require('express');
const router = express.Router();
const controller = require('../controllers/UserController');
const verifyToken = require('../middleware/authMiddleware'); // 👈 import

// 🟢 Register 
router.post('/register', controller.addUser);

// 🟢 Login
router.post('/login', controller.loginUser);

// ✅ Get all staff users (specific route first)
router.get('/staff', controller.getStaffUsers);

// 🟢 Get user by ID (dynamic route last)
router.get('/:id', controller.getUserById);

// 🟢 Update user
router.put('/:id', controller.updateUser);

// 🗑️ Delete user
router.delete('/:id', controller.deleteUser);


module.exports = router;
