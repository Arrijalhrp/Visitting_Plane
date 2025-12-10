const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedTestUsers() {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create MANAGER
    const manager = await prisma.user.upsert({
      where: { username: 'manager' },
      update: { password: hashedPassword },
      create: {
        username: 'manager',
        password: hashedPassword,
        namaLengkap: 'Manager Telkom',
        email: 'manager@telkom.co.id',
        role: 'MANAGER'
      }
    });

    console.log('✅ Manager created:', manager.username);

    // Create USER 1 (under manager)
    const user1 = await prisma.user.upsert({
      where: { username: 'user1' },
      update: { password: hashedPassword, managerId: manager.id },
      create: {
        username: 'user1',
        password: hashedPassword,
        namaLengkap: 'User Sales 1',
        email: 'user1@telkom.co.id',
        role: 'USER',
        managerId: manager.id
      }
    });

    console.log('✅ User 1 created:', user1.username);

    // Create USER 2 (under manager)
    const user2 = await prisma.user.upsert({
      where: { username: 'user2' },
      update: { password: hashedPassword, managerId: manager.id },
      create: {
        username: 'user2',
        password: hashedPassword,
        namaLengkap: 'User Sales 2',
        email: 'user2@telkom.co.id',
        role: 'USER',
        managerId: manager.id
      }
    });

    console.log('✅ User 2 created:', user2.username);

    console.log('\n🎉 Test users created successfully!');
    console.log('\nLogin credentials:');
    console.log('ADMIN     -> username: admin, password: admin123');
    console.log('MANAGER   -> username: manager, password: password123');
    console.log('USER 1    -> username: user1, password: password123');
    console.log('USER 2    -> username: user2, password: password123');

  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestUsers();
