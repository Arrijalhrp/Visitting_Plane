const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper: Cek apakah visit plan masih bisa diedit (48h SETELAH visit date)
const isEditable = (tanggalVisit) => {
  const now = new Date();
  const visitDate = new Date(tanggalVisit);
  
  // Set visit date to end of day (23:59:59)
  visitDate.setHours(23, 59, 59, 999);
  
  // Add 48 hours after visit date
  const lockDate = new Date(visitDate.getTime() + (48 * 60 * 60 * 1000));
  
  // Can edit if now is before lock date
  return now <= lockDate;
};

// Get all visit plans (dengan filter dan pagination)
const getAllVisitPlans = async (req, res) => {
  try {
    const { role, id: userId, managerId } = req.user;
    const { status, customerId, startDate, endDate, page = 1, limit = 10 } = req.query;

    let whereClause = {};

    // Role-based filtering
    if (role === 'USER') {
      whereClause = { userId };
    } else if (role === 'MANAGER') {
      const subordinates = await prisma.user.findMany({
        where: { managerId: userId },
        select: { id: true }
      });
      const subordinateIds = subordinates.map(sub => sub.id);
      whereClause = { userId: { in: [...subordinateIds, userId] } };
    }

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Filter by customer
    if (customerId) {
      whereClause.customerId = customerId;
    }

    // Filter by date range
    if (startDate || endDate) {
      whereClause.tanggalVisit = {};
      if (startDate) {
        whereClause.tanggalVisit.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.tanggalVisit.lte = new Date(endDate);
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get total count
    const totalCount = await prisma.visitPlan.count({ where: whereClause });

    // Get visit plans
    const visitPlans = await prisma.visitPlan.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: { tanggalVisit: 'desc' },
      include: {
        user: { select: { id: true, namaLengkap: true } },
        customer: { select: { id: true, namaCustomer: true } },
        report: true
      }
    });

    res.json({
      success: true,
      data: visitPlans,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get visit plans error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch visit plans' });
  }
};

// Get single visit plan
const getVisitPlanById = async (req, res) => {
  try {
    const { id } = req.params;

    const visitPlan = await prisma.visitPlan.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, namaLengkap: true } },
        customer: true,
        report: true
      }
    });

    if (!visitPlan) {
      return res.status(404).json({ success: false, message: 'Visit plan not found' });
    }

    res.json({ success: true, data: visitPlan });
  } catch (error) {
    console.error('Get visit plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch visit plan' });
  }
};

// Create visit plan
const createVisitPlan = async (req, res) => {
  try {
    const { customerId, tanggalVisit, tujuanVisit, programPembahasan, revenueTarget, kategori } = req.body;

    if (!customerId || !tanggalVisit || !tujuanVisit || !programPembahasan || !revenueTarget) {
      return res.status(400).json({ success: false, message: 'Please complete all required fields' });
    }

    const newVisitPlan = await prisma.visitPlan.create({
      data: {
        userId: req.user.id,
        customerId,
        tanggalVisit: new Date(tanggalVisit),
        tujuanVisit,
        programPembahasan,
        revenueTarget: parseFloat(revenueTarget),
        status: 'PLANNED',
        kategori,
        isEditable: true
      }
    });

    res.status(201).json({ success: true, message: 'Visit plan created', data: newVisitPlan });
  } catch (error) {
    console.error('Create visit plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to create visit plan' });
  }
};

// Update visit plan (dengan validasi 48 jam SETELAH visit date untuk USER & MANAGER)
const updateVisitPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerId, tanggalVisit, tujuanVisit, programPembahasan, revenueTarget, status, kategori } = req.body;

    // Ambil visit plan yang mau diupdate
    const existingPlan = await prisma.visitPlan.findUnique({ where: { id } });

    if (!existingPlan) {
      return res.status(404).json({ success: false, message: 'Visit plan not found' });
    }

    // ✅ ADMIN bypass 48-hour rule
    const isAdmin = req.user.role === 'ADMIN';
    
    // Cek apakah masih dalam 48 jam SETELAH VISIT DATE (hanya untuk USER & MANAGER)
    if (!isAdmin && !isEditable(existingPlan.tanggalVisit)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot edit visit plan after 48 hours from visit date' 
      });
    }

    // Update data
    const updatedPlan = await prisma.visitPlan.update({
      where: { id },
      data: {
        customerId,
        tanggalVisit: tanggalVisit ? new Date(tanggalVisit) : undefined,
        tujuanVisit,
        programPembahasan,
        revenueTarget: revenueTarget ? parseFloat(revenueTarget) : undefined,
        status,
        kategori,
        isEditable: isAdmin ? true : isEditable(tanggalVisit || existingPlan.tanggalVisit)
      }
    });

    res.json({ success: true, message: 'Visit plan updated', data: updatedPlan });
  } catch (error) {
    console.error('Update visit plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to update visit plan' });
  }
};

// Delete visit plan
const deleteVisitPlan = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.visitPlan.delete({ where: { id } });

    res.json({ success: true, message: 'Visit plan deleted' });
  } catch (error) {
    console.error('Delete visit plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete visit plan' });
  }
};

module.exports = {
  getAllVisitPlans,
  getVisitPlanById,
  createVisitPlan,
  updateVisitPlan,
  deleteVisitPlan
};
