const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Customer = require('../models/Customer');

// Helper to generate JWT token for Customer
const generateCustomerToken = (id) => {
  return jwt.sign(
    { id, type: 'CUSTOMER' },
    process.env.JWT_SECRET || 'super_secret_jwt_key_ecommerce_admin_2026_x89z',
    { expiresIn: '30d' }
  );
};

/**
 * @desc    Customer Register
 * @route   POST /api/v1/customer/auth/register
 * @access  Public
 */
const registerCustomer = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const emailClean = email.toLowerCase().trim();
    const existingCustomer = await Customer.findOne({ email: emailClean });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    // Hash password with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const customer = await Customer.create({
      name: name.trim(),
      email: emailClean,
      password: hashedPassword,
      phone: phone || '',
    });

    const token = generateCustomerToken(customer._id);

    res.status(201).json({
      success: true,
      message: 'Customer account registered successfully',
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        avatar: customer.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Customer Login
 * @route   POST /api/v1/customer/auth/login
 * @access  Public
 */
const loginCustomer = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const emailClean = email.toLowerCase().trim();
    const customer = await Customer.findOne({ email: emailClean });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, customer.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateCustomerToken(customer._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        avatar: customer.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Customer Profile
 * @route   GET /api/v1/customer/auth/profile
 * @access  Private (Customer)
 */
const getCustomerProfile = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.customer._id).select('-password');
    res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerCustomer,
  loginCustomer,
  getCustomerProfile,
};
