const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const protectAdmin = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'super_secret_jwt_key_ecommerce_admin_2026_x89z'
      );

      // Get admin from token payload without password
      req.admin = await Admin.findById(decoded.id).select('-password');

      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: 'प्रमाणीकरण विफल: एडमिन खाता मौजूद नहीं है (Admin account not found)',
        });
      }

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'अमान्य टोकन या सत्र समाप्त (Unauthorized access, invalid token)',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'पहुंच अस्वीकृत: टोकन गायब है (Access denied, no token provided)',
    });
  }
};

module.exports = { protectAdmin };
