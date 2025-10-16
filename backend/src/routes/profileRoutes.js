const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middlewares/authMiddleware');

// Semua route harus login
router.use(authMiddleware);

// Profile routes
router.put('/update', profileController.updateProfile);
router.put('/change-password', profileController.changePassword);

module.exports = router;
