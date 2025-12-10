const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all visit reports (dengan filter dan pagination)
const getAllReports = async (req, res) => {
  try {
    const { role, id: userId, managerId } = req.user;
    const { statusRealisasi, hasilVisit, page = 1, limit = 10 } = req.query;

    let whereClause = {};

    // Role-based filtering untuk visit plans
    let visitPlanWhereClause = {};
    if (role === 'USER') {
      visitPlanWhereClause = { userId };
    } else if (role === 'MANAGER') {
      const subordinates = await prisma.user.findMany({
        where: { managerId: userId },
        select: { id: true }
      });
      const subordinateIds = subordinates.map(sub => sub.id);
      visitPlanWhereClause = { userId: { in: [...subordinateIds, userId] } };
    }

    // Get visit plan IDs
    const visitPlans = await prisma.visitPlan.findMany({
      where: visitPlanWhereClause,
      select: { id: true }
    });
    const visitPlanIds = visitPlans.map(vp => vp.id);

    whereClause.visitPlanId = { in: visitPlanIds };

    // Filter by statusRealisasi
    if (statusRealisasi) {
      whereClause.statusRealisasi = statusRealisasi;
    }

    // Filter by hasilVisit
    if (hasilVisit) {
      whereClause.hasilVisit = hasilVisit;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get total count
    const totalCount = await prisma.visitReport.count({ where: whereClause });

    // Get reports
    const reports = await prisma.visitReport.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        visitPlan: {
          include: {
            customer: { select: { id: true, namaCustomer: true } },
            user: { select: { id: true, namaLengkap: true } }
          }
        }
      }
    });

    res.json({
      success: true,
      data: reports,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
};



// Get single report by ID
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await prisma.visitReport.findUnique({
      where: { id },
      include: {
        visitPlan: {
          include: {
            customer: true,
            user: { select: { id: true, namaLengkap: true } }
          }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch report' });
  }
};

const createReport = async (req, res) => {
  try {
    const { visitPlanId, statusRealisasi, hasilVisit, kategori, revenueActual, catatan, pic, cpPic, updateVisitPlanStatus } = req.body;

    if (!visitPlanId) {
      return res.status(400).json({ success: false, message: 'Visit plan ID is required' });
    }

    const visitPlan = await prisma.visitPlan.findUnique({ where: { id: visitPlanId } });

    if (!visitPlan) {
      return res.status(404).json({ success: false, message: 'Visit plan not found' });
    }

    const existingReport = await prisma.visitReport.findUnique({ where: { visitPlanId } });

    if (existingReport) {
      return res.status(400).json({ success: false, message: 'Report already exists for this visit plan' });
    }

    const newReport = await prisma.visitReport.create({
      data: {
        visitPlanId,
        statusRealisasi: statusRealisasi || 'TEREALISASI',
        hasilVisit: hasilVisit ? hasilVisit.toUpperCase() : null,  // ← Normalize ke uppercase
        kategori: kategori || null,
        revenueActual: revenueActual ? parseFloat(revenueActual) : null,
        pic: pic || null,
        cpPic: cpPic || null,
        // catatan dihapus sepenuhnya
      }
    });

    if (updateVisitPlanStatus) {
      await prisma.visitPlan.update({
        where: { id: visitPlanId },
        data: { status: 'COMPLETED' }
      });
    } else {
      // Update default status based on realization status if flag tidak diset
      const newStatus = statusRealisasi === 'TIDAK_TEREALISASI' ? 'CANCELLED' : 'COMPLETED';
      await prisma.visitPlan.update({
        where: { id: visitPlanId },
        data: { status: newStatus }
      });
    }

    res.status(201).json({ success: true, message: 'Visit report created', data: newReport });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ success: false, message: 'Failed to create report' });
  }
};


const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { statusRealisasi, hasilVisit, kategori, revenueActual, pic, cpPic } = req.body;

    const report = await prisma.visitReport.findUnique({ where: { id } });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const updatedReport = await prisma.visitReport.update({
      where: { id },
      data: {
        statusRealisasi: statusRealisasi || report.statusRealisasi,
        hasilVisit: hasilVisit ? hasilVisit.toUpperCase() : report.hasilVisit,  // ← Normalize & uppercase
        kategori: kategori !== undefined ? kategori : report.kategori,
        revenueActual: revenueActual !== undefined ? parseFloat(revenueActual) : report.revenueActual,
        pic: pic !== undefined ? pic : report.pic,
        cpPic: cpPic !== undefined ? cpPic : report.cpPic,
        // catatan dihapus sepenuhnya
        tanggalRealisasi: new Date()
      }
    });

    // Update visit plan status juga (optional)
    const newStatus = statusRealisasi === 'TIDAK_TEREALISASI' ? 'CANCELLED' : 'COMPLETED';
    await prisma.visitPlan.update({
      where: { id: report.visitPlanId },
      data: { status: newStatus }
    });

    res.json({ success: true, message: 'Report updated', data: updatedReport });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ success: false, message: 'Failed to update report' });
  }
};




// Delete report (Admin only)
const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await prisma.visitReport.findUnique({ where: { id } });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    await prisma.visitReport.delete({ where: { id } });

    // Reset visit plan status ke PLANNED
    await prisma.visitPlan.update({
      where: { id: report.visitPlanId },
      data: { status: 'PLANNED' }
    });

    res.json({ success: true, message: 'Report deleted' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete report' });
  }
};

module.exports = {
  getAllReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport
};
