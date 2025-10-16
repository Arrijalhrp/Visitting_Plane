const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

// Semua route harus login
router.use(authMiddleware);

// Dashboard endpoints
router.get('/summary', dashboardController.getDashboardSummary);
router.get('/statistics', dashboardController.getVisitStatistics);
router.get('/revenue', dashboardController.getRevenueAnalytics);

module.exports = router;
