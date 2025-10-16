const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Semua route harus login
router.use(authMiddleware);

// CRUD Users (Admin & Manager have different access)
router.get('/', userController.getAllUsers);
router.get('/subordinates', roleMiddleware('MANAGER', 'ADMIN'), userController.getSubordinates);
router.get('/:id', userController.getUserById);
router.put('/:id', roleMiddleware('ADMIN'), userController.updateUser);
router.delete('/:id', roleMiddleware('ADMIN'), userController.deleteUser);

module.exports = router;
