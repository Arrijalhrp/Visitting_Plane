const express = require('express');
const router = express.Router();
const visitPlanController = require('../controllers/visitPlanController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Semua route harus login
router.use(authMiddleware);

// CRUD Visit Plans
router.get('/', visitPlanController.getAllVisitPlans);
router.get('/:id', visitPlanController.getVisitPlanById);
router.post('/', visitPlanController.createVisitPlan);
router.put('/:id', visitPlanController.updateVisitPlan);
router.delete('/:id', roleMiddleware('ADMIN'), visitPlanController.deleteVisitPlan);

module.exports = router;
