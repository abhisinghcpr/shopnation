const Category = require('../models/Category');
const Product = require('../models/Product');

/**
 * @desc    Get Admin Dashboard Stats from MongoDB
 * @route   GET /api/v1/admin/dashboard/stats
 * @access  Private (Admin Only)
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const totalCategories = await Category.countDocuments();
    const totalProducts = await Product.countDocuments();

    res.status(200).json({
      success: true,
      stats: {
        totalCategories,
        totalProducts,
        totalOrders: null,    // Null indicates API not implemented yet (No fake numbers)
        totalCustomers: null, // Null indicates API not implemented yet (No fake numbers)
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
