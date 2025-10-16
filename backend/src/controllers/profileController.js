const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Update own profile (nama, email)
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { namaLengkap, email } = req.body;

    // Check if email already exists (and not owned by current user)
    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId }
        }
      });

      if (existingEmail) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email already used by another user' 
        });
      }
    }

    // Update profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        namaLengkap: namaLengkap || undefined,
        email: email || undefined
      },
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        email: true,
        role: true,
        managerId: true,
        updatedAt: true
      }
    });

    res.json({ 
      success: true, 
      message: 'Profile updated successfully', 
      data: updatedUser 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password and confirm password do not match' 
      });
    }

    // Check password length
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({ 
      where: { id: userId } 
    });

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ 
      success: true, 
      message: 'Password changed successfully' 
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

module.exports = {
  updateProfile,
  changePassword
};
