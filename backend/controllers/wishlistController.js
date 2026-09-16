const Customer = require('../models/Customer');
const Product = require('../models/Product');

// @desc    Get customer wishlist
// @route   GET /api/v1/customer/wishlist
// @access  Private (Customer)
const getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id).populate({
      path: 'wishlist',
      populate: { path: 'category', select: 'name' },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Filter out deleted products if any
    const cleanWishlist = customer.wishlist.filter((prod) => prod !== null);
    if (cleanWishlist.length !== customer.wishlist.length) {
      customer.wishlist = cleanWishlist.map((p) => p._id);
      await customer.save();
    }

    return res.status(200).json({
      success: true,
      wishlist: cleanWishlist,
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching wishlist' });
  }
};

// @desc    Toggle product in wishlist (Add if not present, remove if present)
// @route   POST /api/v1/customer/wishlist/toggle/:productId
// @access  Private (Customer)
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const customer = await Customer.findById(req.customer._id);
    const existingIndex = customer.wishlist.findIndex(
      (id) => id.toString() === productId
    );

    let isAdded = false;
    if (existingIndex > -1) {
      // Remove from wishlist
      customer.wishlist.splice(existingIndex, 1);
      isAdded = false;
    } else {
      // Add to wishlist (prevent duplicate)
      customer.wishlist.push(productId);
      isAdded = true;
    }

    await customer.save();

    const updatedCustomer = await Customer.findById(req.customer._id).populate({
      path: 'wishlist',
      populate: { path: 'category', select: 'name' },
    });

    return res.status(200).json({
      success: true,
      message: isAdded
        ? 'Product added to wishlist'
        : 'Product removed from wishlist',
      isAdded,
      wishlist: updatedCustomer.wishlist,
    });
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    return res.status(500).json({ success: false, message: 'Server error toggling wishlist' });
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/v1/customer/wishlist/:productId
// @access  Private (Customer)
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const customer = await Customer.findById(req.customer._id);
    customer.wishlist = customer.wishlist.filter(
      (id) => id.toString() !== productId
    );

    await customer.save();

    const updatedCustomer = await Customer.findById(req.customer._id).populate({
      path: 'wishlist',
      populate: { path: 'category', select: 'name' },
    });

    return res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      wishlist: updatedCustomer.wishlist,
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return res.status(500).json({ success: false, message: 'Server error removing from wishlist' });
  }
};

module.exports = {
  getWishlist,
  toggleWishlist,
  removeFromWishlist,
};
