const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hapus user admin yang lama kalau ada
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' }
  });

  if (existingAdmin) {
    console.log('🗑️  Deleting old admin user...');
    await prisma.user.delete({
      where: { username: 'admin' }
    });
  }

  // Buat user admin baru dengan hash yang benar
  console.log('👤 Creating new admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      namaLengkap: 'Administrator',
      email: 'admin@telkom.com',
      role: 'ADMIN'
    }
  });

  console.log('✅ Admin user created successfully!');
  console.log('📧 Email:', admin.email);
  console.log('👤 Username:', admin.username);
  console.log('🔑 Password: admin123');
  console.log('🔐 Hash:', hashedPassword);
  console.log('\n✨ You can now login with:');
  console.log('   Username: admin');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
