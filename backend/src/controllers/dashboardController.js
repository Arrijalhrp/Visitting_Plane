const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getDashboardSummary = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    // Ambil filter tanggal & user dari query
    const { startDate, endDate, filterUserId } = req.query;

    let whereClause = {};

    // Filter user (khusus admin, bisa filterUserId manual)
    // filterUserId = ID user yang ingin difilter pada dashboard
    if (filterUserId) {
      whereClause.userId = filterUserId;
    } else if (role === 'USER') {
      whereClause.userId = userId;
    } else if (role === 'MANAGER') {
      const subordinates = await prisma.user.findMany({
        where: { managerId: userId },
        select: { id: true }
      });
      const subordinateIds = subordinates.map(sub => sub.id);
      whereClause.userId = { in: [...subordinateIds, userId] };
    }
    // Filter tanggalVisit jika filter waktu ada
    if (startDate && endDate) {
      whereClause.tanggalVisit = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Customers manual (tidak usah difilter waktu/user)
    // Customers manual, milik user (SALES) atau seluruh subordinate+dirinya (MANAGER)
    let customerWhere = { source: 'MANUAL' };

    // Jika filterUserId di-query, tampilkan sesuai user yang difilter
    if (filterUserId) {
      customerWhere.createdBy = filterUserId;
    } else if (role === 'USER') {
      customerWhere.createdBy = userId;
    } else if (role === 'MANAGER') {
      const subordinates = await prisma.user.findMany({
        where: { managerId: userId },
        select: { id: true }
      });
      const subordinateIds = subordinates.map(sub => sub.id);
      customerWhere.createdBy = { in: [...subordinateIds, userId] };
    }
    // Untuk admin, biarkan tampil semua MANUAL

    const totalCustomers = await prisma.customer.count({ where: customerWhere });


    // Total Visit Plans & status breakdown
    const totalVisitPlans = await prisma.visitPlan.count({ where: whereClause });
    const plannedVisits = await prisma.visitPlan.count({ where: { ...whereClause, status: 'PLANNED' } });
    const completedVisits = await prisma.visitPlan.count({ where: { ...whereClause, status: 'COMPLETED' } });
    const cancelledVisits = await prisma.visitPlan.count({ where: { ...whereClause, status: 'CANCELLED' } });
    const totalReports = await prisma.visitReport.count();

    // Revenue summary
    const visitPlans = await prisma.visitPlan.findMany({
      where: whereClause,
      select: { id: true, revenueTarget: true }
    });
    const totalRevenueTarget = visitPlans.reduce((sum, vp) =>
      sum + (vp.revenueTarget ? parseFloat(vp.revenueTarget) : 0), 0);

    // Get visit plan IDs for reports query
    const visitPlanIds = visitPlans.map(vp => vp.id);

    // Filter report by visitPlanId dan, jika ingin, filter tanggalRealisasi (opsional)
    const reportWhere = visitPlanIds.length > 0 ? { visitPlanId: { in: visitPlanIds } } : undefined;
    const reports = await prisma.visitReport.findMany({
      where: reportWhere
    });

    const totalRevenueActual = reports.reduce((sum, r) =>
      sum + (r.revenueActual ? parseFloat(r.revenueActual) : 0), 0);

    // Kategori breakdown
    const huntingReports = reports.filter(r => r.kategori === 'HUNTING');
    const farmingReports = reports.filter(r => r.kategori === 'FARMING');
    const huntingRevenue = huntingReports.reduce((sum, r) =>
      sum + (r.revenueActual ? parseFloat(r.revenueActual) : 0), 0);
    const farmingRevenue = farmingReports.reduce((sum, r) =>
      sum + (r.revenueActual ? parseFloat(r.revenueActual) : 0), 0);

    // Recent activities (latest 5 visit plans)
    const recentVisits = await prisma.visitPlan.findMany({
      where: whereClause,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, namaCustomer: true } },
        user: { select: { id: true, namaLengkap: true } }
      }
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalCustomers,
          totalVisitPlans,
          plannedVisits,
          completedVisits,
          cancelledVisits,
          totalReports,
          totalRevenueTarget: parseFloat(totalRevenueTarget),
          totalRevenueActual: parseFloat(totalRevenueActual),
          revenueAchievement: totalRevenueTarget > 0
            ? ((totalRevenueActual / totalRevenueTarget) * 100).toFixed(2)
            : 0,
          huntingCount: huntingReports.length,
          farmingCount: farmingReports.length,
          huntingRevenue: parseFloat(huntingRevenue),
          farmingRevenue: parseFloat(farmingRevenue)
        },
        recentVisits
      }
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard summary' });
  }
};

// Get visit statistics (breakdown by status & hasil)
const getVisitStatistics = async (req, res) => {
  try {
    const { role, id: userId } = req.user;

    let whereClause = {};

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

    // Visit plans by status
    const visitsByStatus = await prisma.visitPlan.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true
    });

    // Visit reports by hasilVisit
    const visitPlanIds = await prisma.visitPlan.findMany({
      where: whereClause,
      select: { id: true }
    });
    const planIds = visitPlanIds.map(vp => vp.id);

    const reportsByHasil = await prisma.visitReport.groupBy({
      by: ['hasilVisit'],
      where: { visitPlanId: { in: planIds } },
      _count: true
    });

    res.json({
      success: true,
      data: {
        visitsByStatus,
        reportsByHasil
      }
    });
  } catch (error) {
    console.error('Get visit statistics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch visit statistics' });
  }
};

// Get revenue analytics (monthly/quarterly breakdown - simplified)
const getRevenueAnalytics = async (req, res) => {
  try {
    const { role, id: userId } = req.user;

    let whereClause = {};

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

    const visitPlans = await prisma.visitPlan.findMany({
      where: whereClause,
      include: { report: true }
    });

    const totalTarget = visitPlans.reduce((sum, vp) => sum + (vp.revenueTarget || 0), 0);
    const totalActual = visitPlans.reduce((sum, vp) => {
      return sum + (vp.report?.revenueActual ? parseFloat(vp.report.revenueActual) : 0);
    }, 0);

    const achievement = totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        totalTarget,
        totalActual,
        achievement: parseFloat(achievement),
        gap: totalTarget - totalActual
      }
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch revenue analytics' });
  }
};

module.exports = {
  getDashboardSummary,
  getVisitStatistics,
  getRevenueAnalytics
};
