const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middlewares/authMiddleware');

// Semua route customer terproteksi, harus login
router.use(authMiddleware);

// Route CRUD Customer - SEMUA ROLE BISA AKSES
router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);
router.post('/', customerController.createCustomer);      // ✅ Dulu ADMIN only, sekarang ALL
router.put('/:id', customerController.updateCustomer);    // ✅ Dulu ADMIN only, sekarang ALL
router.delete('/:id', customerController.deleteCustomer); // ✅ Dulu ADMIN only, sekarang ALL

module.exports = router;
