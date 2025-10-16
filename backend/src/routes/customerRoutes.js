const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Semua route customer terproteksi, harus login
router.use(authMiddleware);

// Route CRUD Customer
router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);
router.post('/', roleMiddleware('ADMIN'), customerController.createCustomer);
router.put('/:id', roleMiddleware('ADMIN'), customerController.updateCustomer);
router.delete('/:id', roleMiddleware('ADMIN'), customerController.deleteCustomer);

module.exports = router;
