const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get dashboard summary (untuk semua role dengan filter berbeda)
const getDashboardSummary = async (req, res) => {
  try {
    const { role, id: userId } = req.user;

    let whereClause = {};

    // Filter berdasarkan role
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
    // Admin tidak perlu filter

    // Total customers
    const totalCustomers = await prisma.customer.count();

    // Total visit plans berdasarkan status
    const totalVisitPlans = await prisma.visitPlan.count({ where: whereClause });
    const plannedVisits = await prisma.visitPlan.count({
      where: { ...whereClause, status: 'PLANNED' }
    });
    const completedVisits = await prisma.visitPlan.count({
      where: { ...whereClause, status: 'COMPLETED' }
    });
    const cancelledVisits = await prisma.visitPlan.count({
      where: { ...whereClause, status: 'CANCELLED' }
    });

    // Total reports
    const totalReports = await prisma.visitReport.count();

    // Revenue summary
    const visitPlans = await prisma.visitPlan.findMany({
      where: whereClause,
      select: { revenueTarget: true }
    });
    const totalRevenueTarget = visitPlans.reduce((sum, vp) => sum + (vp.revenueTarget || 0), 0);

    // Get visit plan IDs berdasarkan whereClause
    const filteredVisitPlans = await prisma.visitPlan.findMany({
      where: whereClause,
      select: { id: true }
    });
    const visitPlanIds = filteredVisitPlans.map(vp => vp.id);

    // Get reports berdasarkan visit plan IDs
    const reports = await prisma.visitReport.findMany({
      where: { visitPlanId: { in: visitPlanIds } }
    });

    const totalRevenueActual = reports.reduce((sum, r) => {
      return sum + (r.revenueActual ? parseFloat(r.revenueActual) : 0);
    }, 0);

    // Recent activities (5 latest visit plans)
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
          totalRevenueTarget,
          totalRevenueActual,
          revenueAchievement: totalRevenueTarget > 0 
            ? ((totalRevenueActual / totalRevenueTarget) * 100).toFixed(2) 
            : 0
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
