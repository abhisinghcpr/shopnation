const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const seedAdminAccount = require('./seedAdmin');
const errorHandler = require('./middleware/errorHandler');

// Load Environment Variables
dotenv.config();

// Initialize Express App
const app = express();

// Ensure Uploads Directory Exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Enable CORS & Body Parser
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve Uploaded Files Statically
app.use('/uploads', express.static(uploadsDir));

// Connect Database & Seed Admin Account
const startServer = async () => {
  await connectDB();
  await seedAdminAccount();
};
startServer();

// Health Check API
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'E-Commerce Backend API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes Mapping
app.use('/api/v1/admin', require('./routes/authRoutes'));
app.use('/api/v1/admin', require('./routes/statsRoutes'));
app.use('/api/v1/categories', require('./routes/categoryRoutes'));
app.use('/api/v1/products', require('./routes/productRoutes'));
app.use('/api/v1/customer/auth', require('./routes/customerAuthRoutes'));
app.use('/api/v1/customer/cart', require('./routes/cartRoutes'));
app.use('/api/v1/customer/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/v1/customer/addresses', require('./routes/addressRoutes'));
app.use('/api/v1', require('./routes/orderRoutes'));
app.use('/api/v1', require('./routes/reviewRoutes'));
app.use('/api/v1', require('./routes/notificationRoutes'));
app.use('/api/v1/admin/email-logs', require('./routes/emailLogRoutes'));

// Global Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`[Express Server] Running on http://localhost:${PORT}`);
  console.log(`[Static Uploads] Served at http://localhost:${PORT}/uploads/`);
  console.log(`[API Base] /api/v1/admin | /api/v1/categories | /api/v1/products`);
  console.log(`====================================================`);
});
