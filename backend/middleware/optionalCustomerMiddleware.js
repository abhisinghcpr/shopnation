const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');

const optionalCustomer = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'super_secret_jwt_key_ecommerce_admin_2026_x89z'
      );
      req.customer = await Customer.findById(decoded.id).select('-password');
    } catch (error) {
      req.customer = null;
    }
  }
  next();
};

module.exports = { optionalCustomer };
