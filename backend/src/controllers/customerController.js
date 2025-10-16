const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all customers (dengan search, filter, dan pagination)
const getAllCustomers = async (req, res) => {
  try {
    // Query params
    const { search, status, page = 1, limit = 10 } = req.query;

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

    // Pagination calculation
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get total count for pagination
    const totalCount = await prisma.customer.count({ where: whereClause });

    // Get customers with pagination
    const customers = await prisma.customer.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
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
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit))
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

// Create new customer
const createCustomer = async (req, res) => {
  try {
    const { namaCustomer, alamat, telepon, email, picName } = req.body;

    if (!namaCustomer || !alamat || !telepon)
      return res.status(400).json({ success: false, message: 'Please complete all required fields' });

    const newCustomer = await prisma.customer.create({
      data: {
        namaCustomer,
        alamat,
        telepon,
        email,
        picName,
        createdBy: req.user.id
      }
    });

    res.status(201).json({ success: true, message: 'Customer created', data: newCustomer });
  } catch (error) {
    console.error('Create customer error:', error);
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

// Delete customer
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.customer.delete({ where: { id } });

    res.json({ success: true, message: 'Customer deleted' });
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
