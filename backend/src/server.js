const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express(); // <-- DEKLARASI DULU DI ATAS

// POSISI PALING ATAS
app.use(cors());

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const customerRoutes = require('./routes/customerRoutes');
const visitPlanRoutes = require('./routes/visitPlanRoutes');
const visitReportRoutes = require('./routes/visitReportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const profileRoutes = require('./routes/profileRoutes');
const importCustomersRouter = require('./routes/importCustomers');

// Route khusus upload file HARUS sebelah atas sebelum body parser!
app.use('/import', importCustomersRouter);

// Middleware untuk JSON dan urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route lain...
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/customers', customerRoutes);
app.use('/visit-plans', visitPlanRoutes);
app.use('/visit-reports', visitReportRoutes);
app.use('/notifications', notificationRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/profile', profileRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Visiting Plane API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});
