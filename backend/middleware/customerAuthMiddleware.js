const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');

const protectCustomer = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'super_secret_jwt_key_ecommerce_admin_2026_x89z'
      );

      req.customer = await Customer.findById(decoded.id).select('-password');

      if (!req.customer) {
        return res.status(401).json({
          success: false,
          message: 'Customer account not found',
        });
      }

      next();
    } catch (error) {
      console.error('Customer JWT Verification Error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access, invalid or expired token',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied, no customer token provided',
    });
  }
};

module.exports = { protectCustomer };
