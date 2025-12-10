const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all customers (dengan search, filter, dan pagination/limit custom)
const getAllCustomers = async (req, res) => {
  try {
    // Query params
    const { search, status, page, limit, order = "asc" } = req.query;
    const sortOrder = order === "desc" ? "desc" : "asc";
    let whereClause = {};

    // Search by nama customer
    if (search) {
      whereClause.namaCustomer = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Pagination & limit logic
    // - Jika limit diberikan, ambil sebanyak itu (untuk kebutuhan dropdown)
    // - Jika tidak, default: paginated (limit=10)
    let take;
    let skip = 0;
    if (limit) {
      take = parseInt(limit);
      skip = page ? (parseInt(page) - 1) * take : 0;
    } else {
      take = 10; // default
      skip = page ? (parseInt(page) - 1) * take : 0;
    }

    // Get total count untuk pagination normal
    const totalCount = await prisma.customer.count({ where: whereClause });

    // Get customers (limit besar jika untuk dropdown, default paginated)
    const customers = await prisma.customer.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: { namaCustomer: sortOrder },
      include: {
        creator: {
          select: { id: true, namaLengkap: true }
        }
      }
    });

    res.json({
      success: true,
      data: customers,
      pagination: {
        total: totalCount,
        page: page ? parseInt(page) : 1,
        limit: take,
        totalPages: Math.ceil(totalCount / take)
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customers' });
  }
};

// Get single customer by ID
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { creator: { select: { id: true, namaLengkap: true } } }
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customer' });
  }
};

const createCustomer = async (req, res) => {
  try {
    const { namaCustomer, nipNas, alamat, telepon, email, picName } = req.body;

    if (!namaCustomer || !alamat || !telepon)
      return res.status(400).json({ success: false, message: 'Please complete all required fields' });

    // Cek apakah nipNas sudah ada
    const existingCustomer = await prisma.customer.findUnique({
      where: { nipNas }
    });

    if (existingCustomer) {
      return res.status(409).json({ success: false, message: 'NIP NAS sudah ada' });
    }

    const newCustomer = await prisma.customer.create({
      data: {
        namaCustomer,
        nipNas,
        alamat,
        telepon,
        email,
        picName,
        createdBy: req.user.id,
        source: 'MANUAL'
      }
    });

    res.status(201).json({ success: true, message: 'Customer created', data: newCustomer });
  } catch (error) {
    console.error('Create customer error:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('nip_nas')) {
      return res.status(409).json({ success: false, message: 'NIP NAS sudah ada' });
    }
    res.status(500).json({ success: false, message: 'Failed to create customer' });
  }
};


// Update existing customer
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { namaCustomer, alamat, telepon, email, picName, status } = req.body;

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: { namaCustomer, alamat, telepon, email, picName, status }
    });

    res.json({ success: true, message: 'Customer updated', data: updatedCustomer });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ success: false, message: 'Failed to update customer' });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Get counts before deletion
    const visitPlansCount = await prisma.visitPlan.count({
      where: { customerId: id }
    });

    // Count reports via visit plans
    const visitPlans = await prisma.visitPlan.findMany({
      where: { customerId: id },
      select: { id: true }
    });
    const visitPlanIds = visitPlans.map(vp => vp.id);
    
    const reportsCount = await prisma.visitReport.count({
      where: { visitPlanId: { in: visitPlanIds } }
    });

    // Delete customer (cascade will handle visit plans and reports)
    await prisma.customer.delete({
      where: { id }
    });

    res.json({ 
      success: true, 
      message: 'Customer deleted successfully',
      deletedCounts: {
        visitPlans: visitPlansCount,
        reports: reportsCount
      }
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete customer' });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
