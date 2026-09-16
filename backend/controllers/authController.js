const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_jwt_key_ecommerce_admin_2026_x89z',
    { expiresIn: '7d' }
  );
};

/**
 * @desc    Admin Login
 * @route   POST /api/v1/admin/login
 * @access  Public
 */
const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log(`[Auth API] POST /api/v1/admin/login attempt for email: "${email}"`);

    if (!email || !password) {
      console.warn('[Auth API Error] Missing email or password in request body');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Check for admin (case-insensitive email search)
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

    if (!admin) {
      console.warn(`[Auth API Error] No admin account found with email: "${email}"`);
      return res.status(401).json({
        success: false,
        message: 'Login failed. Please check your credentials.',
      });
    }

    // Match bcrypt password
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      console.warn(`[Auth API Error] Password comparison failed for admin: "${email}"`);
      return res.status(401).json({
        success: false,
        message: 'Login failed. Please check your credentials.',
      });
    }

    const token = generateToken(admin._id);
    console.log(`[Auth API Success] Login successful for admin: "${email}" (ID: ${admin._id})`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar,
      },
    });
  } catch (error) {
    console.error('[Auth API Exception]:', error);
    next(error);
  }
};

/**
 * @desc    Get Current Admin Profile
 * @route   GET /api/v1/admin/profile
 * @access  Private (Admin Only)
 */
const getAdminProfile = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password');
    res.status(200).json({
      success: true,
      admin,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin Logout
 * @route   POST /api/v1/admin/logout
 * @access  Private (Admin Only)
 */
const logoutAdmin = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin logged out successfully',
  });
};

module.exports = {
  loginAdmin,
  getAdminProfile,
  logoutAdmin,
};
