const express = require('express');
const router = express.Router();
const visitReportController = require('../controllers/visitReportController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Semua route harus login
router.use(authMiddleware);

// CRUD Visit Reports
router.get('/', visitReportController.getAllReports);
router.get('/:id', visitReportController.getReportById);
router.post('/', visitReportController.createReport);
router.put('/:id', visitReportController.updateReport);
router.delete('/:id', roleMiddleware('ADMIN'), visitReportController.deleteReport);

module.exports = router;

