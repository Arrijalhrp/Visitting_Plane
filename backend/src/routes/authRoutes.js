const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Public routes
router.post('/login', authController.login);

// Protected routes (Only Admin can register new users)
router.post('/register', authMiddleware, roleMiddleware('ADMIN'), authController.register);

// Get current logged in user
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;
