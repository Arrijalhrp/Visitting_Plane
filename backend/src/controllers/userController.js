const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get all users (Admin bisa lihat semua, Manager hanya subordinates)
const getAllUsers = async (req, res) => {
  try {
    const { role, id: userId } = req.user;

    let whereClause = {};

    if (role === 'MANAGER') {
      whereClause = { managerId: userId };
    }
    // Admin tidak perlu where clause

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        email: true,
        role: true,
        managerId: true,
        manager: {
          select: { id: true, namaLengkap: true }
        },
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// Get single user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        email: true,
        role: true,
        managerId: true,
        manager: {
          select: { id: true, namaLengkap: true }
        },
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

// Update user (Admin only - untuk edit role, assign manager, dll)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { namaLengkap, email, role, managerId } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        namaLengkap,
        email,
        role,
        managerId
      },
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        email: true,
        role: true,
        managerId: true,
        manager: {
          select: { id: true, namaLengkap: true }
        }
      }
    });

    res.json({ success: true, message: 'User updated', data: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

// Delete user (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Tidak bisa hapus diri sendiri
    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    await prisma.user.delete({ where: { id } });

    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

// Get subordinates (untuk Manager lihat anak buahnya)
const getSubordinates = async (req, res) => {
  try {
    const { id: managerId } = req.user;

    const subordinates = await prisma.user.findMany({
      where: { managerId },
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    res.json({ success: true, data: subordinates });
  } catch (error) {
    console.error('Get subordinates error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subordinates' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getSubordinates
};
