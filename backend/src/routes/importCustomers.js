const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware'); // Tambah import ini
const upload = multer({ dest: 'uploads/' });
router.use(authMiddleware); // ← Tambahkan baris ini
// Middleware cek admin (sesuaikan dengan autentikasi kamu)
function isAdmin(req, res, next) {
  console.log('DEBUG: req.user di isAdmin:', req.user);
  if (req.user && req.user.role === 'ADMIN') return next();
  return res.status(403).json({ success: false, message: 'Access denied' });
}

router.post('/import-customers', isAdmin, upload.single('file'), async (req, res) => {
  console.log('DEBUG: masuk handler, req.user:', req.user);
  console.log('DEBUG req.file:', req.file);
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    let successCount = 0;
    const errors = [];

    for (const [index, row] of rows.entries()) {
      const namaCustomer = row['STANDARD_NAME']?.toString().trim();
      const nipNas = row['NIP_NAS']?.toString().trim();

      if (!namaCustomer || !nipNas) {
        errors.push({ row: index + 2, message: 'Missing STANDARD_NAME or NIP_NAS' });
        continue;
      }
      // Cek unik nipNas
      const exists = await prisma.customer.findUnique({ where: { nipNas } });
      if (exists) {
        errors.push({ row: index + 2, message: 'Duplicate NIP_NAS' });
        continue;
      }

      try {
        await prisma.customer.create({
          data: {
            namaCustomer,
            nipNas,
            alamat: '',
            telepon: '',
            email: '',
            picName: '',
            status: 'AKTIF',
            createdBy: req.user.id,
            source: 'IMPORT' 
          },
        });
        successCount++;
      } catch (e) {
        errors.push({ row: index + 2, message: 'Database error' });
      }
    }

    res.json({ success: true, inserted: successCount, errors });
  } catch (error) {
    console.error('Import failed:', error);
    res.status(500).json({ success: false, message: 'Failed to import customers' });
  }
});

module.exports = router;
